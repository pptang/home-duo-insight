import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Required for CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create regular client for function invocations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Parse request
    const { comparison_id } = await req.json();

    if (!comparison_id) {
      return new Response(
        JSON.stringify({ error: "comparison_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Retrying image extraction for comparison:", comparison_id);

    // Get comparison details
    const { data: comparison, error: comparisonError } = await supabaseServiceClient
      .from("comparisons")
      .select(`
        *,
        property_a:property_a_id(id),
        property_b:property_b_id(id)
      `)
      .eq("id", comparison_id)
      .single();

    if (comparisonError || !comparison) {
      return new Response(
        JSON.stringify({ error: "Comparison not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already in progress
    if (comparison.image_extraction_status === "in_progress") {
      return new Response(
        JSON.stringify({ 
          error: "Image extraction already in progress",
          status: comparison.image_extraction_status
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if we have the original URLs
    if (!comparison.property_url_a || !comparison.property_url_b) {
      return new Response(
        JSON.stringify({ 
          error: "Original property URLs not found - cannot retry image extraction",
          suggestion: "This comparison was created before URL storage was implemented"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Reset status to pending
    await supabaseServiceClient
      .from("comparisons")
      .update({ 
        image_extraction_status: "pending",
        image_extraction_started_at: null,
        image_extraction_completed_at: null
      })
      .eq("id", comparison_id);

    // Trigger image extraction
    const { data: triggerResult, error: triggerError } = await supabaseClient.functions.invoke("process-image-extraction", {
      body: { 
        comparison_id: comparison_id,
        property_urls: [comparison.property_url_a, comparison.property_url_b],
        property_a_id: comparison.property_a.id,
        property_b_id: comparison.property_b.id
      }
    });

    if (triggerError) {
      console.error("Failed to trigger image extraction:", triggerError);
      return new Response(
        JSON.stringify({
          error: "Failed to trigger image extraction retry",
          details: triggerError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Image extraction retry triggered successfully",
        comparison_id: comparison_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Retry image extraction error:", {
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