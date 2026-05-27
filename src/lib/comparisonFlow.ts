import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

export interface PropertyData {
  id: string;
  property_name?: string;
  address?: string;
  price_yen?: number;
  floor_plan?: string;
  commute_minutes?: number;
  property_type?: string;
  image_urls: string[];
  notes?: string;
  private_area_sqm?: number;
  construction_year?: number;
  construction_month?: number;
  building_age_years?: number;
}

export interface ComparisonResult {
  comparison_id: string;
  property_a: PropertyData;
  property_b: PropertyData;
  image_extraction_status?: "pending" | "in_progress" | "completed" | "failed";
  /**
   * True when the edge function returned an existing comparison for the same
   * (normalized URL pair, UTC date) bucket instead of running a fresh
   * parse+analyze. Used by the UI to surface a toast informing the user that
   * the report was reused. See bead home-duo-insight-mc4.
   */
  cached?: boolean;
}

export interface PersonalizationValues {
  proximity_to_cafes: number;
  access_to_gym: number;
  dog_walking_friendly: number;
  quiet_at_night: number;
  morning_vs_afternoon_sunlight: "morning" | "afternoon" | "no_preference";
  laundromat_access: number;
  open_view: number;
  feels_like_home: number;
  creative_friendly: number;
  reading_corner_space: number;
  natural_surroundings: number;
  future_family_growth: number;
  work_from_home_support: number;
  resale_potential: number;
  renovation_willingness: number;
  storage_capacity: number;
  natural_ventilation: number;
  light_sensitivity: number;
  minimalist_vs_maximalist: "minimalist" | "maximalist" | "no_preference";
  privacy_from_neighbors: number;
  grocery_chain_access: number;
  international_schools: number;
  weekend_market_access: number;
  safe_for_biking: number;
  spiritual_space_access: number;
}

export interface AIRecommendation {
  recommendation_id?: string;
  property_a_pros: string[];
  property_a_cons: string[];
  property_b_pros: string[];
  property_b_cons: string[];
  summary_table: {
    field: string;
    property_a: string;
    property_b: string;
  }[];
  final_recommendation: string;
}

export const defaultLandingPreferences: PersonalizationValues = {
  proximity_to_cafes: 3,
  access_to_gym: 3,
  dog_walking_friendly: 3,
  quiet_at_night: 4,
  morning_vs_afternoon_sunlight: "no_preference",
  laundromat_access: 3,
  open_view: 3,
  feels_like_home: 4,
  creative_friendly: 3,
  reading_corner_space: 3,
  natural_surroundings: 3,
  future_family_growth: 3,
  work_from_home_support: 4,
  resale_potential: 4,
  renovation_willingness: 3,
  storage_capacity: 3,
  natural_ventilation: 4,
  light_sensitivity: 3,
  minimalist_vs_maximalist: "no_preference",
  privacy_from_neighbors: 4,
  grocery_chain_access: 3,
  international_schools: 3,
  weekend_market_access: 3,
  safe_for_biking: 3,
  spiritual_space_access: 3,
};

const getCategorizedPreferences = (values: PersonalizationValues) => ({
  lifestyle_fit: {
    proximity_to_cafes: values.proximity_to_cafes,
    access_to_gym: values.access_to_gym,
    dog_walking_friendly: values.dog_walking_friendly,
    quiet_at_night: values.quiet_at_night,
    morning_vs_afternoon_sunlight: values.morning_vs_afternoon_sunlight,
    laundromat_access: values.laundromat_access,
  },
  emotional_desires: {
    open_view: values.open_view,
    feels_like_home: values.feels_like_home,
    creative_friendly: values.creative_friendly,
    reading_corner_space: values.reading_corner_space,
    natural_surroundings: values.natural_surroundings,
  },
  life_planning: {
    future_family_growth: values.future_family_growth,
    work_from_home_support: values.work_from_home_support,
    resale_potential: values.resale_potential,
    renovation_willingness: values.renovation_willingness,
    storage_capacity: values.storage_capacity,
  },
  sensory_comfort: {
    natural_ventilation: values.natural_ventilation,
    light_sensitivity: values.light_sensitivity,
    minimalist_vs_maximalist: values.minimalist_vs_maximalist,
    privacy_from_neighbors: values.privacy_from_neighbors,
  },
  cultural_routine: {
    grocery_chain_access: values.grocery_chain_access,
    international_schools: values.international_schools,
    weekend_market_access: values.weekend_market_access,
    safe_for_biking: values.safe_for_biking,
    spiritual_space_access: values.spiritual_space_access,
  },
});

const getNormalizedLanguage = (): "en" | "ja" => {
  const detectedLanguage = i18n.language || "en";
  return detectedLanguage.startsWith("ja") ? "ja" : "en";
};

export const analyzeProperties = async (
  propertyUrlA: string,
  propertyUrlB: string,
  userId?: string | null,
): Promise<ComparisonResult> => {
  const { data, error } = await supabase.functions.invoke("analyze-properties", {
    body: {
      property_url_a: propertyUrlA,
      property_url_b: propertyUrlB,
      user_id: userId || null,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze properties");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ComparisonResult;
};

export const generateRecommendation = async (
  comparisonResult: ComparisonResult,
  preferences: PersonalizationValues,
  userId?: string | null,
  enabledAspects?: string[],
): Promise<AIRecommendation> => {
  const { data, error } = await supabase.functions.invoke("generate-recommendation", {
    body: {
      comparison_id: comparisonResult.comparison_id,
      property_a: comparisonResult.property_a,
      property_b: comparisonResult.property_b,
      user_profile: getCategorizedPreferences(preferences),
      user_id: userId || null,
      language: getNormalizedLanguage(),
      enabled_aspects: enabledAspects && enabledAspects.length > 0 ? enabledAspects : undefined,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate recommendation");
  }

  return data as AIRecommendation;
};
