#!/usr/bin/env node
/**
 * One-off admin backfill — bd home-duo-insight-584
 * "Backfill extended property + recommendation fields"
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * The tv7 migrations added 15 dedicated columns + an `amenities` jsonb to
 * `properties`, and score/ai_points columns to `recommendations`. Rows created
 * before the backend deploy still have NULLs there, so DetailsTab renders "—"
 * and ScoreCardsGrid / AI points do not render on historical comparisons.
 *
 * The edge functions cannot be re-pointed at existing rows:
 *   - `analyze-properties` always INSERTs two NEW `properties` rows and a NEW
 *     `comparison`; it never updates. It also has no `source_url` on the
 *     properties table — the URLs live on `comparisons.property_url_a/b`.
 *   - `generate-recommendation` always INSERTs a NEW `recommendations` row.
 *
 * So the backfill works PER COMPARISON:
 *   1. Re-invoke the deployed `analyze-properties` with the comparison's two
 *      stored URLs. It returns the fully-extracted `property_a` / `property_b`
 *      rows (incl. all 15 extended columns + amenities). We copy ONLY those
 *      extended fields onto the EXISTING `property_a_id` / `property_b_id`
 *      rows, then delete the throwaway comparison + its two throwaway
 *      properties that analyze-properties created.
 *   2. For each comparison that has a `recommendations` row, delete the stale
 *      recommendation, then re-invoke `generate-recommendation` (with the
 *      stored `user_profile`) so it INSERTs a fresh row populated with
 *      property_a/b_score_total, score_breakdown, ai_points and the
 *      winner/badge-bearing summary_table.
 *
 * USAGE
 * -----
 *   node scripts/backfill-extended-fields.mjs --dry-run        # inspect only, no writes
 *   node scripts/backfill-extended-fields.mjs                  # full backfill
 *   node scripts/backfill-extended-fields.mjs --properties-only
 *   node scripts/backfill-extended-fields.mjs --recommendations-only
 *   node scripts/backfill-extended-fields.mjs --comparison-id <uuid>   # single comparison
 *   node scripts/backfill-extended-fields.mjs --limit 5        # cap rows processed
 *
 * REQUIRED ENVIRONMENT (this is an ADMIN script — keep these out of git)
 * ----------------------------------------------------------------------
 *   SUPABASE_URL                 e.g. https://qditnqwrjioypsuxwagg.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    service-role key (bypasses RLS)
 *   SUPABASE_ANON_KEY            anon key (sent as the function call's Authorization)
 * The edge functions themselves need GEMINI_API_KEY / FIRECRAWL_* configured in
 * the deployed project; this script does not need those locally.
 *
 * Load them inline, e.g.:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... \
 *     node scripts/backfill-extended-fields.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// The 15 dedicated columns + amenities jsonb added by the tv7.11 migration.
// These are the only fields copied from analyze-properties' response onto the
// pre-existing rows — base fields (name/price/etc.) are left untouched so an
// already-curated row is not clobbered by a fresh (possibly noisier) scrape.
// ---------------------------------------------------------------------------
const EXTENDED_PROPERTY_FIELDS = [
  "building_structure",
  "total_units",
  "management_type",
  "parking",
  "pet_allowed",
  "seismic_standard",
  "management_fee",
  "repair_reserve",
  "price_per_tsubo",
  "estimated_rent",
  "estimated_yield",
  "floor_number",
  "direction",
  "train_line",
  "school_district",
  "amenities",
];

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(name);
const getOpt = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : undefined;
};

const DRY_RUN = hasFlag("--dry-run");
const PROPERTIES_ONLY = hasFlag("--properties-only");
const RECOMMENDATIONS_ONLY = hasFlag("--recommendations-only");
const ONLY_COMPARISON_ID = getOpt("--comparison-id");
const LIMIT = getOpt("--limit") ? Number(getOpt("--limit")) : undefined;

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
const log = (...a) => console.log(...a);
const info = (...a) => console.log("ℹ️ ", ...a);
const ok = (...a) => console.log("✅", ...a);
const warn = (...a) => console.log("⚠️ ", ...a);
const err = (...a) => console.error("❌", ...a);

// ---------------------------------------------------------------------------
// Environment + client setup
// ---------------------------------------------------------------------------
function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    err(`Missing required environment variable: ${name}`);
    err(
      "This is an admin script. Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY " +
        "and SUPABASE_ANON_KEY (see the header of this file).",
    );
    process.exit(1);
  }
  return v;
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
// anon key is what real browser callers send; the edge functions expect a
// Bearer token in Authorization. Fall back to the service key if not given.
const ANON_KEY = process.env.SUPABASE_ANON_KEY || SERVICE_ROLE_KEY;

// Service-role client for direct DB reads/writes (bypasses RLS).
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const FUNCTIONS_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1`;

// ---------------------------------------------------------------------------
// Edge function invocation
// ---------------------------------------------------------------------------
async function invokeFunction(name, body) {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { _raw: text };
  }
  if (!res.ok || json?.error) {
    throw new Error(
      `${name} failed (HTTP ${res.status}): ${json?.error || json?._raw || text}`,
    );
  }
  return json;
}

// True when at least one of the 15 extended columns is still null/undefined.
function needsPropertyBackfill(row) {
  if (!row) return false;
  return EXTENDED_PROPERTY_FIELDS.some(
    (f) => row[f] === null || row[f] === undefined,
  );
}

// Pull only the 15 extended fields out of a returned property object.
function pickExtended(src) {
  const out = {};
  for (const f of EXTENDED_PROPERTY_FIELDS) {
    if (src[f] !== undefined) out[f] = src[f];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pass 1 — properties
// ---------------------------------------------------------------------------
async function backfillProperties() {
  log("");
  info("=== Pass 1: properties (15 extended columns + amenities) ===");

  let q = db
    .from("comparisons")
    .select(
      "id, property_url_a, property_url_b, property_a_id, property_b_id",
    )
    .not("property_url_a", "is", null)
    .not("property_url_b", "is", null)
    .order("created_at", { ascending: true });
  if (ONLY_COMPARISON_ID) q = q.eq("id", ONLY_COMPARISON_ID);

  const { data: comparisons, error: cmpErr } = await q;
  if (cmpErr) throw new Error(`Failed to read comparisons: ${cmpErr.message}`);

  info(`Found ${comparisons.length} comparison(s) with both source URLs.`);

  const stats = { scanned: 0, skipped: 0, backfilled: 0, failed: 0 };
  let processed = 0;

  for (const cmp of comparisons) {
    if (LIMIT !== undefined && processed >= LIMIT) break;
    stats.scanned += 1;

    // Read the two existing property rows this comparison points at.
    const { data: props, error: propErr } = await db
      .from("properties")
      .select("*")
      .in("id", [cmp.property_a_id, cmp.property_b_id]);
    if (propErr) {
      err(`comparison ${cmp.id}: failed to read properties — ${propErr.message}`);
      stats.failed += 1;
      continue;
    }
    const rowA = props.find((p) => p.id === cmp.property_a_id);
    const rowB = props.find((p) => p.id === cmp.property_b_id);
    if (!rowA || !rowB) {
      warn(`comparison ${cmp.id}: missing linked property row(s), skipping.`);
      stats.skipped += 1;
      continue;
    }

    const aNeeds = needsPropertyBackfill(rowA);
    const bNeeds = needsPropertyBackfill(rowB);
    if (!aNeeds && !bNeeds) {
      info(`comparison ${cmp.id}: both properties already populated, skipping.`);
      stats.skipped += 1;
      continue;
    }

    processed += 1;

    if (DRY_RUN) {
      info(
        `[dry-run] comparison ${cmp.id}: would re-scrape ` +
          `(A:${aNeeds ? "needs" : "ok"} ${cmp.property_a_id}, ` +
          `B:${bNeeds ? "needs" : "ok"} ${cmp.property_b_id})`,
      );
      stats.backfilled += 1;
      continue;
    }

    let throwawayComparisonId = null;
    const throwawayPropertyIds = [];
    try {
      info(`comparison ${cmp.id}: invoking analyze-properties…`);
      const result = await invokeFunction("analyze-properties", {
        property_url_a: cmp.property_url_a,
        property_url_b: cmp.property_url_b,
      });
      throwawayComparisonId = result.comparison_id || null;
      if (result.property_a?.id) throwawayPropertyIds.push(result.property_a.id);
      if (result.property_b?.id) throwawayPropertyIds.push(result.property_b.id);

      if (!result.property_a || !result.property_b) {
        throw new Error("analyze-properties returned no property data");
      }

      // Copy the extended fields onto the EXISTING rows.
      if (aNeeds) {
        const patchA = pickExtended(result.property_a);
        const { error: upA } = await db
          .from("properties")
          .update(patchA)
          .eq("id", cmp.property_a_id);
        if (upA) throw new Error(`update property A: ${upA.message}`);
      }
      if (bNeeds) {
        const patchB = pickExtended(result.property_b);
        const { error: upB } = await db
          .from("properties")
          .update(patchB)
          .eq("id", cmp.property_b_id);
        if (upB) throw new Error(`update property B: ${upB.message}`);
      }

      ok(`comparison ${cmp.id}: extended fields backfilled.`);
      stats.backfilled += 1;
    } catch (e) {
      err(`comparison ${cmp.id}: ${e.message}`);
      stats.failed += 1;
    } finally {
      // Clean up the throwaway rows analyze-properties created so the
      // backfill does not leave duplicate comparisons / properties behind.
      try {
        if (throwawayComparisonId) {
          await db.from("recommendations").delete().eq("comparison_id", throwawayComparisonId);
          await db.from("comparisons").delete().eq("id", throwawayComparisonId);
        }
        if (throwawayPropertyIds.length) {
          await db.from("properties").delete().in("id", throwawayPropertyIds);
        }
      } catch (cleanupErr) {
        warn(
          `comparison ${cmp.id}: cleanup of throwaway rows failed — ${cleanupErr.message}. ` +
            `Throwaway comparison=${throwawayComparisonId} properties=${throwawayPropertyIds.join(",")}`,
        );
      }
    }
  }

  log("");
  info(
    `Pass 1 done — scanned ${stats.scanned}, skipped ${stats.skipped}, ` +
      `backfilled ${stats.backfilled}, failed ${stats.failed}.`,
  );
  return stats;
}

// ---------------------------------------------------------------------------
// Pass 2 — recommendations
// ---------------------------------------------------------------------------
function needsRecommendationBackfill(rec) {
  return (
    rec.property_a_score_total === null ||
    rec.property_b_score_total === null ||
    rec.score_breakdown === null ||
    rec.ai_points === null
  );
}

async function backfillRecommendations() {
  log("");
  info("=== Pass 2: recommendations (scores + ai_points + summary_table) ===");

  let recQ = db
    .from("recommendations")
    .select(
      "id, comparison_id, user_id, user_profile, property_a_score_total, " +
        "property_b_score_total, score_breakdown, ai_points",
    )
    .order("created_at", { ascending: true });
  if (ONLY_COMPARISON_ID) recQ = recQ.eq("comparison_id", ONLY_COMPARISON_ID);

  const { data: recs, error: recErr } = await recQ;
  if (recErr) throw new Error(`Failed to read recommendations: ${recErr.message}`);

  info(`Found ${recs.length} recommendation(s).`);

  const stats = { scanned: 0, skipped: 0, backfilled: 0, failed: 0 };
  let processed = 0;

  for (const rec of recs) {
    if (LIMIT !== undefined && processed >= LIMIT) break;
    stats.scanned += 1;

    if (!needsRecommendationBackfill(rec)) {
      info(`recommendation ${rec.id}: already has scores, skipping.`);
      stats.skipped += 1;
      continue;
    }
    if (!rec.user_profile) {
      warn(
        `recommendation ${rec.id}: no stored user_profile — cannot re-invoke ` +
          `generate-recommendation, skipping.`,
      );
      stats.skipped += 1;
      continue;
    }

    // Load the comparison + its two (now-backfilled) property rows.
    const { data: cmp, error: cmpErr } = await db
      .from("comparisons")
      .select("id, why_move, property_a_id, property_b_id")
      .eq("id", rec.comparison_id)
      .single();
    if (cmpErr || !cmp) {
      err(`recommendation ${rec.id}: comparison not found — ${cmpErr?.message}`);
      stats.failed += 1;
      continue;
    }
    const { data: props, error: propErr } = await db
      .from("properties")
      .select("*")
      .in("id", [cmp.property_a_id, cmp.property_b_id]);
    if (propErr || !props || props.length < 2) {
      err(`recommendation ${rec.id}: could not load property rows.`);
      stats.failed += 1;
      continue;
    }
    const propertyA = props.find((p) => p.id === cmp.property_a_id);
    const propertyB = props.find((p) => p.id === cmp.property_b_id);

    processed += 1;

    if (DRY_RUN) {
      info(
        `[dry-run] recommendation ${rec.id}: would re-invoke ` +
          `generate-recommendation for comparison ${rec.comparison_id}.`,
      );
      stats.backfilled += 1;
      continue;
    }

    try {
      // generate-recommendation INSERTs a fresh row. Delete the stale one
      // first so we end up with exactly one recommendation per comparison.
      const { error: delErr } = await db
        .from("recommendations")
        .delete()
        .eq("id", rec.id);
      if (delErr) throw new Error(`delete stale recommendation: ${delErr.message}`);

      info(`recommendation ${rec.id}: invoking generate-recommendation…`);
      await invokeFunction("generate-recommendation", {
        comparison_id: rec.comparison_id,
        property_a: propertyA,
        property_b: propertyB,
        user_profile: rec.user_profile,
        user_id: rec.user_id,
        why_move: cmp.why_move || "",
        language: "ja",
      });

      ok(`recommendation for comparison ${rec.comparison_id}: regenerated.`);
      stats.backfilled += 1;
    } catch (e) {
      err(`recommendation ${rec.id}: ${e.message}`);
      stats.failed += 1;
    }
  }

  log("");
  info(
    `Pass 2 done — scanned ${stats.scanned}, skipped ${stats.skipped}, ` +
      `backfilled ${stats.backfilled}, failed ${stats.failed}.`,
  );
  return stats;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log("🏠 AiSumai extended-fields backfill — bd home-duo-insight-584");
  log(`   target: ${SUPABASE_URL}`);
  log(`   mode:   ${DRY_RUN ? "DRY-RUN (no writes)" : "LIVE (writes enabled)"}`);
  if (ONLY_COMPARISON_ID) log(`   scope:  comparison ${ONLY_COMPARISON_ID}`);
  if (LIMIT !== undefined) log(`   limit:  ${LIMIT} row(s) per pass`);

  // Connectivity check — also serves as the dry-run validation.
  const { error: pingErr } = await db
    .from("comparisons")
    .select("id", { count: "exact", head: true });
  if (pingErr) {
    err(`Cannot reach Supabase / read comparisons: ${pingErr.message}`);
    process.exit(1);
  }
  ok("Connectivity OK — service-role client can read the database.");

  let propStats = null;
  let recStats = null;

  if (!RECOMMENDATIONS_ONLY) propStats = await backfillProperties();
  if (!PROPERTIES_ONLY) recStats = await backfillRecommendations();

  log("");
  log("──────────────────────────────────────────");
  if (propStats)
    log(
      `Properties:      ${propStats.backfilled} backfilled, ` +
        `${propStats.skipped} skipped, ${propStats.failed} failed`,
    );
  if (recStats)
    log(
      `Recommendations: ${recStats.backfilled} backfilled, ` +
        `${recStats.skipped} skipped, ${recStats.failed} failed`,
    );
  log("──────────────────────────────────────────");

  const anyFailed =
    (propStats && propStats.failed > 0) || (recStats && recStats.failed > 0);
  if (DRY_RUN) {
    ok("Dry-run complete — no rows were modified.");
  } else if (anyFailed) {
    warn("Backfill finished with some failures — review the log above.");
    process.exit(1);
  } else {
    ok("Backfill complete.");
  }
}

main().catch((e) => {
  err(e.stack || e.message || String(e));
  process.exit(1);
});
