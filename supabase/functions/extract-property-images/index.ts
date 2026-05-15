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
const RATE_LIMIT = 20; // requests per hour
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

    // Get session for user identification (optional for rate limiting)
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    console.log("Extract images - Authorization header:", req.headers.get("Authorization"));
    console.log("Extract images - Session data:", session);

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
    const { property_urls } = await req.json();

    if (!property_urls || !Array.isArray(property_urls) || property_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "property_urls array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URLs
    for (const url of property_urls) {
      try {
        new URL(url);
      } catch (e) {
        return new Response(
          JSON.stringify({ error: `Invalid URL provided: ${url}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get Firecrawl configuration
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const firecrawlUrl = Deno.env.get('FIRECRAWL_URL') || 'https://api.firecrawl.dev';
    
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Using Firecrawl URL: ${firecrawlUrl}`);

    // Extract images for all properties in parallel
    console.log("Extracting images for URLs:", property_urls);
    const imageExtractionPromises = property_urls.map(async (url) => {
      const result = await extractImagesWithFirecrawl(url, firecrawlApiKey, firecrawlUrl);
      return {
        url,
        images: result.images || [],
        error: result.error,
      };
    });

    const results = await Promise.all(imageExtractionPromises);

    console.log("Image extraction completed:", {
      totalUrls: property_urls.length,
      successfulExtractions: results.filter(r => !r.error).length,
      totalImages: results.reduce((sum, r) => sum + r.images.length, 0)
    });

    // Return results
    return new Response(
      JSON.stringify({
        message: "Image extraction completed",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extract images function error:", {
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

// Helper function to extract images using Firecrawl API
async function extractImagesWithFirecrawl(
  url: string,
  apiKey: string,
  firecrawlUrl: string = 'https://api.firecrawl.dev'
): Promise<{ images?: string[]; error?: string }> {
  try {
    console.log(`Extracting images from ${url} using Firecrawl`);

    const apiEndpoint = `${firecrawlUrl}/v1/scrape`;
    console.log(`Making request to: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['extract', 'html'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              property_images: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Property photo URLs only - exclude tracking pixels, analytics images, logos, icons, and advertisements. Focus on actual property interior/exterior photos that show the house/apartment rooms, facade, or building.'
              }
            },
            required: ['property_images']
          }
        },
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down' }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Could not parse error response" }));
      console.error(`Firecrawl image extraction error for ${url}:`, errorData);
      return { error: `Firecrawl error: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(`Firecrawl image extraction failed for ${url}:`, data);
      return { error: `Firecrawl extraction failed: ${data.error || 'Unknown error'}` };
    }

    const extractedData = data.data?.extract;
    const aiExtractedImages = extractedData?.property_images || [];
    
    // Also get the raw HTML to extract images as fallback
    const htmlData = data.data?.html || '';
    const regexExtractedImages = extractImagesFromHtml(htmlData);
    
    // Combine AI-extracted and regex-extracted images
    const allImages = [...new Set([...aiExtractedImages, ...regexExtractedImages])];
    
    // Filter out tracking URLs and non-property images
    const images = allImages.filter(url => {
      // Exclude analytics/tracking URLs
      if (url.includes('log.suumo.jp') || url.includes('ls.gif')) return false;
      if (url.includes('track') || url.includes('analytics')) return false;
      
      // Include images that are clearly property photos
      if (url.includes('gazo/bukken') || url.includes('front/gazo')) return true;
      
      // For resized images, filter by size
      if (url.includes('resizeImage') && url.includes('&w=') && url.includes('&h=')) {
        const widthMatch = url.match(/w=(\d+)/);
        const heightMatch = url.match(/h=(\d+)/);
        if (widthMatch && heightMatch) {
          const width = parseInt(widthMatch[1]);
          const height = parseInt(heightMatch[1]);
          return width >= 200 && height >= 150; // Keep reasonably sized images
        }
      }
      
      // Include other SUUMO image URLs
      return url.includes('suumo.jp') && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'));
    });
    
    console.log(`Extracted ${images.length} property images from ${url} (AI: ${aiExtractedImages.length}, Regex: ${regexExtractedImages.length}, Combined: ${allImages.length})`);
    return { images: images.slice(0, 10) }; // Limit to 10 images

  } catch (error) {
    console.error(`Error extracting images from ${url}:`, error);
    return { error: `Image extraction error: ${error.message}` };
  }
}

// Helper function to extract images from HTML using regex patterns
function extractImagesFromHtml(html: string): string[] {
  const imageUrls = new Set<string>();
  
  // Focus on SUUMO property image patterns - preserve full URLs with query parameters including w= and h=
  const patterns = [
    // Standard img src attributes - capture complete URLs
    /src=["']([^"']+)["']/gi,
    // Data-src attributes for lazy loading
    /data-src=["']([^"']+)["']/gi,
    /data-original=["']([^"']+)["']/gi,
    // Markdown-style image links - capture everything inside parentheses (most reliable for SUUMO)
    /\[!\[[^\]]*\]\(([^)]+)\)/gi,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1] || match[0];
      if (url && !url.startsWith('data:')) {
        try {
          let fullUrl = url;

          // Handle relative URLs
          if (!url.startsWith('http')) {
            if (url.startsWith('//')) {
              fullUrl = 'https:' + url;
            } else if (url.startsWith('/')) {
              fullUrl = 'https://img01.suumo.com' + url;
            } else {
              fullUrl = 'https://' + url;
            }
          }

          // Only add if it's a SUUMO image URL
          if (fullUrl.includes('suumo.com') &&
              (fullUrl.includes('gazo') || fullUrl.includes('bukken') || fullUrl.includes('resizeImage')) &&
              fullUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
            imageUrls.add(fullUrl);
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }
    }
  });
  
  return Array.from(imageUrls);
}