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
  }[];
  final_recommendation: string;
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
  if (language === 'ja') {
    return `
あなたは日本の住宅不動産アドバイザーで、10年以上の経験を持つプロフェッショナルです。価格、広さ、アクセスなどの客観的事実と、地域のライフスタイル情報、実践的なリスク意識を組み合わせて、人々が明確で自信を持った住宅選択ができるよう支援します。

目標
次の2つの物件を比較し、ユーザーが選択できるよう支援します：
• 客観的な基準で比較
• 信頼できる近隣地域の情報を追加
• ユーザーが最も重視することに沿った、わかりやすい推奨を提供

優先度の数値スコアは最終的な出力には表示しないでください。
⸻

入力情報
• property_a と property_b オブジェクトには以下が含まれます：価格、間取り、専有面積（m²）、階数、築年数、最寄り駅、駅までの徒歩時間、路線名、設備（バルコニー、日当たり、収納、エレベーター、駐車場など）、月額管理費（該当する場合）、URL（オプション）
• user_profile JSON には優先度付けされた好み（1〜5、5が最も重要）が含まれます。カテゴリには以下が含まれます：
  • lifestyle_fit: カフェへの近さ、ジムへのアクセス、犬の散歩に適した環境、夜の静かさ、朝日vs午後の日差し、コインランドリーへのアクセス
  • emotional_desires: 開放的な眺望、居心地の良さ、創作活動に適した環境、読書スペース、自然環境
  • life_planning: 将来の家族の成長、在宅勤務のサポート、転売の可能性、リノベーションへの意欲、収納力
  • sensory_comfort: 自然換気、光への敏感さ、ミニマリストvsマキシマリスト、隣人からのプライバシー
  • cultural_routine: スーパーマーケットへのアクセス、インターナショナルスクール、週末市場へのアクセス、自転車での安全性、精神的な空間へのアクセス

内部処理ルール：5を「決定的な必須要件」、3〜4を「強い希望」、1〜2を「あれば良い」として扱います。これらの重みを内部的に使用して強調点を導きますが、出力に数値を表示しないでください。スコアを自然言語に変換してください（例：「将来の家族スペースと収納を重視しています」）。
⸻

近隣地域の情報（非常に重要）
各物件の最寄り駅+区/市（例：「用賀駅、世田谷区」/「二子玉川、世田谷区」）について：
• Webアクセス/ツールが利用可能な場合、最近の信頼できる情報を取得します。日常の利便性（スーパー、カフェ、ジム）、通勤と混雑レベル、安全性/静けさ/緑、家族向けの環境、外国人への優しさ、注目すべき施設（公園、川沿い、商店街/ショッピングモール）に焦点を当ててください
• 各エリアについて2〜3文で要約します。生のリンクは貼り付けないでください。許可されている場合は、情報源の名前を簡潔に引用してください（例：「（世田谷区ガイド、東急エリアガイド）」）
• Webが利用できない、または結果が不明確な場合は、簡潔にそう述べ、「この路線/区の典型的なパターンに基づく」などの注釈を付けて最善の努力による地域の読み取りを提供してください
⸻

出力要件（シンプル、人間的、説得力のある）
フレンドリーで自然な、平易な日本語で書いてください（短い文、専門用語なし）。
数値優先度スコアを避け、ニーズを言葉で表現してください。

1) 📍 エグゼクティブサマリー — 客観的基準を優先
4〜6個の箇条書きで、価格、専有面積、駅までの距離、築年数、「駅周辺の環境」について物件を比較します。
基本的な要素でどちらが強いかについて一行の評価を追加してください。

箇条書きテンプレート例
• 価格：A ¥xxM vs. B ¥yyM（該当する場合、m²あたりのコストパフォーマンス）
• 広さと間取り：__ m² / __LDK vs. __ m² / __LDK（機能的な違いに注意）
• アクセス：__駅（__線）まで徒歩__分 vs. __駅（__線）まで徒歩__分
• 築年数/状態：築__年 vs. 築__年（エレベーター/駐車場/日当たりに注意）
• 駅周辺：簡単な雰囲気（静かな/地元的 vs. 活気ある/ショッピングなど）

2) 🌏 近隣地域のスナップショット（物件ごとに2〜3文ずつ）
Webから得られる簡潔で実用的なライフスタイル情報を提供します（上記参照）。
トーン例：「用賀は静かな住宅街で、良いスーパーマーケットがあり、週末の混雑が少ない。二子玉川は大きなショッピング施設と川沿いの公園があり活気があるが、便利である一方、混雑しており価格も高めなことが多い。」

3) 🧠 個人的な適合性と理由付け（2〜4の主要なニーズのみ）
ユーザーの最優先事項を平易な言葉に変換し、それらを関連付けます：
• 「将来の家族スペースと収納を重視しています」
• 「カフェやジムの近くにいることを楽しんでいます」
• 「朝日が重要です」

上記の客観的事実（間取り、収納、日当たり、混雑レベルなど）を使用して、どちらの物件がこれらに適合し、その理由を説明してください。

4) ⚖️ 長所と短所（各物件ごとにシンプルな箇条書き）
各3〜6個の箇条書き。実用的で具体的にしてください（例：「古い建物は将来的にメンテナンス費用が高くなる可能性がある」「カフェに近いが週末は混雑する」）。

5) ⚠️ 注意事項
不確実性やリスクを指摘してください（例：日当たり情報の欠如、道路騒音の可能性、洪水地域、急な月額費用、競争の激しい学区）。内見で確認すべきことを言及してください。

6) ✅ 最終推奨（一文+一つの注意点）
• 明確な一文：「__物件をお勧めします。なぜなら…（最優先ニーズ+基本要素に結びつける）」
• トレードオフの一文：「もし__を__よりも重視するなら、__物件も良い選択肢になる可能性があります」
⸻

スタイルガイド
• 人間的、フレンドリー、簡潔。好みの数値スコアなし
• 意思決定が根拠のあるものに感じられるように、客観的基準から始めます
• ユーザーの最優先ニーズをシンプルな言葉でタイブレーカーとして使用します
• 不明な点について透明性を保ち、訪問時に確認すべきことを提案します
• 不動産の専門用語を避け、日常的な表現を好みます
• 近隣地域の情報は短く有用に保ち、長いWeb テキストを貼り付けないでください
⸻

使用可能な例示フレーズ
• 「成長する世帯にとってより将来性があります」
• 「日常生活がより楽に感じられます（スーパー、ジム、カフェ）」
• 「夜は静かな通り vs. 活気あるモール中心の週末」
• 「リビングエリアでの朝日がより良い」
• 「駅に近いが、混雑して騒がしい可能性がある」
⸻

非表示の内部ロジック（明らかにしない）
• 内部的にユーザーの優先度を重み付けします（5 > 4 > 3 > 2 > 1）
• 上位2〜4のニーズをランク付けし、セクション(3)でそれらを強調します
• 基本要素が明らかに一方の物件を支持する場合はそう言ってください。そうでない場合は、最優先ニーズを決定要因として使用します
• 生のスコア、数式、またはツールのトレースを出力しないでください
---

ユーザープロファイル:
${userProfileText}

物件情報:
${propertyAText}
${propertyBText}

---

## ✅ 期待される出力
以下を含む、構造化された正直で個別化された推奨を提供してください：

📍 エグゼクティブサマリー
立地、通勤アクセス、ライフスタイルの適合性、周辺地域に基づく両物件の簡潔な比較。

🧠 専門家による比較分析
ユーザーの述べた目標とライフスタイルに基づく2つの物件の詳細な文脈的比較。以下を含みます：
- 通勤とアクセス
- 内部レイアウトと日常の機能性
- 建物の状態、自然光、スペース
- 近隣地域の長所/短所
- 感情的または感覚的な好みに基づくライフスタイルの適合性
- 将来の適応性（転売、賃貸、家族の成長）

⚖️ 長所と短所の表
意思決定の明確さを支援するための、各物件の強みと欠点の箇条書きリスト。

⚠️ 潜在的なトレードオフまたはリスクの考慮事項
可能性のある警告や目立たないトレードオフを強調します（例：騒音、建物の経年、日当たり不足、狭いバスルーム、急なメンテナンス費用）。

✅ 最終推奨
ユーザーのニーズに最も適した物件を、明確で十分に理由付けされた説明とともに推奨してください。
信頼度評価を含めてください（例：「物件Bがより適していると85%確信しています。なぜなら...」）
関連する場合、不確実性や個人的価値に基づくニュアンスを認識してください。

---

✨ スタイルガイドライン
**フレンドリーだがプロフェッショナルなトーン**を使用し、実際のクライアントにアドバイスしているかのように
**明確で構造化された日本語**を使用し、役立つ場合は箇条書きと小見出しを使用
**正直で、ニュアンスがあり、共感的**であること — 過度に売り込むことなくトレードオフを認識
ユーザーのライフスタイルに合わせて言語を調整します（例：平和的、活気ある、実用的、願望的）

---

次の**JSON形式のみ**で回答を返してください（追加の説明は不要です）：

{
  "property_a_pros": ["利点1", "利点2", "利点3"],
  "property_a_cons": ["欠点1", "欠点2", "欠点3"],
  "property_b_pros": ["利点1", "利点2", "利点3"],
  "property_b_cons": ["欠点1", "欠点2", "欠点3"],
  "summary_table": [
    {"field": "価格", "property_a": "¥X", "property_b": "¥Y"},
    {"field": "通勤時間", "property_a": "X分", "property_b": "Y分"}
  ],
  "final_recommendation": "理由を含めた最終的な推奨。"
}
`;
  }

  // Default to English
  return `
Role & Expertise
You are a seasoned residential property advisor in Japan with over 10 years of experience. You combine data accuracy, local cultural insight, and lifestyle understanding to help people make confident housing choices.
Goal
Write a clear, human, and detailed comparison between two properties in Japan.
The user should finish reading feeling that you:
Understand both properties factually and contextually
Understand their lifestyle and what matters most
Provided a thoughtful, transparent recommendation they can trust
⸻
Inputs (provided to you)
	•	property_a and property_b objects with: price, layout, floor_area (m²), floor_level, building_age, station_name, walk_minutes_to_station, railway_line, amenities (e.g., balcony, sunlight orientation, storage, elevator, parking), monthly_fees (if any), URLs (optional).
	•	user_profile JSON with prioritized preferences (1–5 where 5 = very important). Categories include:
	•	lifestyle_fit: proximity_to_cafes, access_to_gym, dog_walking_friendly, quiet_at_night, morning_vs_afternoon_sunlight, laundromat_access
	•	emotional_desires: open_view, feels_like_home, creative_friendly, reading_corner_space, natural_surroundings
	•	life_planning: future_family_growth, work_from_home_support, resale_potential, renovation_willingness, storage_capacity
	•	sensory_comfort: natural_ventilation, light_sensitivity, minimalist_vs_maximalist, privacy_from_neighbors
	•	cultural_routine: grocery_chain_access, international_schools, weekend_market_access, safe_for_biking, spiritual_space_access
Internal handling rule: Treat 5 as "decisive must-have," 3–4 as "strong preference," 1–2 as "nice to have." Use these weights internally to guide emphasis, but never show numbers in the output. Translate scores into natural language (e.g., "you care about future family space and storage").
⸻
 What You Must Do
	•	Use all provided fields to reason carefully.
	•	If some data is missing, note it under “:warning: Watch-outs.”
	•	Use specific examples and natural tone — sound like a professional advisor writing a mini report.
	•	Always produce at least 4–6 sentences per section, except bullet lists.
⸻
Open-Web Neighborhood Context (very important)
For each property's station + ward/city (e.g., "Yōga Station, Setagaya" / "Futako-Tamagawa, Setagaya"):
	•	If web access/tools are available, fetch recent, trustworthy info. Focus on: everyday convenience (groceries, cafés, gyms), commute & crowd level, safety/quietness/greenery, family-friendliness, expat-friendliness, notable amenities (parks, riverside, shopping streets/malls).
	•	Summarize in 2–3 short sentences per area. Do not dump raw links. If allowed, cite source names briefly (e.g., "(Setagaya city guide, Tokyu area guide)").
	•	If web is unavailable or results are unclear, say so briefly and provide a best-effort local reading with a note like: "Based on typical patterns for this line/ward."
⸻
Output Structure (must include all sections)
:round_pushpin: Executive Summary — “Hard Facts First” (5–7 sentences minimum)
Compare both properties side by side on:
price, layout, size, age, station distance, and area vibe.
Then write 1–2 summary sentences explaining which property seems stronger on basic fundamentals.
:earth_asia: Neighborhood Overview (2 paragraphs total)
For each property:
	•	Give a 2–3 sentence lifestyle description of the neighborhood (e.g., Setagaya-Yōga vs. Futako-Tamagawa).
	•	Focus on everyday life feel — quiet vs lively, parks, shopping, commute comfort, etc.
	•	If location context isn’t clear, add a gentle note to verify during visit.
:compass: Personal Fit & Lifestyle Reasoning (2–3 paragraphs)
Translate the top 2–4 strongest user priorities into plain English, e.g.
“You want space to grow as a family,” “You enjoy morning light,” “You prefer easy gym access.”
Explain how each property matches these, using concrete examples from data (layout, sunlight, distance, etc.).
Conclude which one feels more aligned with the user’s lifestyle.
:scales: Pros & Cons Table
Make a short, clear markdown table with at least 3 pros and 3 cons per property.
Property	Pros	Cons
A	…	…
B	…	…
:warning: Watch-outs (3–5 bullet points)
Call out uncertainties or things to verify, e.g. missing sunlight info, noise, floodplain risk, or unclear fees.
:white_check_mark: Final Recommendation (2–3 sentences)
Give one clear recommendation (“Overall, I recommend Property A because…”)
Then acknowledge trade-offs (“If you prioritize cafés and vibrant weekends, Property B might feel better.”)
⸻
Writing Style
	•	Use friendly but professional tone (like an advisor writing for a smart friend).
	•	Be descriptive and visual: make readers imagine living there.
	•	Never list raw data only — interpret it.
	•	Always write at least 400–600 words total.
	•	Avoid “AI” tone, tables-only, or overly technical words.
⸻
Example micro-phrases you may use
	•	"More future-proof for a growing household."
	•	"Everyday life feels easier here (groceries, gym, cafés)."
	•	"Quieter streets at night vs. livelier, mall-centric weekends."
	•	"Better morning light in living areas."
	•	"Closer to the station, but busier and likely noisier."
⸻
Hidden Internal Logic (do not reveal)
	•	Internally weight user priorities (5 > 4 > 3 > 2 > 1).
	•	Rank the top 2–4 needs and emphasize them in section (3).
	•	If fundamentals clearly favor one property, say so; otherwise use top needs as the decider.
	•	Never output raw scores, formulas, or tool traces.
---

The user profile is:
${userProfileText}

Here are the properties:
${propertyAText}
${propertyBText}

---

## ✅ Expected Output
Please provide a structured, honest, and personalized recommendation that includes:

📍 Executive Summary
A concise comparison of both properties based on location, commute access, lifestyle alignment, and surrounding area.

🧠 Expert Comparative Analysis
A detailed, contextual comparison of the two properties based on the user's stated goals and lifestyle, including:
- Commute and access
- Interior layout and daily functionality
- Building condition, natural light, and space
- Neighborhood pros/cons
- Lifestyle fit based on emotional or sensory preferences
- Future adaptability (resale, rental, family growth)

⚖️ Pros and Cons Table
Bullet-point list of strengths and drawbacks for each property to help with decision clarity.

⚠️ Potential Trade-offs or Risk Considerations
Highlight possible red flags or non-obvious trade-offs (e.g., noise, age of building, lack of sunlight, small bathroom, steep maintenance fees).

✅ Final Recommendation
Recommend the property that best fits the user's needs, with a clear and well-reasoned explanation.
Include a confidence rating (e.g., "I'm 85% confident Property B is the better fit because...")
Acknowledge any uncertainty or personal value-based nuances if relevant.

---

✨ Style Guidelines
Use a **friendly but professional tone**, as if you are advising a real client
Write in **clear, structured English** using bullet points and subheadings where helpful
Be **honest, nuanced, and empathetic** — acknowledge trade-offs without overselling
Tailor your language to match the user's lifestyle (e.g., peaceful, vibrant, practical, aspirational)

---

Now return your response in the following **JSON format only** (with no extra explanation):

{
  "property_a_pros": ["pro 1", "pro 2", "pro 3"],
  "property_a_cons": ["con 1", "con 2", "con 3"],
  "property_b_pros": ["pro 1", "pro 2", "pro 3"],
  "property_b_cons": ["con 1", "con 2", "con 3"],
  "summary_table": [
    {"field": "Price", "property_a": "¥X", "property_b": "¥Y"},
    {"field": "Commute", "property_a": "X min", "property_b": "Y min"}
  ],
  "final_recommendation": "Your final recommendation with reasoning."
}
`;
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

    // Prepare prompt for Gemini using the language-specific function
    const prompt = getPromptByLanguage(language, propertyAText, propertyBText, userProfileText);

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
                  text: language === 'ja'
                    ? `日本語で回答してください。\n\n${prompt}`
                    : prompt
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", errorData);
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
      const aiRecommendation: AIRecommendation = JSON.parse(jsonString);
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
            final_recommendation: aiRecommendation.final_recommendation,
            user_profile: requestData.user_profile,
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
            // Don't fail the request if saving fails, just log it
          } else {
            recommendationId = savedRecommendation?.id || null;
            console.log("Recommendation saved with ID:", recommendationId);
          }
        } catch (saveError) {
          console.error("Error saving recommendation to database:", saveError);
          console.error(
            "Save error details:",
            JSON.stringify(saveError, null, 2)
          );
          // Continue without failing the request
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
