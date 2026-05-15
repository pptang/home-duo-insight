import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { comparison_id, status, user_id } = await req.json();

    // Validate input
    if (!comparison_id || !status) {
      return new Response(
        JSON.stringify({ error: "comparison_id and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validStatuses = ['pending', 'in_review', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update comparison status
    const updateData: Record<string, string> = {
      metadata_review_status: status,
    };

    if (status === 'completed') {
      updateData.metadata_reviewed_at = new Date().toISOString();
    }

    const { data: updatedComparison, error: updateError } = await supabaseServiceClient
      .from("comparisons")
      .update(updateData)
      .eq("id", comparison_id)
      .select()
      .single();

    if (updateError) {
      console.error("Comparison update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update comparison status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        comparison: updatedComparison
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});