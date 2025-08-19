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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      fan_club_memberships: {
        Row: {
          artist_id: string
          created_at: string
          expires_at: string | null
          id: string
          membership_tier: string
          nft_token_id: string | null
          profile_id: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          membership_tier: string
          nft_token_id?: string | null
          profile_id?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          membership_tier?: string
          nft_token_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_club_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listening_history: {
        Row: {
          artist_id: string
          duration_played: number | null
          id: string
          played_at: string
          profile_id: string | null
          tip_amount: number | null
          track_id: string
        }
        Insert: {
          artist_id: string
          duration_played?: number | null
          id?: string
          played_at?: string
          profile_id?: string | null
          tip_amount?: number | null
          track_id: string
        }
        Update: {
          artist_id?: string
          duration_played?: number | null
          id?: string
          played_at?: string
          profile_id?: string | null
          tip_amount?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          track_data: Json | null
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position: number
          track_data?: Json | null
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          track_data?: Json | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          reputation_score: number | null
          ton_dns_name: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          reputation_score?: number | null
          ton_dns_name?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          reputation_score?: number | null
          ton_dns_name?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      track_collections: {
        Row: {
          collected_at: string
          id: string
          nft_contract_address: string | null
          nft_token_id: string | null
          profile_id: string | null
          purchase_price: number | null
          track_id: string
        }
        Insert: {
          collected_at?: string
          id?: string
          nft_contract_address?: string | null
          nft_token_id?: string | null
          profile_id?: string | null
          purchase_price?: number | null
          track_id: string
        }
        Update: {
          collected_at?: string
          id?: string
          nft_contract_address?: string | null
          nft_token_id?: string | null
          profile_id?: string | null
          purchase_price?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_collections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_ton: number
          created_at: string
          fee_ton: number | null
          from_profile_id: string | null
          id: string
          metadata: Json | null
          status: string
          to_profile_id: string | null
          transaction_hash: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount_ton: number
          created_at?: string
          fee_ton?: number | null
          from_profile_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          to_profile_id?: string | null
          transaction_hash: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount_ton?: number
          created_at?: string
          fee_ton?: number | null
          from_profile_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          to_profile_id?: string | null
          transaction_hash?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assets: {
        Row: {
          asset_type: string
          contract_address: string | null
          created_at: string
          id: string
          metadata: Json | null
          profile_id: string | null
          token_id: string | null
        }
        Insert: {
          asset_type: string
          contract_address?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          token_id?: string | null
        }
        Update: {
          asset_type?: string
          contract_address?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_assets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
