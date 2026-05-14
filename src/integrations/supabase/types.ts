export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      comparisons: {
        Row: {
          created_at: string | null
          date_bucket: string | null
          failure_reason: string | null
          id: string
          image_extraction_completed_at: string | null
          image_extraction_started_at: string | null
          image_extraction_status: string | null
          metadata_review_status: string | null
          metadata_reviewed_at: string | null
          pair_key: string | null
          property_a_id: string
          property_b_id: string
          property_url_a: string | null
          property_url_b: string | null
          save_count: number
          status: Database["public"]["Enums"]["comparison_status"]
          top_priority_1: string | null
          top_priority_2: string | null
          top_priority_3: string | null
          user_id: string | null
          view_count: number
          why_move: string | null
        }
        Insert: {
          created_at?: string | null
          date_bucket?: string | null
          failure_reason?: string | null
          id?: string
          image_extraction_completed_at?: string | null
          image_extraction_started_at?: string | null
          image_extraction_status?: string | null
          metadata_review_status?: string | null
          metadata_reviewed_at?: string | null
          pair_key?: string | null
          property_a_id: string
          property_b_id: string
          property_url_a?: string | null
          property_url_b?: string | null
          save_count?: number
          status?: Database["public"]["Enums"]["comparison_status"]
          top_priority_1?: string | null
          top_priority_2?: string | null
          top_priority_3?: string | null
          user_id?: string | null
          view_count?: number
          why_move?: string | null
        }
        Update: {
          created_at?: string | null
          date_bucket?: string | null
          failure_reason?: string | null
          id?: string
          image_extraction_completed_at?: string | null
          image_extraction_started_at?: string | null
          image_extraction_status?: string | null
          metadata_review_status?: string | null
          metadata_reviewed_at?: string | null
          pair_key?: string | null
          property_a_id?: string
          property_b_id?: string
          property_url_a?: string | null
          property_url_b?: string | null
          save_count?: number
          status?: Database["public"]["Enums"]["comparison_status"]
          top_priority_1?: string | null
          top_priority_2?: string | null
          top_priority_3?: string | null
          user_id?: string | null
          view_count?: number
          why_move?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_property_a_id_fkey"
            columns: ["property_a_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_property_b_id_fkey"
            columns: ["property_b_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comparisons_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons_archive_non_jp: {
        Row: {
          archived_at: string
          comparison_row: Json
          id: string
          property_a_row: Json | null
          property_b_row: Json | null
          reason: string
          recommendation_rows: Json | null
        }
        Insert: {
          archived_at?: string
          comparison_row: Json
          id: string
          property_a_row?: Json | null
          property_b_row?: Json | null
          reason?: string
          recommendation_rows?: Json | null
        }
        Update: {
          archived_at?: string
          comparison_row?: Json
          id?: string
          property_a_row?: Json | null
          property_b_row?: Json | null
          reason?: string
          recommendation_rows?: Json | null
        }
        Relationships: []
      }
      expert_profiles: {
        Row: {
          average_rating: number | null
          bio: string | null
          company_website: string | null
          created_at: string | null
          email: string
          id: string
          instagram_url: string | null
          line_url: string | null
          name: string
          phone: string | null
          profile_image_url: string | null
          rating_count: number | null
          region: string | null
          specialization_tags: string[] | null
          status: string | null
          user_id: string | null
          x_handle: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          company_website?: string | null
          created_at?: string | null
          email: string
          id?: string
          instagram_url?: string | null
          line_url?: string | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          rating_count?: number | null
          region?: string | null
          specialization_tags?: string[] | null
          status?: string | null
          user_id?: string | null
          x_handle?: string | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          company_website?: string | null
          created_at?: string | null
          email?: string
          id?: string
          instagram_url?: string | null
          line_url?: string | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          rating_count?: number | null
          region?: string | null
          specialization_tags?: string[] | null
          status?: string | null
          user_id?: string | null
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_ratings: {
        Row: {
          created_at: string | null
          expert_user_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expert_user_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          expert_user_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area_specialization: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          area_specialization?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          area_specialization?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json | null
          building_age_years: number | null
          building_structure: string | null
          commute_minutes: number | null
          construction_month: number | null
          construction_year: number | null
          created_at: string | null
          direction: string | null
          edited_at: string | null
          edited_by: string | null
          estimated_rent: number | null
          estimated_yield: number | null
          floor_number: number | null
          floor_plan: string | null
          id: string
          image_urls: string[] | null
          management_fee: number | null
          management_type: string | null
          manual_overrides: Json | null
          notes: string | null
          parking: string | null
          pet_allowed: boolean | null
          price_per_tsubo: number | null
          price_yen: number | null
          private_area_sqm: number | null
          property_name: string | null
          property_type: string | null
          repair_reserve: number | null
          school_district: string | null
          seismic_standard: string | null
          total_units: number | null
          train_line: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          building_age_years?: number | null
          building_structure?: string | null
          commute_minutes?: number | null
          construction_month?: number | null
          construction_year?: number | null
          created_at?: string | null
          direction?: string | null
          edited_at?: string | null
          edited_by?: string | null
          estimated_rent?: number | null
          estimated_yield?: number | null
          floor_number?: number | null
          floor_plan?: string | null
          id?: string
          image_urls?: string[] | null
          management_fee?: number | null
          management_type?: string | null
          manual_overrides?: Json | null
          notes?: string | null
          parking?: string | null
          pet_allowed?: boolean | null
          price_per_tsubo?: number | null
          price_yen?: number | null
          private_area_sqm?: number | null
          property_name?: string | null
          property_type?: string | null
          repair_reserve?: number | null
          school_district?: string | null
          seismic_standard?: string | null
          total_units?: number | null
          train_line?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          building_age_years?: number | null
          building_structure?: string | null
          commute_minutes?: number | null
          construction_month?: number | null
          construction_year?: number | null
          created_at?: string | null
          direction?: string | null
          edited_at?: string | null
          edited_by?: string | null
          estimated_rent?: number | null
          estimated_yield?: number | null
          floor_number?: number | null
          floor_plan?: string | null
          id?: string
          image_urls?: string[] | null
          management_fee?: number | null
          management_type?: string | null
          manual_overrides?: Json | null
          notes?: string | null
          parking?: string | null
          pet_allowed?: boolean | null
          price_per_tsubo?: number | null
          price_yen?: number | null
          private_area_sqm?: number | null
          property_name?: string | null
          property_type?: string | null
          repair_reserve?: number | null
          school_district?: string | null
          seismic_standard?: string | null
          total_units?: number | null
          train_line?: string | null
        }
        Relationships: []
      }
      recommendation_feedback: {
        Row: {
          created_at: string
          feedback: string
          id: string
          recommendation_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: string
          recommendation_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          recommendation_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          ai_points: Json | null
          comparison_id: string
          created_at: string
          final_recommendation: string
          id: string
          property_a_cons: string[]
          property_a_pros: string[]
          property_a_score_total: number | null
          property_b_cons: string[]
          property_b_pros: string[]
          property_b_score_total: number | null
          score_breakdown: Json | null
          summary_table: Json
          updated_at: string
          user_id: string | null
          user_profile: Json | null
        }
        Insert: {
          ai_points?: Json | null
          comparison_id: string
          created_at?: string
          final_recommendation: string
          id?: string
          property_a_cons?: string[]
          property_a_pros?: string[]
          property_a_score_total?: number | null
          property_b_cons?: string[]
          property_b_pros?: string[]
          property_b_score_total?: number | null
          score_breakdown?: Json | null
          summary_table?: Json
          updated_at?: string
          user_id?: string | null
          user_profile?: Json | null
        }
        Update: {
          ai_points?: Json | null
          comparison_id?: string
          created_at?: string
          final_recommendation?: string
          id?: string
          property_a_cons?: string[]
          property_a_pros?: string[]
          property_a_score_total?: number | null
          property_b_cons?: string[]
          property_b_pros?: string[]
          property_b_score_total?: number | null
          score_breakdown?: Json | null
          summary_table?: Json
          updated_at?: string
          user_id?: string | null
          user_profile?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_comparisons: {
        Row: {
          comparison_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_comparisons_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_comparisons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          comment: string | null
          comparison_id: string
          created_at: string
          expert_user_id: string
          id: string
          voted_for: string
        }
        Insert: {
          comment?: string | null
          comparison_id: string
          created_at?: string
          expert_user_id: string
          id?: string
          voted_for: string
        }
        Update: {
          comment?: string | null
          comparison_id?: string
          created_at?: string
          expert_user_id?: string
          id?: string
          voted_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_expert_user_id_fkey"
            columns: ["expert_user_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_comparison_view: {
        Args: { p_comparison_id: string }
        Returns: undefined
      }
    }
    Enums: {
      comparison_status: "processing" | "failed" | "published" | "archived"
      social_media_platform: "twitter" | "instagram" | "line" | "website"
      user_role: "user" | "expert" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      comparison_status: ["processing", "failed", "published", "archived"],
      social_media_platform: ["twitter", "instagram", "line", "website"],
      user_role: ["user", "expert", "admin"],
    },
  },
} as const
