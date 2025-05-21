
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateExpertRequest {
  email: string
  password: string
  role: "expert"
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Parse request body
    const requestData: CreateExpertRequest = await req.json()
    const { email, password, role } = requestData
    
    // Validate request body
    if (!email || !password || role !== 'expert') {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // Create new user with expert role
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { role: 'expert' },
    })

    if (error) {
      console.error('Error creating expert user:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // Update the user's role in the profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'expert' })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Error updating user role in profiles:', profileError)
      }
    }

    return new Response(
      JSON.stringify({ id: data.user.id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})
