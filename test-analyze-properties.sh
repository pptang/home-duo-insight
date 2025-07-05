#!/bin/bash

# Test script for analyze-properties edge function
echo "🧪 Testing analyze-properties edge function..."
echo ""

# Test with real property URLs (using simpler test URLs first)
echo "🔍 Testing analyze-properties function..."
response=$(curl -s -X POST \
  "http://localhost:54321/functions/v1/analyze-properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "property_url_a": "https://example.com",
    "property_url_b": "https://httpbin.org/html",
    "user_id": "test-user-123"
  }')

echo "Response status and first part:"
echo "$response" | head -c 500
echo ""
echo "..."
echo ""

# Check if there's an error
if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Error found:"
    echo "$response" | jq '.error, .details'
else
    echo "✅ Function appears to be working!"
    echo "Checking for comparison_id..."
    if echo "$response" | jq -e '.comparison_id' > /dev/null 2>&1; then
        echo "✅ Comparison ID found: $(echo "$response" | jq -r '.comparison_id')"
    fi
fi
