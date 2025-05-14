
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

    // Fetch HTML content from both URLs
    console.log("Fetching HTML from URLs:", property_url_a, property_url_b);
    const fetchPromises = [
      fetchHtmlWithTimeout(property_url_a),
      fetchHtmlWithTimeout(property_url_b),
    ];

    // Wait for both fetches to complete
    const [resultA, resultB] = await Promise.all(fetchPromises);

    if (resultA.error) {
      return new Response(
        JSON.stringify({ error: `Error fetching property A: ${resultA.error}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (resultB.error) {
      return new Response(
        JSON.stringify({ error: `Error fetching property B: ${resultB.error}` }),
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

// Helper function to fetch HTML with a timeout
async function fetchHtmlWithTimeout(
  url: string,
  timeoutMs = 10000
): Promise<{ html?: string; error?: string }> {
  try {
    // Set fetch options - including user-agent to avoid being blocked
    const fetchOptions = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      redirect: "follow" as RequestRedirect,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    fetchOptions["signal"] = controller.signal;

    // Fetch the URL
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // Check if response is OK
    if (!response.ok) {
      return {
        error: `HTTP error! Status: ${response.status} ${response.statusText}`,
      };
    }

    // Get the HTML content
    const html = await response.text();
    return { html };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return { error: error.message };
  }
}
