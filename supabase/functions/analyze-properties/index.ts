
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Required for CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Create a service role client for database operations (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get session for user identification (optional for rate limiting)
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    // Debug authentication
    console.log("Authorization header:", req.headers.get("Authorization"));
    console.log("Session data:", session);
    console.log("Session error:", sessionError);

    // Authentication is optional - we'll use service role for database operations

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
    const { property_url_a, property_url_b } = await req.json();

    if (!property_url_a || !property_url_b) {
      return new Response(
        JSON.stringify({ error: "Both property URLs are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if URLs are valid
    try {
      new URL(property_url_a);
      new URL(property_url_b);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid URLs provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. First call the parse-properties function to get the HTML content
    console.log("Calling parse-properties function");
    const parseResponse = await supabaseClient.functions.invoke("parse-properties", {
      body: { property_url_a, property_url_b },
    });

    if (parseResponse.error) {
      console.error("Parse function error:", parseResponse.error);
      return new Response(
        JSON.stringify({ error: "Error parsing property URLs: " + parseResponse.error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { html_property_a, html_property_b } = parseResponse.data;

    if (!html_property_a || !html_property_b) {
      return new Response(
        JSON.stringify({ error: "Failed to retrieve HTML content from one or both URLs" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Call Gemini API to extract property data from HTML
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare prompt for Gemini - use HTML content
    // Truncate HTML if too long to avoid token limit issues
    const maxHtmlLength = 20000; // Adjust based on Gemini's token limit
    const truncatedHtmlA = html_property_a.length > maxHtmlLength ?
      html_property_a.substring(0, maxHtmlLength) + "... [HTML truncated]" :
      html_property_a;
    const truncatedHtmlB = html_property_b.length > maxHtmlLength ?
      html_property_b.substring(0, maxHtmlLength) + "... [HTML truncated]" :
      html_property_b;

    const prompt = `You are DuoHome Advisor AI. Here are two raw real estate listing pages.
Extract structured property data for each property:
Property Name, Address, Price, Floor Plan, Commute Time, Property Type, Image URLs, Notes.
Return results as structured JSON for DuoHome Advisor.

FOR PROPERTY A:
${truncatedHtmlA}

FOR PROPERTY B:
${truncatedHtmlB}

Please return the data in this exact format (do not include any explanation, just the JSON):
{
  "property_a": {
    "property_name": "",
    "address": "",
    "price_yen": 0,
    "floor_plan": "",
    "commute_minutes": 0,
    "property_type": "",
    "image_urls": [],
    "notes": ""
  },
  "property_b": {
    "property_name": "",
    "address": "",
    "price_yen": 0,
    "floor_plan": "",
    "commute_minutes": 0,
    "property_type": "",
    "image_urls": [],
    "notes": ""
  }
}`;

    // Make request to Gemini API
    console.log("Calling Gemini API to extract data");
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
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error extracting property data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini response received");

    try {
      // Extract the JSON from Gemini's response
      const responseText =
        geminiData.candidates[0]?.content?.parts?.[0]?.text || "";

      // Extract the JSON part from the response
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;

      // Parse the extracted JSON
      const extractedData = JSON.parse(jsonString);
      console.log("Successfully parsed property data");

      // Insert property data into Supabase
      const propertyA = extractedData.property_a;
      const propertyB = extractedData.property_b;

      // Insert PropertyA using service role client (bypasses RLS)
      const { data: propertyAData, error: propertyAError } =
        await supabaseServiceClient.from("properties").insert([propertyA]).select();

      if (propertyAError) {
        throw new Error(
          `Error inserting property A: ${propertyAError.message}`
        );
      }

      // Insert PropertyB using service role client (bypasses RLS)
      const { data: propertyBData, error: propertyBError } =
        await supabaseServiceClient.from("properties").insert([propertyB]).select();

      if (propertyBError) {
        throw new Error(
          `Error inserting property B: ${propertyBError.message}`
        );
      }

      // Create comparison record
      const comparisonData = {
        property_a_id: propertyAData[0].id,
        property_b_id: propertyBData[0].id,
        user_id: session?.user?.id || null,
      };

      const { data: comparisonResult, error: comparisonError } =
        await supabaseServiceClient
          .from("comparisons")
          .insert([comparisonData])
          .select();

      if (comparisonError) {
        throw new Error(
          `Error creating comparison: ${comparisonError.message}`
        );
      }

      // Return success response with property data
      return new Response(
        JSON.stringify({
          message: "Properties analyzed successfully",
          comparison_id: comparisonResult[0].id,
          property_a: propertyAData[0],
          property_b: propertyBData[0],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      return new Response(
        JSON.stringify({
          error:
            "Could not extract data. Please check the URLs or try another.",
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
