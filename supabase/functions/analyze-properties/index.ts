
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

    console.log("Authorization header:", req.headers.get("Authorization"));
    console.log("Session data:", session);
    console.log("Session error:", sessionError);

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
    const { property_url_a, property_url_b, user_id } = await req.json();

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

    // Log the user_id we received
    console.log("Received user_id from request:", user_id);

    // 1. First call the parse-properties function to get the HTML content
    console.log("Calling parse-properties function with URLs:", { property_url_a, property_url_b });
    let parseResponse;
    try {
      parseResponse = await supabaseClient.functions.invoke("parse-properties", {
        body: { property_url_a, property_url_b },
        headers: {
          Authorization: req.headers.get("Authorization") || "",
        },
      });
    } catch (invokeError) {
      console.error("Error invoking parse-properties function:", invokeError);
      return new Response(
        JSON.stringify({
          error: "Failed to invoke parse-properties function",
          details: invokeError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (parseResponse.error) {
      console.error("Parse function error:", parseResponse.error);
      return new Response(
        JSON.stringify({
          error: "Error parsing property URLs",
          details: parseResponse.error.message || parseResponse.error,
          statusCode: parseResponse.error.status || 'unknown'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { html_property_a, html_property_b, images_property_a, images_property_b } = parseResponse.data || {};

    if (!html_property_a || !html_property_b) {
      console.error("Missing HTML content from parse response:", {
        hasPropertyA: !!html_property_a,
        hasPropertyB: !!html_property_b,
        parseResponseData: parseResponse.data
      });
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve HTML content from one or both URLs",
          details: {
            property_a_retrieved: !!html_property_a,
            property_b_retrieved: !!html_property_b,
            response_data: parseResponse.data
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("HTML content retrieved successfully", {
      property_a_length: html_property_a.length,
      property_b_length: html_property_b.length
    });

    // Debug: Log sample content to see what we're working with
    console.log("Sample HTML A content:", html_property_a.substring(0, 1000));
    console.log("Sample HTML B content:", html_property_b.substring(0, 1000));

    // Check if HTML contains Japanese property-related keywords
    const keyTerms = ['専有面積', '居住面積', '面積', '徒歩', '築年月', '建築年', '竣工年', '賃料', '家賃', '価格', '㎡', '平米'];
    const foundTermsA = keyTerms.filter(term => html_property_a.includes(term));
    const foundTermsB = keyTerms.filter(term => html_property_b.includes(term));

    console.log("Property A contains key terms:", foundTermsA);
    console.log("Property B contains key terms:", foundTermsB);

    // Use images from parse-properties response, with optional fallback
    console.log("Using images from parse-properties response");

    // Use images from parse-properties if available, otherwise fallback to extraction
    const parsedImagesA = images_property_a || [];
    const parsedImagesB = images_property_b || [];

    console.log("ANALYZE-PROPERTIES: Images from parse-properties with detailed analysis:", {
      property_a_images: parsedImagesA.length,
      property_b_images: parsedImagesB.length,
      sample_a_full: parsedImagesA.slice(0, 3),
      sample_b_full: parsedImagesB.slice(0, 3),
      sample_a_has_w_param: parsedImagesA.slice(0, 3).map(url => url.includes('&w=')),
      sample_b_has_w_param: parsedImagesB.slice(0, 3).map(url => url.includes('&w=')),
      sample_a_has_h_param: parsedImagesA.slice(0, 3).map(url => url.includes('&h=')),
      sample_b_has_h_param: parsedImagesB.slice(0, 3).map(url => url.includes('&h='))
    });

    // Fallback image extraction only if no images from parse-properties
    const fastExtractImages = (html: string): string[] => {
      const images: string[] = [];

      // Fast regex for basic image extraction - limit complexity
      const imgPattern = /<img[^>]+src=["']([^"']+)["']/gi;
      const matches = html.match(imgPattern) || [];

      // Process only first 10 matches to avoid timeout
      for (let i = 0; i < Math.min(matches.length, 10); i++) {
        const srcMatch = matches[i].match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
          let url = srcMatch[1];

          // Quick URL validation
          if (url.startsWith('//')) url = 'https:' + url;
          if (url.startsWith('http') && /\.(jpg|jpeg|png|webp)/i.test(url)) {
            // Quick filter out obvious non-property images
            if (!/(icon|logo|btn|nav|menu)/i.test(url)) {
              images.push(url);
            }
          }
        }
      }

      return images.slice(0, 5); // Limit to 5 images max
    };

    // Use parsed images if available, otherwise use fallback extraction
    const fallbackImagesA = parsedImagesA.length > 0 ? parsedImagesA : fastExtractImages(html_property_a);
    const fallbackImagesB = parsedImagesB.length > 0 ? parsedImagesB : fastExtractImages(html_property_b);

    console.log("Final image results:", {
      property_a_images_found: fallbackImagesA.length,
      property_b_images_found: fallbackImagesB.length,
      property_a_source: parsedImagesA.length > 0 ? "parse-properties" : "fallback-extraction",
      property_b_source: parsedImagesB.length > 0 ? "parse-properties" : "fallback-extraction",
      sample_a: fallbackImagesA.slice(0, 3),
      sample_b: fallbackImagesB.slice(0, 3)
    });

    // Simplified logging to avoid timeout
    if (fallbackImagesA.length > 0) {
      console.log("Property A - found", fallbackImagesA.length, "images from", parsedImagesA.length > 0 ? "parse-properties" : "fallback extraction");
    }
    if (fallbackImagesB.length > 0) {
      console.log("Property B - found", fallbackImagesB.length, "images from", parsedImagesB.length > 0 ? "parse-properties" : "fallback extraction");
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

    // Send full HTML content directly to Gemini without preprocessing
    console.log(`Sending full HTML content to Gemini - Property A: ${html_property_a.length} chars, Property B: ${html_property_b.length} chars`);

    const fullHtmlA = html_property_a;
    const fullHtmlB = html_property_b;

    const prompt = `You are DuoHome Advisor AI. Extract structured property data from these Japanese real estate listing pages.

Focus on extracting: Property Name, Address, Price, Floor Plan, Commute Time, Property Type, Private Area, Building Age, Notes, and Image URLs.

CRITICAL EXTRACTION GUIDELINES:
- Price: Look for 賃料, 家賃, 価格, 売買価格, 万円, 円. Extract rental/purchase price in yen, convert to numeric value
- Address: Full address including 都道府県 (prefecture), 市区町村 (city/ward), detailed location
- Commute Time: Look for 徒歩, 駅まで, 分, minutes, walking time to nearest station
- Private Area: Look for 専有面積, 居住面積, 面積, ㎡, 平米, 平方メートル, m². Extract exclusive floor area in square meters
- Building Age: Look for 築年月, 建築年, 竣工年, 築, 年, 月. Extract construction year and month, calculate age from current date (2025)
- Floor Plan: Room configuration like 1K, 1DK, 1LDK, 2DK, 2LDK, 3LDK, etc.

JAPANESE TERMINOLOGY TO LOOK FOR:
- 専有面積 / 居住面積 / 面積 = Private Area
- 徒歩○分 / ○分歩 / 駅まで○分 = Walking time to station
- 築○年○月 / 建築年○年 / 竣工○年 = Construction date
- 賃料 / 家賃 / 月額 = Rent
- 価格 / 売買価格 / 販売価格 = Sale price

SEARCH PATTERNS:
- For area: Look for numbers followed by ㎡, 平米, 平方メートル, m²
- For commute: Look for numbers followed by 分, minutes, combined with 徒歩, 駅
- For building age: Look for numbers followed by 年, 月, combined with 築, 建築, 竣工
- Check both visible text AND data attributes, meta tags, JSON-LD structured data

CRITICAL FOR MAIN PROPERTY IMAGE EXTRACTION (SUUMO-OPTIMIZED):
- PRIORITIZE main/hero/primary property images first - these are the most important
- SUUMO-SPECIFIC IMAGE PATTERNS to look for:
  1. HIGHEST PRIORITY: URLs with pattern like "73125861_0001.jpg", "76216406_0095.jpg" (property ID + sequential numbers)
  2. SUUMO resizeImage URLs: "resizeImage?src=gazo%2Fbukken%2F040%2FN010000%2Fimg%2F861%2F73125861%2F73125861_0001.jpg"
  3. Direct SUUMO paths: "img01.suumo.com/front/gazo/bukken/" or "img01.suumo.com/jj/resizeImage"
  4. Japanese text context: 現地外観写真, 浴室, 間取り図, リビング, キッチン, 寝室, 玄関
- IMAGE NUMBERING PRIORITY for SUUMO:
  1. _0001, _0002, _0003 (first few images are usually main property photos)
  2. _01, _02, _03 (alternative numbering)
  3. Lower numbers generally = more important property images
- SUUMO ROOM TYPES to prioritize:
  - 現地外観写真 (exterior photos) - HIGHEST priority
  - 間取り図 (floor plan) - HIGH priority
  - リビング (living room), キッチン (kitchen), 浴室 (bathroom), 寝室 (bedroom)
- EXCLUDE completely: spacer.gif, icons, logos, buttons, navigation, thumbnails, UI elements
- Look for images in <img> tags, data-src attributes, markdown image syntax like [![alt](url)]
- Return 5-10 highest quality MAIN property images per property, prioritizing low-numbered SUUMO images
- If no main images found, return empty array []

FOR PROPERTY A:
${fullHtmlA}

FOR PROPERTY B:
${fullHtmlB}

IMPORTANT: Search thoroughly through ALL text content. If you cannot find specific values, set them to null (not 0). Only use 0 for actual zero values.

Return only this JSON format (no explanations):
{
  "property_a": {
    "property_name": "",
    "address": "",
    "price_yen": null,
    "floor_plan": "",
    "commute_minutes": null,
    "property_type": "",
    "private_area_sqm": null,
    "construction_year": null,
    "construction_month": null,
    "building_age_years": null,
    "image_urls": [],
    "notes": ""
  },
  "property_b": {
    "property_name": "",
    "address": "",
    "price_yen": null,
    "floor_plan": "",
    "commute_minutes": null,
    "property_type": "",
    "private_area_sqm": null,
    "construction_year": null,
    "construction_month": null,
    "building_age_years": null,
    "image_urls": [],
    "notes": ""
  }
}`;

    // Make request to Gemini API
    console.log("Calling Gemini API to extract data");
    let geminiResponse;
    try {
      geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
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
              maxOutputTokens: 4096, // Increased from 2048 to allow full response
            },
          }),
        }
      );
    } catch (fetchError) {
      console.error("Network error calling Gemini API:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Network error connecting to Gemini API",
          details: fetchError.message
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({ error: "Could not parse error response" }));
      console.error("Gemini API error:", {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        errorData
      });
      return new Response(
        JSON.stringify({
          error: "Gemini API request failed",
          status: geminiResponse.status,
          statusText: geminiResponse.statusText,
          details: errorData
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let geminiData;
    try {
      geminiData = await geminiResponse.json();
      console.log("Gemini response received successfully");
    } catch (jsonError) {
      console.error("Error parsing Gemini response JSON:", jsonError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON response from Gemini API",
          details: jsonError.message
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      // Extract the JSON from Gemini's response
      const responseText =
        geminiData.candidates[0]?.content?.parts?.[0]?.text || "";

      console.log("Raw Gemini response text:", responseText.substring(0, 500) + "...");

      // Extract the JSON part from the response
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/({[\s\S]*})/);
      let jsonString = jsonMatch ? jsonMatch[1] : responseText;

      // Clean HTML entities from JSON string before parsing
      jsonString = jsonString
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      console.log("Extracted and cleaned JSON string:", jsonString.substring(0, 500) + "...");

      // Parse the extracted JSON
      let extractedData;
      try {
        extractedData = JSON.parse(jsonString);
        console.log("Successfully parsed property data");
        console.log("Extracted data structure:", JSON.stringify(extractedData, null, 2));

        // Log specific field extraction for debugging
        if (extractedData.property_a) {
          console.log("Property A extracted fields:", {
            private_area_sqm: extractedData.property_a.private_area_sqm,
            commute_minutes: extractedData.property_a.commute_minutes,
            construction_year: extractedData.property_a.construction_year,
            construction_month: extractedData.property_a.construction_month,
            building_age_years: extractedData.property_a.building_age_years
          });
        }
        if (extractedData.property_b) {
          console.log("Property B extracted fields:", {
            private_area_sqm: extractedData.property_b.private_area_sqm,
            commute_minutes: extractedData.property_b.commute_minutes,
            construction_year: extractedData.property_b.construction_year,
            construction_month: extractedData.property_b.construction_month,
            building_age_years: extractedData.property_b.building_age_years
          });
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError.message);
        console.error("Failed JSON string:", jsonString);
        throw new Error(`Failed to parse JSON from Gemini response: ${parseError.message}. Raw response: ${responseText.substring(0, 1000)}`);
      }

      // Validate extracted data structure
      if (!extractedData.property_a || !extractedData.property_b) {
        console.error("Missing property data in extracted response:", extractedData);
        throw new Error(`Invalid data structure from Gemini. Missing property_a or property_b. Received: ${JSON.stringify(extractedData)}`);
      }

      // Process and validate extracted data with new fields and enhanced image handling
      const processPropertyData = (propertyData: {
        property_name?: string;
        address?: string;
        price_yen?: number;
        floor_plan?: string;
        commute_minutes?: number;
        property_type?: string;
        private_area_sqm?: number;
        construction_year?: number;
        construction_month?: number;
        building_age_years?: number;
        image_urls?: string[];
        notes?: string;
      }, fallbackImages: string[]) => {
        // Calculate building age if construction year is provided
        let building_age_years = null;
        if (propertyData.construction_year && propertyData.construction_year > 1900) {
          const currentYear = 2025;
          const currentMonth = 9; // September
          const constructionMonth = propertyData.construction_month || 1;

          building_age_years = currentYear - propertyData.construction_year;
          if (currentMonth < constructionMonth) {
            building_age_years -= 1;
          }
          building_age_years = Math.max(0, building_age_years); // Ensure non-negative
        }

        // Enhanced image processing with prioritization for main property images
        const validateImageUrl = (url: string): boolean => {
          try {
            // Decode HTML entities first
            const decodedUrl = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            new URL(decodedUrl);

            // Check for image extensions, including URL-encoded ones in query parameters
            const hasDirectExtension = decodedUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) !== null;
            const hasEncodedExtension = decodedUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) !== null ||
                                      decodedUrl.includes('%2F') && decodedUrl.match(/(jpg|jpeg|png|webp|gif)/i) !== null;

            return hasDirectExtension || hasEncodedExtension;
          } catch {
            return false;
          }
        };

        const prioritizeImages = (images: string[]): Array<{url: string, priority: number}> => {
          return images.filter(validateImageUrl).map(url => {
            // Decode HTML entities to get clean URL
            const decodedUrl = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

            let priority = 50; // Base priority

            // High priority for main/hero/primary images
            if (decodedUrl.match(/(?:main|hero|primary|first|top|default)/i)) priority += 40;

            // High priority for Japanese property keywords
            if (decodedUrl.match(/(?:gazo|shashin|bukken|madori|heimen)/i)) priority += 35;

            // High priority for room/interior keywords
            if (decodedUrl.match(/(?:room|interior|living|bedroom|kitchen|bath|exterior|view)/i)) priority += 30;
            if (decodedUrl.match(/(?:居間|寝室|キッチン|バスルーム|玄関|外観|内観)/i)) priority += 30;

            // Medium-high priority for large dimensions and first images
            if (decodedUrl.match(/(?:1200|1000|800|large|big|xl)/i)) priority += 25;
            if (decodedUrl.match(/(?:01|001|_1\.|\/1\.)/i)) priority += 20;

            // Medium priority for property-specific paths
            if (decodedUrl.match(/\/(?:gazo|bukken|img|images|photo|gallery)\//i)) priority += 15;

            // Lower priority for numbered images beyond the first few
            if (decodedUrl.match(/(?:02|03|04|002|003|004|_2\.|_3\.|_4\.)/i)) priority += 5;

            // Penalty for likely UI/navigation images
            if (decodedUrl.match(/(?:thumb|nav|menu|btn|icon|arrow|logo)/i)) priority -= 30;

            return {url: decodedUrl, priority}; // Return decoded URL
          });
        };

        // Process and prioritize images from both sources
        const geminiImages = propertyData.image_urls || [];
        const geminiPrioritized = prioritizeImages(geminiImages);
        const fallbackPrioritized = prioritizeImages(fallbackImages);

        console.log("ANALYZE-PROPERTIES: Before prioritization:", {
          gemini_images_count: geminiImages.length,
          fallback_images_count: fallbackImages.length,
          gemini_sample: geminiImages.slice(0, 3),
          fallback_sample: fallbackImages.slice(0, 3),
          gemini_has_w_params: geminiImages.slice(0, 3).map(url => url.includes('&w=')),
          fallback_has_w_params: fallbackImages.slice(0, 3).map(url => url.includes('&w='))
        });

        // Combine and sort by priority (Gemini images get much higher bonus as they have correct w= and h= params)
        const allPrioritizedImages = [
          ...geminiPrioritized.map(img => ({...img, priority: img.priority + 1000})), // Large Gemini bonus for w= and h= params
          ...fallbackPrioritized
        ];


        // Remove duplicates, keeping highest priority version with full URL (including query params)
        const uniqueImages = new Map<string, {url: string, priority: number}>();
        allPrioritizedImages.forEach(({url, priority}) => {
          // Use full URL (including query params) as key to preserve unique parameter combinations
          if (!uniqueImages.has(url) || uniqueImages.get(url)!.priority < priority) {
            uniqueImages.set(url, {url, priority}); // Store full URL with query params
          }
        });

        // Sort by priority and take top images with full URLs including query params
        const finalImages = Array.from(uniqueImages.values())
          .sort((a, b) => b.priority - a.priority)
          .map(item => item.url) // Extract the full URL with query params
          .slice(0, 10);

        console.log("ANALYZE-PROPERTIES: Final image prioritization results:", {
          gemini_images: geminiImages.length,
          fallback_images: fallbackImages.length,
          final_images: finalImages.length,
          top_3_images: finalImages.slice(0, 3),
          final_has_w_params: finalImages.slice(0, 3).map(url => url.includes('&w=')),
          final_has_h_params: finalImages.slice(0, 3).map(url => url.includes('&h='))
        });

        return {
          property_name: propertyData.property_name || null,
          address: propertyData.address || null,
          price_yen: propertyData.price_yen && propertyData.price_yen > 0 ? propertyData.price_yen : null,
          floor_plan: propertyData.floor_plan || null,
          commute_minutes: propertyData.commute_minutes && propertyData.commute_minutes >= 0 ? propertyData.commute_minutes : null,
          property_type: propertyData.property_type || null,
          private_area_sqm: propertyData.private_area_sqm && propertyData.private_area_sqm > 0 ? propertyData.private_area_sqm : null,
          construction_year: propertyData.construction_year && propertyData.construction_year > 1900 ? propertyData.construction_year : null,
          construction_month: propertyData.construction_month && propertyData.construction_month >= 1 && propertyData.construction_month <= 12 ? propertyData.construction_month : null,
          building_age_years: building_age_years,
          image_urls: finalImages,
          notes: propertyData.notes || null
        };
      };

      // Process properties with both Gemini and fallback images
      const propertyA = processPropertyData(extractedData.property_a, fallbackImagesA);
      const propertyB = processPropertyData(extractedData.property_b, fallbackImagesB);

      // Log final image extraction results
      console.log("ANALYZE-PROPERTIES: Final property data with enhanced images:", {
        property_a_images: propertyA.image_urls?.length || 0,
        property_b_images: propertyB.image_urls?.length || 0,
        property_a_sample: propertyA.image_urls?.slice(0, 3),
        property_b_sample: propertyB.image_urls?.slice(0, 3),
        property_a_has_w_params: propertyA.image_urls?.slice(0, 3).map(url => url.includes('&w=')),
        property_b_has_w_params: propertyB.image_urls?.slice(0, 3).map(url => url.includes('&w=')),
        property_a_has_h_params: propertyA.image_urls?.slice(0, 3).map(url => url.includes('&h=')),
        property_b_has_h_params: propertyB.image_urls?.slice(0, 3).map(url => url.includes('&h='))
      });

      console.log("ANALYZE-PROPERTIES: Property A image URLs (first 3):", propertyA.image_urls?.slice(0, 3));
      console.log("ANALYZE-PROPERTIES: Property B image URLs (first 3):", propertyB.image_urls?.slice(0, 3));

      // Insert PropertyA using service role client (bypasses RLS)
      const { data: propertyAData, error: propertyAError } =
        await supabaseServiceClient.from("properties").insert([propertyA]).select();

      if (propertyAError) {
        console.error("Property A insertion error:", propertyAError);
        console.error("Property A data that failed:", JSON.stringify(propertyA, null, 2));
        throw new Error(
          `Error inserting property A: ${propertyAError.message}. Details: ${JSON.stringify(propertyAError.details || {})}. Code: ${propertyAError.code || 'unknown'}`
        );
      }

      console.log("Property A inserted successfully:", propertyAData[0]);

      // Insert PropertyB using service role client (bypasses RLS)
      const { data: propertyBData, error: propertyBError } =
        await supabaseServiceClient.from("properties").insert([propertyB]).select();

      if (propertyBError) {
        console.error("Property B insertion error:", propertyBError);
        console.error("Property B data that failed:", JSON.stringify(propertyB, null, 2));
        throw new Error(
          `Error inserting property B: ${propertyBError.message}. Details: ${JSON.stringify(propertyBError.details || {})}. Code: ${propertyBError.code || 'unknown'}`
        );
      }

      console.log("Property B inserted successfully:", propertyBData[0]);

      // Create comparison record with user_id from request and original URLs
      const comparisonData = {
        property_a_id: propertyAData[0].id,
        property_b_id: propertyBData[0].id,
        user_id: user_id || null, // Use user_id from request body
        property_url_a: property_url_a,
        property_url_b: property_url_b,
        image_extraction_status: "completed", // Always completed with enhanced extraction
      };

      console.log("Creating comparison with data:", JSON.stringify(comparisonData, null, 2));

      const { data: comparisonResult, error: comparisonError } =
        await supabaseServiceClient
          .from("comparisons")
          .insert([comparisonData])
          .select();

      if (comparisonError) {
        console.error("Comparison creation error:", comparisonError);
        console.error("Comparison data that failed:", JSON.stringify(comparisonData, null, 2));
        throw new Error(
          `Error creating comparison: ${comparisonError.message}. Details: ${JSON.stringify(comparisonError.details || {})}. Code: ${comparisonError.code || 'unknown'}`
        );
      }

      console.log("Comparison created successfully:", comparisonResult[0]);

      // Return success response with property data
      return new Response(
        JSON.stringify({
          message: "Properties analyzed successfully",
          comparison_id: comparisonResult[0].id,
          property_a: propertyAData[0],
          property_b: propertyBData[0],
          image_extraction_status: "completed" // Always completed with enhanced extraction
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error processing Gemini response:", {
        errorMessage: error.message,
        errorStack: error.stack,
        geminiDataReceived: !!geminiData,
        responseText: geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 500)
      });
      return new Response(
        JSON.stringify({
          error: "Could not extract property data from response",
          details: error.message,
          geminiResponse: geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 1000) || "No response text available"
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Function error:", {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
        errorType: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

