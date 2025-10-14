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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          lead_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          lead_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          lead_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          roi: number | null
          status: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          roi?: number | null
          status?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          roi?: number | null
          status?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean
          is_read: boolean
          message: string
          recipient_id: string | null
          sender_id: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          is_read?: boolean
          message: string
          recipient_id?: string | null
          sender_id: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          is_read?: boolean
          message?: string
          recipient_id?: string | null
          sender_id?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          actor: string | null
          created_at: string | null
          data: Json | null
          id: string
          lead_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          actor?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          lead_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          actor?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          lead_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string | null
          external_id: string | null
          fields: Json | null
          id: string
          name: string
          origin: string | null
          owner_user_id: string | null
          phone: string | null
          pipeline_id: string | null
          source: string | null
          stage_id: string | null
          status: string
          tags: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          fields?: Json | null
          id?: string
          name: string
          origin?: string | null
          owner_user_id?: string | null
          phone?: string | null
          pipeline_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string
          tags?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          fields?: Json | null
          id?: string
          name?: string
          origin?: string | null
          owner_user_id?: string | null
          phone?: string | null
          pipeline_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string
          tags?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          direction: string
          id: string
          lead_id: string
          media_url: string | null
          metadata: Json | null
          source: string | null
          tenant_id: string
          text: string | null
          user_id: string | null
          wa_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          lead_id: string
          media_url?: string | null
          metadata?: Json | null
          source?: string | null
          tenant_id: string
          text?: string | null
          user_id?: string | null
          wa_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          lead_id?: string
          media_url?: string | null
          metadata?: Json | null
          source?: string | null
          tenant_id?: string
          text?: string | null
          user_id?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_daily: {
        Row: {
          average_ticket: number | null
          booked: number | null
          closed: number | null
          created_at: string | null
          date: string
          leads_attended: number | null
          leads_in: number | null
          lost: number | null
          qualified: number | null
          refused: number | null
          tenant_id: string
          total_budget_value: number | null
          total_revenue: number | null
        }
        Insert: {
          average_ticket?: number | null
          booked?: number | null
          closed?: number | null
          created_at?: string | null
          date: string
          leads_attended?: number | null
          leads_in?: number | null
          lost?: number | null
          qualified?: number | null
          refused?: number | null
          tenant_id: string
          total_budget_value?: number | null
          total_revenue?: number | null
        }
        Update: {
          average_ticket?: number | null
          booked?: number | null
          closed?: number | null
          created_at?: string | null
          date?: string
          leads_attended?: number | null
          leads_in?: number | null
          lost?: number | null
          qualified?: number | null
          refused?: number | null
          tenant_id?: string
          total_budget_value?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          order: number
          pipeline_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          order: number
          pipeline_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          order?: number
          pipeline_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          plan: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          plan?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          plan?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          id: string
          name: string | null
          password_hash: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: string[] | null
          id: string
          is_active: boolean | null
          name: string
          secret: string
          tenant_id: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          secret: string
          tenant_id?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          secret?: string
          tenant_id?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          api_token_encrypted: string
          api_url: string
          created_at: string | null
          id: string
          instance_name: string
          is_active: boolean | null
          last_sync_at: string | null
          phone: string | null
          provider: string | null
          qr_code_url: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
          webhook_url: string | null
        }
        Insert: {
          api_token_encrypted: string
          api_url: string
          created_at?: string | null
          id?: string
          instance_name: string
          is_active?: boolean | null
          last_sync_at?: string | null
          phone?: string | null
          provider?: string | null
          qr_code_url?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_token_encrypted?: string
          api_url?: string
          created_at?: string | null
          id?: string
          instance_name?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          phone?: string | null
          provider?: string | null
          qr_code_url?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users_safe_view: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string | null
          name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections_with_users: {
        Row: {
          api_url: string | null
          created_at: string | null
          id: string | null
          instance_name: string | null
          is_active: boolean | null
          last_sync_at: string | null
          phone: string | null
          qr_code_url: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_internal_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_display_info: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          name: string
          tenant_id: string
        }[]
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin_or_supervisor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      recalculate_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "client_owner"
        | "manager"
        | "agent"
        | "viewer"
        | "supervisor"
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
      app_role: [
        "admin",
        "client_owner",
        "manager",
        "agent",
        "viewer",
        "supervisor",
      ],
    },
  },
} as const
