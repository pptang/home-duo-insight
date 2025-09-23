import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    // Get environment variables
    const firecrawlUrl = Deno.env.get('FIRECRAWL_URL');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const envVars = {
      FIRECRAWL_URL: firecrawlUrl || 'Not set',
      FIRECRAWL_API_KEY: firecrawlApiKey ? 'Set' : 'Not set',
      GEMINI_API_KEY: geminiApiKey ? 'Set' : 'Not set',
    };

    return new Response(
      JSON.stringify({
        message: 'Environment variables status',
        environment: envVars,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to check environment variables',
        details: error.message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
