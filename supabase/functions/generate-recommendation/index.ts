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

🏆 AI Recommendation
Start with the decision. Clearly state:
- which property you recommend
- the core reason in one sentence
- who this option fits best
- one important trade-off
3-4 sentences maximum.

👤 Why This Fits You
Translate the user's strongest priorities into natural lifestyle needs.
Explain briefly how EACH property aligns or conflicts with those needs using concrete examples.
Limit to 6-8 sentences total. Focus on decision clarity rather than description.

🧭 City Persona Insight
Infer the user's likely lifestyle archetype based on preferences.
Choose one primary persona (optionally one secondary):
- Urban Explorer
- Balanced Professional
- Future Family Builder
- Strategic Investor
Explain: what lifestyle this persona represents, why the user likely fits it, which property aligns better.
4-5 sentences maximum.

🏙️ Lifestyle & Location Snapshot
Use BOTH property data and general open-world knowledge about the neighborhood.
Incorporate understanding of: neighborhood character, walkability and daily convenience, typical resident lifestyle patterns, daytime vs nighttime atmosphere.
Important: focus on everyday living experience. Do NOT list tourist attractions. Translate geographic facts into lived experience.
Output format:
Property A:
- 2-3 concise lifestyle insights
Property B:
- 2-3 concise lifestyle insights

🧩 Strategic Perspective
Evaluate both properties using three lenses:
1. Long-term desirability of location
2. Rarity and resale resilience
3. Adaptability to future life changes
Explain briefly (5-6 sentences total).

✅ Decision Confidence
Evaluate how confident the user can be in making a decision now.
Consider: completeness of available data, alignment with priorities, unresolved risks.
Output: Decision Confidence: High / Medium / Low
Then explain briefly: why, whether the user can proceed confidently, or what should be verified next.
3-4 sentences. Tone should be supportive, not absolute.

🔮 Future Living Perspective
Simulate realistic future friction for each property.
Consider: lifestyle mismatch risk, perceived long-term value concerns, lifestyle identity mismatch.
Describe one realistic concern per property.
Then conclude which option is LESS likely to create long-term regret.
5-6 sentences total.

⚠️ Watch-outs
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
  "final_recommendation": "Your complete recommendation following the OUTPUT STRUCTURE above with all 8 sections."
}
`;

  // Add translation instruction for Japanese
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
- Include all sections: 🏆 AIおすすめ、👤 あなたに合う理由、🧭 シティペルソナ、🏙️ ライフスタイル＆立地、🧩 戦略的視点、✅ 決断の確信度、🔮 将来の暮らし展望、⚠️ 注意点
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
