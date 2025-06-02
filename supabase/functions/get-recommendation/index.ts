import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Required for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Extract and validate the session from the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get session for user identification
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    // Extract query parameters
    const url = new URL(req.url);
    const comparisonId = url.searchParams.get('comparison_id');
    const recommendationId = url.searchParams.get('recommendation_id');

    if (!comparisonId && !recommendationId) {
      return new Response(
        JSON.stringify({ error: 'Either comparison_id or recommendation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let query = supabaseClient
      .from('recommendations')
      .select(`
        id,
        comparison_id,
        property_a_pros,
        property_a_cons,
        property_b_pros,
        property_b_cons,
        summary_table,
        final_recommendation,
        user_profile,
        created_at,
        updated_at,
        comparisons!inner(
          id,
          property_a_id,
          property_b_id,
          properties_property_a:properties!comparisons_property_a_id_fkey(
            id,
            property_name,
            address,
            price_yen,
            floor_plan,
            commute_minutes,
            property_type,
            image_urls,
            notes
          ),
          properties_property_b:properties!comparisons_property_b_id_fkey(
            id,
            property_name,
            address,
            price_yen,
            floor_plan,
            commute_minutes,
            property_type,
            image_urls,
            notes
          )
        )
      `);

    if (recommendationId) {
      query = query.eq('id', recommendationId);
    } else if (comparisonId) {
      query = query.eq('comparison_id', comparisonId);
    }

    // Add user filter for private recommendations
    if (session?.user?.id) {
      query = query.or(`user_id.eq.${session.user.id},user_id.is.null`);
    } else {
      query = query.is('user_id', null);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve recommendations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recommendations || recommendations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recommendations found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the most recent recommendation if multiple exist for a comparison
    const recommendation = recommendationId ? recommendations[0] :
      recommendations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return new Response(
      JSON.stringify(recommendation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
