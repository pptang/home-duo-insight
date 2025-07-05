#!/bin/bash

# Test script to verify Firecrawl API key is working
echo "🧪 Testing Firecrawl API key configuration..."
echo ""

# Check if the functions environment has FIRECRAWL_API_KEY set
echo "📋 Checking environment variables..."

# Test the parse-properties function with a simple request
echo "🔍 Testing parse-properties function..."
response=$(curl -s -X POST \
  "http://localhost:54321/functions/v1/parse-properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "property_url_a": "https://example.com",
    "property_url_b": "https://httpbin.org/html"
  }')

echo "Response: $response"
echo ""

# Check if the response indicates missing API key
if echo "$response" | grep -q "Firecrawl API key not configured"; then
    echo "❌ FIRECRAWL_API_KEY is still not configured"
    echo "Please add your Firecrawl API key to supabase/functions/.env"
    echo "Replace 'your_firecrawl_api_key_here' with your actual API key"
elif echo "$response" | grep -q "error"; then
    echo "⚠️  API key is configured but there may be other issues:"
    echo "$response" | jq -r '.error // .details // .'
else
    echo "✅ Firecrawl API key appears to be configured correctly!"
fi

echo ""
echo "Next steps:"
echo "1. Get your Firecrawl API key from https://firecrawl.dev"
echo "2. Edit supabase/functions/.env and replace 'your_firecrawl_api_key_here' with your key"
echo "3. Restart Supabase with: supabase stop && supabase start"
echo "4. Test again with this script"
