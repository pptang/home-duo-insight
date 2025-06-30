
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Return the HTML content
    return new Response(
      JSON.stringify({
        html_property_a: resultA.html,
        html_property_b: resultB.html,
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

// Helper function to fetch HTML using Firecrawl API
async function fetchWithFirecrawl(
  url: string,
  apiKey: string
): Promise<{ html?: string; error?: string }> {
  try {
    console.log(`Fetching URL with Firecrawl: ${url}`);

    const startTime = Date.now();
    
    // Call Firecrawl API to scrape the URL
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
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
