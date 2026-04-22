
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
    
    const prompt = `You are AiSumai (愛住) AI. Extract structured property data from these Japanese real estate listing pages.

Focus on extracting: Property Name, Address, Price, Floor Plan, Commute Time, Property Type, Private Area, Building Age, Notes, Image URLs, and extended fields (building structure, management fee, parking, pet policy, floor number, direction, train line, school district, amenities).

CRITICAL EXTRACTION GUIDELINES:
- Price: Look for 賃料, 家賃, 価格, 売買価格, 万円, 円. Extract rental/purchase price in yen, convert to numeric value
- Address: Full address including 都道府県 (prefecture), 市区町村 (city/ward), detailed location
- Commute Time: Look for 徒歩, 駅まで, 分, minutes, walking time to nearest station
- Private Area: Look for 専有面積, 居住面積, 面積, ㎡, 平米, 平方メートル, m². Extract exclusive floor area in square meters
- Building Age: Look for 築年月, 建築年, 竣工年, 築, 年, 月. Extract construction year and month, calculate age from current date (2025)
- Floor Plan: Room configuration like 1K, 1DK, 1LDK, 2DK, 2LDK, 3LDK, etc.
- Building Structure: Look for 構造, 建物構造 (e.g. 鉄筋コンクリート造, 鉄骨造)
- Total Units: Look for 総戸数, 総戸数 (integer)
- Management Type: Look for 管理形態 (e.g. 全部委託, 一部委託, 自主管理)
- Parking: Look for 駐車場 (e.g. 有, 無, 空き有, with fee info)
- Pet Allowed: Look for ペット (可=true, 不可=false, 相談=null)
- Seismic Standard: Look for 耐震基準, 新耐震基準 (text description)
- Management Fee: Look for 管理費 in yen/month (integer, strip 円/月)
- Repair Reserve: Look for 修繕積立金 in yen/month (integer, strip 円/月)
- Price Per Tsubo: Look for 坪単価 (convert 万円 × 10000 to integer yen)
- Estimated Rent: Look for 想定賃料 in yen (integer)
- Estimated Yield: Look for 表面利回り, 想定利回り as percentage number (e.g. 4.5% → 4.5)
- Floor Number: Look for 所在階 (integer, e.g. 3階 → 3)
- Direction: Look for 向き, バルコニー向き (e.g. 南東, 南)
- Train Line: Look for 沿線名, 路線 (transit line name, not station name)
- School District: Look for 小学校区, 中学校区

JAPANESE TERMINOLOGY TO LOOK FOR:
- 専有面積 / 居住面積 / 面積 = Private Area
- 徒歩○分 / ○分歩 / 駅まで○分 = Walking time to station
- 築○年○月 / 建築年○年 / 竣工○年 = Construction date
- 賃料 / 家賃 / 月額 = Rent
- 価格 / 売買価格 / 販売価格 = Sale price
- 構造 / 建物構造 = Building Structure
- 総戸数 = Total Units
- 管理形態 = Management Type
- 駐車場 = Parking
- ペット = Pet Policy
- 耐震基準 / 新耐震基準 = Seismic Standard
- 管理費 = Management Fee
- 修繕積立金 = Repair Reserve Fund
- 坪単価 = Price Per Tsubo
- 想定賃料 = Estimated Rent
- 表面利回り / 想定利回り = Estimated Yield
- 所在階 = Floor Number
- 向き / バルコニー向き = Direction
- 沿線名 / 路線 = Train Line
- 小学校区 / 中学校区 = School District
- 宅配ボックス = Delivery Box (amenity)
- コンシェルジュ = Concierge (amenity)
- 外国籍購入可 = Foreigner Purchase (amenity)
- 投資目的購入可 = Investment Allowed (amenity)
- ハザードマップ = Hazard Map (amenity)

SEARCH PATTERNS:
- For area: Look for numbers followed by ㎡, 平米, 平方メートル, m²
- For commute: Look for numbers followed by 分, minutes, combined with 徒歩, 駅
- For building age: Look for numbers followed by 年, 月, combined with 築, 建築, 竣工
- Check both visible text AND data attributes, meta tags, JSON-LD structured data

CRITICAL FOR MAIN PROPERTY IMAGE EXTRACTION:
Extract 3-5 main property images per property. Prioritize exterior photos, floor plans, and interior shots.

SUPPORTED SITE IMAGE PATTERNS:
1. ATHOME.CO.JP - Dynamic image URLs (NO file extension):
   Pattern: https://www.athome.co.jp/image_files/path/{base64_id}?width={w}&height={h}
   Example: https://www.athome.co.jp/image_files/path/ZWdy1QwQ4PVAEKLOVELGXg==?width=572&height=418&margin=false
   Note: These URLs use base64-encoded path IDs, prefer larger width/height values

2. SUUMO - Standard image URLs (with .jpg extension):
   Pattern: img01.suumo.com/.../propertyId_0001.jpg or resizeImage?src=...
   Lower image numbers (_0001, _0002) = main property photos

3. OTHER SITES - Standard image URLs ending in .jpg, .png, .webp

IMAGE PRIORITIZATION (by Japanese property context):
- 現地外観写真/外観 (exterior) - HIGHEST priority
- 間取り図/間取 (floor plan) - HIGH priority
- リビング/居間 (living room), キッチン (kitchen), 浴室/風呂 (bathroom), 寝室 (bedroom)

EXTRACTION RULES:
- EXCLUDE: icons, logos, buttons, navigation, UI elements, spacer images
- EXCLUDE: Placeholder images (URLs containing "no_image", "no-image", "placeholder")
- EXCLUDE: Static assets (URLs containing "/static_app_contents/", "/assets/common/", "/assets/pc/")
- EXCLUDE: Loading spinners, map pins, help icons
- INCLUDE: Full URLs with all query parameters (width, height, w, h, etc.)
- INCLUDE ONLY: Actual property photos with valid base64 IDs or image file extensions
- Return empty array [] if no main property images found

FOR PROPERTY A:
${fullHtmlA}

FOR PROPERTY B:
${fullHtmlB}

IMPORTANT: Search thoroughly through ALL text content. If you cannot find specific values, set them to null (not 0). Only use 0 for actual zero values.

Return only this JSON format (no explanations). Include every key even when the value is null. Use null (not 0 and not empty string) when the listing does not expose the field.
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
    "notes": "",
    "building_structure": null,
    "total_units": null,
    "management_type": null,
    "parking": null,
    "pet_allowed": null,
    "seismic_standard": null,
    "management_fee": null,
    "repair_reserve": null,
    "price_per_tsubo": null,
    "estimated_rent": null,
    "estimated_yield": null,
    "floor_number": null,
    "direction": null,
    "train_line": null,
    "school_district": null,
    "amenities": {
      "delivery_box": null,
      "concierge": null,
      "foreigner_purchase": null,
      "investment_allowed": null,
      "hazard_map": null
    }
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
    "notes": "",
    "building_structure": null,
    "total_units": null,
    "management_type": null,
    "parking": null,
    "pet_allowed": null,
    "seismic_standard": null,
    "management_fee": null,
    "repair_reserve": null,
    "price_per_tsubo": null,
    "estimated_rent": null,
    "estimated_yield": null,
    "floor_number": null,
    "direction": null,
    "train_line": null,
    "school_district": null,
    "amenities": {
      "delivery_box": null,
      "concierge": null,
      "foreigner_purchase": null,
      "investment_allowed": null,
      "hazard_map": null
    }
  }
}`;

    // Make request to Gemini API using cheaper Flash-Lite model
    console.log("Calling Gemini API to extract data");
    let geminiResponse;
    try {
      geminiResponse = await fetch(
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
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 16384, // Increased to handle extended schema with additional property fields
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
      // Check if response was truncated due to token limit
      const finishReason = geminiData.candidates[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Gemini response was truncated due to token limit (MAX_TOKENS)');
      }

      // Extract the JSON from Gemini's response
      const responseText =
        geminiData.candidates[0]?.content?.parts?.[0]?.text || "";

      console.log("Raw Gemini response text:", responseText.substring(0, 500) + "...");
      console.log("Gemini finish reason:", finishReason);

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

      // Check for truncation - validate JSON contains both properties before parsing
      if (!jsonString.includes('"property_b"')) {
        const truncationError = 'Response appears truncated - missing property_b data. This usually indicates the Gemini output token limit was exceeded.';
        console.error(truncationError);
        console.error("Truncated JSON string:", jsonString.substring(0, 2000) + "...");
        throw new Error(truncationError);
      }

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
        // Extended fields from tv7.11 migration
        building_structure?: string;      // 構造 / 建物構造
        total_units?: number;             // 総戸数
        management_type?: string;         // 管理形態
        parking?: string;                 // 駐車場
        pet_allowed?: boolean | null;     // ペット (可=true, 不可=false)
        seismic_standard?: string;        // 耐震基準 / 新耐震基準
        management_fee?: number;          // 管理費 (yen/month)
        repair_reserve?: number;          // 修繕積立金 (yen/month)
        price_per_tsubo?: number;         // 坪単価 (yen)
        estimated_rent?: number;          // 想定賃料 (yen)
        estimated_yield?: number;         // 表面利回り / 想定利回り (percentage as number)
        floor_number?: number;            // 所在階
        direction?: string;               // 向き / バルコニー向き
        train_line?: string;              // 沿線名 / 路線
        school_district?: string;         // 小学校区 / 中学校区
        amenities?: {
          delivery_box?: boolean | null;      // 宅配ボックス
          concierge?: boolean | null;         // コンシェルジュ
          foreigner_purchase?: boolean | null; // 外国籍購入可
          investment_allowed?: boolean | null; // 投資目的購入可
          hazard_map?: string | null;         // ハザードマップ
        } | null;
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

            // Exclude placeholder and static asset images
            if (decodedUrl.includes('/no_image') || decodedUrl.includes('no-image') || decodedUrl.includes('placeholder')) {
              return false;
            }
            if (decodedUrl.includes('/static_app_contents/') || decodedUrl.includes('/assets/common/') || decodedUrl.includes('/assets/pc/')) {
              return false;
            }
            if (decodedUrl.match(/(icon|logo|btn|nav|menu|header|footer|ui|thumb|spacer|loading)/i)) {
              return false;
            }
            // Exclude Google Maps and other map-related images
            if (decodedUrl.includes('maps.gstatic.com') || decodedUrl.includes('maps.google.com') || decodedUrl.includes('mapfiles')) {
              return false;
            }
            // Exclude transparent pixels and tracking images
            if (decodedUrl.includes('transparent.png') || decodedUrl.includes('pixel.gif')) {
              return false;
            }

            // Check for image extensions, including URL-encoded ones in query parameters
            const hasDirectExtension = decodedUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) !== null;
            const hasEncodedExtension = decodedUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) !== null ||
                                      decodedUrl.includes('%2F') && decodedUrl.match(/(jpg|jpeg|png|webp|gif)/i) !== null;

            // athome.co.jp uses dynamic image URLs without file extensions (but must have valid base64 path)
            const isAthomeImage = decodedUrl.includes('athome.co.jp/image_files/path/') &&
                                  decodedUrl.match(/\/path\/[A-Za-z0-9+/=_-]{10,}/) !== null;

            return hasDirectExtension || hasEncodedExtension || isAthomeImage;
          } catch {
            return false;
          }
        };

        const prioritizeImages = (images: string[]): Array<{url: string, priority: number}> => {
          return images.filter(validateImageUrl).map(url => {
            // Decode HTML entities to get clean URL
            const decodedUrl = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

            let priority = 50; // Base priority

            // athome.co.jp images - high base priority
            if (decodedUrl.includes('athome.co.jp/image_files/path/')) {
              priority += 80; // High priority for athome images
              // Higher priority for images with size parameters (larger = better quality)
              if (decodedUrl.includes('width=') && decodedUrl.includes('height=')) priority += 20;
            }

            // High priority for main/hero/primary images
            if (decodedUrl.match(/(?:main|hero|primary|first|top|default)/i)) priority += 40;

            // High priority for Japanese property keywords
            if (decodedUrl.match(/(?:gazo|shashin|bukken|madori|heimen)/i)) priority += 35;

            // High priority for room/interior keywords
            if (decodedUrl.match(/(?:room|interior|living|bedroom|kitchen|bath|exterior|view)/i)) priority += 30;
            if (decodedUrl.match(/(?:居間|寝室|キッチン|バスルーム|玄関|外観|内観)/i)) priority += 30;

            // Medium-high priority for large dimensions and first images
            if (decodedUrl.match(/(?:1200|1000|800|large|big|xl)/i)) priority += 25;
            if (decodedUrl.match(/(?:01|001|_1\.)/) || decodedUrl.includes('/1.')) priority += 20;

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

        // Helper: safely parse a positive integer, returning null for invalid values
        const safeInt = (v: unknown): number | null => {
          if (v === null || v === undefined) return null;
          const n = typeof v === 'number' ? v : Number(v);
          return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
        };

        // Helper: safely parse a positive float, returning null for invalid values
        const safeFloat = (v: unknown): number | null => {
          if (v === null || v === undefined) return null;
          const n = typeof v === 'number' ? v : Number(v);
          return Number.isFinite(n) && n > 0 ? n : null;
        };

        // Helper: safely coerce to bool (only true/false; null for anything else)
        const safeBool = (v: unknown): boolean | null => {
          if (v === true || v === false) return v;
          return null;
        };

        // Helper: safely return a non-empty string or null
        const safeStr = (v: unknown): string | null => {
          if (typeof v === 'string' && v.trim().length > 0) return v.trim();
          return null;
        };

        // Build amenities jsonb — all fields optional, default null
        const rawAmenities = propertyData.amenities ?? null;
        const amenities = {
          delivery_box: safeBool(rawAmenities?.delivery_box ?? null),       // 宅配ボックス
          concierge: safeBool(rawAmenities?.concierge ?? null),             // コンシェルジュ
          foreigner_purchase: safeBool(rawAmenities?.foreigner_purchase ?? null), // 外国籍購入可
          investment_allowed: safeBool(rawAmenities?.investment_allowed ?? null), // 投資目的購入可
          hazard_map: safeStr(rawAmenities?.hazard_map ?? null),            // ハザードマップ
        };

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
          notes: propertyData.notes || null,
          // Extended fields from tv7.11 migration
          building_structure: safeStr(propertyData.building_structure),     // 構造 / 建物構造
          total_units: safeInt(propertyData.total_units),                   // 総戸数
          management_type: safeStr(propertyData.management_type),           // 管理形態
          parking: safeStr(propertyData.parking),                           // 駐車場
          pet_allowed: safeBool(propertyData.pet_allowed),                  // ペット可否
          seismic_standard: safeStr(propertyData.seismic_standard),         // 耐震基準
          management_fee: safeInt(propertyData.management_fee),             // 管理費 (円/月)
          repair_reserve: safeInt(propertyData.repair_reserve),             // 修繕積立金 (円/月)
          price_per_tsubo: safeInt(propertyData.price_per_tsubo),           // 坪単価 (円)
          estimated_rent: safeInt(propertyData.estimated_rent),             // 想定賃料 (円)
          estimated_yield: safeFloat(propertyData.estimated_yield),         // 表面利回り (%)
          floor_number: safeInt(propertyData.floor_number),                 // 所在階
          direction: safeStr(propertyData.direction),                       // 向き / バルコニー向き
          train_line: safeStr(propertyData.train_line),                     // 沿線名 / 路線
          school_district: safeStr(propertyData.school_district),           // 小学校区 / 中学校区
          amenities: amenities,
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

