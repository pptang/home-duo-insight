# Troubleshooting Edge Functions

## Common Issues and Solutions

### "Error parsing property URLs" - Firecrawl API Key Missing

**Symptoms:**
- Error message: "Error parsing property URLs"
- Details: "Edge Function returned a non-2xx status code"
- Status code: "unknown"

**Root Cause:**
The `analyze-properties` and `parse-properties` functions require a Firecrawl API key to scrape website content.

**Solution:**
1. Get your Firecrawl API key from [firecrawl.dev](https://firecrawl.dev)
2. Add it to `supabase/functions/.env`:
   ```
   FIRECRAWL_API_KEY=your_actual_api_key_here
   ```
3. Restart Supabase: `supabase stop && supabase start`

**Testing:**
- Run `./test-firecrawl-config.sh` to verify the API key is working
- Run `./test-analyze-properties.sh` to test the full workflow

### User ID Format Issues

**Symptoms:**
- Error: "invalid input syntax for type uuid"

**Solution:**
- Ensure `user_id` is either a valid UUID or `null`
- Valid format: `"123e4567-e89b-12d3-a456-426614174000"`
- For anonymous users: `"user_id": null`

## Test Scripts

- `test-firecrawl-config.sh` - Verify Firecrawl API configuration
- `test-analyze-properties.sh` - Test the complete analyze-properties workflow
- `test-parse-properties-final.sh` - Test the parse-properties function specifically
