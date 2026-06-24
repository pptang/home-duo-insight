/**
 * Dynamic per-comparison OG social card (bead home-duo-insight-mug).
 *
 * Resource route (loader only, no default export) that renders a 1200x630 PNG
 * showing the two compared property names + their prices. Wired at
 * `/comparisons/:id/og.png` (see src/routes.ts). ComparisonDetail.meta() points
 * og:image + twitter:image at this URL so Twitter/X + Facebook validators render
 * a per-pair card instead of the single static OG image.
 *
 * Runs in the Vercel Function (Node.js) runtime where @vercel/og works. Mirrors
 * the anon Supabase query used by ComparisonDetail's loader (bead nae) — the
 * comparison + property rows are anon-readable, so no auth is needed; we only
 * select the fields the card needs.
 */
import type { LoaderFunctionArgs } from "react-router";
import { ImageResponse } from "@vercel/og";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { SITE_TITLE } from "@/lib/site";

const WIDTH = 1200;
const HEIGHT = 630;

// Brand colors lifted from the design tokens (ink/paper) so the card matches the
// site. Inline styles only — @vercel/og supports a constrained flexbox subset.
const PAPER = "#faf9f6";
const INK = "#1a1a1a";
const INK_60 = "#6b6b6b";
const RULE = "#e5e3de";

interface PropertyCardData {
  property_name: string | null;
  price_yen: number | null;
}

interface ComparisonRow {
  property_a: PropertyCardData | PropertyCardData[] | null;
  property_b: PropertyCardData | PropertyCardData[] | null;
}

// PostgREST returns embedded one-to-one relations as a single object, but the
// generated types can widen them to arrays; normalize defensively.
function pickProperty(
  rel: PropertyCardData | PropertyCardData[] | null | undefined,
): PropertyCardData {
  if (Array.isArray(rel)) return rel[0] ?? { property_name: null, price_yen: null };
  return rel ?? { property_name: null, price_yen: null };
}

function PropertyColumn({
  label,
  name,
  price,
}: {
  label: string;
  name: string;
  price: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: 4,
          color: INK_60,
          marginBottom: 18,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 46,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.15,
          marginBottom: 20,
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 40, fontWeight: 600, color: INK }}>{price}</div>
    </div>
  );
}

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;

  let aName = "物件 A";
  let bName = "物件 B";
  let aPrice = "—";
  let bPrice = "—";

  if (id) {
    const { data: row } = await supabase
      .from("comparisons")
      .select(
        `property_a:properties!comparisons_property_a_id_fkey(property_name, price_yen),
         property_b:properties!comparisons_property_b_id_fkey(property_name, price_yen)`,
      )
      .eq("id", id)
      .single<ComparisonRow>();

    if (row) {
      const a = pickProperty(row.property_a);
      const b = pickProperty(row.property_b);
      aName = a.property_name || "物件 A";
      bName = b.property_name || "物件 B";
      aPrice = formatPrice(a.price_yen);
      bPrice = formatPrice(b.price_yen);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: PAPER,
          padding: 64,
          justifyContent: "space-between",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 700,
            color: INK,
            letterSpacing: 1,
          }}
        >
          {SITE_TITLE.split(" ")[0]}
        </div>

        {/* The pair */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <PropertyColumn label="A" name={aName} price={aPrice} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 100,
              fontSize: 40,
              fontStyle: "italic",
              color: INK_60,
            }}
          >
            vs
          </div>
          <PropertyColumn label="B" name={bName} price={bPrice} />
        </div>

        {/* Footer rule + tagline */}
        <div
          style={{
            display: "flex",
            borderTop: `2px solid ${RULE}`,
            paddingTop: 24,
            fontSize: 24,
            color: INK_60,
          }}
        >
          AI で物件を比較 · Compare homes in Japan with AI
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Cache the generated card aggressively at the CDN — the pair + prices
        // for a given comparison id are immutable in practice.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
