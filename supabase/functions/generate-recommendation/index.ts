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
:white_check_mark: Summary (2–3 sentences)
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

## ✅ Expected Output in the final_recommendation field
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

✅ Summary
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

  // Add translation instruction for Japanese
  if (language === 'ja') {
    return englishPrompt + `

---
CRITICAL LANGUAGE INSTRUCTION (これは非常に重要です):
- You MUST write your ENTIRE response in natural, fluent Japanese (日本語で回答してください)
- All JSON field values (property_a_pros, property_a_cons, property_b_pros, property_b_cons, summary_table field names and values, and final_recommendation) must be in Japanese
- The final_recommendation field MUST be at least 400-600 words in Japanese (approximately 800-1200 Japanese characters / 日本語で800〜1200文字以上)
- Each item in property_a_pros, property_a_cons, property_b_pros, property_b_cons should be a complete, detailed sentence (2-3 sentences each, not single short phrases)
- Maintain the SAME level of detail, nuance, and thoroughness as the English requirements above
- Do NOT summarize or shorten the content - provide the same depth of analysis as you would in English
- Write in a friendly, professional tone suitable for Japanese readers (です・ます調を使用)
- Include all sections: 📍概要、🧠比較分析、⚖️メリット・デメリット、⚠️注意点、✅結論
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
