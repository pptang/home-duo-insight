
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  isSupportedRealEstateUrl,
  UNSUPPORTED_SITE_MESSAGE_JA,
} from "../_shared/url-whitelist.ts";

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
    // Extract and validate the request
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

    // Authoritative whitelist gate: reject any URL that is not on a supported
    // Japanese real estate site. The frontend performs the same check for UX,
    // but this server-side gate is the source of truth — never scrape arbitrary
    // sites. See supabase/functions/_shared/url-whitelist.ts.
    if (
      !isSupportedRealEstateUrl(property_url_a) ||
      !isSupportedRealEstateUrl(property_url_b)
    ) {
      return new Response(
        JSON.stringify({
          error: "unsupported_site",
          message: UNSUPPORTED_SITE_MESSAGE_JA,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch HTML content from both URLs using Firecrawl API
    console.log("Fetching content using Firecrawl API:", property_url_a, property_url_b);

    const [resultA, resultB] = await Promise.all([
      fetchWithFirecrawl(property_url_a, firecrawlApiKey),
      fetchWithFirecrawl(property_url_b, firecrawlApiKey),
    ]);

    if (resultA.error) {
      console.error("Final error for property A:", resultA.error);
      return new Response(
        JSON.stringify({
          error: `Error fetching property A: ${resultA.error}`,
          url: property_url_a,
          suggestion: "Try accessing the URL directly to verify it's working, or try again later if the site is slow."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (resultB.error) {
      console.error("Final error for property B:", resultB.error);
      return new Response(
        JSON.stringify({
          error: `Error fetching property B: ${resultB.error}`,
          url: property_url_b,
          suggestion: "Try accessing the URL directly to verify it's working, or try again later if the site is slow."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract image URLs from HTML content
    const imagesA = extractImageUrls(resultA.html || '');
    const imagesB = extractImageUrls(resultB.html || '');

    console.log("PARSE-PROPERTIES: Extracted images with detailed analysis:", {
      property_a_images: imagesA.length,
      property_b_images: imagesB.length,
      sample_a_full: imagesA.slice(0, 3),
      sample_b_full: imagesB.slice(0, 3),
      sample_a_has_w_param: imagesA.slice(0, 3).map(url => url.includes('&w=')),
      sample_b_has_w_param: imagesB.slice(0, 3).map(url => url.includes('&w=')),
      sample_a_has_h_param: imagesA.slice(0, 3).map(url => url.includes('&h=')),
      sample_b_has_h_param: imagesB.slice(0, 3).map(url => url.includes('&h='))
    });

    // Return the HTML content and extracted image URLs
    return new Response(
      JSON.stringify({
        html_property_a: resultA.html,
        html_property_b: resultB.html,
        images_property_a: imagesA,
        images_property_b: imagesB,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    let errorMessage = "Internal server error";
    let statusCode = 500;

    // Provide more specific error handling
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      errorMessage = "Invalid JSON in request body";
      statusCode = 400;
    } else if (error.name === 'AbortError') {
      errorMessage = "Request was cancelled due to timeout";
      statusCode = 408;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
        suggestion: error.name === 'AbortError' ?
          "The website may be slow or blocking requests. Try again or check if the URLs are accessible." :
          "Please check your request and try again."
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to extract image URLs from HTML content
function extractImageUrls(html: string): string[] {
  const images: Array<{ url: string; priority: number }> = [];

  try {
    // Enhanced regex for comprehensive image extraction with SUUMO and athome.co.jp patterns
    const imgPatterns = [
      // Standard img tags with src - preserve full URLs with query parameters
      /<img[^>]+src=['"']([^'"]+)['"']/gi,
      // Data-src attributes (lazy loading)
      /<img[^>]+data-src=['"']([^'"]+)['"']/gi,
      // Background images in style attributes
      /background-image:\s*url\(['"']?([^'"()]+)['"']?\)/gi,
      // Data attributes for image URLs
      /data-[^=]*image[^=]*=['"']([^'"]+)['"']/gi,
      // Markdown-style image links (most reliable for SUUMO scraped content) - capture full URLs with w= and h=
      /\[!\[[^\]]*\]\(([^)]+)\)/gi,
      // SUUMO-specific patterns for image URLs - preserve query parameters
      /(?:gazo|shashin|bukken)[^=]*=['"']([^'"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^'"]*)?)['"']/gi,
      // Direct SUUMO image paths with query parameters
      /(https?:\/\/img01\.suumo\.com[^'")\s]*\.(?:jpg|jpeg|png|webp|gif)(?:\?[^'")\s]*)?)/gi,
      // SUUMO front gazo paths with query parameters
      /(https?:\/\/[^'")\s]*front\/gazo\/bukken\/[^'")\s]*\.(?:jpg|jpeg|png|webp|gif)(?:\?[^'")\s]*)?)/gi,
      // athome.co.jp image_files/path URLs (base64-encoded paths, no file extension)
      /(https?:\/\/www\.athome\.co\.jp\/image_files\/path\/[A-Za-z0-9+/=_-]+(?:\?[^'")\s]*)?)/gi,
      // athome.co.jp quoted URLs with HTML entities
      /["'](https?:\/\/www\.athome\.co\.jp\/image_files\/path\/[A-Za-z0-9+/=_-]+[^"']*)['"]/gi
    ];

    for (const pattern of imgPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        let url = match[1] || match[0];
        if (!url) continue;

        // Clean and validate URL
        url = url.trim();

        // Decode HTML entities (athome uses &amp; for &)
        url = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

        // Handle URL encoding for SUUMO resizeImage URLs
        if (url.includes('%2F')) {
          url = decodeURIComponent(url);
        }

        // Handle relative URLs
        if (url.startsWith('//')) {
          url = 'https:' + url;
        } else if (url.startsWith('/')) {
          // For SUUMO relative paths, prepend the base domain
          if (url.includes('gazo') || url.includes('bukken')) {
            url = 'https://img01.suumo.com' + url;
          } else if (url.includes('image_files')) {
            url = 'https://www.athome.co.jp' + url;
          } else {
            continue;
          }
        } else if (!url.startsWith('http')) {
          // Handle protocol-relative or domain-relative URLs
          if (url.includes('img01.suumo.com')) {
            url = 'https://' + url;
          } else if (url.includes('athome.co.jp')) {
            url = 'https://' + url;
          }
        }

        // Check if URL is a valid property image
        const hasImageExtension = url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i);
        const isAthomeImage = url.includes('athome.co.jp/image_files/path/') && url.match(/\/path\/[A-Za-z0-9+/=_-]{10,}/);
        const isSuumoImage = url.includes('suumo.com') && url.match(/\.(jpg|jpeg|png|webp|gif)/i);

        if (hasImageExtension || isAthomeImage || isSuumoImage) {
          // Filter out placeholder and static asset images
          const isPlaceholder = url.includes('/no_image') || url.includes('no-image') || url.includes('placeholder');
          const isStaticAsset = url.includes('/static_app_contents/') || url.includes('/assets/common/') || url.includes('/assets/pc/');
          const isMapImage = url.includes('maps.gstatic.com') || url.includes('maps.google.com') || url.includes('mapfiles');
          const isTransparent = url.includes('transparent.png') || url.includes('pixel.gif');

          // Filter out obvious non-property images
          if (!isPlaceholder && !isStaticAsset && !isMapImage && !isTransparent && !url.match(/(icon|logo|btn|nav|menu|header|footer|ui|thumb|spacer|loading)/i)) {
            // Log URL before processing
            console.log("PARSE-PROPERTIES: Processing URL:", url);

            // Enhanced prioritization for property images
            let priority = 0;

            // athome.co.jp images - high base priority
            if (isAthomeImage) {
              priority += 90;
              // Higher priority for images with size parameters (likely main images)
              if (url.includes('width=') && url.includes('height=')) priority += 20;
            }

            // Highest priority: Main property images with low numbers (SUUMO)
            if (url.match(/_000[1-5]\.jpg|_00[0-5][0-9]\.jpg/i)) priority += 100;

            // High priority: SUUMO-specific keywords
            if (url.match(/(gazo|bukken|madori|heimen)/i)) priority += 80;

            // High priority: Room types in Japanese
            if (url.match(/(リビング|キッチン|浴室|寝室|玄関|外観|内観|間取)/i)) priority += 70;

            // Medium-high priority: Standard main image indicators
            if (url.match(/(main|primary|hero|large|big)/i)) priority += 60;

            // Medium priority: First few numbered images
            if (url.match(/(_001|_01|_1\.)/i)) priority += 50;

            // Add image with priority
            images.push({ url, priority });
            console.log("PARSE-PROPERTIES: Added to images array:", url, "priority:", priority);
          }
        }
      }
    }

    // Sort by priority (highest first) and extract URLs
    const sortedImages = images
      .sort((a: any, b: any) => b.priority - a.priority)
      .map((img: any) => img.url);

    // Remove duplicates while preserving priority order
    const uniqueImages = [...new Set(sortedImages)];

    // Limit to reasonable number to avoid overwhelming response
    return uniqueImages.slice(0, 20);
  } catch (error) {
    console.error("Error extracting images:", error);
    return [];
  }
}

// Helper function to fetch HTML using Firecrawl API
async function fetchWithFirecrawl(
  url: string,
  apiKey: string
): Promise<{ html?: string; error?: string }> {
  try {
    console.log(`Fetching URL with Firecrawl: ${url}`);

    const startTime = Date.now();
    
    // Get Firecrawl URL from environment, default to hosted service
    const firecrawlUrl = Deno.env.get('FIRECRAWL_URL') || 'https://api.firecrawl.dev';
    const isLocal = firecrawlUrl.includes('localhost') || firecrawlUrl.includes('host.docker.internal');
    
    // Prepare headers - local Firecrawl doesn't need authorization
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Only add authorization for hosted service
    if (!isLocal) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // Call Firecrawl API to scrape the URL
    const response = await fetch(`${firecrawlUrl}/v1/scrape`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: url,
        formats: ['html'],
        actions: [
          { type: 'wait', milliseconds: 3000 }, // Wait for dynamic content
          { type: 'scroll', direction: 'down' }   // Trigger lazy loading
        ],
        onlyMainContent: false // Get full page content including images
      })
    });

    const fetchDuration = Date.now() - startTime;
    console.log(`Firecrawl request completed for ${url} in ${fetchDuration}ms`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Could not parse error response" }));
      console.error(`Firecrawl API error for ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      return {
        error: `Firecrawl API error: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorData)}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(`Firecrawl scraping failed for ${url}:`, data);
      return {
        error: `Firecrawl scraping failed: ${data.error || 'Unknown error'}`
      };
    }

    const html = data.data?.html;
    if (!html) {
      console.error(`No HTML content returned from Firecrawl for ${url}:`, data);
      return {
        error: 'No HTML content returned from Firecrawl'
      };
    }

    console.log(`Successfully retrieved ${html.length} characters from ${url} via Firecrawl`);
    return { html };

  } catch (error) {
    console.error(`Error calling Firecrawl API for ${url}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return {
      error: `Firecrawl API error: ${error.message}`
    };
  }
}
