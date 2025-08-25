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
      chat_messages: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          message: string
          profile_id: string | null
          reply_to_id: string | null
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          message: string
          profile_id?: string | null
          reply_to_id?: string | null
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          message?: string
          profile_id?: string | null
          reply_to_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          artist_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean | null
          options: Json
          profile_id: string | null
          question: string
          total_votes: number | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          options: Json
          profile_id?: string | null
          question: string
          total_votes?: number | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          options?: Json
          profile_id?: string | null
          question?: string
          total_votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_polls_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_token_transactions: {
        Row: {
          completed_at: string | null
          conversion_rate: number
          created_at: string | null
          fees: number | null
          from_amount: number
          from_token: string
          id: string
          profile_id: string | null
          status: string | null
          to_amount: number
          to_token: string
        }
        Insert: {
          completed_at?: string | null
          conversion_rate: number
          created_at?: string | null
          fees?: number | null
          from_amount: number
          from_token: string
          id?: string
          profile_id?: string | null
          status?: string | null
          to_amount: number
          to_token: string
        }
        Update: {
          completed_at?: string | null
          conversion_rate?: number
          created_at?: string | null
          fees?: number | null
          from_amount?: number
          from_token?: string
          id?: string
          profile_id?: string | null
          status?: string | null
          to_amount?: number
          to_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_token_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      live_events: {
        Row: {
          artist_id: string
          created_at: string
          current_attendees: number | null
          description: string | null
          id: string
          is_live: boolean | null
          max_attendees: number | null
          scheduled_end: string | null
          scheduled_start: string
          stream_url: string | null
          thumbnail_url: string | null
          ticket_price: number | null
          title: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          id?: string
          is_live?: boolean | null
          max_attendees?: number | null
          scheduled_end?: string | null
          scheduled_start: string
          stream_url?: string | null
          thumbnail_url?: string | null
          ticket_price?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          id?: string
          is_live?: boolean | null
          max_attendees?: number | null
          scheduled_end?: string | null
          scheduled_start?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          ticket_price?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_preferences: {
        Row: {
          action_type: string
          auto_select: boolean | null
          created_at: string | null
          id: string
          preferred_token: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          auto_select?: boolean | null
          created_at?: string | null
          id?: string
          preferred_token: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          auto_select?: boolean | null
          created_at?: string | null
          id?: string
          preferred_token?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_preferences_profile_id_fkey"
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
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id?: string | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          audio_token_balance: number | null
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_payment_token: string | null
          reputation_score: number | null
          ton_dns_name: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          audio_token_balance?: number | null
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_payment_token?: string | null
          reputation_score?: number | null
          ton_dns_name?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          audio_token_balance?: number | null
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_payment_token?: string | null
          reputation_score?: number | null
          ton_dns_name?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      token_balances: {
        Row: {
          balance: number
          id: string
          last_updated: string | null
          profile_id: string | null
          token_type: string
        }
        Insert: {
          balance?: number
          id?: string
          last_updated?: string | null
          profile_id?: string | null
          token_type: string
        }
        Update: {
          balance?: number
          id?: string
          last_updated?: string | null
          profile_id?: string | null
          token_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_balances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_conversion_rates: {
        Row: {
          created_at: string | null
          from_token: string
          id: string
          rate: number
          source: string
          to_token: string
        }
        Insert: {
          created_at?: string | null
          from_token: string
          id?: string
          rate: number
          source: string
          to_token: string
        }
        Update: {
          created_at?: string | null
          from_token?: string
          id?: string
          rate?: number
          source?: string
          to_token?: string
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
          audio_amount: number | null
          conversion_rate: number | null
          created_at: string
          fee_ton: number | null
          from_profile_id: string | null
          id: string
          metadata: Json | null
          status: string
          to_profile_id: string | null
          token_type: string | null
          transaction_hash: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount_ton: number
          audio_amount?: number | null
          conversion_rate?: number | null
          created_at?: string
          fee_ton?: number | null
          from_profile_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          to_profile_id?: string | null
          token_type?: string | null
          transaction_hash: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount_ton?: number
          audio_amount?: number | null
          conversion_rate?: number | null
          created_at?: string
          fee_ton?: number | null
          from_profile_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          to_profile_id?: string | null
          token_type?: string | null
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
