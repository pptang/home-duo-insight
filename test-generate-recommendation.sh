#!/bin/bash

# Test script for generate-recommendation function
# Uses sample data based on the provided Suumo URLs:
# Property A: https://suumo.jp/library/tf_20/sc_20201/to_1000689554/?bs=040
# Property B: https://suumo.jp/chintai/jnc_000097338833/?bc=100427995778

# Read environment variables
source supabase/.env.local

# Function URL
FUNCTION_URL="${SUPABASE_URL}/functions/v1/generate-recommendation"

echo "Testing generate-recommendation function at: $FUNCTION_URL"
echo "Using GEMINI_API_KEY: ${GEMINI_API_KEY:0:10}..."
echo ""

# Create the JSON payload
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{
    "comparison_id": "fc7b8b3b-a899-4423-a21b-41a4df660f66",
    "property_a": {
      "property_name": "Modern Tokyo Apartment",
      "address": "Shibuya, Tokyo",
      "price_yen": 280000,
      "floor_plan": "1LDK",
      "commute_minutes": 25,
      "property_type": "Apartment",
      "image_urls": ["https://suumo.jp/library/tf_20/sc_20201/to_1000689554/?bs=040"],
      "notes": "Modern building with good access to Shibuya station. Well-maintained property with elevator."
    },
    "property_b": {
      "property_name": "Convenient Rental Unit",
      "address": "Shinjuku, Tokyo",
      "price_yen": 250000,
      "floor_plan": "1K",
      "commute_minutes": 15,
      "property_type": "Apartment",
      "image_urls": ["https://suumo.jp/chintai/jnc_000097338833/?bc=100427995778"],
      "notes": "Close to JR station, convenient for commuting. Compact but efficient layout."
    },
    "user_profile": {
      "has_pets": false,
      "works_from_home": true,
      "family_size": 1,
      "commute_priority": 3
    }
  }' \
  | jq '.'

echo ""
echo "Test completed!"