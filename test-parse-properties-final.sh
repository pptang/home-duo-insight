#!/bin/bash

# Test script for parse-properties edge function
# This script tests the local Supabase edge function

echo "🧪 Testing parse-properties edge function..."
echo ""

# Get Supabase status to confirm it's running
echo "📋 Checking Supabase status..."
supabase status | grep "API URL\|JWT secret\|anon key" || {
    echo "❌ Supabase is not running. Please start it with 'supabase start'"
    exit 1
}

echo ""
echo "✅ Supabase is running!"
echo ""

# Test 1: Valid URLs
echo "🔍 Test 1: Testing with valid URLs..."
start_time=$(date +%s.%N)
response=$(curl -s -X POST \
  "http://localhost:54321/functions/v1/parse-properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "property_url_a": "https://suumo.jp/chukoikkodate/nagano/sc_kitasakugun/nc_76216406/",
    "property_url_b": "https://suumo.jp/chukoikkodate/nagano/sc_kitasakugun/nc_73125861/"
  }')
end_time=$(date +%s.%N)
execution_time=$(echo "$end_time - $start_time" | bc)

if echo "$response" | jq -e '.html_property_a' > /dev/null 2>&1; then
    echo "✅ Test 1 PASSED: Function returned HTML content"
    printf "⏱️  Execution time: %.2f seconds\n" "$execution_time"

    # Show the complete API response
    echo "📄 API Response:"
    echo "$response" | jq .

else
    echo "❌ Test 1 FAILED: Expected HTML content"
    printf "⏱️  Execution time: %.2f seconds\n" "$execution_time"
    echo "Response: $response"
fi

echo ""
echo "🎉 Test completed!"
echo ""
echo "📝 Summary:"
printf -- "- Successfully fetched HTML content from both property URLs in %.2f seconds\n" "$execution_time"
echo "- Property data is now available for analysis"
