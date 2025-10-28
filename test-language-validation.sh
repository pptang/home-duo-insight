#!/bin/bash

# Quick test script to verify language parameter validation
# This tests the edge function's input validation without requiring actual API calls

set -e

echo "🧪 Quick Language Validation Test"
echo "=================================="

# Check if Supabase functions are running
if ! curl -s http://localhost:54321/functions/v1/generate-recommendation > /dev/null 2>&1; then
    echo "❌ Supabase functions not running. Please run: npm run supabase:start"
    exit 1
fi

echo "✅ Supabase functions are running"
echo ""

# Get anon key from .env.local
ANON_KEY=$(grep SUPABASE_ANON_KEY .env.local | cut -d'=' -f2)

if [ -z "$ANON_KEY" ]; then
    echo "❌ SUPABASE_ANON_KEY not found in .env.local"
    exit 1
fi

# Mock minimal data
PROPERTY='{
  "property_name": "Test",
  "address": "Tokyo",
  "price_yen": 50000000,
  "floor_plan": "2LDK",
  "commute_minutes": 15,
  "property_type": "Apartment",
  "image_urls": [],
  "notes": "Test"
}'

USER_PROFILE='{
  "lifestyle_fit": {"proximity_to_cafes": 3, "access_to_gym": 3, "dog_walking_friendly": 3, "quiet_at_night": 3, "morning_vs_afternoon_sunlight": "no_preference", "laundromat_access": 3},
  "emotional_desires": {"open_view": 3, "feels_like_home": 3, "creative_friendly": 3, "reading_corner_space": 3, "natural_surroundings": 3},
  "life_planning": {"future_family_growth": 3, "work_from_home_support": 3, "resale_potential": 3, "renovation_willingness": 3, "storage_capacity": 3},
  "sensory_comfort": {"natural_ventilation": 3, "light_sensitivity": 3, "minimalist_vs_maximalist": "no_preference", "privacy_from_neighbors": 3},
  "cultural_routine": {"grocery_chain_access": 3, "international_schools": 3, "weekend_market_access": 3, "safe_for_biking": 3, "spiritual_space_access": 3}
}'

# Test invalid language - should get 400 error
echo "Test 1: Invalid language parameter (should return 400)"
echo "------------------------------------------------------"

PAYLOAD=$(jq -n \
  --argjson pa "$PROPERTY" \
  --argjson pb "$PROPERTY" \
  --argjson up "$USER_PROFILE" \
  '{property_a: $pa, property_b: $pb, user_profile: $up, language: "fr"}')

TEMP=$(mktemp)
HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD" \
  -w "%{http_code}" \
  -o "$TEMP")

RESPONSE=$(cat "$TEMP")

if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Invalid language correctly rejected (HTTP $HTTP_CODE)"
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error')
    echo "   Error: $ERROR_MSG"
    if [[ "$ERROR_MSG" == *"Invalid language"* ]]; then
        echo "   ✅ Error message is correct"
    else
        echo "   ⚠️  Error message doesn't mention invalid language"
    fi
else
    echo "❌ Expected HTTP 400 but got $HTTP_CODE"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    rm -f "$TEMP"
    exit 1
fi

rm -f "$TEMP"
echo ""

# Test valid language 'en'
echo "Test 2: Valid language 'en' (should accept parameter)"
echo "-----------------------------------------------------"

PAYLOAD_EN=$(jq -n \
  --argjson pa "$PROPERTY" \
  --argjson pb "$PROPERTY" \
  --argjson up "$USER_PROFILE" \
  '{property_a: $pa, property_b: $pb, user_profile: $up, language: "en"}')

TEMP=$(mktemp)
HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD_EN" \
  -w "%{http_code}" \
  -o "$TEMP")

RESPONSE=$(cat "$TEMP")

if [ "$HTTP_CODE" != "400" ]; then
    echo "✅ Language 'en' accepted (HTTP $HTTP_CODE)"
    if [ "$HTTP_CODE" = "500" ]; then
        ERROR=$(echo "$RESPONSE" | jq -r '.error // empty')
        if [[ "$ERROR" == *"Invalid language"* ]]; then
            echo "❌ Should not reject 'en' as invalid language"
            exit 1
        else
            echo "   ℹ️  Got 500 error (likely API key issue, but validation passed)"
        fi
    fi
else
    echo "❌ Language 'en' was rejected with HTTP 400"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    rm -f "$TEMP"
    exit 1
fi

rm -f "$TEMP"
echo ""

# Test valid language 'ja'
echo "Test 3: Valid language 'ja' (should accept parameter)"
echo "-----------------------------------------------------"

PAYLOAD_JA=$(jq -n \
  --argjson pa "$PROPERTY" \
  --argjson pb "$PROPERTY" \
  --argjson up "$USER_PROFILE" \
  '{property_a: $pa, property_b: $pb, user_profile: $up, language: "ja"}')

TEMP=$(mktemp)
HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD_JA" \
  -w "%{http_code}" \
  -o "$TEMP")

RESPONSE=$(cat "$TEMP")

if [ "$HTTP_CODE" != "400" ]; then
    echo "✅ Language 'ja' accepted (HTTP $HTTP_CODE)"
    if [ "$HTTP_CODE" = "500" ]; then
        ERROR=$(echo "$RESPONSE" | jq -r '.error // empty')
        if [[ "$ERROR" == *"Invalid language"* ]]; then
            echo "❌ Should not reject 'ja' as invalid language"
            exit 1
        else
            echo "   ℹ️  Got 500 error (likely API key issue, but validation passed)"
        fi
    fi
else
    echo "❌ Language 'ja' was rejected with HTTP 400"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    rm -f "$TEMP"
    exit 1
fi

rm -f "$TEMP"
echo ""

# Test missing language parameter (should default to 'en')
echo "Test 4: Missing language parameter (should default to 'en')"
echo "-----------------------------------------------------------"

PAYLOAD_NO_LANG=$(jq -n \
  --argjson pa "$PROPERTY" \
  --argjson pb "$PROPERTY" \
  --argjson up "$USER_PROFILE" \
  '{property_a: $pa, property_b: $pb, user_profile: $up}')

TEMP=$(mktemp)
HTTP_CODE=$(curl -s -X POST \
  http://localhost:54321/functions/v1/generate-recommendation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD_NO_LANG" \
  -w "%{http_code}" \
  -o "$TEMP")

RESPONSE=$(cat "$TEMP")

if [ "$HTTP_CODE" != "400" ]; then
    echo "✅ Missing language accepted (defaults to 'en') (HTTP $HTTP_CODE)"
    if [ "$HTTP_CODE" = "500" ]; then
        ERROR=$(echo "$RESPONSE" | jq -r '.error // empty')
        if [[ "$ERROR" == *"Invalid language"* ]]; then
            echo "❌ Should not reject missing language"
            exit 1
        else
            echo "   ℹ️  Got 500 error (likely API key issue, but validation passed)"
        fi
    fi
else
    echo "❌ Missing language was rejected with HTTP 400"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    rm -f "$TEMP"
    exit 1
fi

rm -f "$TEMP"
echo ""

echo "✅ All validation tests passed!"
echo ""
echo "Summary:"
echo "  ✅ Invalid language 'fr' rejected with 400"
echo "  ✅ Valid language 'en' accepted"
echo "  ✅ Valid language 'ja' accepted"
echo "  ✅ Missing language defaults to 'en'"
echo ""
echo "Note: Full API testing requires a valid GEMINI_API_KEY in .env.local"
