export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      comparisons: {
        Row: {
          created_at: string | null
          id: string
          property_a_id: string
          property_b_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_a_id: string
          property_b_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_a_id?: string
          property_b_id?: string
          user_id?: string | null
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
        ]
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
          x_handle: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          company_website?: string | null
          created_at?: string | null
          email: string
          id: string
          instagram_url?: string | null
          line_url?: string | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          rating_count?: number | null
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
          x_handle?: string | null
        }
        Relationships: []
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
          commute_minutes: number | null
          created_at: string | null
          floor_plan: string | null
          id: string
          image_urls: string[] | null
          notes: string | null
          price_yen: number | null
          property_name: string | null
          property_type: string | null
        }
        Insert: {
          address?: string | null
          commute_minutes?: number | null
          created_at?: string | null
          floor_plan?: string | null
          id?: string
          image_urls?: string[] | null
          notes?: string | null
          price_yen?: number | null
          property_name?: string | null
          property_type?: string | null
        }
        Update: {
          address?: string | null
          commute_minutes?: number | null
          created_at?: string | null
          floor_plan?: string | null
          id?: string
          image_urls?: string[] | null
          notes?: string | null
          price_yen?: number | null
          property_name?: string | null
          property_type?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          comparison_id: string
          created_at: string
          final_recommendation: string
          id: string
          property_a_cons: string[]
          property_a_pros: string[]
          property_b_cons: string[]
          property_b_pros: string[]
          summary_table: Json
          updated_at: string
          user_id: string | null
          user_profile: Json | null
        }
        Insert: {
          comparison_id: string
          created_at?: string
          final_recommendation: string
          id?: string
          property_a_cons?: string[]
          property_a_pros?: string[]
          property_b_cons?: string[]
          property_b_pros?: string[]
          summary_table?: Json
          updated_at?: string
          user_id?: string | null
          user_profile?: Json | null
        }
        Update: {
          comparison_id?: string
          created_at?: string
          final_recommendation?: string
          id?: string
          property_a_cons?: string[]
          property_a_pros?: string[]
          property_b_cons?: string[]
          property_b_pros?: string[]
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
      [_ in never]: never
    }
    Enums: {
      social_media_platform: "twitter" | "instagram" | "line" | "website"
      user_role: "user" | "expert" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      social_media_platform: ["twitter", "instagram", "line", "website"],
      user_role: ["user", "expert", "admin"],
    },
  },
} as const
