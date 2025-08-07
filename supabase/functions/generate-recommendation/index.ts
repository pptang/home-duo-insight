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
  has_pets: boolean;
  works_from_home: boolean;
  family_size: number;
  commute_priority: number;
  why_move: string;
  top_priority_1: string;
  top_priority_2: string;
  top_priority_3: string;
}

interface RequestData {
  comparison_id: string;
  property_a: PropertyData;
  property_b: PropertyData;
  user_profile: UserProfile;
  why_move: string;
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
    const userProfileText = `
- Has pets: ${requestData.user_profile.has_pets ? "Yes" : "No"}
- Works from home: ${requestData.user_profile.works_from_home ? "Yes" : "No"}
- Family size: ${requestData.user_profile.family_size} people
- Commute priority: ${
      requestData.user_profile.commute_priority
    }/5 (higher means more important)
- Why move: ${requestData.user_profile.why_move} 
- Top priority 1: ${requestData.user_profile.top_priority_1}
- Top priority 2: ${requestData.user_profile.top_priority_2}
- Top priority 3: ${requestData.user_profile.top_priority_3}
`;

    // Format property data for prompt
    const propertyAText = `
Property A: ${requestData.property_a.property_name}
- Address: ${requestData.property_a.address}
- Price: ¥${requestData.property_a.price_yen.toLocaleString()}
- Floor Plan: ${requestData.property_a.floor_plan}
- Commute Time: ${requestData.property_a.commute_minutes} minutes
- Property Type: ${requestData.property_a.property_type}
- Additional Notes: ${requestData.property_a.notes || "None"}
`;

    const propertyBText = `
Property B: ${requestData.property_b.property_name}
- Address: ${requestData.property_b.address}
- Price: ¥${requestData.property_b.price_yen.toLocaleString()}
- Floor Plan: ${requestData.property_b.floor_plan}
- Commute Time: ${requestData.property_b.commute_minutes} minutes
- Property Type: ${requestData.property_b.property_type}
- Additional Notes: ${requestData.property_b.notes || "None"}
`;

    // Prepare prompt for Gemini
    const prompt = `
You are a certified residential property advisor with over 10 years of experience helping families, professionals, and expats navigate the Japanese real estate market. You combine market insight, lifestyle alignment, and risk evaluation to help users make confident and personalized housing decisions.

## 🧠 Purpose  
Provide expert-level, honest, and localized advice to help users choose between two shortlisted residential properties in Japan — tailored to their unique lifestyle, preferences, and goals.

## 📝 Input  
Users will provide:

🏠 Two property listings, with details such as:  
Location (including station name and walking distance)  
Price, floor plan, square meters, floor level, building age  
Amenities, property URLs (optional)

👤 Personal and lifestyle context:  
Household composition (e.g., couple, family with kids, solo professional)  
Desired commute time and workplace location  
Neighborhood preferences (e.g., quiet, vibrant, near parks, pet-friendly, access to gym, supermarket, or school)  
Specific home needs (e.g., balcony, sunlight, elevator, natural light, parking space)

🧘 Daily life preferences (optional):  
     • Proximity to cafés / dog-walking areas / bikeable streets  
     • Sunlight preference (morning light vs. afternoon light)  
     • Noise sensitivity / privacy from neighbors  
     • Creative or cozy interior feel  
     • Onsite or nearby laundry  
     • Open view / feeling of spaciousness  
     • Minimalist layout or storage-heavy design

🧭 Decision Priorities (optional but recommended):  
What are the most important values or trade-offs in this decision?  
     (e.g., peace vs. walkability, investment potential vs. emotional comfort, modern design vs. size)

🔮 Future Lifestyle Considerations (optional):  
Any expected lifestyle changes in the next 2–5 years?  
     (e.g., planning to have a child, aging parent moving in, working from home, reselling or renting out the property)

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
Tailor your language to match the user’s lifestyle (e.g., peaceful, vibrant, practical, aspirational)

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

    // Make request to Gemini API
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
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
