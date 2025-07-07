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
    // Create a service role client for database operations (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Create regular client for function invocations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Parse request
    const { 
      comparison_id, 
      property_urls, 
      property_a_id, 
      property_b_id 
    } = await req.json();

    if (!comparison_id || !property_urls || !property_a_id || !property_b_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing image extraction for comparison:", comparison_id);

    // Update comparison status to in_progress
    await supabaseServiceClient
      .from("comparisons")
      .update({ 
        image_extraction_status: "in_progress",
        image_extraction_started_at: new Date().toISOString()
      })
      .eq("id", comparison_id);

    // Extract images using extract-property-images function
    console.log("Calling extract-property-images function...");
    let imageExtractionResponse;
    try {
      imageExtractionResponse = await supabaseClient.functions.invoke("extract-property-images", {
        body: { property_urls: property_urls },
      });
    } catch (invokeError) {
      console.error("Error invoking extract-property-images function:", invokeError);
      
      // Update comparison status to failed
      await supabaseServiceClient
        .from("comparisons")
        .update({ 
          image_extraction_status: "failed",
          image_extraction_completed_at: new Date().toISOString()
        })
        .eq("id", comparison_id);

      return new Response(
        JSON.stringify({
          error: "Failed to invoke extract-property-images function",
          details: invokeError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (imageExtractionResponse.error) {
      console.error("Image extraction error:", imageExtractionResponse.error);
      
      // Update comparison status to failed
      await supabaseServiceClient
        .from("comparisons")
        .update({ 
          image_extraction_status: "failed",
          image_extraction_completed_at: new Date().toISOString()
        })
        .eq("id", comparison_id);

      return new Response(
        JSON.stringify({
          error: "Error extracting property images",
          details: imageExtractionResponse.error.message || imageExtractionResponse.error,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imageResults = imageExtractionResponse.data?.results || [];
    const imageUrlsA = imageResults.find(r => r.url === property_urls[0])?.images || [];
    const imageUrlsB = imageResults.find(r => r.url === property_urls[1])?.images || [];
    
    console.log("Image extraction results:", {
      property_a_images: imageUrlsA.length,
      property_b_images: imageUrlsB.length
    });

    // Update properties with extracted images
    if (imageUrlsA.length > 0) {
      await supabaseServiceClient
        .from("properties")
        .update({ image_urls: imageUrlsA })
        .eq("id", property_a_id);
    }

    if (imageUrlsB.length > 0) {
      await supabaseServiceClient
        .from("properties")
        .update({ image_urls: imageUrlsB })
        .eq("id", property_b_id);
    }

    // Update comparison status to completed
    await supabaseServiceClient
      .from("comparisons")
      .update({ 
        image_extraction_status: "completed",
        image_extraction_completed_at: new Date().toISOString()
      })
      .eq("id", comparison_id);

    console.log("Image extraction completed successfully for comparison:", comparison_id);

    // Return success response
    return new Response(
      JSON.stringify({
        message: "Image extraction completed successfully",
        comparison_id: comparison_id,
        images_extracted: {
          property_a: imageUrlsA.length,
          property_b: imageUrlsB.length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Process image extraction error:", {
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