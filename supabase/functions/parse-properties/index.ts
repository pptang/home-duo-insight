
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

    // Fetch HTML content from both URLs with retry logic
    console.log("Fetching HTML from URLs:", property_url_a, property_url_b);

    // First attempt with standard timeout
    let [resultA, resultB] = await Promise.all([
      fetchHtmlWithTimeout(property_url_a, 30000),
      fetchHtmlWithTimeout(property_url_b, 30000),
    ]);

    // Retry failed requests with longer timeout
    if (resultA.error && resultA.error.includes('timed out')) {
      console.log("Retrying property A with extended timeout...");
      resultA = await fetchHtmlWithTimeout(property_url_a, 60000);
    }

    if (resultB.error && resultB.error.includes('timed out')) {
      console.log("Retrying property B with extended timeout...");
      resultB = await fetchHtmlWithTimeout(property_url_b, 60000);
    }

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

// Helper function to fetch HTML with a timeout
async function fetchHtmlWithTimeout(
  url: string,
  timeoutMs = 10000
): Promise<{ html?: string; error?: string }> {
  try {
    console.log(`Fetching URL: ${url} with timeout: ${timeoutMs}ms`);

    // Set fetch options - including user-agent to avoid being blocked
    const fetchOptions = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8", // Japanese preference for Japanese sites
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow" as RequestRedirect,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`Request to ${url} timed out after ${timeoutMs}ms`);
      controller.abort();
    }, timeoutMs);

    fetchOptions["signal"] = controller.signal;

    // Fetch the URL
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const fetchDuration = Date.now() - startTime;

    clearTimeout(timeoutId);

    console.log(`Fetch completed for ${url} in ${fetchDuration}ms`);

    // Check if response is OK
    if (!response.ok) {
      console.error(`HTTP error for ${url}: ${response.status} ${response.statusText}`);
      return {
        error: `HTTP error! Status: ${response.status} ${response.statusText}`,
      };
    }

    // Get the HTML content
    const html = await response.text();
    console.log(`Successfully retrieved ${html.length} characters from ${url}`);
    return { html };
  } catch (error) {
    console.error(`Error fetching ${url}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Provide more specific error messages
    if (error.name === 'AbortError') {
      return {
        error: `Request timed out after ${timeoutMs}ms. The website may be slow or blocking automated requests. URL: ${url}`
      };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        error: `Network error: Unable to connect to ${url}. Please check if the URL is accessible.`
      };
    } else {
      return {
        error: `${error.name}: ${error.message}`
      };
    }
  }
}
