#!/bin/bash

# Test script to verify local Supabase setup
echo "🔍 Testing Local Supabase Configuration..."
echo

# Check if Supabase is running
echo "📡 Checking Supabase status..."
supabase status --no-color | head -n 20

echo
echo "🌐 Testing API connectivity..."

# Test API endpoint
API_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  "$API_URL/rest/v1/")

if [ "$response" = "200" ]; then
    echo "✅ API is accessible (HTTP $response)"
else
    echo "❌ API not accessible (HTTP $response)"
fi

echo
echo "📊 Supabase Studio: http://localhost:54323"
echo "🖥️  Frontend: http://localhost:8080"
echo "🔧 API: http://localhost:54321"
echo
echo "✅ Local Supabase setup complete!"
echo "   Run 'npm run dev' to start the frontend"
echo "   Run 'npm run supabase:stop' to stop Supabase"
