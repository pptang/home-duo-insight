import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Required for CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PropertyData {
  property_name: string;
  address: string;
  price_yen: number;
  floor_plan: string;
  commute_minutes: number;
  property_type: string;
  image_urls: string[];
  notes: string;
}

interface UserProfile {
  lifestyle_fit: {
    proximity_to_cafes: number;
    access_to_gym: number;
    dog_walking_friendly: number;
    quiet_at_night: number;
    morning_vs_afternoon_sunlight: string | number;
    laundromat_access: number;
  };
  emotional_desires: {
    open_view: number;
    feels_like_home: number;
    creative_friendly: number;
    reading_corner_space: number;
    natural_surroundings: number;
  };
  life_planning: {
    future_family_growth: number;
    work_from_home_support: number;
    resale_potential: number;
    renovation_willingness: number;
    storage_capacity: number;
  };
  sensory_comfort: {
    natural_ventilation: number;
    light_sensitivity: number;
    minimalist_vs_maximalist: string | number;
    privacy_from_neighbors: number;
  };
  cultural_routine: {
    grocery_chain_access: number;
    international_schools: number;
    weekend_market_access: number;
    safe_for_biking: number;
    spiritual_space_access: number;
  };
}

interface RequestData {
  comparison_id: string;
  property_a: PropertyData;
  property_b: PropertyData;
  user_profile: UserProfile;
  why_move: string;
  language?: 'en' | 'ja';
  // Subset of aspect ids the client wants in summary_table, in display order.
  // When present and non-empty, summary_table must contain EXACTLY these rows
  // in this exact order. When absent/empty, falls back to the legacy
  // behavior (AI-chosen structural rows + 6 mandatory lifestyle rows).
  enabled_aspects?: string[];
}

// Localized labels + hints for each chip id supported by the /compare form.
// Keep aligned with FILTER_CHIPS in src/pages/Index.tsx — bead home-duo-insight-che.
const ASPECT_LABELS_EN: Record<string, { label: string; hint: string }> = {
  price:      { label: 'Price',           hint: 'price comparison (badge example: 安/割安)' },
  access:     { label: 'Commute',         hint: 'station walk minutes / commute time (badge example: 近)' },
  age:        { label: 'Building age',    hint: 'construction year or building age (badge example: 新)' },
  layout:     { label: 'Layout',          hint: 'floor plan and floor area (badge example: 広/可)' },
  school:     { label: 'School district', hint: 'school district quality and nearby schools' },
  risk:       { label: 'Risk',            hint: 'hazard / flood / earthquake / area-risk factors' },
  cafe:       { label: 'Cafés nearby',    hint: 'proximity to cafés (badge example: 近)' },
  gym:        { label: 'Gym access',      hint: 'walking distance to gyms (badge example: 近)' },
  dog:        { label: 'Dog walking',     hint: 'dog-friendly streets / green space (badge example: 良)' },
  quiet:      { label: 'Quiet at night',  hint: 'nighttime noise / street type (badge example: 静)' },
  sunlight:   { label: 'Sunlight',        hint: 'sunlight exposure based on orientation/floor (badge example: 日)' },
  laundromat: { label: 'Laundromat',      hint: 'in-unit hookup + coin laundry access (badge example: 近)' },
};

const ASPECT_LABELS_JA: Record<string, { label: string; hint: string }> = {
  price:      { label: '価格',                 hint: '価格比較。badge例: 安/割安' },
  access:     { label: '通勤',                 hint: '駅徒歩分や通勤時間。badge例: 近' },
  age:        { label: '築年数',               hint: '築年数または建築年。badge例: 新' },
  layout:     { label: '間取り',               hint: '間取り・専有面積。badge例: 広/可' },
  school:     { label: '学区',                 hint: '学区の質や近隣の学校' },
  risk:       { label: 'リスク',               hint: 'ハザード/浸水/地震/エリアリスク' },
  cafe:       { label: 'カフェへの近さ',       hint: 'カフェへの距離。badge例: 近' },
  gym:        { label: 'ジムへのアクセス',     hint: 'ジムへの徒歩距離。badge例: 近' },
  dog:        { label: '犬の散歩のしやすさ',   hint: '散歩しやすさ・緑地。badge例: 良' },
  quiet:      { label: '夜間の静かさ',         hint: '夜間騒音・接道種別。badge例: 静' },
  sunlight:   { label: '日当たり',             hint: '向き/階層に基づく日照。badge例: 日' },
  laundromat: { label: 'コインランドリー',     hint: '室内洗濯機/コインランドリー。badge例: 近' },
};

function buildAspectOverride(
  language: 'en' | 'ja',
  enabledAspects: string[] | undefined,
): string {
  if (!enabledAspects || enabledAspects.length === 0) return '';

  const labels = language === 'ja' ? ASPECT_LABELS_JA : ASPECT_LABELS_EN;
  const rows = enabledAspects
    .map((id, idx) => {
      const entry = labels[id];
      if (!entry) return null;
      return `${idx + 1}. "${entry.label}" — ${entry.hint}`;
    })
    .filter((row): row is string => row !== null);

  if (rows.length === 0) return '';

  if (language === 'ja') {
    return `

---
## STRICT SUMMARY_TABLE OVERRIDE（最優先ルール）
summary_table は以下の${rows.length}行のみを、指定された順序で厳密に含めてください。他の行は絶対に追加しないでください。1行も省略しないでください。先述の「6行を必ず追加すること」のルールはこのオーバーライドに置き換えられます。

${rows.join('\n')}

各行で:
- 'field' は上記の日本語ラベルをそのまま使用すること
- 'property_a' と 'property_b' は各物件の具体的な体験を1文（≤50文字）で記述
- 'winner' は 'A' / 'B' / 'draw'
- 'badge' は日本語1〜3文字
他のセクション（pros/cons、ai_points、final_recommendation など）のルールは変更しません。
`;
  }

  return `

---
## STRICT SUMMARY_TABLE OVERRIDE (highest priority)
The 'summary_table' MUST contain EXACTLY these ${rows.length} rows, in this exact order. Do not add other rows. Do not omit any of them. This override REPLACES the earlier "MUST include 6 additional rows" rule.

${rows.join('\n')}

For each row:
- Use the exact label shown above as the 'field' value
- 'property_a' and 'property_b' must each be one concrete lived-experience sentence comparing the two properties on that aspect (<=80 chars), written in English
- 'winner' is 'A', 'B', or 'draw'
- 'badge' is 1-12 English characters — short adjective or symbol (examples: Cheap, Close, New, Quiet, Bright, Spacious, Good, OK, Far, Old). Do NOT use Japanese characters.
All other section rules (pros/cons, ai_points, final_recommendation, axis scores) remain unchanged.
`;
}

interface AIRecommendation {
  property_a_pros: string[];
  property_a_cons: string[];
  property_b_pros: string[];
  property_b_cons: string[];
  summary_table: {
    field: string;
    property_a: string;
    property_b: string;
    winner?: "A" | "B" | "draw";
    badge?: string;
  }[];
  ai_points?: {
    kind: "pro-a" | "pro-b" | "caution";
    body: string;
  }[];
  final_recommendation: string;
  property_a_score_total?: number;
  property_b_score_total?: number;
  score_breakdown?: {
    a: { price: number; location: number; building: number };
    b: { price: number; location: number; building: number };
  };
}

interface AIRecommendationResponse extends AIRecommendation {
  recommendation_id: string | null;
  comparison_id: string;
}

// In-memory rate limiting
const rateLimiter = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generates language-specific prompts for the property recommendation
 * @param language - The language code ('en' or 'ja')
 * @param propertyAText - Formatted text for Property A
 * @param propertyBText - Formatted text for Property B
 * @param userProfileText - Formatted user profile JSON
 * @returns The complete prompt in the specified language
 */
function getPromptByLanguage(
  language: 'en' | 'ja',
  propertyAText: string,
  propertyBText: string,
  userProfileText: string
): string {
  const englishPrompt = `
Role & Expertise
You are a senior residential property advisor in Japan and a decision strategist.
You combine factual property analysis, neighborhood understanding, and long-term living considerations to help users confidently choose between two homes.
Your role is not only to compare properties but to guide a clear and thoughtful housing decision.

Goal
Users should understand the recommendation within seconds and feel confident about their choice after reading.
Prioritize clarity, decision support, and real-life relevance over long explanations.

---

Inputs (provided to you)
- property_a, property_b: structured property data (price, layout, floor_area, floor_level, building_age, station_name, walk_minutes_to_station, railway_line, amenities, monthly_fees, URLs)
- user_profile: lifestyle preference inputs across multiple categories (1-5 scale where 5 = very important)

---

Interpretation of Preferences
User preferences represent a continuous importance spectrum rather than fixed categories.
Treat preferences as weighted lifestyle signals rather than labels.
Preferences may belong to four reasoning layers:

1. Daily Lifestyle Needs (day-to-day convenience and friction)
   Examples: cafes, gym access, dog walking environment, quiet nights, grocery access, laundromat access.
   Use these as practical livability constraints.

2. Emotional & Identity Signals (personal meaning and lifestyle expression)
   Examples: feels like home, creativity support, greenery, open views, reading space.
   Use these to understand lifestyle identity alignment.

3. Future Planning Signals (long-term adaptability and strategic value)
   Examples: future family growth, resale potential, work-from-home suitability, storage capacity, renovation flexibility.
   These signals should strongly influence the final recommendation because they affect long-term satisfaction.

4. Comfort & Cultural Needs (sensory comfort and routine compatibility)
   Examples: ventilation, light sensitivity, privacy, school access, shopping habits.
   Use these to evaluate long-term stability and hidden friction risks.

Weigh preferences proportionally rather than categorizing them rigidly.
Never display numeric values or scales.

---

General Reasoning Rules
- Use all available data.
- If information is missing, mention it under Watch-outs.
- Translate facts into lived experience.
- Avoid generic real-estate language.
- Be concise and practical.

---

Recommendation Emphasis
When making the recommendation, prioritize explaining why the choice works well over time, not only which property appears better today.
Emphasize reasoning in this general order when relevant:
1. Long-term living comfort and daily lifestyle sustainability
2. Flexibility for future life changes and resale adaptability
3. Strength and resilience of the surrounding location
Avoid focusing primarily on superficial or short-term features.
The recommendation should feel thoughtful, grounded, and forward-looking, like guidance from an experienced advisor.

---

Hidden Internal Logic (do not reveal)
- Internally weight user priorities (5 > 4 > 3 > 2 > 1).
- Treat 5 as "decisive must-have," 3-4 as "strong preference," 1-2 as "nice to have."
- Use these weights internally to guide emphasis, but never show numbers in the output.
- Translate scores into natural language (e.g., "you care about future family space and storage").
- Never output raw scores, formulas, or tool traces.

---

The user profile is:
${userProfileText}

Here are the properties:
${propertyAText}
${propertyBText}

---

## OUTPUT STRUCTURE (STRICT ORDER)
The final_recommendation field must contain ALL of the following sections in this exact order.
Each section must use the emoji header shown. Total length: 300-450 words. Distribute detail selectively across sections.

[Recommended] AI Recommendation
Start with the decision. Clearly state:
- which property you recommend
- the core reason in one sentence
- who this option fits best
- one important trade-off
3-4 sentences maximum.

[Profile] Why This Fits You
Translate the user's strongest priorities into natural lifestyle needs.
Explain briefly how EACH property aligns or conflicts with those needs using concrete examples.
Limit to 6-8 sentences total. Focus on decision clarity rather than description.

[Persona] City Persona Insight
Infer the user's likely lifestyle archetype based on preferences.
Choose one primary persona (optionally one secondary):
- Urban Explorer
- Balanced Professional
- Future Family Builder
- Strategic Investor
Explain: what lifestyle this persona represents, why the user likely fits it, which property aligns better.
4-5 sentences maximum.

[Location] Lifestyle & Location Snapshot
Use BOTH property data and general open-world knowledge about the neighborhood.
Incorporate understanding of: neighborhood character, walkability and daily convenience, typical resident lifestyle patterns, daytime vs nighttime atmosphere.
Important: focus on everyday living experience. Do NOT list tourist attractions. Translate geographic facts into lived experience.
Output format:
Property A:
- 2-3 concise lifestyle insights
Property B:
- 2-3 concise lifestyle insights

[Strategy] Strategic Perspective
Evaluate both properties using three lenses:
1. Long-term desirability of location
2. Rarity and resale resilience
3. Adaptability to future life changes
Explain briefly (5-6 sentences total).

[Confidence] Decision Confidence
Evaluate how confident the user can be in making a decision now.
Consider: completeness of available data, alignment with priorities, unresolved risks.
Output: Decision Confidence: High / Medium / Low
Then explain briefly: why, whether the user can proceed confidently, or what should be verified next.
3-4 sentences. Tone should be supportive, not absolute.

[Future] Future Living Perspective
Simulate realistic future friction for each property.
Consider: lifestyle mismatch risk, perceived long-term value concerns, lifestyle identity mismatch.
Describe one realistic concern per property.
Then conclude which option is LESS likely to create long-term regret.
5-6 sentences total.

[Watch-outs] Watch-outs
Provide 3-5 concise bullet points.
Mention uncertainties or items to verify during viewing.

---

## Writing Rules
- Total length for the ENTIRE final_recommendation: 300-450 words
- Distribute detail selectively across sections
- Keep paragraphs short and readable
- Use a clear, human, advisor-like tone
- Avoid report-style writing
- Interpret insights rather than listing raw data

---

## Pros and Cons (separate JSON fields)
In the property_a_pros, property_a_cons, property_b_pros, property_b_cons fields:
- Provide at least 3 items each
- Each item should be a complete, insightful sentence (not a single word or short phrase)
- Focus on practical, lived-experience impact rather than raw data

---

## Axis Scores
Compute a 0-100 score for each property on three axes:
- price: affordability relative to market and user budget sensitivity (0 = expensive/poor value, 100 = excellent value)
- location: neighborhood quality, commute convenience, daily amenities access (0 = poor, 100 = excellent)
- building: physical quality of the building/unit — age, layout, condition, amenities (0 = poor, 100 = excellent)

Weighting for property_a_score_total and property_b_score_total (weighted average):
- price: 40%
- location: 35%
- building: 25%

Formula: total = price×0.40 + location×0.35 + building×0.25

Include these in the JSON output as numeric fields (integer, 0-100).

---

Now return your response in the following **JSON format only** (with no extra explanation):

{
  "property_a_pros": ["pro 1", "pro 2", "pro 3"],
  "property_a_cons": ["con 1", "con 2", "con 3"],
  "property_b_pros": ["pro 1", "pro 2", "pro 3"],
  "property_b_cons": ["con 1", "con 2", "con 3"],
  "ai_points": [
    {"kind": "pro-a", "body": "Property A advantage point"},
    {"kind": "pro-b", "body": "Property B advantage point"},
    {"kind": "caution", "body": "A key watch-out to verify"}
  ],
  "summary_table": [
    {"field": "Price", "property_a": "¥X", "property_b": "¥Y", "winner": "A", "badge": "Cheap"},
    {"field": "Commute", "property_a": "X min", "property_b": "Y min", "winner": "B", "badge": "Close"},
    {"field": "Layout", "property_a": "2LDK", "property_b": "2SLDK", "winner": "draw", "badge": "OK"},
    {"field": "Cafés nearby", "property_a": "Two indie cafés within 5-minute walk.", "property_b": "Nearest café is a 12-minute walk.", "winner": "A", "badge": "Close"},
    {"field": "Gym access", "property_a": "ANYTIME FITNESS 7 min walk; 24-hour.", "property_b": "Closest gym 20 min by bike.", "winner": "A", "badge": "Close"},
    {"field": "Dog walking", "property_a": "Riverside path; off-leash on weekdays.", "property_b": "Wide streets but little green space.", "winner": "A", "badge": "Good"},
    {"field": "Quiet at night", "property_a": "Faces inner courtyard; minimal noise.", "property_b": "Fronts a local road; late-night traffic.", "winner": "A", "badge": "Quiet"},
    {"field": "Sunlight", "property_a": "South-facing 8F; strong morning + afternoon light.", "property_b": "East-facing 3F; morning light only.", "winner": "A", "badge": "Bright"},
    {"field": "Laundromat", "property_a": "In-unit hookup; coin laundry 3 min walk.", "property_b": "Washer space only; coin laundry 10 min walk.", "winner": "A", "badge": "Close"}
  ],
  "final_recommendation": "Your complete recommendation following the OUTPUT STRUCTURE above with all 8 sections.",
  "property_a_score_total": 72,
  "property_b_score_total": 68,
  "score_breakdown": {
    "a": { "price": 75, "location": 70, "building": 68 },
    "b": { "price": 65, "location": 72, "building": 65 }
  }
}

Rules for structured fields:
- 'ai_points' must contain 2-4 items.
- Allowed 'kind' values: 'pro-a', 'pro-b', 'caution'.
- In each 'summary_table' row, include:
  - 'winner' (optional for schema compatibility): 'A', 'B', or 'draw'
  - 'badge' (optional for schema compatibility): a short adjective or symbol matching the response language. For 'ja' responses, 1-3 Japanese characters (examples: 安, 広, 近, 多, 新, 割安, 日当り, 可, 高). For 'en' responses, 1-12 English characters (examples: Cheap, Close, New, Quiet, Bright, Spacious, Good, OK, Far, Old). Never mix the two.
- The 'summary_table' MUST include 6 additional rows for lifestyle fit, appended after the standard property rows (price, commute, layout, area, building age, etc.). One row per aspect, in this exact order:
  1. Cafés nearby (proximity to cafés)
  2. Gym access
  3. Dog walking (dog-friendly environment)
  4. Quiet at night
  5. Sunlight (morning vs afternoon exposure based on orientation/floor when inferable, regardless of the user_profile importance weight)
  6. Laundromat access
- For each lifestyle row, 'property_a' and 'property_b' must be one concrete lived-experience sentence (<=80 chars EN). Use specific, vivid phrasing (e.g. "Two indie cafés within 5-minute walk" not "good café access"). No raw scores, no emojis.
- Localize the lifestyle 'field' label to the response language (use natural locale-appropriate names; do not emit English snake_case keys).
`;

  // Add language-specific instruction blocks
  if (language === 'en') {
    return englishPrompt + `

---
CRITICAL LANGUAGE INSTRUCTION (this is extremely important):
- You MUST write your ENTIRE response in natural, fluent English
- ALL JSON field values must be in English — no Japanese characters anywhere in the output
- ALL summary_table[].field values MUST be in English. Use ONLY these canonical English labels:
  Price, Commute, Building age, Layout, School district, Risk, Cafés nearby, Gym access, Dog walking, Quiet at night, Sunlight, Laundromat
- ALL summary_table[].badge values MUST be in English — short adjectives or symbols (1-12 characters). Examples: Cheap, Close, New, Quiet, Bright, Spacious, Good, OK, Far, Old, High, Low, Rare. Do NOT use Japanese characters (e.g. 安, 近, 可, 良, 静, 日, 割安 are forbidden).
- ALL summary_table[].property_a and property_b cell values must be in English
- ALL property_a_pros, property_a_cons, property_b_pros, property_b_cons items must be in English
- ALL ai_points[].body values must be in English
- The final_recommendation must be in English, following the 8-section OUTPUT STRUCTURE above
- The response language is English. Do not infer a different response language from field labels, badge characters, or property data.
`;
  }

  if (language === 'ja') {
    return englishPrompt + `

---
CRITICAL LANGUAGE INSTRUCTION (これは非常に重要です):
- You MUST write your ENTIRE response in natural, fluent Japanese (日本語で回答してください)
- All JSON field values (property_a_pros, property_a_cons, property_b_pros, property_b_cons, summary_table field names and values, and final_recommendation) must be in Japanese
- The final_recommendation field MUST be at least 300-450 words in Japanese (approximately 600-900 Japanese characters / 日本語で600〜900文字以上)
- Each item in property_a_pros, property_a_cons, property_b_pros, property_b_cons should be a complete, detailed sentence (2-3 sentences each, not single short phrases)
- Maintain the SAME level of detail, nuance, and thoroughness as the English requirements above
- Do NOT summarize or shorten the content - provide the same depth of analysis as you would in English
- Write in a friendly, professional tone suitable for Japanese readers (です・ます調を使用)
- Include all sections: [Recommended] AIおすすめ、[Profile] あなたに合う理由、[Persona] シティペルソナ、[Location] ライフスタイル＆立地、[Strategy] 戦略的視点、[Confidence] 決断の確信度、[Future] 将来の暮らし展望、[Watch-outs] 注意点
- JSONスキーマ例（日本語の値で出力）:
  {
    "property_a_pros": ["長所1", "長所2", "長所3"],
    "property_a_cons": ["懸念1", "懸念2", "懸念3"],
    "property_b_pros": ["長所1", "長所2", "長所3"],
    "property_b_cons": ["懸念1", "懸念2", "懸念3"],
    "ai_points": [
      {"kind": "pro-a", "body": "物件Aの優位点"},
      {"kind": "pro-b", "body": "物件Bの優位点"},
      {"kind": "caution", "body": "内見前に確認すべき注意点"}
    ],
    "summary_table": [
      {"field": "価格", "property_a": "¥X", "property_b": "¥Y", "winner": "A", "badge": "割安"},
      {"field": "通勤", "property_a": "X分", "property_b": "Y分", "winner": "B", "badge": "近"},
      {"field": "間取り", "property_a": "2LDK", "property_b": "2SLDK", "winner": "draw", "badge": "可"},
      {"field": "カフェへの近さ", "property_a": "徒歩5分以内に個性的なカフェが2軒あります。", "property_b": "最寄りカフェは駅前まで徒歩12分かかります。", "winner": "A", "badge": "近"},
      {"field": "ジムへのアクセス", "property_a": "ANYTIME FITNESS徒歩7分、24時間利用可。", "property_b": "徒歩圏内にジムはなく、自転車で20分です。", "winner": "A", "badge": "近"},
      {"field": "犬の散歩のしやすさ", "property_a": "川沿いの遊歩道が近く平日はリードなしで歩けます。", "property_b": "広い住宅街ですが近隣の緑地は少なめです。", "winner": "A", "badge": "良"},
      {"field": "夜間の静かさ", "property_a": "中庭に面し、22時以降の騒音はほぼありません。", "property_b": "生活道路に面し、深夜の車音が時折あります。", "winner": "A", "badge": "静"},
      {"field": "日当たり", "property_a": "南向き8階で朝から午後まで日差しが安定。", "property_b": "東向き3階で朝のみ日光、昼には陰ります。", "winner": "A", "badge": "日"},
      {"field": "コインランドリー", "property_a": "室内洗濯機設置可。徒歩3分にコインランドリー。", "property_b": "洗濯機置き場のみ。コインランドリー徒歩10分。", "winner": "A", "badge": "近"}
    ],
    "final_recommendation": "上記8セクションをすべて含む最終提案文",
    "property_a_score_total": 72,
    "property_b_score_total": 68,
    "score_breakdown": {
      "a": { "price": 75, "location": 70, "building": 68 },
      "b": { "price": 65, "location": 72, "building": 65 }
    }
  }
- 'ai_points' は2〜4件で出力すること
- 'kind' は 'pro-a' / 'pro-b' / 'caution' のみ使用すること
- 'summary_table' 各行に 'winner'（A/B/draw）と 'badge'（日本語1〜3文字、例: 安・広・近・多・新・割安・日当り・可・高）を含めること（後方互換のためoptional）
- property_a_score_total / property_b_score_total / score_breakdown の各スコアは数値（0〜100の整数）のまま出力すること（翻訳不要）
- summary_table の末尾に、ライフスタイル適合の6行を上記の順番（カフェへの近さ／ジムへのアクセス／犬の散歩のしやすさ／夜間の静かさ／日当たり／コインランドリー）で必ず追加すること。各行の 'field' は日本語で記述し、'property_a' と 'property_b' は具体的な体験を1文（≤50文字）で記述すること（スコアや数値の羅列ではなく実生活の描写）。
`;
  }

  return englishPrompt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate the session from the request
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Service-role client for transitioning comparisons.status. The anon client
    // can't UPDATE comparisons under RLS, but the report-status flow needs to
    // mark the comparison 'published' (or 'failed') regardless of who triggered
    // generation, so we use the service role for that one column.
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const setComparisonStatus = async (
      comparisonId: string,
      status: "published" | "failed",
      failureReason: string | null = null,
    ) => {
      try {
        const { error } = await supabaseServiceClient
          .from("comparisons")
          .update({ status, failure_reason: failureReason })
          .eq("id", comparisonId);
        if (error) {
          console.error(
            `Failed to set comparison ${comparisonId} status='${status}':`,
            error
          );
        }
      } catch (e) {
        console.error(
          `Exception updating comparison ${comparisonId} status='${status}':`,
          e
        );
      }
    };

    // Get session for user identification (optional)
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    // Basic rate limiting by IP or user ID
    const clientIP = req.headers.get("cf-connecting-ip") || "anonymous";
    const identifier = session?.user?.id || clientIP;

    // Check rate limiting
    const now = Date.now();
    const userRateLimit = rateLimiter.get(identifier) || {
      count: 0,
      lastReset: now,
    };

    // Reset counter if window has passed
    if (now - userRateLimit.lastReset > RATE_WINDOW) {
      userRateLimit.count = 0;
      userRateLimit.lastReset = now;
    }

    // Check if user has exceeded rate limit
    if (userRateLimit.count >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Increment rate limit counter
    userRateLimit.count++;
    rateLimiter.set(identifier, userRateLimit);

    // Parse request
    const requestData: RequestData = await req.json();
    const language = requestData.language || 'en'; // Default to English
    console.log('Language received:', language, 'Raw request language:', requestData.language);

    if (
      !requestData.property_a ||
      !requestData.property_b ||
      !requestData.user_profile
    ) {
      return new Response(
        JSON.stringify({ error: "Missing property or user profile data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate language parameter
    if (requestData.language && !['en', 'ja'].includes(requestData.language)) {
      return new Response(
        JSON.stringify({ error: "Invalid language. Supported languages: en, ja" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if comparison exists in DB
    if (requestData.comparison_id) {
      const { data: comparisonData, error: comparisonError } =
        await supabaseClient
          .from("comparisons")
          .select("id")
          .eq("id", requestData.comparison_id)
          .single();

      if (comparisonError || !comparisonData) {
        return new Response(
          JSON.stringify({ error: "Invalid comparison ID" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Call Gemini API to generate property recommendation
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format user profile for prompt
    const userProfileText = JSON.stringify(requestData.user_profile, null, 2);

    // Format property data for prompt
    const propertyAText = `
Property A: ${requestData.property_a.property_name || "N/A"}
- Address: ${requestData.property_a.address || "N/A"}
- Price: ${requestData.property_a.price_yen ? `¥${requestData.property_a.price_yen.toLocaleString()}` : "N/A"}
- Floor Plan: ${requestData.property_a.floor_plan || "N/A"}
- Commute Time: ${requestData.property_a.commute_minutes ? `${requestData.property_a.commute_minutes} minutes` : "N/A"}
- Property Type: ${requestData.property_a.property_type || "N/A"}
- Additional Notes: ${requestData.property_a.notes || "None"}
`;

    const propertyBText = `
Property B: ${requestData.property_b.property_name || "N/A"}
- Address: ${requestData.property_b.address || "N/A"}
- Price: ${requestData.property_b.price_yen ? `¥${requestData.property_b.price_yen.toLocaleString()}` : "N/A"}
- Floor Plan: ${requestData.property_b.floor_plan || "N/A"}
- Commute Time: ${requestData.property_b.commute_minutes ? `${requestData.property_b.commute_minutes} minutes` : "N/A"}
- Property Type: ${requestData.property_b.property_type || "N/A"}
- Additional Notes: ${requestData.property_b.notes || "None"}
`;

    // Prepare prompt for Gemini using the language-specific function, then
    // append the strict aspect-override section if the client specified
    // enabled_aspects. The override appears last so it takes precedence over
    // the earlier "must include 6 lifestyle rows" rule in the base prompt.
    const basePrompt = getPromptByLanguage(language, propertyAText, propertyBText, userProfileText);
    const prompt = basePrompt + buildAspectOverride(language, requestData.enabled_aspects);


    console.log("Prompt:", prompt);
    // Make request to Gemini API using cheaper Flash-Lite model (2.0)
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", errorData);
      if (requestData.comparison_id) {
        await setComparisonStatus(
          requestData.comparison_id,
          "failed",
          "gemini_api_error"
        );
      }
      return new Response(
        JSON.stringify({ error: "Error generating recommendation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini response:", JSON.stringify(geminiData));

    try {
      // Extract the JSON from Gemini's response
      const responseText =
        geminiData.candidates[0]?.content?.parts?.[0]?.text || "";
      console.log("Response text:", responseText);

      // Extract the JSON part from the response
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;
      console.log("Extracted JSON string:", jsonString);

      // Parse the extracted JSON
      let aiRecommendation: AIRecommendation;
      try {
        aiRecommendation = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("JSON string length:", jsonString.length);
        console.error("JSON string (first 500 chars):", jsonString.substring(0, 500));
        console.error("JSON string (last 500 chars):", jsonString.substring(jsonString.length - 500));
        throw parseError;
      }
      console.log("Parsed recommendation data:", aiRecommendation);

      // Store the recommendation in Supabase database
      let recommendationId: string | null = null;

      if (requestData.comparison_id) {
        try {
          console.log(
            "Attempting to save recommendation for comparison:",
            requestData.comparison_id
          );
          console.log("Session user ID:", session?.user?.id);

          const recommendationData = {
            comparison_id: requestData.comparison_id,
            user_id: session?.user?.id || null,
            property_a_pros: aiRecommendation.property_a_pros,
            property_a_cons: aiRecommendation.property_a_cons,
            property_b_pros: aiRecommendation.property_b_pros,
            property_b_cons: aiRecommendation.property_b_cons,
            summary_table: aiRecommendation.summary_table,
            ai_points: aiRecommendation.ai_points ?? null,
            property_a_score_total: aiRecommendation.property_a_score_total ?? null,
            property_b_score_total: aiRecommendation.property_b_score_total ?? null,
            score_breakdown: aiRecommendation.score_breakdown ?? null,
            final_recommendation: aiRecommendation.final_recommendation,
            user_profile: requestData.user_profile,
            // bead home-duo-insight-elg: persist the authored language so the
            // viewer UI can flag a locale mismatch. Fixed at authoring; the
            // report is never regenerated per viewer.
            language,
          };

          console.log(
            "Recommendation data to insert:",
            JSON.stringify(recommendationData, null, 2)
          );

          const { data: savedRecommendation, error: saveError } =
            await supabaseClient
              .from("recommendations")
              .insert([recommendationData])
              .select("id")
              .single();

          if (saveError) {
            console.error("Error saving recommendation:", saveError);
            console.error("Error details:", JSON.stringify(saveError, null, 2));
            // Recommendation is the gating artifact for a 'published' report —
            // if we couldn't store it, the comparison shouldn't appear on Feed.
            await setComparisonStatus(
              requestData.comparison_id,
              "failed",
              "recommendation_save_error"
            );
          } else {
            recommendationId = savedRecommendation?.id || null;
            console.log("Recommendation saved with ID:", recommendationId);
            await setComparisonStatus(requestData.comparison_id, "published");
          }
        } catch (saveError) {
          console.error("Error saving recommendation to database:", saveError);
          console.error(
            "Save error details:",
            JSON.stringify(saveError, null, 2)
          );
          await setComparisonStatus(
            requestData.comparison_id,
            "failed",
            "recommendation_save_exception"
          );
        }
      } else {
        console.log("No comparison_id provided, skipping database save");
      }

      // Return success response with AI recommendation and recommendation ID
      return new Response(
        JSON.stringify({
          ...aiRecommendation,
          recommendation_id: recommendationId,
          comparison_id: requestData.comparison_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      if (requestData.comparison_id) {
        await setComparisonStatus(
          requestData.comparison_id,
          "failed",
          "gemini_response_parse_error"
        );
      }
      return new Response(
        JSON.stringify({
          error: "Could not generate recommendation. Please try again.",
          details: error.message,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
