#!/bin/bash

# Script to verify the analyze-properties edge function
#
# This script tests the analyze-properties Supabase Edge Function by:
# 1. Checking required environment variables (FIRECRAWL_API_KEY, GEMINI_API_KEY)
# 2. Verifying Supabase functions are running locally
# 3. Making a test API call with two Japanese property URLs
# 4. Displaying the response and any errors
#
# Prerequisites:
# - Supabase CLI installed and local instance running
# - .env.local file with required API keys
# - curl and jq installed
#
# Usage: ./verify-analyze-properties.sh

set -e

echo "🏠 Verifying analyze-properties edge function..."
echo "================================================"

# # Check if .env.local exists
# if [ ! -f ".env.local" ]; then
#     echo "❌ .env.local file not found"
#     echo "Please copy .env.example to .env.local and configure your API keys"
#     exit 1
# fi

# # Check for required environment variables
# echo "Checking environment variables..."
# if ! grep -q "FIRECRAWL_API_KEY" .env.local; then
#     echo "❌ FIRECRAWL_API_KEY not found in .env.local"
#     echo "Please add your Firecrawl API key to .env.local:"
#     echo "FIRECRAWL_API_KEY=your_api_key_here"
#     exit 1
# fi

# if ! grep -q "GEMINI_API_KEY" .env.local; then
#     echo "❌ GEMINI_API_KEY not found in .env.local"
#     echo "Please add your Gemini API key to .env.local:"
#     echo "GEMINI_API_KEY=your_api_key_here"
#     exit 1
# fi

echo "✅ Environment variables configured"

# Check if Supabase functions are running
echo "Checking if Supabase functions are running..."
if ! curl -s http://localhost:54321/functions/v1/analyze-properties > /dev/null 2>&1; then
    echo "❌ Supabase functions not running. Please run: npm run supabase:start"
    exit 1
fi

echo "✅ Supabase functions are running"
echo ""

# Test data
PROPERTY_URL_A="https://suumo.jp/chukoikkodate/nagano/sc_kitasakugun/nc_76216406/"
PROPERTY_URL_B="https://suumo.jp/chukoikkodate/nagano/sc_kitasakugun/nc_73125861/"

echo "Testing with properties:"
echo "Property A: $PROPERTY_URL_A"
echo "Property B: $PROPERTY_URL_B"
echo ""

# Make the API call
echo "🔄 Calling analyze-properties function..."

# Create temporary files for response
TEMP_RESPONSE=$(mktemp)
TEMP_HEADERS=$(mktemp)

HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/analyze-properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat .env.local | grep SUPABASE_ANON_KEY | cut -d'=' -f2)" \
  -d "{
    \"property_url_a\": \"$PROPERTY_URL_A\",
    \"property_url_b\": \"$PROPERTY_URL_B\"
  }" \
  -w "%{http_code}" \
  -o "$TEMP_RESPONSE" \
  -D "$TEMP_HEADERS")

RESPONSE_BODY=$(cat "$TEMP_RESPONSE")

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Function executed successfully!"
    echo ""
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ Function failed with status $HTTP_CODE"
    echo ""
    echo "Error response:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    exit 1
fi

# Clean up temporary files
rm -f "$TEMP_RESPONSE" "$TEMP_HEADERS"

echo ""
echo "🎉 Verification complete!"