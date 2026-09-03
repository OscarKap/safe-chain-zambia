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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_reports: {
        Row: {
          case_number: string | null
          case_opened: boolean
          created_at: string
          follow_up_date: string | null
          follow_up_required: boolean
          help_provided: string[]
          id: string
          outcome: string
          planned_actions: string | null
          recommendations: string | null
          referral_agency: string | null
          report_id: string
          responder_id: string
          summary: string
          updated_at: string
          victim_condition: string | null
        }
        Insert: {
          case_number?: string | null
          case_opened?: boolean
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean
          help_provided?: string[]
          id?: string
          outcome: string
          planned_actions?: string | null
          recommendations?: string | null
          referral_agency?: string | null
          report_id: string
          responder_id: string
          summary: string
          updated_at?: string
          victim_condition?: string | null
        }
        Update: {
          case_number?: string | null
          case_opened?: boolean
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean
          help_provided?: string[]
          id?: string
          outcome?: string
          planned_actions?: string | null
          recommendations?: string | null
          referral_agency?: string | null
          report_id?: string
          responder_id?: string
          summary?: string
          updated_at?: string
          victim_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_access_requests: {
        Row: {
          created_at: string
          district: string
          email: string
          full_name: string
          id: string
          ip_address: string | null
          job_title: string
          organisation: string
          phone: string
          province: string
          reason: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          district: string
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          job_title: string
          organisation: string
          phone: string
          province: string
          reason: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          district?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          job_title?: string
          organisation?: string
          phone?: string
          province?: string
          reason?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          accepted_privacy_at: string | null
          created_at: string
          district: string | null
          full_name: string
          last_login_at: string | null
          must_change_password: boolean
          organisation: string | null
          phone: string | null
          province: string | null
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_privacy_at?: string | null
          created_at?: string
          district?: string | null
          full_name: string
          last_login_at?: string | null
          must_change_password?: boolean
          organisation?: string | null
          phone?: string | null
          province?: string | null
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_privacy_at?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          last_login_at?: string | null
          must_change_password?: boolean
          organisation?: string | null
          phone?: string | null
          province?: string | null
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_reauth_grants: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          scope: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          scope?: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      case_attachments: {
        Row: {
          action_report_id: string | null
          content_type: string | null
          created_at: string
          filename: string
          id: string
          report_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          action_report_id?: string | null
          content_type?: string | null
          created_at?: string
          filename: string
          id?: string
          report_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          action_report_id?: string | null
          content_type?: string | null
          created_at?: string
          filename?: string
          id?: string
          report_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_attachments_action_report_id_fkey"
            columns: ["action_report_id"]
            isOneToOne: false
            referencedRelation: "action_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          case_types: string[]
          created_at: string
          department: string | null
          district: string | null
          email: string
          first_name: string | null
          is_available: boolean
          last_name: string | null
          max_active_cases: number
          mfa_enrolled_at: string | null
          mfa_required: boolean
          pending_role: Database["public"]["Enums"]["app_role"] | null
          phone: string | null
          province: string | null
          specialization: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_types?: string[]
          created_at?: string
          department?: string | null
          district?: string | null
          email: string
          first_name?: string | null
          is_available?: boolean
          last_name?: string | null
          max_active_cases?: number
          mfa_enrolled_at?: string | null
          mfa_required?: boolean
          pending_role?: Database["public"]["Enums"]["app_role"] | null
          phone?: string | null
          province?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_types?: string[]
          created_at?: string
          department?: string | null
          district?: string | null
          email?: string
          first_name?: string | null
          is_available?: boolean
          last_name?: string | null
          max_active_cases?: number
          mfa_enrolled_at?: string | null
          mfa_required?: boolean
          pending_role?: Database["public"]["Enums"]["app_role"] | null
          phone?: string | null
          province?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          bucket: string
          created_at: string
          id: string
          key_hash: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          key_hash: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          key_hash?: string
        }
        Relationships: []
      }
      report_history: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: string | null
          id: string
          report_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          report_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          report_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          report_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          district: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          priority: string
          province: string | null
          reporter_name: string | null
          reporter_phone: string | null
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          district?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          priority?: string
          province?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          district?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          priority?: string
          province?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      retention_purge_runs: {
        Row: {
          actor_user_id: string | null
          deleted_attachments: number
          deleted_audit_logs: number
          deleted_notifications: number
          deleted_rate_limits: number
          details: Json
          dry_run: boolean
          id: string
          ran_at: string
          trigger_source: string
        }
        Insert: {
          actor_user_id?: string | null
          deleted_attachments?: number
          deleted_audit_logs?: number
          deleted_notifications?: number
          deleted_rate_limits?: number
          details?: Json
          dry_run?: boolean
          id?: string
          ran_at?: string
          trigger_source?: string
        }
        Update: {
          actor_user_id?: string | null
          deleted_attachments?: number
          deleted_audit_logs?: number
          deleted_notifications?: number
          deleted_rate_limits?: number
          details?: Json
          dry_run?: boolean
          id?: string
          ran_at?: string
          trigger_source?: string
        }
        Relationships: []
      }
      retention_settings: {
        Row: {
          attachment_days: number
          audit_log_days: number
          auto_purge_enabled: boolean
          id: boolean
          notification_days: number
          rate_limit_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attachment_days?: number
          audit_log_days?: number
          auto_purge_enabled?: boolean
          id?: boolean
          notification_days?: number
          rate_limit_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attachment_days?: number
          audit_log_days?: number
          auto_purge_enabled?: boolean
          id?: boolean
          notification_days?: number
          rate_limit_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      translation_failures: {
        Row: {
          created_at: string
          error: string
          id: string
          provider: string | null
          source_text: string | null
          target_language: string
          translation_key: string | null
        }
        Insert: {
          created_at?: string
          error: string
          id?: string
          provider?: string | null
          source_text?: string | null
          target_language: string
          translation_key?: string | null
        }
        Update: {
          created_at?: string
          error?: string
          id?: string
          provider?: string | null
          source_text?: string | null
          target_language?: string
          translation_key?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          context: string | null
          created_at: string
          human_reviewed: boolean
          id: string
          machine_text: string | null
          model: string | null
          provider: string | null
          reviewed_at: string | null
          reviewer: string | null
          source_language: string
          source_text: string
          status: string
          target_language: string
          translated_text: string
          translation_key: string
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          human_reviewed?: boolean
          id?: string
          machine_text?: string | null
          model?: string | null
          provider?: string | null
          reviewed_at?: string | null
          reviewer?: string | null
          source_language?: string
          source_text: string
          status?: string
          target_language: string
          translated_text: string
          translation_key: string
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          human_reviewed?: boolean
          id?: string
          machine_text?: string | null
          model?: string | null
          provider?: string | null
          reviewed_at?: string | null
          reviewer?: string | null
          source_language?: string
          source_text?: string
          status?: string
          target_language?: string
          translated_text?: string
          translation_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approve_user: {
        Args: { _caller: string; _target: string }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { _caller: string; _target: string }
        Returns: undefined
      }
      admin_reactivate_user: {
        Args: { _caller: string; _target: string }
        Returns: undefined
      }
      admin_reject_user: {
        Args: { _caller: string; _target: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          _caller: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      admin_suspend_user: {
        Args: { _caller: string; _target: string }
        Returns: undefined
      }
      assign_report_to: {
        Args: { _caller: string; _report_id: string; _responder_id: string }
        Returns: undefined
      }
      auto_assign_report: {
        Args: { _caller: string; _report_id: string }
        Returns: string
      }
      log_case_view: { Args: { _report_id: string }; Returns: undefined }
      responder_workload: {
        Args: never
        Returns: {
          case_types: string[]
          department: string
          district: string
          email: string
          first_name: string
          is_available: boolean
          last_name: string
          max_active_cases: number
          open_cases: number
          province: string
          specialization: string
          user_id: string
        }[]
      }
      run_retention_purge: {
        Args: { _actor?: string; _dry_run?: boolean; _source?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "gbv_responder"
        | "clinic_admin"
        | "community_volunteer"
        | "counsellor"
        | "data_reviewer"
        | "admin"
        | "responder"
        | "gbv_officer"
        | "developer"
      request_status: "pending" | "approved" | "rejected" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
        "super_admin",
        "gbv_responder",
        "clinic_admin",
        "community_volunteer",
        "counsellor",
        "data_reviewer",
        "admin",
        "responder",
        "gbv_officer",
        "developer",
      ],
      request_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
