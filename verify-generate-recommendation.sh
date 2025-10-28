#!/bin/bash

# Script to verify the generate-recommendation edge function end-to-end
#
# This script tests the complete flow:
# 1. Calls analyze-properties to parse two property URLs
# 2. Uses the parsed data to call generate-recommendation
# 3. Displays the AI-generated recommendation
#
# Prerequisites:
# - Supabase CLI installed and local instance running
# - .env.local file with required API keys
# - curl and jq installed
#
# Usage:
#   ./verify-generate-recommendation.sh           # Defaults to English
#   ./verify-generate-recommendation.sh en        # English
#   ./verify-generate-recommendation.sh ja        # Japanese

set -e

# Parse language parameter (default to 'en')
LANGUAGE="${1:-en}"

# Validate language parameter
if [[ ! "$LANGUAGE" =~ ^(en|ja)$ ]]; then
    echo "❌ Invalid language: $LANGUAGE"
    echo "Supported languages: en, ja"
    echo "Usage: ./verify-generate-recommendation.sh [en|ja]"
    exit 1
fi

echo "🏠 E2E Test: Property Analysis → AI Recommendation (Language: $LANGUAGE)"
echo "=========================================================================="

# Check if Supabase functions are running
echo "Checking if Supabase functions are running..."
if ! curl -s http://localhost:54321/functions/v1/analyze-properties > /dev/null 2>&1; then
    echo "❌ Supabase functions not running. Please run: npm run supabase:start"
    exit 1
fi

echo "✅ Supabase functions are running"
echo ""

# Test data - Property URLs
PROPERTY_URL_A="https://suumo.jp/ikkodate/tokyo/sc_shinjuku/nc_78456719/"
PROPERTY_URL_B="https://suumo.jp/ikkodate/tokyo/sc_shinjuku/nc_78448509/"

echo "Testing with properties:"
echo "Property A: $PROPERTY_URL_A"
echo "Property B: $PROPERTY_URL_B"
echo ""

# Hardcoded user profile for testing (detailed structure matching prompt expectations)
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

echo "Using test user profile:"
echo "$USER_PROFILE" | jq '.'
echo ""

# Step 1: Call analyze-properties
echo "📊 Step 1: Analyzing properties..."
echo "-----------------------------------"

TEMP_ANALYZE=$(mktemp)
ANALYZE_HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/analyze-properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat .env.local | grep SUPABASE_ANON_KEY | cut -d'=' -f2)" \
  -d "{
    \"property_url_a\": \"$PROPERTY_URL_A\",
    \"property_url_b\": \"$PROPERTY_URL_B\"
  }" \
  -w "%{http_code}" \
  -o "$TEMP_ANALYZE")

ANALYZE_RESPONSE=$(cat "$TEMP_ANALYZE")

if [ "$ANALYZE_HTTP_CODE" != "200" ]; then
    echo "❌ analyze-properties failed with status $ANALYZE_HTTP_CODE"
    echo "$ANALYZE_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYZE_RESPONSE"
    rm -f "$TEMP_ANALYZE"
    exit 1
fi

echo "✅ Properties analyzed successfully"
echo ""

echo "📄 Analyze-Properties Response:"
echo "================================"
echo "$ANALYZE_RESPONSE" | jq '.'
echo ""

# Extract comparison_id and property data
COMPARISON_ID=$(echo "$ANALYZE_RESPONSE" | jq -r '.comparison_id')
PROPERTY_A_DATA=$(echo "$ANALYZE_RESPONSE" | jq '.property_a')
PROPERTY_B_DATA=$(echo "$ANALYZE_RESPONSE" | jq '.property_b')

echo "Comparison ID: $COMPARISON_ID"
echo ""

# Step 2: Call generate-recommendation
echo "🤖 Step 2: Generating AI recommendation..."
echo "-------------------------------------------"

# Build the request payload
REQUEST_PAYLOAD=$(jq -n \
  --arg comparison_id "$COMPARISON_ID" \
  --arg language "$LANGUAGE" \
  --argjson property_a "$PROPERTY_A_DATA" \
  --argjson property_b "$PROPERTY_B_DATA" \
  --argjson user_profile "$USER_PROFILE" \
  '{
    comparison_id: $comparison_id,
    property_a: {
      property_name: $property_a.property_name,
      address: $property_a.address,
      price_yen: $property_a.price_yen,
      floor_plan: $property_a.floor_plan,
      commute_minutes: $property_a.commute_minutes,
      property_type: $property_a.property_type,
      image_urls: $property_a.image_urls,
      notes: $property_a.notes
    },
    property_b: {
      property_name: $property_b.property_name,
      address: $property_b.address,
      price_yen: $property_b.price_yen,
      floor_plan: $property_b.floor_plan,
      commute_minutes: $property_b.commute_minutes,
      property_type: $property_b.property_type,
      image_urls: $property_b.image_urls,
      notes: $property_b.notes
    },
    user_profile: $user_profile,
    language: $language
  }')

echo "📋 Request Payload (Input to generate-recommendation):"
echo "======================================================"
echo ""
echo "Language: $LANGUAGE"
echo ""
echo "Property A Data:"
echo "$PROPERTY_A_DATA" | jq '.'
echo ""
echo "Property B Data:"
echo "$PROPERTY_B_DATA" | jq '.'
echo ""
echo "User Profile:"
echo "$USER_PROFILE" | jq '.'
echo ""

TEMP_RECOMMEND=$(mktemp)
RECOMMEND_HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat .env.local | grep SUPABASE_ANON_KEY | cut -d'=' -f2)" \
  -d "$REQUEST_PAYLOAD" \
  -w "%{http_code}" \
  -o "$TEMP_RECOMMEND")

RECOMMEND_RESPONSE=$(cat "$TEMP_RECOMMEND")

echo "HTTP Status: $RECOMMEND_HTTP_CODE"
echo ""

echo "📄 Generate-Recommendation Response:"
echo "===================================="
echo "$RECOMMEND_RESPONSE" | jq '.'
echo ""

if [ "$RECOMMEND_HTTP_CODE" = "200" ]; then
    echo "✅ Recommendation generated successfully!"
    echo ""

    # Display recommendation
    echo "📋 AI Recommendation:"
    echo "===================="

    RECOMMENDATION_ID=$(echo "$RECOMMEND_RESPONSE" | jq -r '.recommendation_id // "not saved"')
    echo "Recommendation ID: $RECOMMENDATION_ID"
    echo ""

    echo "Property A Pros:"
    echo "$RECOMMEND_RESPONSE" | jq -r '.property_a_pros[]' | sed 's/^/  • /'
    echo ""

    echo "Property A Cons:"
    echo "$RECOMMEND_RESPONSE" | jq -r '.property_a_cons[]' | sed 's/^/  • /'
    echo ""

    echo "Property B Pros:"
    echo "$RECOMMEND_RESPONSE" | jq -r '.property_b_pros[]' | sed 's/^/  • /'
    echo ""

    echo "Property B Cons:"
    echo "$RECOMMEND_RESPONSE" | jq -r '.property_b_cons[]' | sed 's/^/  • /'
    echo ""

    echo "Summary Table:"
    echo "$RECOMMEND_RESPONSE" | jq -r '.summary_table[] | "  • \(.field): Property A = \(.property_a), Property B = \(.property_b)"'
    echo ""

    echo "Final Recommendation:"
    echo "$RECOMMEND_RESPONSE" | jq -r '.final_recommendation' | fold -s -w 80 | sed 's/^/  /'
    echo ""

    # Verify database save
    if [ "$RECOMMENDATION_ID" != "null" ] && [ "$RECOMMENDATION_ID" != "not saved" ]; then
        echo "✅ Recommendation saved to database with ID: $RECOMMENDATION_ID"
    else
        echo "⚠️  Recommendation was not saved to database"
    fi
else
    echo "❌ generate-recommendation failed with status $RECOMMEND_HTTP_CODE"
    echo ""
    echo "Error response:"
    echo "$RECOMMEND_RESPONSE" | jq '.' 2>/dev/null || echo "$RECOMMEND_RESPONSE"
    rm -f "$TEMP_ANALYZE" "$TEMP_RECOMMEND"
    exit 1
fi

# Clean up temporary files
rm -f "$TEMP_ANALYZE" "$TEMP_RECOMMEND"

echo ""
echo "🎉 E2E verification complete!"
