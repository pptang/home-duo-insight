#!/bin/bash

# Simple verification script for metadata editing APIs
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo -e "${BLUE}🚀 Verifying Metadata Editing APIs${NC}"
echo "===================================="

# Check if Supabase is running
if ! curl -s "$SUPABASE_URL/rest/v1/" > /dev/null; then
    echo -e "${RED}❌ Supabase is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Supabase is running${NC}"

# Test 1: Create property
echo -e "\n${YELLOW}📝 Test 1: Creating test property...${NC}"
property_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: return=representation" \
    -d '{"property_name": "Test Property", "address": "Test Address", "price_yen": 100000, "floor_plan": "1LDK"}' \
    "$SUPABASE_URL/rest/v1/properties")

property_id=$(echo "$property_response" | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo -e "${GREEN}✅ Created property: $property_id${NC}"

# Test 2: Update single field
echo -e "\n${YELLOW}🔧 Test 2: Updating price field...${NC}"
update_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -d "{\"property_id\": \"$property_id\", \"field_name\": \"price_yen\", \"field_value\": 120000, \"user_id\": null}" \
    "$SUPABASE_URL/functions/v1/update-property-metadata")

if echo "$update_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Price update successful${NC}"
    echo "Updated price: $(echo "$update_response" | grep -o '"price_yen":[0-9]*' | cut -d':' -f2)"
else
    echo -e "${RED}❌ Price update failed${NC}"
    echo "$update_response"
    exit 1
fi

# Test 3: Batch update
echo -e "\n${YELLOW}🔧 Test 3: Batch update multiple fields...${NC}"
batch_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -d "{\"property_id\": \"$property_id\", \"updates\": {\"property_name\": \"Updated Property\", \"floor_plan\": \"2LDK\"}, \"user_id\": null}" \
    "$SUPABASE_URL/functions/v1/update-property-metadata")

if echo "$batch_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Batch update successful${NC}"
    echo "Updated fields: $(echo "$batch_response" | grep -o '"updated_fields":\[[^\]]*\]')"
else
    echo -e "${RED}❌ Batch update failed${NC}"
    echo "$batch_response"
    exit 1
fi

# Test 4: Validation error
echo -e "\n${YELLOW}🚨 Test 4: Testing validation (negative price)...${NC}"
validation_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -d "{\"property_id\": \"$property_id\", \"field_name\": \"price_yen\", \"field_value\": -1000, \"user_id\": null}" \
    "$SUPABASE_URL/functions/v1/update-property-metadata")

if echo "$validation_response" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Validation error correctly caught${NC}"
else
    echo -e "${RED}❌ Validation should have failed${NC}"
    exit 1
fi

# Test 5: Create comparison for status testing
echo -e "\n${YELLOW}📊 Test 5: Creating comparison...${NC}"
property2_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: return=representation" \
    -d '{"property_name": "Second Property", "price_yen": 90000}' \
    "$SUPABASE_URL/rest/v1/properties")

property2_id=$(echo "$property2_response" | sed 's/.*"id":"\([^"]*\)".*/\1/')

comparison_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: return=representation" \
    -d "{\"property_a_id\": \"$property_id\", \"property_b_id\": \"$property2_id\"}" \
    "$SUPABASE_URL/rest/v1/comparisons")

comparison_id=$(echo "$comparison_response" | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo -e "${GREEN}✅ Created comparison: $comparison_id${NC}"

# Test 6: Update comparison status
echo -e "\n${YELLOW}📈 Test 6: Updating comparison status...${NC}"
status_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -d "{\"comparison_id\": \"$comparison_id\", \"status\": \"completed\"}" \
    "$SUPABASE_URL/functions/v1/update-comparison-status")

if echo "$status_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Status update successful${NC}"
    echo "Status: $(echo "$status_response" | grep -o '"metadata_review_status":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ Status update failed${NC}"
    echo "$status_response"
    exit 1
fi

# Test 7: Invalid status validation
echo -e "\n${YELLOW}🚨 Test 7: Testing invalid status...${NC}"
invalid_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -d "{\"comparison_id\": \"$comparison_id\", \"status\": \"invalid\"}" \
    "$SUPABASE_URL/functions/v1/update-comparison-status")

if echo "$invalid_response" | grep -q '"error":"Invalid status"'; then
    echo -e "${GREEN}✅ Invalid status correctly rejected${NC}"
else
    echo -e "${RED}❌ Invalid status should have been rejected${NC}"
    exit 1
fi

# Summary
echo -e "\n${BLUE}📋 Test Results${NC}"
echo "================="
echo -e "${GREEN}✅ Property creation${NC}"
echo -e "${GREEN}✅ Single field update${NC}" 
echo -e "${GREEN}✅ Batch field update${NC}"
echo -e "${GREEN}✅ Validation error handling${NC}"
echo -e "${GREEN}✅ Comparison creation${NC}"
echo -e "${GREEN}✅ Status update${NC}"
echo -e "${GREEN}✅ Invalid status rejection${NC}"

echo -e "\n${GREEN}🎉 All metadata editing APIs are working perfectly!${NC}"
echo -e "\n${YELLOW}Test data created:${NC}"
echo "Property 1: $property_id"
echo "Property 2: $property2_id"
echo "Comparison: $comparison_id"