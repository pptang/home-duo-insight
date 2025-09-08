import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePropertyRequest {
  property_id: string;
  field_name: string;
  field_value: any;
  user_id?: string;
}

interface BatchUpdatePropertyRequest {
  property_id: string;
  updates: Record<string, any>;
  user_id?: string;
}

interface UpdatePropertyResponse {
  success: boolean;
  property: any;
  validation_errors?: ValidationError[];
  updated_fields: string[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { property_id, field_name, field_value, user_id, updates } = await req.json();

    // Validate input
    if (!property_id) {
      return new Response(
        JSON.stringify({ error: "property_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current property data
    const { data: currentProperty, error: fetchError } = await supabaseServiceClient
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (fetchError || !currentProperty) {
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle single field update or batch updates
    const fieldsToUpdate = updates || { [field_name]: field_value };
    const validationErrors: ValidationError[] = [];
    const updatedFields: string[] = [];
    const manualOverrides = currentProperty.manual_overrides || {};

    // Validate and prepare updates
    const propertyUpdates: Record<string, any> = {};
    
    for (const [fieldName, value] of Object.entries(fieldsToUpdate)) {
      // Skip validation if field is empty (all fields optional)
      if (value === null || value === "" || value === undefined) {
        propertyUpdates[fieldName] = null;
        updatedFields.push(fieldName);
        
        // Track the override
        manualOverrides[fieldName] = {
          original_value: currentProperty[fieldName],
          edited_value: null,
          edited_at: new Date().toISOString(),
          edited_by: user_id
        };
        continue;
      }

      // Format validation for non-empty fields
      const validation = validateField(value, fieldName);
      if (!validation.isValid) {
        validationErrors.push({
          field: fieldName,
          message: validation.error,
          code: 'INVALID_FORMAT'
        });
        continue;
      }

      // Apply the update
      propertyUpdates[fieldName] = value;
      updatedFields.push(fieldName);
      
      // Track the override
      manualOverrides[fieldName] = {
        original_value: currentProperty[fieldName],
        edited_value: value,
        edited_at: new Date().toISOString(),
        edited_by: user_id
      };
    }

    // If there are validation errors, return them without saving
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          validation_errors: validationErrors,
          updated_fields: []
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the property
    propertyUpdates.manual_overrides = manualOverrides;
    propertyUpdates.edited_at = new Date().toISOString();
    propertyUpdates.edited_by = user_id;

    const { data: updatedProperty, error: updateError } = await supabaseServiceClient
      .from("properties")
      .update(propertyUpdates)
      .eq("id", property_id)
      .select()
      .single();

    if (updateError) {
      console.error("Property update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update property" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: updatedProperty,
        updated_fields: updatedFields
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Format validation function
function validateField(value: any, fieldName: string): { isValid: boolean, error?: string } {
  switch (fieldName) {
    case 'price_yen':
      if (typeof value !== 'number' || value <= 0) {
        return { isValid: false, error: 'Price must be a positive number' };
      }
      break;
      
    case 'private_area_sqm':
      if (typeof value !== 'number' || value <= 0) {
        return { isValid: false, error: 'Area must be a positive number' };
      }
      break;
      
    case 'construction_year':
      if (typeof value !== 'number' || value < 1900 || value > 2025) {
        return { isValid: false, error: 'Construction year must be between 1900 and 2025' };
      }
      break;
      
    case 'construction_month':
      if (typeof value !== 'number' || value < 1 || value > 12) {
        return { isValid: false, error: 'Month must be between 1 and 12' };
      }
      break;
      
    case 'commute_minutes':
      if (typeof value !== 'number' || value < 0) {
        return { isValid: false, error: 'Commute time cannot be negative' };
      }
      break;
      
    case 'floor_plan':
      const floorPlanRegex = /^(\d+[DKLR]+|\d+部屋)$/i;
      if (typeof value !== 'string' || !floorPlanRegex.test(value)) {
        return { isValid: false, error: 'Invalid floor plan format (e.g., 1LDK, 2DK)' };
      }
      break;
      
    case 'property_name':
    case 'address':
    case 'property_type':
    case 'notes':
      // String fields - no specific validation needed
      break;
      
    default:
      return { isValid: false, error: 'Unknown field' };
  }
  
  return { isValid: true };
}