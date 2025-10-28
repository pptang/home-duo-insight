#!/bin/bash

# Script to verify the language support in generate-recommendation edge function
#
# This script tests:
# 1. English recommendation (language: 'en')
# 2. Japanese recommendation (language: 'ja')
# 3. Default language when no parameter is provided (defaults to 'en')
# 4. Invalid language parameter (should return 400 error)
#
# Prerequisites:
# - Supabase CLI installed and local instance running
# - curl and jq installed
#
# Usage: ./verify-language-support.sh

set -e

echo "🌐 Language Support Test: Generate-Recommendation Edge Function"
echo "================================================================"

# Check if Supabase functions are running
echo "Checking if Supabase functions are running..."
if ! curl -s http://localhost:54321/functions/v1/generate-recommendation > /dev/null 2>&1; then
    echo "❌ Supabase functions not running. Please run: npm run supabase:start"
    exit 1
fi

echo "✅ Supabase functions are running"
echo ""

# Test user profile
USER_PROFILE='{
  "lifestyle_fit": {
    "proximity_to_cafes": 4,
    "access_to_gym": 5,
    "dog_walking_friendly": 5,
    "quiet_at_night": 5,
    "morning_vs_afternoon_sunlight": "no_preference",
    "laundromat_access": 3
  },
  "emotional_desires": {
    "open_view": 3,
    "feels_like_home": 3,
    "creative_friendly": 3,
    "reading_corner_space": 3,
    "natural_surroundings": 3
  },
  "life_planning": {
    "future_family_growth": 3,
    "work_from_home_support": 3,
    "resale_potential": 3,
    "renovation_willingness": 3,
    "storage_capacity": 3
  },
  "sensory_comfort": {
    "natural_ventilation": 3,
    "light_sensitivity": 3,
    "minimalist_vs_maximalist": "no_preference",
    "privacy_from_neighbors": 5
  },
  "cultural_routine": {
    "grocery_chain_access": 3,
    "international_schools": 3,
    "weekend_market_access": 3,
    "safe_for_biking": 3,
    "spiritual_space_access": 3
  }
}'

# Mock property data for testing
PROPERTY_A='{
  "property_name": "Sunny Hills Apartment",
  "address": "1-2-3 Shibuya, Tokyo",
  "price_yen": 50000000,
  "floor_plan": "2LDK",
  "commute_minutes": 15,
  "property_type": "Apartment",
  "image_urls": [],
  "notes": "South facing, 5th floor"
}'

PROPERTY_B='{
  "property_name": "Green View Mansion",
  "address": "4-5-6 Meguro, Tokyo",
  "price_yen": 45000000,
  "floor_plan": "1LDK",
  "commute_minutes": 25,
  "property_type": "Mansion",
  "image_urls": [],
  "notes": "Near park, 3rd floor"
}'

COMPARISON_ID="test-comparison-$(date +%s)"

# Test 1: English Recommendation
echo "📝 Test 1: English Recommendation (language: 'en')"
echo "=================================================="

REQUEST_PAYLOAD_EN=$(jq -n \
  --arg comparison_id "$COMPARISON_ID" \
  --argjson property_a "$PROPERTY_A" \
  --argjson property_b "$PROPERTY_B" \
  --argjson user_profile "$USER_PROFILE" \
  '{
    comparison_id: $comparison_id,
    property_a: $property_a,
    property_b: $property_b,
    user_profile: $user_profile,
    language: "en"
  }')

TEMP_EN=$(mktemp)
HTTP_CODE_EN=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD_EN" \
  -w "%{http_code}" \
  -o "$TEMP_EN")

RESPONSE_EN=$(cat "$TEMP_EN")

echo "HTTP Status: $HTTP_CODE_EN"
echo ""

if [ "$HTTP_CODE_EN" = "200" ]; then
    echo "✅ English recommendation generated successfully!"
    echo ""
    echo "Sample Output (final_recommendation):"
    echo "$RESPONSE_EN" | jq -r '.final_recommendation' | head -c 200
    echo "..."
    echo ""
else
    echo "❌ Test failed with status $HTTP_CODE_EN"
    echo "$RESPONSE_EN" | jq '.' 2>/dev/null || echo "$RESPONSE_EN"
    rm -f "$TEMP_EN"
    exit 1
fi

rm -f "$TEMP_EN"
echo ""

# Test 2: Japanese Recommendation
echo "📝 Test 2: Japanese Recommendation (language: 'ja')"
echo "===================================================="

REQUEST_PAYLOAD_JA=$(jq -n \
  --arg comparison_id "$COMPARISON_ID" \
  --argjson property_a "$PROPERTY_A" \
  --argjson property_b "$PROPERTY_B" \
  --argjson user_profile "$USER_PROFILE" \
  '{
    comparison_id: $comparison_id,
    property_a: $property_a,
    property_b: $property_b,
    user_profile: $user_profile,
    language: "ja"
  }')

TEMP_JA=$(mktemp)
HTTP_CODE_JA=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD_JA" \
  -w "%{http_code}" \
  -o "$TEMP_JA")

RESPONSE_JA=$(cat "$TEMP_JA")

echo "HTTP Status: $HTTP_CODE_JA"
echo ""

if [ "$HTTP_CODE_JA" = "200" ]; then
    echo "✅ Japanese recommendation generated successfully!"
    echo ""
    echo "Sample Output (final_recommendation):"
    echo "$RESPONSE_JA" | jq -r '.final_recommendation' | head -c 200
    echo "..."
    echo ""
else
    echo "❌ Test failed with status $HTTP_CODE_JA"
    echo "$RESPONSE_JA" | jq '.' 2>/dev/null || echo "$RESPONSE_JA"
    rm -f "$TEMP_JA"
    exit 1
fi

rm -f "$TEMP_JA"
echo ""

# Test 3: Default Language (no language parameter)
echo "📝 Test 3: Default Language (no language parameter - should default to 'en')"
echo "============================================================================"

REQUEST_PAYLOAD_DEFAULT=$(jq -n \
  --arg comparison_id "$COMPARISON_ID" \
  --argjson property_a "$PROPERTY_A" \
  --argjson property_b "$PROPERTY_B" \
  --argjson user_profile "$USER_PROFILE" \
  '{
    comparison_id: $comparison_id,
    property_a: $property_a,
    property_b: $property_b,
    user_profile: $user_profile
  }')

TEMP_DEFAULT=$(mktemp)
HTTP_CODE_DEFAULT=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD_DEFAULT" \
  -w "%{http_code}" \
  -o "$TEMP_DEFAULT")

RESPONSE_DEFAULT=$(cat "$TEMP_DEFAULT")

echo "HTTP Status: $HTTP_CODE_DEFAULT"
echo ""

if [ "$HTTP_CODE_DEFAULT" = "200" ]; then
    echo "✅ Default language recommendation generated successfully!"
    echo ""
    echo "Sample Output (final_recommendation):"
    echo "$RESPONSE_DEFAULT" | jq -r '.final_recommendation' | head -c 200
    echo "..."
    echo ""
else
    echo "❌ Test failed with status $HTTP_CODE_DEFAULT"
    echo "$RESPONSE_DEFAULT" | jq '.' 2>/dev/null || echo "$RESPONSE_DEFAULT"
    rm -f "$TEMP_DEFAULT"
    exit 1
fi

rm -f "$TEMP_DEFAULT"
echo ""

# Test 4: Invalid Language
echo "📝 Test 4: Invalid Language (language: 'fr' - should return 400 error)"
echo "======================================================================"

REQUEST_PAYLOAD_INVALID=$(jq -n \
  --arg comparison_id "$COMPARISON_ID" \
  --argjson property_a "$PROPERTY_A" \
  --argjson property_b "$PROPERTY_B" \
  --argjson user_profile "$USER_PROFILE" \
  '{
    comparison_id: $comparison_id,
    property_a: $property_a,
    property_b: $property_b,
    user_profile: $user_profile,
    language: "fr"
  }')

TEMP_INVALID=$(mktemp)
HTTP_CODE_INVALID=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD_INVALID" \
  -w "%{http_code}" \
  -o "$TEMP_INVALID")

RESPONSE_INVALID=$(cat "$TEMP_INVALID")

echo "HTTP Status: $HTTP_CODE_INVALID"
echo ""

if [ "$HTTP_CODE_INVALID" = "400" ]; then
    echo "✅ Invalid language correctly rejected!"
    echo ""
    echo "Error Message:"
    echo "$RESPONSE_INVALID" | jq -r '.error'
    echo ""
else
    echo "❌ Test failed - expected status 400 but got $HTTP_CODE_INVALID"
    echo "$RESPONSE_INVALID" | jq '.' 2>/dev/null || echo "$RESPONSE_INVALID"
    rm -f "$TEMP_INVALID"
    exit 1
fi

rm -f "$TEMP_INVALID"
echo ""

echo "🎉 All language support tests passed!"
echo ""
echo "Summary:"
echo "  ✅ English recommendation (language: 'en')"
echo "  ✅ Japanese recommendation (language: 'ja')"
echo "  ✅ Default language (no parameter → 'en')"
echo "  ✅ Invalid language rejected (400 error)"
