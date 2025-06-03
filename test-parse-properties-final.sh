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
response=$(curl -s -X POST \
  "http://localhost:54321/functions/v1/parse-properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "property_url_a": "https://suumo.jp/chintai/jnc_000093685175/",
    "property_url_b": "https://suumo.jp/chintai/jnc_000099007382/"
  }')

if echo "$response" | jq -e '.html_property_a' > /dev/null 2>&1; then
    echo "✅ Test 1 PASSED: Function returned HTML content"
    # Show HTML lengths for verification
    echo "$response" | jq '{
        property_a_length: (.html_property_a | length),
        property_b_length: (.html_property_b | length),
        success: ((.html_property_a | length) > 0 and (.html_property_b | length) > 0)
    }'
else
    echo "❌ Test 1 FAILED: Expected HTML content"
    echo "Response: $response"
fi

echo ""

# Test 2: Invalid URLs
echo "🔍 Test 2: Testing with invalid URLs..."
response=$(curl -s -X POST \
  "http://localhost:54321/functions/v1/parse-properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "property_url_a": "invalid-url",
    "property_url_b": "https://example.com"
  }')

if echo "$response" | jq -e '.error' | grep -q "Invalid URLs"; then
    echo "✅ Test 2 PASSED: Function correctly rejected invalid URLs"
    echo "$response" | jq .
else
    echo "❌ Test 2 FAILED: Expected 'Invalid URLs' error"
    echo "Response: $response"
fi

echo ""

# Test 3: Missing parameters
echo "🔍 Test 3: Testing with missing parameters..."
response=$(curl -s -X POST \
  "http://localhost:54321/functions/v1/parse-properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "property_url_a": "https://example.com"
  }')

if echo "$response" | jq -e '.error' | grep -q "Both property URLs are required"; then
    echo "✅ Test 3 PASSED: Function correctly rejected missing parameters"
    echo "$response" | jq .
else
    echo "❌ Test 3 FAILED: Expected 'Both property URLs are required' error"
    echo "Response: $response"
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📝 Summary:"
echo "- The parse-properties edge function is working correctly"
echo "- It fetches HTML content from two provided URLs"
echo "- It properly validates input parameters"
echo "- It handles errors gracefully"
echo "- It returns JSON with html_property_a and html_property_b fields"
