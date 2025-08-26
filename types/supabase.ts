export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean | null
          timestamp: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      assessment_media: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assessment_id: string
          caption: string | null
          category: string | null
          compressed_generated: boolean | null
          created_at: string | null
          description: string | null
          file_size_bytes: number | null
          filename: string
          id: string
          is_featured: boolean | null
          location_description: string | null
          media_type: Database["public"]["Enums"]["assessment_media_type"]
          metadata: Json | null
          mime_type: string | null
          original_filename: string | null
          processing_status: string | null
          public_url: string | null
          requires_approval: boolean | null
          sort_order: number | null
          storage_bucket: string | null
          storage_path: string
          tags: string[] | null
          taken_at: string | null
          thumbnail_generated: boolean | null
          updated_at: string | null
          user_id: string
          visible_to_client: boolean | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_id: string
          caption?: string | null
          category?: string | null
          compressed_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          filename: string
          id?: string
          is_featured?: boolean | null
          location_description?: string | null
          media_type: Database["public"]["Enums"]["assessment_media_type"]
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          processing_status?: string | null
          public_url?: string | null
          requires_approval?: boolean | null
          sort_order?: number | null
          storage_bucket?: string | null
          storage_path: string
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_generated?: boolean | null
          updated_at?: string | null
          user_id: string
          visible_to_client?: boolean | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_id?: string
          caption?: string | null
          category?: string | null
          compressed_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          filename?: string
          id?: string
          is_featured?: boolean | null
          location_description?: string | null
          media_type?: Database["public"]["Enums"]["assessment_media_type"]
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          processing_status?: string | null
          public_url?: string | null
          requires_approval?: boolean | null
          sort_order?: number | null
          storage_bucket?: string | null
          storage_path?: string
          tags?: string[] | null
          taken_at?: string | null
          thumbnail_generated?: boolean | null
          updated_at?: string | null
          user_id?: string
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_media_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "assessment_media_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "property_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_reports: {
        Row: {
          assessment_id: string
          created_at: string | null
          html_content: string | null
          id: string
          pdf_url: string | null
          report_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          html_content?: string | null
          id: string
          pdf_url?: string | null
          report_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          html_content?: string | null
          id?: string
          pdf_url?: string | null
          report_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "assessment_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "property_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          execution_time_ms: number | null
          failed_items: number
          id: string
          memory_usage_mb: number | null
          operation_type: string
          options: Json | null
          processed_items: number
          progress_percent: number
          request_id: string
          status: string
          total_items: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          failed_items?: number
          id?: string
          memory_usage_mb?: number | null
          operation_type: string
          options?: Json | null
          processed_items?: number
          progress_percent?: number
          request_id: string
          status?: string
          total_items?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          failed_items?: number
          id?: string
          memory_usage_mb?: number | null
          operation_type?: string
          options?: Json | null
          processed_items?: number
          progress_percent?: number
          request_id?: string
          status?: string
          total_items?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_url: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id: string
          invoice_url?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_metrics_validation: {
        Row: {
          baseline_value: number
          created_at: string | null
          current_value: number | null
          data_source: string | null
          id: string
          improvement_percent: number | null
          measurement_unit: string
          metric_category: string
          metric_name: string
          target_achieved: boolean | null
          target_value: number
          validation_id: string
          validation_method: string | null
        }
        Insert: {
          baseline_value: number
          created_at?: string | null
          current_value?: number | null
          data_source?: string | null
          id?: string
          improvement_percent?: number | null
          measurement_unit?: string
          metric_category: string
          metric_name: string
          target_achieved?: boolean | null
          target_value: number
          validation_id: string
          validation_method?: string | null
        }
        Update: {
          baseline_value?: number
          created_at?: string | null
          current_value?: number | null
          data_source?: string | null
          id?: string
          improvement_percent?: number | null
          measurement_unit?: string
          metric_category?: string
          metric_name?: string
          target_achieved?: boolean | null
          target_value?: number
          validation_id?: string
          validation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_metrics_validation_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "production_validation_reports"
            referencedColumns: ["validation_id"]
          },
        ]
      }
      cache_optimization_tracking: {
        Row: {
          cache_key_pattern: string
          cache_type: string
          compression_enabled: boolean
          created_at: string | null
          enabled: boolean
          hit_rate_after: number | null
          hit_rate_before: number | null
          id: string
          memory_usage_mb: number | null
          optimization_id: string
          performance_impact_ms: number | null
          ttl_seconds: number
          updated_at: string | null
        }
        Insert: {
          cache_key_pattern: string
          cache_type: string
          compression_enabled?: boolean
          created_at?: string | null
          enabled?: boolean
          hit_rate_after?: number | null
          hit_rate_before?: number | null
          id?: string
          memory_usage_mb?: number | null
          optimization_id: string
          performance_impact_ms?: number | null
          ttl_seconds?: number
          updated_at?: string | null
        }
        Update: {
          cache_key_pattern?: string
          cache_type?: string
          compression_enabled?: boolean
          created_at?: string | null
          enabled?: boolean
          hit_rate_after?: number | null
          hit_rate_before?: number | null
          id?: string
          memory_usage_mb?: number | null
          optimization_id?: string
          performance_impact_ms?: number | null
          ttl_seconds?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cache_optimization_tracking_optimization_id_fkey"
            columns: ["optimization_id"]
            isOneToOne: false
            referencedRelation: "global_optimization_reports"
            referencedColumns: ["optimization_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          billing_address: string | null
          business_license: string | null
          client_status: Database["public"]["Enums"]["client_status"] | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          company_name: string | null
          created_at: string | null
          credit_limit: number | null
          credit_terms: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_communication: string | null
          primary_contact_person: string | null
          service_area: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          business_license?: string | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          client_type?: Database["public"]["Enums"]["client_type"] | null
          company_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_terms?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_communication?: string | null
          primary_contact_person?: string | null
          service_area?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          business_license?: string | null
          client_status?: Database["public"]["Enums"]["client_status"] | null
          client_type?: Database["public"]["Enums"]["client_type"] | null
          company_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_terms?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_communication?: string | null
          primary_contact_person?: string | null
          service_area?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cold_start_optimization_tracking: {
        Row: {
          cold_start_time_after_ms: number | null
          cold_start_time_before_ms: number | null
          created_at: string | null
          enabled: boolean
          function_name: string
          id: string
          improvement_percent: number | null
          optimization_id: string
          optimization_type: string
          preload_data_items: Json | null
          updated_at: string | null
          warmup_interval_minutes: number | null
        }
        Insert: {
          cold_start_time_after_ms?: number | null
          cold_start_time_before_ms?: number | null
          created_at?: string | null
          enabled?: boolean
          function_name: string
          id?: string
          improvement_percent?: number | null
          optimization_id: string
          optimization_type: string
          preload_data_items?: Json | null
          updated_at?: string | null
          warmup_interval_minutes?: number | null
        }
        Update: {
          cold_start_time_after_ms?: number | null
          cold_start_time_before_ms?: number | null
          created_at?: string | null
          enabled?: boolean
          function_name?: string
          id?: string
          improvement_percent?: number | null
          optimization_id?: string
          optimization_type?: string
          preload_data_items?: Json | null
          updated_at?: string | null
          warmup_interval_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cold_start_optimization_tracking_optimization_id_fkey"
            columns: ["optimization_id"]
            isOneToOne: false
            referencedRelation: "global_optimization_reports"
            referencedColumns: ["optimization_id"]
          },
        ]
      }
      cold_start_optimizations: {
        Row: {
          cold_start_time_after_ms: number
          cold_start_time_before_ms: number
          connection_prewarming: boolean
          created_at: string | null
          execution_context_reuse: boolean
          function_name: string
          id: string
          improvement_ms: number | null
          improvement_percentage: number | null
          memory_optimization: boolean
          optimization_id: string
          optimization_techniques: Json
          preloaded_modules: Json | null
        }
        Insert: {
          cold_start_time_after_ms?: number
          cold_start_time_before_ms?: number
          connection_prewarming?: boolean
          created_at?: string | null
          execution_context_reuse?: boolean
          function_name: string
          id?: string
          improvement_ms?: number | null
          improvement_percentage?: number | null
          memory_optimization?: boolean
          optimization_id: string
          optimization_techniques?: Json
          preloaded_modules?: Json | null
        }
        Update: {
          cold_start_time_after_ms?: number
          cold_start_time_before_ms?: number
          connection_prewarming?: boolean
          created_at?: string | null
          execution_context_reuse?: boolean
          function_name?: string
          id?: string
          improvement_ms?: number | null
          improvement_percentage?: number | null
          memory_optimization?: boolean
          optimization_id?: string
          optimization_techniques?: Json
          preloaded_modules?: Json | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          default_markup_rate: number | null
          default_tax_rate: number | null
          id: string
          logo_file_name: string | null
          logo_url: string | null
          preferred_currency: string | null
          quote_terms: string | null
          updated_at: string | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          default_markup_rate?: number | null
          default_tax_rate?: number | null
          id: string
          logo_file_name?: string | null
          logo_url?: string | null
          preferred_currency?: string | null
          quote_terms?: string | null
          updated_at?: string | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          default_markup_rate?: number | null
          default_tax_rate?: number | null
          id?: string
          logo_file_name?: string | null
          logo_url?: string | null
          preferred_currency?: string | null
          quote_terms?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_tracking: {
        Row: {
          compliance_score: number | null
          control_description: string
          control_id: string
          created_at: string | null
          evidence_links: Json | null
          findings: Json | null
          framework: string
          id: string
          implementation_status: string
          last_audit_date: string | null
          metadata: Json | null
          next_audit_due: string | null
          remediation_plan: Json | null
          responsible_team: string | null
          updated_at: string | null
        }
        Insert: {
          compliance_score?: number | null
          control_description: string
          control_id: string
          created_at?: string | null
          evidence_links?: Json | null
          findings?: Json | null
          framework: string
          id?: string
          implementation_status: string
          last_audit_date?: string | null
          metadata?: Json | null
          next_audit_due?: string | null
          remediation_plan?: Json | null
          responsible_team?: string | null
          updated_at?: string | null
        }
        Update: {
          compliance_score?: number | null
          control_description?: string
          control_id?: string
          created_at?: string | null
          evidence_links?: Json | null
          findings?: Json | null
          framework?: string
          id?: string
          implementation_status?: string
          last_audit_date?: string | null
          metadata?: Json | null
          next_audit_due?: string | null
          remediation_plan?: Json | null
          responsible_team?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_health_monitoring: {
        Row: {
          connection_age_ms: number | null
          connection_id: string
          created_at: string | null
          environment: string
          error_count: number
          health_details: Json | null
          health_score: number
          health_status: string
          id: string
          last_health_check: string
          last_used: string | null
          query_count: number
          response_time_ms: number | null
        }
        Insert: {
          connection_age_ms?: number | null
          connection_id: string
          created_at?: string | null
          environment: string
          error_count?: number
          health_details?: Json | null
          health_score?: number
          health_status?: string
          id?: string
          last_health_check?: string
          last_used?: string | null
          query_count?: number
          response_time_ms?: number | null
        }
        Update: {
          connection_age_ms?: number | null
          connection_id?: string
          created_at?: string | null
          environment?: string
          error_count?: number
          health_details?: Json | null
          health_score?: number
          health_status?: string
          id?: string
          last_health_check?: string
          last_used?: string | null
          query_count?: number
          response_time_ms?: number | null
        }
        Relationships: []
      }
      connection_pool_alerts: {
        Row: {
          alert_details: Json | null
          alert_id: string
          alert_status: string
          alert_type: string
          created_at: string | null
          environment: string
          id: string
          message: string
          metric_value: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          threshold_value: number | null
          triggered_at: string
        }
        Insert: {
          alert_details?: Json | null
          alert_id: string
          alert_status?: string
          alert_type: string
          created_at?: string | null
          environment: string
          id?: string
          message: string
          metric_value?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          threshold_value?: number | null
          triggered_at?: string
        }
        Update: {
          alert_details?: Json | null
          alert_id?: string
          alert_status?: string
          alert_type?: string
          created_at?: string | null
          environment?: string
          id?: string
          message?: string
          metric_value?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threshold_value?: number | null
          triggered_at?: string
        }
        Relationships: []
      }
      connection_pool_benchmarks: {
        Row: {
          baseline_metrics: Json | null
          benchmark_id: string
          created_at: string | null
          environment: string
          execution_time_ms: number
          id: string
          performance_improvement: number | null
          results: Json
          test_config: Json
          test_status: string
          test_type: string
        }
        Insert: {
          baseline_metrics?: Json | null
          benchmark_id: string
          created_at?: string | null
          environment: string
          execution_time_ms?: number
          id?: string
          performance_improvement?: number | null
          results?: Json
          test_config?: Json
          test_status?: string
          test_type?: string
        }
        Update: {
          baseline_metrics?: Json | null
          benchmark_id?: string
          created_at?: string | null
          environment?: string
          execution_time_ms?: number
          id?: string
          performance_improvement?: number | null
          results?: Json
          test_config?: Json
          test_status?: string
          test_type?: string
        }
        Relationships: []
      }
      connection_pool_config: {
        Row: {
          acquire_timeout_ms: number
          config_metadata: Json | null
          connection_timeout_ms: number
          created_at: string | null
          enable_health_check: boolean
          enable_metrics: boolean
          environment: string
          health_check_interval_ms: number
          id: string
          idle_timeout_ms: number
          max_connections: number
          max_retries: number
          min_connections: number
          retry_delay_ms: number
          updated_at: string | null
        }
        Insert: {
          acquire_timeout_ms?: number
          config_metadata?: Json | null
          connection_timeout_ms?: number
          created_at?: string | null
          enable_health_check?: boolean
          enable_metrics?: boolean
          environment: string
          health_check_interval_ms?: number
          id?: string
          idle_timeout_ms?: number
          max_connections?: number
          max_retries?: number
          min_connections?: number
          retry_delay_ms?: number
          updated_at?: string | null
        }
        Update: {
          acquire_timeout_ms?: number
          config_metadata?: Json | null
          connection_timeout_ms?: number
          created_at?: string | null
          enable_health_check?: boolean
          enable_metrics?: boolean
          environment?: string
          health_check_interval_ms?: number
          id?: string
          idle_timeout_ms?: number
          max_connections?: number
          max_retries?: number
          min_connections?: number
          retry_delay_ms?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_pool_config_changes: {
        Row: {
          applied_at: string | null
          change_impact: string | null
          change_type: string
          changed_by: string | null
          created_at: string | null
          environment: string
          id: string
          new_value: string
          old_value: string | null
          parameter_name: string
          reason: string | null
          rollback_info: Json | null
        }
        Insert: {
          applied_at?: string | null
          change_impact?: string | null
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          environment: string
          id?: string
          new_value: string
          old_value?: string | null
          parameter_name: string
          reason?: string | null
          rollback_info?: Json | null
        }
        Update: {
          applied_at?: string | null
          change_impact?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          environment?: string
          id?: string
          new_value?: string
          old_value?: string | null
          parameter_name?: string
          reason?: string | null
          rollback_info?: Json | null
        }
        Relationships: []
      }
      connection_pool_metrics: {
        Row: {
          active_connections: number
          avg_response_time_ms: number
          connection_acquisition_time_ms: number
          connection_errors: number
          cpu_usage_percent: number | null
          created_at: string | null
          environment: string
          error_rate: number
          failed_queries: number
          health_check_score: number | null
          id: string
          idle_connections: number
          memory_usage_mb: number | null
          pending_acquisitions: number
          pool_utilization: number
          successful_queries: number
          timeout_errors: number
          total_connections: number
          total_queries: number
        }
        Insert: {
          active_connections?: number
          avg_response_time_ms?: number
          connection_acquisition_time_ms?: number
          connection_errors?: number
          cpu_usage_percent?: number | null
          created_at?: string | null
          environment: string
          error_rate?: number
          failed_queries?: number
          health_check_score?: number | null
          id?: string
          idle_connections?: number
          memory_usage_mb?: number | null
          pending_acquisitions?: number
          pool_utilization?: number
          successful_queries?: number
          timeout_errors?: number
          total_connections?: number
          total_queries?: number
        }
        Update: {
          active_connections?: number
          avg_response_time_ms?: number
          connection_acquisition_time_ms?: number
          connection_errors?: number
          cpu_usage_percent?: number | null
          created_at?: string | null
          environment?: string
          error_rate?: number
          failed_queries?: number
          health_check_score?: number | null
          id?: string
          idle_connections?: number
          memory_usage_mb?: number | null
          pending_acquisitions?: number
          pool_utilization?: number
          successful_queries?: number
          timeout_errors?: number
          total_connections?: number
          total_queries?: number
        }
        Relationships: []
      }
      connection_pool_optimization_tracking: {
        Row: {
          avg_wait_time_after_ms: number | null
          avg_wait_time_before_ms: number | null
          connection_timeout_seconds: number
          connections_after: number | null
          connections_before: number | null
          created_at: string | null
          enabled: boolean
          health_check_interval_seconds: number
          id: string
          idle_timeout_seconds: number
          max_connections: number
          optimization_id: string
          performance_improvement_ms: number | null
          pool_type: string
          region: string
          updated_at: string | null
        }
        Insert: {
          avg_wait_time_after_ms?: number | null
          avg_wait_time_before_ms?: number | null
          connection_timeout_seconds?: number
          connections_after?: number | null
          connections_before?: number | null
          created_at?: string | null
          enabled?: boolean
          health_check_interval_seconds?: number
          id?: string
          idle_timeout_seconds?: number
          max_connections?: number
          optimization_id: string
          performance_improvement_ms?: number | null
          pool_type: string
          region: string
          updated_at?: string | null
        }
        Update: {
          avg_wait_time_after_ms?: number | null
          avg_wait_time_before_ms?: number | null
          connection_timeout_seconds?: number
          connections_after?: number | null
          connections_before?: number | null
          created_at?: string | null
          enabled?: boolean
          health_check_interval_seconds?: number
          id?: string
          idle_timeout_seconds?: number
          max_connections?: number
          optimization_id?: string
          performance_improvement_ms?: number | null
          pool_type?: string
          region?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_pool_optimization_tracking_optimization_id_fkey"
            columns: ["optimization_id"]
            isOneToOne: false
            referencedRelation: "global_optimization_reports"
            referencedColumns: ["optimization_id"]
          },
        ]
      }
      connection_pool_optimizations: {
        Row: {
          auto_applied: boolean
          created_at: string | null
          current_stats: Json
          environment: string
          id: string
          implementation_status: string | null
          implemented_at: string | null
          optimization_id: string
          optimizations: Json
          performance_impact: Json | null
          recommendation_score: number | null
          usage_analysis: Json
        }
        Insert: {
          auto_applied?: boolean
          created_at?: string | null
          current_stats?: Json
          environment: string
          id?: string
          implementation_status?: string | null
          implemented_at?: string | null
          optimization_id: string
          optimizations?: Json
          performance_impact?: Json | null
          recommendation_score?: number | null
          usage_analysis?: Json
        }
        Update: {
          auto_applied?: boolean
          created_at?: string | null
          current_stats?: Json
          environment?: string
          id?: string
          implementation_status?: string | null
          implemented_at?: string | null
          optimization_id?: string
          optimizations?: Json
          performance_impact?: Json | null
          recommendation_score?: number | null
          usage_analysis?: Json
        }
        Relationships: []
      }
      connection_pool_recommendations: {
        Row: {
          category: string
          created_at: string | null
          description: string
          environment: string
          expected_impact: string | null
          id: string
          implementation_effort: string | null
          implementation_steps: Json | null
          implemented_at: string | null
          priority: string
          recommendation_id: string
          recommended_action: string
          reviewed_at: string | null
          status: string
          supporting_data: Json | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          environment: string
          expected_impact?: string | null
          id?: string
          implementation_effort?: string | null
          implementation_steps?: Json | null
          implemented_at?: string | null
          priority: string
          recommendation_id: string
          recommended_action: string
          reviewed_at?: string | null
          status?: string
          supporting_data?: Json | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          environment?: string
          expected_impact?: string | null
          id?: string
          implementation_effort?: string | null
          implementation_steps?: Json | null
          implemented_at?: string | null
          priority?: string
          recommendation_id?: string
          recommended_action?: string
          reviewed_at?: string | null
          status?: string
          supporting_data?: Json | null
          title?: string
        }
        Relationships: []
      }
      cost_metrics: {
        Row: {
          actual_monthly_cost: number | null
          bandwidth_usage_gb: number | null
          created_at: string | null
          database_usage_hours: number | null
          edge_function_invocations: number | null
          estimated_monthly_cost: number | null
          id: string
          metadata: Json | null
          metric_date: string
          storage_usage_gb: number | null
        }
        Insert: {
          actual_monthly_cost?: number | null
          bandwidth_usage_gb?: number | null
          created_at?: string | null
          database_usage_hours?: number | null
          edge_function_invocations?: number | null
          estimated_monthly_cost?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          storage_usage_gb?: number | null
        }
        Update: {
          actual_monthly_cost?: number | null
          bandwidth_usage_gb?: number | null
          created_at?: string | null
          database_usage_hours?: number | null
          edge_function_invocations?: number | null
          estimated_monthly_cost?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          storage_usage_gb?: number | null
        }
        Relationships: []
      }
      cost_validation_tracking: {
        Row: {
          actual_cost_monthly: number | null
          baseline_cost_monthly: number
          cost_breakdown: Json | null
          cost_category: string
          cost_reduction_percent: number | null
          cost_target_met: boolean | null
          created_at: string | null
          id: string
          projected_cost_monthly: number
          usage_metrics: Json | null
          validation_id: string
        }
        Insert: {
          actual_cost_monthly?: number | null
          baseline_cost_monthly?: number
          cost_breakdown?: Json | null
          cost_category: string
          cost_reduction_percent?: number | null
          cost_target_met?: boolean | null
          created_at?: string | null
          id?: string
          projected_cost_monthly?: number
          usage_metrics?: Json | null
          validation_id: string
        }
        Update: {
          actual_cost_monthly?: number | null
          baseline_cost_monthly?: number
          cost_breakdown?: Json | null
          cost_category?: string
          cost_reduction_percent?: number | null
          cost_target_met?: boolean | null
          created_at?: string | null
          id?: string
          projected_cost_monthly?: number
          usage_metrics?: Json | null
          validation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_validation_tracking_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "production_validation_reports"
            referencedColumns: ["validation_id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      deployment_readiness_checks: {
        Row: {
          automated: boolean
          check_category: string
          check_name: string
          check_result: Json | null
          created_at: string | null
          id: string
          last_checked: string | null
          next_check_due: string | null
          required_for_deployment: boolean
          status: string
          validation_id: string
        }
        Insert: {
          automated?: boolean
          check_category: string
          check_name: string
          check_result?: Json | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          next_check_due?: string | null
          required_for_deployment?: boolean
          status: string
          validation_id: string
        }
        Update: {
          automated?: boolean
          check_category?: string
          check_name?: string
          check_result?: Json | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          next_check_due?: string | null
          required_for_deployment?: boolean
          status?: string
          validation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployment_readiness_checks_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "production_validation_reports"
            referencedColumns: ["validation_id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string | null
          dispute_id: string
          evidence_data: Json
          id: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dispute_id: string
          evidence_data: Json
          id?: string
          submitted_at: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dispute_id?: string
          evidence_data?: Json
          id?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "payment_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_case_analytics: {
        Row: {
          generated_at: string | null
          handler_breakdown: Json | null
          id: string
          period_end: string
          period_start: string
          success_rate: number
          successful_events: number
          total_events: number
        }
        Insert: {
          generated_at?: string | null
          handler_breakdown?: Json | null
          id?: string
          period_end: string
          period_start: string
          success_rate?: number
          successful_events?: number
          total_events?: number
        }
        Update: {
          generated_at?: string | null
          handler_breakdown?: Json | null
          id?: string
          period_end?: string
          period_start?: string
          success_rate?: number
          successful_events?: number
          total_events?: number
        }
        Relationships: []
      }
      edge_case_events: {
        Row: {
          actions: string[] | null
          context_metadata: Json | null
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          event_id: string
          event_type: string
          handler_used: string
          id: string
          invoice_id: string | null
          next_steps: string[] | null
          payment_method_id: string | null
          result_metadata: Json | null
          subscription_id: string | null
          success: boolean
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actions?: string[] | null
          context_metadata?: Json | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          handler_used: string
          id?: string
          invoice_id?: string | null
          next_steps?: string[] | null
          payment_method_id?: string | null
          result_metadata?: Json | null
          subscription_id?: string | null
          success?: boolean
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actions?: string[] | null
          context_metadata?: Json | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          handler_used?: string
          id?: string
          invoice_id?: string | null
          next_steps?: string[] | null
          payment_method_id?: string | null
          result_metadata?: Json | null
          subscription_id?: string | null
          success?: boolean
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      edge_function_health: {
        Row: {
          created_at: string | null
          details: Json | null
          error_rate: number
          function_name: string
          id: string
          last_checked: string
          response_time_ms: number
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          error_rate?: number
          function_name: string
          id?: string
          last_checked: string
          response_time_ms: number
          status: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          error_rate?: number
          function_name?: string
          id?: string
          last_checked?: string
          response_time_ms?: number
          status?: string
        }
        Relationships: []
      }
      edge_function_metrics: {
        Row: {
          api_calls_made: number | null
          created_at: string | null
          database_queries: number | null
          error_count: number | null
          execution_time_ms: number
          function_name: string
          id: string
          memory_usage_mb: number | null
          metadata: Json | null
          operation_type: string
          user_id: string | null
        }
        Insert: {
          api_calls_made?: number | null
          created_at?: string | null
          database_queries?: number | null
          error_count?: number | null
          execution_time_ms: number
          function_name: string
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json | null
          operation_type: string
          user_id?: string | null
        }
        Update: {
          api_calls_made?: number | null
          created_at?: string | null
          database_queries?: number | null
          error_count?: number | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          memory_usage_mb?: number | null
          metadata?: Json | null
          operation_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean
          metadata: Json | null
          target_audience: Json | null
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          target_audience?: Json | null
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          target_audience?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      function_warmup_tracking: {
        Row: {
          created_at: string | null
          enabled: boolean
          function_name: string
          id: string
          last_warmup: string | null
          next_warmup: string | null
          updated_at: string | null
          warmup_details: Json | null
          warmup_duration_ms: number | null
          warmup_frequency: number
          warmup_strategy: string
          warmup_success: boolean | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          function_name: string
          id?: string
          last_warmup?: string | null
          next_warmup?: string | null
          updated_at?: string | null
          warmup_details?: Json | null
          warmup_duration_ms?: number | null
          warmup_frequency?: number
          warmup_strategy: string
          warmup_success?: boolean | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          function_name?: string
          id?: string
          last_warmup?: string | null
          next_warmup?: string | null
          updated_at?: string | null
          warmup_details?: Json | null
          warmup_duration_ms?: number | null
          warmup_frequency?: number
          warmup_strategy?: string
          warmup_success?: boolean | null
        }
        Relationships: []
      }
      global_categories: {
        Row: {
          access_tier: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          access_tier?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          access_tier?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_deployment_status: {
        Row: {
          created_at: string | null
          deployment_status: string
          deployment_time: string
          deployment_version: string
          error_message: string | null
          function_name: string
          health_check_passed: boolean | null
          id: string
          metadata: Json | null
          performance_validated: boolean | null
          region: string
          rollback_available: boolean
        }
        Insert: {
          created_at?: string | null
          deployment_status: string
          deployment_time?: string
          deployment_version: string
          error_message?: string | null
          function_name: string
          health_check_passed?: boolean | null
          id?: string
          metadata?: Json | null
          performance_validated?: boolean | null
          region: string
          rollback_available?: boolean
        }
        Update: {
          created_at?: string | null
          deployment_status?: string
          deployment_time?: string
          deployment_version?: string
          error_message?: string | null
          function_name?: string
          health_check_passed?: boolean | null
          id?: string
          metadata?: Json | null
          performance_validated?: boolean | null
          region?: string
          rollback_available?: boolean
        }
        Relationships: []
      }
      global_items: {
        Row: {
          access_tier: string
          category_id: string
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          sort_order: number | null
          subcategory: string | null
          tags: string[] | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          access_tier?: string
          category_id: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          access_tier?: string
          category_id?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "global_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      global_optimization_config: {
        Row: {
          applied_at: string | null
          config_key: string
          config_type: string
          config_value: Json
          enabled: boolean
          id: string
          last_modified_at: string | null
          metadata: Json | null
        }
        Insert: {
          applied_at?: string | null
          config_key: string
          config_type: string
          config_value?: Json
          enabled?: boolean
          id?: string
          last_modified_at?: string | null
          metadata?: Json | null
        }
        Update: {
          applied_at?: string | null
          config_key?: string
          config_type?: string
          config_value?: Json
          enabled?: boolean
          id?: string
          last_modified_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      global_optimization_reports: {
        Row: {
          auto_applied: boolean
          configuration_changes: Json
          created_at: string | null
          execution_time_ms: number
          id: string
          optimization_id: string
          optimizations: Json
          overall_performance: Json
          performance_improvement: number | null
          recommendations: Json
          regional_metrics: Json
        }
        Insert: {
          auto_applied?: boolean
          configuration_changes?: Json
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          optimization_id: string
          optimizations?: Json
          overall_performance?: Json
          performance_improvement?: number | null
          recommendations?: Json
          regional_metrics?: Json
        }
        Update: {
          auto_applied?: boolean
          configuration_changes?: Json
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          optimization_id?: string
          optimizations?: Json
          overall_performance?: Json
          performance_improvement?: number | null
          recommendations?: Json
          regional_metrics?: Json
        }
        Relationships: []
      }
      item_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      line_items: {
        Row: {
          category: string | null
          cost: number
          created_at: string | null
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          name: string
          tags: string[] | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          name: string
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          name?: string
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      load_balancing_optimization_tracking: {
        Row: {
          created_at: string | null
          efficiency_improvement: number | null
          enabled: boolean
          failover_enabled: boolean
          health_check_enabled: boolean
          id: string
          optimization_id: string
          performance_variance_after: number | null
          performance_variance_before: number | null
          regional_weights: Json
          strategy: string
          timeout_ms: number
          traffic_distribution_after: Json | null
          traffic_distribution_before: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          efficiency_improvement?: number | null
          enabled?: boolean
          failover_enabled?: boolean
          health_check_enabled?: boolean
          id?: string
          optimization_id: string
          performance_variance_after?: number | null
          performance_variance_before?: number | null
          regional_weights?: Json
          strategy: string
          timeout_ms?: number
          traffic_distribution_after?: Json | null
          traffic_distribution_before?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          efficiency_improvement?: number | null
          enabled?: boolean
          failover_enabled?: boolean
          health_check_enabled?: boolean
          id?: string
          optimization_id?: string
          performance_variance_after?: number | null
          performance_variance_before?: number | null
          regional_weights?: Json
          strategy?: string
          timeout_ms?: number
          traffic_distribution_after?: Json | null
          traffic_distribution_before?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "load_balancing_optimization_tracking_optimization_id_fkey"
            columns: ["optimization_id"]
            isOneToOne: false
            referencedRelation: "global_optimization_reports"
            referencedColumns: ["optimization_id"]
          },
        ]
      }
      load_testing_results: {
        Row: {
          avg_response_time_ms: number
          bottlenecks_identified: Json | null
          concurrent_users: number
          cpu_usage_percent: number | null
          created_at: string | null
          database_connections: number | null
          error_rate: number
          failed_requests: number
          function_name: string
          id: string
          max_response_time_ms: number
          memory_usage_mb: number | null
          min_response_time_ms: number
          p95_response_time_ms: number
          p99_response_time_ms: number
          performance_degradation: boolean | null
          requests_per_second: number
          successful_requests: number
          test_duration_seconds: number
          test_scenario: string
          test_status: string
          total_requests: number
          validation_id: string
        }
        Insert: {
          avg_response_time_ms?: number
          bottlenecks_identified?: Json | null
          concurrent_users?: number
          cpu_usage_percent?: number | null
          created_at?: string | null
          database_connections?: number | null
          error_rate?: number
          failed_requests?: number
          function_name: string
          id?: string
          max_response_time_ms?: number
          memory_usage_mb?: number | null
          min_response_time_ms?: number
          p95_response_time_ms?: number
          p99_response_time_ms?: number
          performance_degradation?: boolean | null
          requests_per_second?: number
          successful_requests?: number
          test_duration_seconds?: number
          test_scenario: string
          test_status: string
          total_requests?: number
          validation_id: string
        }
        Update: {
          avg_response_time_ms?: number
          bottlenecks_identified?: Json | null
          concurrent_users?: number
          cpu_usage_percent?: number | null
          created_at?: string | null
          database_connections?: number | null
          error_rate?: number
          failed_requests?: number
          function_name?: string
          id?: string
          max_response_time_ms?: number
          memory_usage_mb?: number | null
          min_response_time_ms?: number
          p95_response_time_ms?: number
          p99_response_time_ms?: number
          performance_degradation?: boolean | null
          requests_per_second?: number
          successful_requests?: number
          test_duration_seconds?: number
          test_scenario?: string
          test_status?: string
          total_requests?: number
          validation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_testing_results_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "production_validation_reports"
            referencedColumns: ["validation_id"]
          },
        ]
      }
      memory_optimizations: {
        Row: {
          average_memory_usage_mb: number | null
          cache_cleared: boolean
          created_at: string | null
          function_name: string
          garbage_collection_performed: boolean
          id: string
          memory_after_mb: number
          memory_before_mb: number
          memory_efficiency_score: number | null
          memory_saved_mb: number | null
          module_unloading: boolean
          optimization_id: string
          optimization_techniques: Json
          peak_memory_usage_mb: number | null
        }
        Insert: {
          average_memory_usage_mb?: number | null
          cache_cleared?: boolean
          created_at?: string | null
          function_name: string
          garbage_collection_performed?: boolean
          id?: string
          memory_after_mb?: number
          memory_before_mb?: number
          memory_efficiency_score?: number | null
          memory_saved_mb?: number | null
          module_unloading?: boolean
          optimization_id: string
          optimization_techniques?: Json
          peak_memory_usage_mb?: number | null
        }
        Update: {
          average_memory_usage_mb?: number | null
          cache_cleared?: boolean
          created_at?: string | null
          function_name?: string
          garbage_collection_performed?: boolean
          id?: string
          memory_after_mb?: number
          memory_before_mb?: number
          memory_efficiency_score?: number | null
          memory_saved_mb?: number | null
          module_unloading?: boolean
          optimization_id?: string
          optimization_techniques?: Json
          peak_memory_usage_mb?: number | null
        }
        Relationships: []
      }
      migration_config: {
        Row: {
          actual_traffic_percent: number
          created_at: string | null
          current_state: string
          enabled_functions: Json
          feature_flags: Json
          health_check_interval: number
          id: string
          rollback_thresholds: Json
          target_traffic_percent: number
          updated_at: string | null
        }
        Insert: {
          actual_traffic_percent?: number
          created_at?: string | null
          current_state: string
          enabled_functions?: Json
          feature_flags?: Json
          health_check_interval?: number
          id?: string
          rollback_thresholds?: Json
          target_traffic_percent?: number
          updated_at?: string | null
        }
        Update: {
          actual_traffic_percent?: number
          created_at?: string | null
          current_state?: string
          enabled_functions?: Json
          feature_flags?: Json
          health_check_interval?: number
          id?: string
          rollback_thresholds?: Json
          target_traffic_percent?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      migration_metrics: {
        Row: {
          active_alerts: Json
          created_at: string | null
          current_phase: string
          end_time: string | null
          error_rate: number
          health_score: number
          id: string
          migration_id: string
          performance_improvement: number
          progress_percent: number
          rollbacks_triggered: number
          start_time: string
          traffic_split_percent: number
          updated_at: string | null
        }
        Insert: {
          active_alerts?: Json
          created_at?: string | null
          current_phase: string
          end_time?: string | null
          error_rate?: number
          health_score?: number
          id?: string
          migration_id: string
          performance_improvement?: number
          progress_percent?: number
          rollbacks_triggered?: number
          start_time: string
          traffic_split_percent?: number
          updated_at?: string | null
        }
        Update: {
          active_alerts?: Json
          created_at?: string | null
          current_phase?: string
          end_time?: string | null
          error_rate?: number
          health_score?: number
          id?: string
          migration_id?: string
          performance_improvement?: number
          progress_percent?: number
          rollbacks_triggered?: number
          start_time?: string
          traffic_split_percent?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_metrics_migration_id_fkey"
            columns: ["migration_id"]
            isOneToOne: false
            referencedRelation: "migration_config"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_performance_benchmarks: {
        Row: {
          baseline_value: number
          created_at: string | null
          current_value: number | null
          function_name: string
          id: string
          improvement_percent: number | null
          last_measured_at: string | null
          measurement_unit: string
          metric_type: string
          migration_id: string
          sample_size: number | null
          target_value: number
        }
        Insert: {
          baseline_value: number
          created_at?: string | null
          current_value?: number | null
          function_name: string
          id?: string
          improvement_percent?: number | null
          last_measured_at?: string | null
          measurement_unit?: string
          metric_type: string
          migration_id: string
          sample_size?: number | null
          target_value: number
        }
        Update: {
          baseline_value?: number
          created_at?: string | null
          current_value?: number | null
          function_name?: string
          id?: string
          improvement_percent?: number | null
          last_measured_at?: string | null
          measurement_unit?: string
          metric_type?: string
          migration_id?: string
          sample_size?: number | null
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "migration_performance_benchmarks_migration_id_fkey"
            columns: ["migration_id"]
            isOneToOne: false
            referencedRelation: "migration_config"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_rollbacks: {
        Row: {
          automatic: boolean
          created_at: string | null
          id: string
          metadata: Json | null
          migration_id: string
          recovery_time_ms: number | null
          rollback_reason: string
          rollback_time: string
          rolled_back_from: string
          traffic_at_rollback: number
        }
        Insert: {
          automatic?: boolean
          created_at?: string | null
          id?: string
          metadata?: Json | null
          migration_id: string
          recovery_time_ms?: number | null
          rollback_reason: string
          rollback_time: string
          rolled_back_from: string
          traffic_at_rollback?: number
        }
        Update: {
          automatic?: boolean
          created_at?: string | null
          id?: string
          metadata?: Json | null
          migration_id?: string
          recovery_time_ms?: number | null
          rollback_reason?: string
          rollback_time?: string
          rolled_back_from?: string
          traffic_at_rollback?: number
        }
        Relationships: [
          {
            foreignKeyName: "migration_rollbacks_migration_id_fkey"
            columns: ["migration_id"]
            isOneToOne: false
            referencedRelation: "migration_config"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_analytics: {
        Row: {
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          step_id: string | null
          tour_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          step_id?: string | null
          tour_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          step_id?: string | null
          tour_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          active_tour_id: string | null
          active_tour_step: number | null
          completed_tours: string[] | null
          created_at: string | null
          has_seen_welcome: boolean | null
          id: string
          last_active_at: string | null
          session_count: number | null
          skipped_tours: string[] | null
          tour_progresses: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_tour_id?: string | null
          active_tour_step?: number | null
          completed_tours?: string[] | null
          created_at?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          last_active_at?: string | null
          session_count?: number | null
          skipped_tours?: string[] | null
          tour_progresses?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_tour_id?: string | null
          active_tour_step?: number | null
          completed_tours?: string[] | null
          created_at?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          last_active_at?: string | null
          session_count?: number | null
          skipped_tours?: string[] | null
          tour_progresses?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_disputes: {
        Row: {
          amount: number
          charge_id: string
          closed_at: string | null
          created_at: string | null
          currency: string
          evidence_due_by: string | null
          id: string
          last_event_type: string | null
          reason: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          charge_id: string
          closed_at?: string | null
          created_at?: string | null
          currency: string
          evidence_due_by?: string | null
          id: string
          last_event_type?: string | null
          reason: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          charge_id?: string
          closed_at?: string | null
          created_at?: string | null
          currency?: string
          evidence_due_by?: string | null
          id?: string
          last_event_type?: string | null
          reason?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_method_failures: {
        Row: {
          created_at: string | null
          failure_code: string | null
          failure_message: string | null
          failure_type: string
          id: string
          occurred_at: string
          payment_method_id: string
          resolution_method: string | null
          resolved_at: string | null
          retryable: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          failure_type: string
          id?: string
          occurred_at: string
          payment_method_id: string
          resolution_method?: string | null
          resolved_at?: string | null
          retryable?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          failure_type?: string
          id?: string
          occurred_at?: string
          payment_method_id?: string
          resolution_method?: string | null
          resolved_at?: string | null
          retryable?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          stripe_payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id: string
          is_default?: boolean | null
          stripe_payment_method_id: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pdf_generation_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_size_kb: number | null
          generation_time_ms: number | null
          generation_type: string
          id: string
          metadata: Json | null
          quote_id: string | null
          status: string
          storage_path: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_size_kb?: number | null
          generation_time_ms?: number | null
          generation_type: string
          id?: string
          metadata?: Json | null
          quote_id?: string | null
          status: string
          storage_path?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_size_kb?: number | null
          generation_time_ms?: number | null
          generation_type?: string
          id?: string
          metadata?: Json | null
          quote_id?: string | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_generation_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          css_styles: string
          description: string | null
          html_template: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          css_styles?: string
          description?: string | null
          html_template: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          css_styles?: string
          description?: string | null
          html_template?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      performance_alerts: {
        Row: {
          actual_value: number
          alert_details: Json | null
          alert_id: string
          alert_status: string
          alert_type: string
          auto_resolved: boolean
          created_at: string | null
          function_name: string
          id: string
          message: string
          metric_name: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          threshold_value: number
          triggered_at: string
        }
        Insert: {
          actual_value: number
          alert_details?: Json | null
          alert_id: string
          alert_status?: string
          alert_type: string
          auto_resolved?: boolean
          created_at?: string | null
          function_name: string
          id?: string
          message: string
          metric_name: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          threshold_value: number
          triggered_at?: string
        }
        Update: {
          actual_value?: number
          alert_details?: Json | null
          alert_id?: string
          alert_status?: string
          alert_type?: string
          auto_resolved?: boolean
          created_at?: string | null
          function_name?: string
          id?: string
          message?: string
          metric_name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threshold_value?: number
          triggered_at?: string
        }
        Relationships: []
      }
      performance_baselines: {
        Row: {
          baseline_api_calls: number
          baseline_db_queries: number
          baseline_response_time_ms: number
          created_at: string | null
          id: string
          improvement_percentage: number | null
          operation_name: string
          target_api_calls: number
          target_db_queries: number
          target_response_time_ms: number
          updated_at: string | null
        }
        Insert: {
          baseline_api_calls: number
          baseline_db_queries: number
          baseline_response_time_ms: number
          created_at?: string | null
          id?: string
          improvement_percentage?: number | null
          operation_name: string
          target_api_calls: number
          target_db_queries: number
          target_response_time_ms: number
          updated_at?: string | null
        }
        Update: {
          baseline_api_calls?: number
          baseline_db_queries?: number
          baseline_response_time_ms?: number
          created_at?: string | null
          id?: string
          improvement_percentage?: number | null
          operation_name?: string
          target_api_calls?: number
          target_db_queries?: number
          target_response_time_ms?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      performance_benchmarks: {
        Row: {
          baseline_comparison: Json | null
          benchmark_id: string
          benchmark_type: string
          concurrency_level: number
          config: Json
          created_at: string | null
          execution_time_ms: number
          function_name: string
          id: string
          performance_score: number | null
          results: Json
          success_rate: number | null
          test_duration_ms: number
        }
        Insert: {
          baseline_comparison?: Json | null
          benchmark_id: string
          benchmark_type: string
          concurrency_level?: number
          config?: Json
          created_at?: string | null
          execution_time_ms?: number
          function_name: string
          id?: string
          performance_score?: number | null
          results?: Json
          success_rate?: number | null
          test_duration_ms?: number
        }
        Update: {
          baseline_comparison?: Json | null
          benchmark_id?: string
          benchmark_type?: string
          concurrency_level?: number
          config?: Json
          created_at?: string | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          performance_score?: number | null
          results?: Json
          success_rate?: number | null
          test_duration_ms?: number
        }
        Relationships: []
      }
      performance_optimization_baselines: {
        Row: {
          baseline_type: string
          baseline_value: number
          conditions: Json | null
          confidence_interval: Json | null
          created_at: string | null
          environment: string
          function_name: string
          id: string
          measurement_period: unknown
          measurement_unit: string
          sample_size: number
          statistical_data: Json | null
        }
        Insert: {
          baseline_type: string
          baseline_value: number
          conditions?: Json | null
          confidence_interval?: Json | null
          created_at?: string | null
          environment: string
          function_name: string
          id?: string
          measurement_period: unknown
          measurement_unit: string
          sample_size?: number
          statistical_data?: Json | null
        }
        Update: {
          baseline_type?: string
          baseline_value?: number
          conditions?: Json | null
          confidence_interval?: Json | null
          created_at?: string | null
          environment?: string
          function_name?: string
          id?: string
          measurement_period?: unknown
          measurement_unit?: string
          sample_size?: number
          statistical_data?: Json | null
        }
        Relationships: []
      }
      performance_optimization_test_results: {
        Row: {
          average_response_time_ms: number | null
          concurrent_users: number
          created_at: string | null
          error_rate: number | null
          failed_requests: number
          function_name: string
          id: string
          p95_response_time_ms: number | null
          pass_fail_criteria: Json | null
          performance_metrics: Json
          successful_requests: number
          test_config: Json
          test_duration_ms: number
          test_id: string
          test_passed: boolean | null
          test_results: Json
          test_type: string
          throughput_rps: number | null
          total_requests: number
        }
        Insert: {
          average_response_time_ms?: number | null
          concurrent_users?: number
          created_at?: string | null
          error_rate?: number | null
          failed_requests?: number
          function_name: string
          id?: string
          p95_response_time_ms?: number | null
          pass_fail_criteria?: Json | null
          performance_metrics?: Json
          successful_requests?: number
          test_config?: Json
          test_duration_ms?: number
          test_id: string
          test_passed?: boolean | null
          test_results?: Json
          test_type: string
          throughput_rps?: number | null
          total_requests?: number
        }
        Update: {
          average_response_time_ms?: number | null
          concurrent_users?: number
          created_at?: string | null
          error_rate?: number | null
          failed_requests?: number
          function_name?: string
          id?: string
          p95_response_time_ms?: number | null
          pass_fail_criteria?: Json | null
          performance_metrics?: Json
          successful_requests?: number
          test_config?: Json
          test_duration_ms?: number
          test_id?: string
          test_passed?: boolean | null
          test_results?: Json
          test_type?: string
          throughput_rps?: number | null
          total_requests?: number
        }
        Relationships: []
      }
      performance_optimizations: {
        Row: {
          auto_applied: boolean
          created_at: string | null
          execution_time_ms: number
          function_name: string
          id: string
          improvement_percentage: number | null
          memory_usage_mb: number | null
          optimization_id: string
          optimization_type: string
          optimizations_applied: Json
          performance_after: Json | null
          performance_before: Json | null
          results: Json
          success_rate: number | null
        }
        Insert: {
          auto_applied?: boolean
          created_at?: string | null
          execution_time_ms?: number
          function_name: string
          id?: string
          improvement_percentage?: number | null
          memory_usage_mb?: number | null
          optimization_id: string
          optimization_type: string
          optimizations_applied?: Json
          performance_after?: Json | null
          performance_before?: Json | null
          results?: Json
          success_rate?: number | null
        }
        Update: {
          auto_applied?: boolean
          created_at?: string | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          improvement_percentage?: number | null
          memory_usage_mb?: number | null
          optimization_id?: string
          optimization_type?: string
          optimizations_applied?: Json
          performance_after?: Json | null
          performance_before?: Json | null
          results?: Json
          success_rate?: number | null
        }
        Relationships: []
      }
      performance_recommendations: {
        Row: {
          auto_generated: boolean
          category: string
          confidence_score: number | null
          created_at: string | null
          current_performance: Json | null
          description: string
          expected_impact: string | null
          expected_performance: Json | null
          function_name: string
          id: string
          implementation_effort: string | null
          implemented_at: string | null
          priority: string
          recommendation_id: string
          recommended_actions: Json
          reviewed_at: string | null
          status: string
          supporting_data: Json | null
          title: string
        }
        Insert: {
          auto_generated?: boolean
          category: string
          confidence_score?: number | null
          created_at?: string | null
          current_performance?: Json | null
          description: string
          expected_impact?: string | null
          expected_performance?: Json | null
          function_name: string
          id?: string
          implementation_effort?: string | null
          implemented_at?: string | null
          priority: string
          recommendation_id: string
          recommended_actions?: Json
          reviewed_at?: string | null
          status?: string
          supporting_data?: Json | null
          title: string
        }
        Update: {
          auto_generated?: boolean
          category?: string
          confidence_score?: number | null
          created_at?: string | null
          current_performance?: Json | null
          description?: string
          expected_impact?: string | null
          expected_performance?: Json | null
          function_name?: string
          id?: string
          implementation_effort?: string | null
          implemented_at?: string | null
          priority?: string
          recommendation_id?: string
          recommended_actions?: Json
          reviewed_at?: string | null
          status?: string
          supporting_data?: Json | null
          title?: string
        }
        Relationships: []
      }
      performance_test_results: {
        Row: {
          actual_value: number
          baseline_value: number
          created_at: string | null
          function_name: string
          id: string
          improvement_percent: number | null
          sample_size: number | null
          status: string
          target_value: number
          test_details: Json | null
          test_duration_ms: number
          test_type: string
          validation_id: string
        }
        Insert: {
          actual_value: number
          baseline_value: number
          created_at?: string | null
          function_name: string
          id?: string
          improvement_percent?: number | null
          sample_size?: number | null
          status: string
          target_value: number
          test_details?: Json | null
          test_duration_ms?: number
          test_type: string
          validation_id: string
        }
        Update: {
          actual_value?: number
          baseline_value?: number
          created_at?: string | null
          function_name?: string
          id?: string
          improvement_percent?: number | null
          sample_size?: number | null
          status?: string
          target_value?: number
          test_details?: Json | null
          test_duration_ms?: number
          test_type?: string
          validation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_test_results_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "production_validation_reports"
            referencedColumns: ["validation_id"]
          },
        ]
      }
      production_validation_reports: {
        Row: {
          category_scores: Json
          created_at: string | null
          critical_issues_count: number
          deployment_ready: boolean
          estimated_risk: string
          execution_time_ms: number
          failed_tests: number
          id: string
          metadata: Json | null
          overall_score: number
          overall_status: string
          passed_tests: number
          recommendations: Json
          skipped_tests: number
          total_tests: number
          validation_id: string
          validation_results: Json
          warning_tests: number
        }
        Insert: {
          category_scores?: Json
          created_at?: string | null
          critical_issues_count?: number
          deployment_ready?: boolean
          estimated_risk: string
          execution_time_ms?: number
          failed_tests?: number
          id?: string
          metadata?: Json | null
          overall_score: number
          overall_status: string
          passed_tests?: number
          recommendations?: Json
          skipped_tests?: number
          total_tests?: number
          validation_id: string
          validation_results?: Json
          warning_tests?: number
        }
        Update: {
          category_scores?: Json
          created_at?: string | null
          critical_issues_count?: number
          deployment_ready?: boolean
          estimated_risk?: string
          execution_time_ms?: number
          failed_tests?: number
          id?: string
          metadata?: Json | null
          overall_score?: number
          overall_status?: string
          passed_tests?: number
          recommendations?: Json
          skipped_tests?: number
          total_tests?: number
          validation_id?: string
          validation_results?: Json
          warning_tests?: number
        }
        Relationships: []
      }
      properties: {
        Row: {
          access_instructions: string | null
          billing_address: string | null
          billing_notes: string | null
          client_id: string
          client_requirements: string | null
          created_at: string | null
          gate_code: string | null
          hardscape_area: number | null
          id: string
          is_active: boolean | null
          landscape_area: number | null
          latitude: number | null
          lawn_area: number | null
          location_verified: boolean | null
          longitude: number | null
          lot_size: number | null
          parking_location: string | null
          pet_information: string | null
          preferred_service_time: string | null
          property_access: Database["public"]["Enums"]["property_access"] | null
          property_name: string | null
          property_notes: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          safety_considerations: string | null
          season_end_date: string | null
          season_start_date: string | null
          service_address: string
          service_frequency: string | null
          special_equipment_needed: string[] | null
          square_footage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_instructions?: string | null
          billing_address?: string | null
          billing_notes?: string | null
          client_id: string
          client_requirements?: string | null
          created_at?: string | null
          gate_code?: string | null
          hardscape_area?: number | null
          id?: string
          is_active?: boolean | null
          landscape_area?: number | null
          latitude?: number | null
          lawn_area?: number | null
          location_verified?: boolean | null
          longitude?: number | null
          lot_size?: number | null
          parking_location?: string | null
          pet_information?: string | null
          preferred_service_time?: string | null
          property_access?:
            | Database["public"]["Enums"]["property_access"]
            | null
          property_name?: string | null
          property_notes?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          safety_considerations?: string | null
          season_end_date?: string | null
          season_start_date?: string | null
          service_address: string
          service_frequency?: string | null
          special_equipment_needed?: string[] | null
          square_footage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_instructions?: string | null
          billing_address?: string | null
          billing_notes?: string | null
          client_id?: string
          client_requirements?: string | null
          created_at?: string | null
          gate_code?: string | null
          hardscape_area?: number | null
          id?: string
          is_active?: boolean | null
          landscape_area?: number | null
          latitude?: number | null
          lawn_area?: number | null
          location_verified?: boolean | null
          longitude?: number | null
          lot_size?: number | null
          parking_location?: string | null
          pet_information?: string | null
          preferred_service_time?: string | null
          property_access?:
            | Database["public"]["Enums"]["property_access"]
            | null
          property_name?: string | null
          property_notes?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          safety_considerations?: string | null
          season_end_date?: string | null
          season_start_date?: string | null
          service_address?: string
          service_frequency?: string | null
          special_equipment_needed?: string[] | null
          square_footage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assessments: {
        Row: {
          assessment_date: string | null
          assessment_notes: string | null
          assessment_number: string | null
          assessment_reviewed_by: string | null
          assessment_status:
            | Database["public"]["Enums"]["assessment_status"]
            | null
          assessor_contact: string | null
          assessor_name: string
          bare_spots_count: number | null
          client_walkthrough_completed: boolean | null
          compaction_level: number | null
          completed_date: string | null
          complexity_score: number | null
          crane_access_needed: boolean | null
          created_at: string | null
          distance_to_disposal_feet: number | null
          drainage_quality: number | null
          dump_truck_access: boolean | null
          electrical_outlets_available: number | null
          environmental_considerations: string | null
          equipment_needed:
            | Database["public"]["Enums"]["equipment_category"][]
            | null
          erosion_issues: boolean | null
          estimated_disposal_cost: number | null
          estimated_equipment_cost: number | null
          estimated_labor_cost: number | null
          estimated_material_cost: number | null
          estimated_total_cost: number | null
          existing_mulch_area: number | null
          fence_linear_feet: number | null
          flower_bed_area: number | null
          follow_up_needed: boolean | null
          follow_up_notes: string | null
          gate_width_feet: number | null
          grass_type: string | null
          hardscape_area_measured: number | null
          hoa_restrictions: string | null
          id: string
          internal_notes: string | null
          irrigation_status:
            | Database["public"]["Enums"]["irrigation_status"]
            | null
          irrigation_zones_count: number | null
          lawn_area_estimated: number | null
          lawn_area_measured: number | null
          lawn_condition: Database["public"]["Enums"]["lawn_condition"] | null
          material_requirements: Json | null
          measurements_verified: boolean | null
          neighbor_considerations: string | null
          obstacles: Json | null
          overall_condition:
            | Database["public"]["Enums"]["assessment_overall_condition"]
            | null
          parking_available: boolean | null
          permit_required: boolean | null
          photos_taken_count: number | null
          priority_level: number | null
          profit_margin_percent: number | null
          property_id: string
          quote_id: string | null
          recommendations: string | null
          review_date: string | null
          safety_hazards: string[] | null
          scheduled_date: string | null
          shrub_count: number | null
          slope_grade_percent: number | null
          soil_condition: Database["public"]["Enums"]["soil_condition"] | null
          soil_ph: number | null
          special_considerations: Json | null
          temperature_f: number | null
          thatch_thickness_inches: number | null
          total_estimated_hours: number | null
          tree_count: number | null
          updated_at: string | null
          user_id: string
          utility_lines_marked: boolean | null
          vehicle_access_width_feet: number | null
          water_source_access: boolean | null
          weather_conditions: string | null
          weed_coverage_percent: number | null
        }
        Insert: {
          assessment_date?: string | null
          assessment_notes?: string | null
          assessment_number?: string | null
          assessment_reviewed_by?: string | null
          assessment_status?:
            | Database["public"]["Enums"]["assessment_status"]
            | null
          assessor_contact?: string | null
          assessor_name: string
          bare_spots_count?: number | null
          client_walkthrough_completed?: boolean | null
          compaction_level?: number | null
          completed_date?: string | null
          complexity_score?: number | null
          crane_access_needed?: boolean | null
          created_at?: string | null
          distance_to_disposal_feet?: number | null
          drainage_quality?: number | null
          dump_truck_access?: boolean | null
          electrical_outlets_available?: number | null
          environmental_considerations?: string | null
          equipment_needed?:
            | Database["public"]["Enums"]["equipment_category"][]
            | null
          erosion_issues?: boolean | null
          estimated_disposal_cost?: number | null
          estimated_equipment_cost?: number | null
          estimated_labor_cost?: number | null
          estimated_material_cost?: number | null
          estimated_total_cost?: number | null
          existing_mulch_area?: number | null
          fence_linear_feet?: number | null
          flower_bed_area?: number | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          gate_width_feet?: number | null
          grass_type?: string | null
          hardscape_area_measured?: number | null
          hoa_restrictions?: string | null
          id?: string
          internal_notes?: string | null
          irrigation_status?:
            | Database["public"]["Enums"]["irrigation_status"]
            | null
          irrigation_zones_count?: number | null
          lawn_area_estimated?: number | null
          lawn_area_measured?: number | null
          lawn_condition?: Database["public"]["Enums"]["lawn_condition"] | null
          material_requirements?: Json | null
          measurements_verified?: boolean | null
          neighbor_considerations?: string | null
          obstacles?: Json | null
          overall_condition?:
            | Database["public"]["Enums"]["assessment_overall_condition"]
            | null
          parking_available?: boolean | null
          permit_required?: boolean | null
          photos_taken_count?: number | null
          priority_level?: number | null
          profit_margin_percent?: number | null
          property_id: string
          quote_id?: string | null
          recommendations?: string | null
          review_date?: string | null
          safety_hazards?: string[] | null
          scheduled_date?: string | null
          shrub_count?: number | null
          slope_grade_percent?: number | null
          soil_condition?: Database["public"]["Enums"]["soil_condition"] | null
          soil_ph?: number | null
          special_considerations?: Json | null
          temperature_f?: number | null
          thatch_thickness_inches?: number | null
          total_estimated_hours?: number | null
          tree_count?: number | null
          updated_at?: string | null
          user_id: string
          utility_lines_marked?: boolean | null
          vehicle_access_width_feet?: number | null
          water_source_access?: boolean | null
          weather_conditions?: string | null
          weed_coverage_percent?: number | null
        }
        Update: {
          assessment_date?: string | null
          assessment_notes?: string | null
          assessment_number?: string | null
          assessment_reviewed_by?: string | null
          assessment_status?:
            | Database["public"]["Enums"]["assessment_status"]
            | null
          assessor_contact?: string | null
          assessor_name?: string
          bare_spots_count?: number | null
          client_walkthrough_completed?: boolean | null
          compaction_level?: number | null
          completed_date?: string | null
          complexity_score?: number | null
          crane_access_needed?: boolean | null
          created_at?: string | null
          distance_to_disposal_feet?: number | null
          drainage_quality?: number | null
          dump_truck_access?: boolean | null
          electrical_outlets_available?: number | null
          environmental_considerations?: string | null
          equipment_needed?:
            | Database["public"]["Enums"]["equipment_category"][]
            | null
          erosion_issues?: boolean | null
          estimated_disposal_cost?: number | null
          estimated_equipment_cost?: number | null
          estimated_labor_cost?: number | null
          estimated_material_cost?: number | null
          estimated_total_cost?: number | null
          existing_mulch_area?: number | null
          fence_linear_feet?: number | null
          flower_bed_area?: number | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          gate_width_feet?: number | null
          grass_type?: string | null
          hardscape_area_measured?: number | null
          hoa_restrictions?: string | null
          id?: string
          internal_notes?: string | null
          irrigation_status?:
            | Database["public"]["Enums"]["irrigation_status"]
            | null
          irrigation_zones_count?: number | null
          lawn_area_estimated?: number | null
          lawn_area_measured?: number | null
          lawn_condition?: Database["public"]["Enums"]["lawn_condition"] | null
          material_requirements?: Json | null
          measurements_verified?: boolean | null
          neighbor_considerations?: string | null
          obstacles?: Json | null
          overall_condition?:
            | Database["public"]["Enums"]["assessment_overall_condition"]
            | null
          parking_available?: boolean | null
          permit_required?: boolean | null
          photos_taken_count?: number | null
          priority_level?: number | null
          profit_margin_percent?: number | null
          property_id?: string
          quote_id?: string | null
          recommendations?: string | null
          review_date?: string | null
          safety_hazards?: string[] | null
          scheduled_date?: string | null
          shrub_count?: number | null
          slope_grade_percent?: number | null
          soil_condition?: Database["public"]["Enums"]["soil_condition"] | null
          soil_ph?: number | null
          special_considerations?: Json | null
          temperature_f?: number | null
          thatch_thickness_inches?: number | null
          total_estimated_hours?: number | null
          tree_count?: number | null
          updated_at?: string | null
          user_id?: string
          utility_lines_marked?: boolean | null
          vehicle_access_width_feet?: number | null
          water_source_access?: boolean | null
          weather_conditions?: string | null
          weed_coverage_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_assessments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_assessments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assessments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_assessments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          assessment_id: string | null
          client_contact: string | null
          client_id: string | null
          client_name: string
          created_at: string | null
          expires_at: string | null
          follow_up_date: string | null
          id: string
          is_template: boolean | null
          markup_rate: number
          notes: string | null
          property_id: string | null
          property_notes: string | null
          quote_data: Json
          quote_number: string | null
          sent_at: string | null
          service_address: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          subtotal: number
          tax_rate: number
          template_name: string | null
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          client_contact?: string | null
          client_id?: string | null
          client_name: string
          created_at?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_template?: boolean | null
          markup_rate: number
          notes?: string | null
          property_id?: string | null
          property_notes?: string | null
          quote_data: Json
          quote_number?: string | null
          sent_at?: string | null
          service_address?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          subtotal: number
          tax_rate: number
          template_name?: string | null
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          client_contact?: string | null
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_template?: boolean | null
          markup_rate?: number
          notes?: string | null
          property_id?: string | null
          property_notes?: string | null
          quote_data?: Json
          quote_number?: string | null
          sent_at?: string | null
          service_address?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          subtotal?: number
          tax_rate?: number
          template_name?: string | null
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "quotes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_analytics"
            referencedColumns: ["property_id"]
          },
        ]
      }
      rate_limit_tracking: {
        Row: {
          blocked_until: string | null
          client_ip: unknown
          created_at: string | null
          id: string
          last_request: string
          metadata: Json | null
          request_count: number
          updated_at: string | null
          violation_count: number
        }
        Insert: {
          blocked_until?: string | null
          client_ip: unknown
          created_at?: string | null
          id?: string
          last_request?: string
          metadata?: Json | null
          request_count?: number
          updated_at?: string | null
          violation_count?: number
        }
        Update: {
          blocked_until?: string | null
          client_ip?: unknown
          created_at?: string | null
          id?: string
          last_request?: string
          metadata?: Json | null
          request_count?: number
          updated_at?: string | null
          violation_count?: number
        }
        Relationships: []
      }
      regional_config: {
        Row: {
          caching_strategy: string
          cold_start_optimization: boolean
          connection_pooling: Json
          created_at: string | null
          enabled: boolean
          error_rate_threshold: number
          id: string
          latency_threshold: number
          load_balancing_weight: number
          priority: number
          region: string
          region_name: string
          updated_at: string | null
        }
        Insert: {
          caching_strategy?: string
          cold_start_optimization?: boolean
          connection_pooling?: Json
          created_at?: string | null
          enabled?: boolean
          error_rate_threshold?: number
          id?: string
          latency_threshold?: number
          load_balancing_weight?: number
          priority?: number
          region: string
          region_name: string
          updated_at?: string | null
        }
        Update: {
          caching_strategy?: string
          cold_start_optimization?: boolean
          connection_pooling?: Json
          created_at?: string | null
          enabled?: boolean
          error_rate_threshold?: number
          id?: string
          latency_threshold?: number
          load_balancing_weight?: number
          priority?: number
          region?: string
          region_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      regional_performance_metrics: {
        Row: {
          active_connections: number
          avg_response_time_ms: number
          cache_hit_rate: number
          cold_start_rate: number
          created_at: string | null
          data_points_count: number
          error_rate: number
          health_status: string
          id: string
          last_checked: string
          metadata: Json | null
          region: string
          throughput_rps: number
          uptime_percent: number
        }
        Insert: {
          active_connections?: number
          avg_response_time_ms?: number
          cache_hit_rate?: number
          cold_start_rate?: number
          created_at?: string | null
          data_points_count?: number
          error_rate?: number
          health_status?: string
          id?: string
          last_checked?: string
          metadata?: Json | null
          region: string
          throughput_rps?: number
          uptime_percent?: number
        }
        Update: {
          active_connections?: number
          avg_response_time_ms?: number
          cache_hit_rate?: number
          cold_start_rate?: number
          created_at?: string | null
          data_points_count?: number
          error_rate?: number
          health_status?: string
          id?: string
          last_checked?: string
          metadata?: Json | null
          region?: string
          throughput_rps?: number
          uptime_percent?: number
        }
        Relationships: []
      }
      scheduled_follow_ups: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          event_id: string
          event_type: string
          handler_used: string
          id: string
          next_steps: string[] | null
          scheduled_for: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          event_id: string
          event_type: string
          handler_used: string
          id?: string
          next_steps?: string[] | null
          scheduled_for: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          event_id?: string
          event_type?: string
          handler_used?: string
          id?: string
          next_steps?: string[] | null
          scheduled_for?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_performed: string
          created_at: string | null
          details: Json | null
          event_category: string
          event_type: string
          function_name: string | null
          id: string
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          result: string
          risk_level: string | null
          session_id: string | null
          source_ip: unknown | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_performed: string
          created_at?: string | null
          details?: Json | null
          event_category: string
          event_type: string
          function_name?: string | null
          id?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          result: string
          risk_level?: string | null
          session_id?: string | null
          source_ip?: unknown | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_performed?: string
          created_at?: string | null
          details?: Json | null
          event_category?: string
          event_type?: string
          function_name?: string | null
          id?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          result?: string
          risk_level?: string | null
          session_id?: string | null
          source_ip?: unknown | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_configuration: {
        Row: {
          config_category: string
          config_key: string
          config_value: Json
          created_at: string | null
          enabled: boolean
          id: string
          last_modified_at: string | null
          last_modified_by: string | null
          metadata: Json | null
        }
        Insert: {
          config_category: string
          config_key: string
          config_value?: Json
          created_at?: string | null
          enabled?: boolean
          id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          metadata?: Json | null
        }
        Update: {
          config_category?: string
          config_key?: string
          config_value?: Json
          created_at?: string | null
          enabled?: boolean
          id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          created_at: string | null
          event_type: string
          function_name: string
          id: string
          incident_id: string
          metadata: Json | null
          payload: Json | null
          request_path: string
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          response_action: string
          source_ip: unknown | null
          threat_level: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          function_name: string
          id?: string
          incident_id: string
          metadata?: Json | null
          payload?: Json | null
          request_path: string
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          response_action: string
          source_ip?: unknown | null
          threat_level: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          function_name?: string
          id?: string
          incident_id?: string
          metadata?: Json | null
          payload?: Json | null
          request_path?: string
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          response_action?: string
          source_ip?: unknown | null
          threat_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_metrics: {
        Row: {
          calculated_at: string
          id: string
          metric_date: string
          metric_details: Json | null
          metric_type: string
          metric_value: number
        }
        Insert: {
          calculated_at?: string
          id?: string
          metric_date?: string
          metric_details?: Json | null
          metric_type: string
          metric_value: number
        }
        Update: {
          calculated_at?: string
          id?: string
          metric_date?: string
          metric_details?: Json | null
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      security_scan_reports: {
        Row: {
          created_at: string | null
          critical_issues: number
          execution_time_ms: number
          failed_tests: number
          high_issues: number
          id: string
          low_issues: number
          medium_issues: number
          passed_tests: number
          scan_id: string
          scan_results: Json
          scan_type: string
          security_score: number
          total_tests: number
          warning_tests: number
        }
        Insert: {
          created_at?: string | null
          critical_issues?: number
          execution_time_ms?: number
          failed_tests?: number
          high_issues?: number
          id?: string
          low_issues?: number
          medium_issues?: number
          passed_tests?: number
          scan_id: string
          scan_results?: Json
          scan_type?: string
          security_score: number
          total_tests?: number
          warning_tests?: number
        }
        Update: {
          created_at?: string | null
          critical_issues?: number
          execution_time_ms?: number
          failed_tests?: number
          high_issues?: number
          id?: string
          low_issues?: number
          medium_issues?: number
          passed_tests?: number
          scan_id?: string
          scan_results?: Json
          scan_type?: string
          security_score?: number
          total_tests?: number
          warning_tests?: number
        }
        Relationships: []
      }
      security_validation_results: {
        Row: {
          compliance_standards: Json | null
          created_at: string | null
          id: string
          remediation_steps: Json | null
          security_category: string
          severity: string
          status: string
          test_evidence: Json | null
          test_name: string
          validation_id: string
          vulnerability_details: Json | null
        }
        Insert: {
          compliance_standards?: Json | null
          created_at?: string | null
          id?: string
          remediation_steps?: Json | null
          security_category: string
          severity: string
          status: string
          test_evidence?: Json | null
          test_name: string
          validation_id: string
          vulnerability_details?: Json | null
        }
        Update: {
          compliance_standards?: Json | null
          created_at?: string | null
          id?: string
          remediation_steps?: Json | null
          security_category?: string
          severity?: string
          status?: string
          test_evidence?: Json | null
          test_name?: string
          validation_id?: string
          vulnerability_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "security_validation_results_validation_id_fkey"
            columns: ["validation_id"]
            isOneToOne: false
            referencedRelation: "production_validation_reports"
            referencedColumns: ["validation_id"]
          },
        ]
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          stripe_product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          stripe_product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_prices_stripe_product_id_fkey"
            columns: ["stripe_product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          data: Json | null
          error_message: string | null
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscription_changes: {
        Row: {
          change_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          subscription_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          change_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          subscription_id?: string | null
          timestamp: string
          user_id?: string | null
        }
        Update: {
          change_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          subscription_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id: string
          metadata?: Json | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_stripe_price_id_fkey"
            columns: ["stripe_price_id"]
            isOneToOne: false
            referencedRelation: "stripe_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_intelligence: {
        Row: {
          confidence_level: string
          created_at: string | null
          description: string | null
          false_positive: boolean
          first_seen: string
          id: string
          indicator_type: string
          indicator_value: string
          is_active: boolean
          last_seen: string
          metadata: Json | null
          severity: string
          source: string
          threat_type: string
          updated_at: string | null
        }
        Insert: {
          confidence_level: string
          created_at?: string | null
          description?: string | null
          false_positive?: boolean
          first_seen?: string
          id?: string
          indicator_type: string
          indicator_value: string
          is_active?: boolean
          last_seen?: string
          metadata?: Json | null
          severity: string
          source: string
          threat_type: string
          updated_at?: string | null
        }
        Update: {
          confidence_level?: string
          created_at?: string | null
          description?: string | null
          false_positive?: boolean
          first_seen?: string
          id?: string
          indicator_type?: string
          indicator_value?: string
          is_active?: boolean
          last_seen?: string
          metadata?: Json | null
          severity?: string
          source?: string
          threat_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      traffic_routing_config: {
        Row: {
          created_at: string | null
          edge_function_endpoint: string
          function_name: string
          id: string
          is_active: boolean
          legacy_endpoint: string
          migration_id: string
          routing_rules: Json | null
          traffic_percentage: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          edge_function_endpoint: string
          function_name: string
          id?: string
          is_active?: boolean
          legacy_endpoint: string
          migration_id: string
          routing_rules?: Json | null
          traffic_percentage?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          edge_function_endpoint?: string
          function_name?: string
          id?: string
          is_active?: boolean
          legacy_endpoint?: string
          migration_id?: string
          routing_rules?: Json | null
          traffic_percentage?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_routing_config_migration_id_fkey"
            columns: ["migration_id"]
            isOneToOne: false
            referencedRelation: "migration_config"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_item_usage: {
        Row: {
          created_at: string | null
          global_item_id: string
          id: string
          is_favorite: boolean | null
          last_used_at: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          global_item_id: string
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          global_item_id?: string
          id?: string
          is_favorite?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_global_item_usage_global_item_id_fkey"
            columns: ["global_item_id"]
            isOneToOne: false
            referencedRelation: "global_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_global_item_usage_global_item_id_fkey"
            columns: ["global_item_id"]
            isOneToOne: false
            referencedRelation: "global_items_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_onboarding_preferences: {
        Row: {
          auto_start_tours: boolean | null
          created_at: string | null
          enable_animations: boolean | null
          preferences: Json | null
          preferred_tour_speed: string | null
          show_tooltips: boolean | null
          skip_completed_tours: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_start_tours?: boolean | null
          created_at?: string | null
          enable_animations?: boolean | null
          preferences?: Json | null
          preferred_tour_speed?: string | null
          show_tooltips?: boolean | null
          skip_completed_tours?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_start_tours?: boolean | null
          created_at?: string | null
          enable_animations?: boolean | null
          preferences?: Json | null
          preferred_tour_speed?: string | null
          show_tooltips?: boolean | null
          skip_completed_tours?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          last_active_at: string | null
          metadata: Json | null
          started_at: string | null
          status: string | null
          total_steps: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          total_steps?: number | null
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          total_steps?: number | null
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          api_calls_count: number
          bulk_operations_count: number
          created_at: string
          id: string
          month_year: string
          pdf_exports_count: number
          quotes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          api_calls_count?: number
          bulk_operations_count?: number
          created_at?: string
          id?: string
          month_year: string
          pdf_exports_count?: number
          quotes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          api_calls_count?: number
          bulk_operations_count?: number
          created_at?: string
          id?: string
          month_year?: string
          pdf_exports_count?: number
          quotes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_usage_history: {
        Row: {
          api_calls_count: number
          archived_at: string
          bulk_operations_count: number
          id: string
          month_year: string
          pdf_exports_count: number
          quotes_count: number
          user_id: string
        }
        Insert: {
          api_calls_count?: number
          archived_at?: string
          bulk_operations_count?: number
          id?: string
          month_year: string
          pdf_exports_count?: number
          quotes_count?: number
          user_id: string
        }
        Update: {
          api_calls_count?: number
          archived_at?: string
          bulk_operations_count?: number
          id?: string
          month_year?: string
          pdf_exports_count?: number
          quotes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          admin_locked_until: string | null
          admin_login_attempts: number | null
          admin_verified_at: string | null
          avatar_url: string | null
          billing_address: Json | null
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_admin_login: string | null
          onboarding_completed_at: string | null
          onboarding_progress: Json | null
          payment_method: Json | null
          updated_at: string | null
        }
        Insert: {
          admin_locked_until?: string | null
          admin_login_attempts?: number | null
          admin_verified_at?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_admin_login?: string | null
          onboarding_completed_at?: string | null
          onboarding_progress?: Json | null
          payment_method?: Json | null
          updated_at?: string | null
        }
        Update: {
          admin_locked_until?: string | null
          admin_login_attempts?: number | null
          admin_verified_at?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_admin_login?: string | null
          onboarding_completed_at?: string | null
          onboarding_progress?: Json | null
          payment_method?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vulnerability_assessments: {
        Row: {
          affected_component: string
          assessment_id: string
          assessment_type: string
          created_at: string | null
          cve_references: Json | null
          cvss_score: number | null
          description: string
          discovered_at: string
          id: string
          metadata: Json | null
          remediation_steps: Json
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          verification_status: string | null
          vulnerability_type: string
        }
        Insert: {
          affected_component: string
          assessment_id: string
          assessment_type: string
          created_at?: string | null
          cve_references?: Json | null
          cvss_score?: number | null
          description: string
          discovered_at?: string
          id?: string
          metadata?: Json | null
          remediation_steps?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          verification_status?: string | null
          vulnerability_type: string
        }
        Update: {
          affected_component?: string
          assessment_id?: string
          assessment_type?: string
          created_at?: string | null
          cve_references?: Json | null
          cvss_score?: number | null
          description?: string
          discovered_at?: string
          id?: string
          metadata?: Json | null
          remediation_steps?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          verification_status?: string | null
          vulnerability_type?: string
        }
        Relationships: []
      }
      webhook_audit_trail: {
        Row: {
          created_at: string | null
          database_changes: Json | null
          event_type: string
          external_api_calls: Json | null
          handler_matched: boolean
          id: string
          idempotency_checked: boolean
          ip_address: unknown | null
          processing_completed_at: string | null
          processing_started_at: string
          request_headers: Json | null
          response_body_summary: string | null
          response_status: number | null
          signature_validated: boolean
          stripe_event_id: string
          total_processing_time_ms: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          database_changes?: Json | null
          event_type: string
          external_api_calls?: Json | null
          handler_matched: boolean
          id?: string
          idempotency_checked: boolean
          ip_address?: unknown | null
          processing_completed_at?: string | null
          processing_started_at: string
          request_headers?: Json | null
          response_body_summary?: string | null
          response_status?: number | null
          signature_validated: boolean
          stripe_event_id: string
          total_processing_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          database_changes?: Json | null
          event_type?: string
          external_api_calls?: Json | null
          handler_matched?: boolean
          id?: string
          idempotency_checked?: boolean
          ip_address?: unknown | null
          processing_completed_at?: string | null
          processing_started_at?: string
          request_headers?: Json | null
          response_body_summary?: string | null
          response_status?: number | null
          signature_validated?: boolean
          stripe_event_id?: string
          total_processing_time_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_dead_letter_queue: {
        Row: {
          event_data: Json
          event_type: string
          failure_count: number
          failure_reason: string
          first_failed_at: string | null
          id: string
          last_error_message: string | null
          last_error_stack: string | null
          last_failed_at: string | null
          metadata: Json | null
          requires_manual_review: boolean | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          stripe_event_id: string
        }
        Insert: {
          event_data: Json
          event_type: string
          failure_count?: number
          failure_reason: string
          first_failed_at?: string | null
          id?: string
          last_error_message?: string | null
          last_error_stack?: string | null
          last_failed_at?: string | null
          metadata?: Json | null
          requires_manual_review?: boolean | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          stripe_event_id: string
        }
        Update: {
          event_data?: Json
          event_type?: string
          failure_count?: number
          failure_reason?: string
          first_failed_at?: string | null
          id?: string
          last_error_message?: string | null
          last_error_stack?: string | null
          last_failed_at?: string | null
          metadata?: Json | null
          requires_manual_review?: boolean | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      webhook_performance_benchmarks: {
        Row: {
          baseline_time_ms: number
          created_at: string | null
          current_avg_time_ms: number | null
          event_type: string
          id: string
          improvement_percentage: number | null
          last_calculated_at: string | null
          sample_size: number | null
          target_time_ms: number
          updated_at: string | null
        }
        Insert: {
          baseline_time_ms: number
          created_at?: string | null
          current_avg_time_ms?: number | null
          event_type: string
          id?: string
          improvement_percentage?: number | null
          last_calculated_at?: string | null
          sample_size?: number | null
          target_time_ms: number
          updated_at?: string | null
        }
        Update: {
          baseline_time_ms?: number
          created_at?: string | null
          current_avg_time_ms?: number | null
          event_type?: string
          id?: string
          improvement_percentage?: number | null
          last_calculated_at?: string | null
          sample_size?: number | null
          target_time_ms?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_processing_logs: {
        Row: {
          api_calls_made: number | null
          created_at: string | null
          database_queries: number | null
          error_message: string | null
          error_stack: string | null
          event_type: string
          execution_time_ms: number | null
          handler_name: string | null
          id: string
          metadata: Json | null
          processing_stage: string
          retry_attempt: number | null
          status: string
          stripe_event_id: string
        }
        Insert: {
          api_calls_made?: number | null
          created_at?: string | null
          database_queries?: number | null
          error_message?: string | null
          error_stack?: string | null
          event_type: string
          execution_time_ms?: number | null
          handler_name?: string | null
          id?: string
          metadata?: Json | null
          processing_stage: string
          retry_attempt?: number | null
          status: string
          stripe_event_id: string
        }
        Update: {
          api_calls_made?: number | null
          created_at?: string | null
          database_queries?: number | null
          error_message?: string | null
          error_stack?: string | null
          event_type?: string
          execution_time_ms?: number | null
          handler_name?: string | null
          id?: string
          metadata?: Json | null
          processing_stage?: string
          retry_attempt?: number | null
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      assessment_analytics: {
        Row: {
          assessment_date: string | null
          assessment_duration_hours: number | null
          assessment_id: string | null
          assessment_number: string | null
          assessment_status:
            | Database["public"]["Enums"]["assessment_status"]
            | null
          client_id: string | null
          client_name: string | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          client_walkthrough_completed: boolean | null
          company_name: string | null
          complexity_score: number | null
          created_at: string | null
          estimated_total_cost: number | null
          featured_media_count: number | null
          follow_up_needed: boolean | null
          hardscape_area_measured: number | null
          has_quote: boolean | null
          irrigation_status:
            | Database["public"]["Enums"]["irrigation_status"]
            | null
          lawn_area_measured: number | null
          lawn_condition: Database["public"]["Enums"]["lawn_condition"] | null
          measurements_verified: boolean | null
          media_count: number | null
          overall_condition:
            | Database["public"]["Enums"]["assessment_overall_condition"]
            | null
          photo_count: number | null
          priority_level: number | null
          profit_margin_percent: number | null
          property_id: string | null
          property_name: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          quote_id: string | null
          service_address: string | null
          shrub_count: number | null
          soil_condition: Database["public"]["Enums"]["soil_condition"] | null
          total_estimated_hours: number | null
          tree_count: number | null
          updated_at: string | null
          user_id: string | null
          video_count: number | null
          weed_coverage_percent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_assessments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_summary: {
        Row: {
          assessments_this_month: number | null
          assessments_this_week: number | null
          assessments_with_quotes: number | null
          average_assessment_value: number | null
          average_complexity: number | null
          average_labor_hours: number | null
          completed_count: number | null
          critical_condition_count: number | null
          excellent_condition_count: number | null
          fair_condition_count: number | null
          followup_required_count: number | null
          good_condition_count: number | null
          high_complexity_count: number | null
          in_progress_count: number | null
          max_complexity: number | null
          most_recent_assessment: string | null
          poor_condition_count: number | null
          quote_conversion_rate_percent: number | null
          quoted_value: number | null
          reviewed_count: number | null
          scheduled_count: number | null
          total_assessments: number | null
          total_estimated_hours: number | null
          total_estimated_value: number | null
          total_media_files: number | null
          user_id: string | null
        }
        Relationships: []
      }
      client_analytics: {
        Row: {
          acceptance_rate_percent: number | null
          accepted_quotes: number | null
          accepted_value: number | null
          active_properties: number | null
          average_quote_value: number | null
          client_id: string | null
          client_name: string | null
          client_since: string | null
          client_status: Database["public"]["Enums"]["client_status"] | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          company_name: string | null
          declined_quotes: number | null
          email: string | null
          last_quote_date: string | null
          phone: string | null
          total_properties: number | null
          total_quote_value: number | null
          total_quotes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      global_items_analytics: {
        Row: {
          access_tier: string | null
          avg_usage_count: number | null
          category_name: string | null
          created_at: string | null
          favorite_count: number | null
          id: string | null
          last_used: string | null
          name: string | null
          total_users: number | null
        }
        Relationships: []
      }
      property_analytics: {
        Row: {
          acceptance_rate_percent: number | null
          accepted_quotes: number | null
          accepted_value: number | null
          average_quote_value: number | null
          client_id: string | null
          client_name: string | null
          company_name: string | null
          declined_quotes: number | null
          is_active: boolean | null
          last_quote_date: string | null
          lawn_area: number | null
          property_id: string | null
          property_name: string | null
          property_since: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          sent_quotes: number | null
          service_address: string | null
          service_frequency: string | null
          square_footage: number | null
          total_quote_value: number | null
          total_quotes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "assessment_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_analytics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_analytics: {
        Row: {
          acceptance_rate_percent: number | null
          accepted_quotes: number | null
          accepted_value: number | null
          average_quote_value: number | null
          converted_quotes: number | null
          declined_quotes: number | null
          draft_quotes: number | null
          expired_quotes: number | null
          sent_quotes: number | null
          template_count: number | null
          total_quote_value: number | null
          total_quotes: number | null
          unique_clients_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_optimization_config: {
        Args: {
          p_config_value: Json
          p_config_key: string
          p_config_type: string
          p_enabled?: boolean
        }
        Returns: boolean
      }
      archive_and_reset_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_deployment_readiness_score: {
        Args: { p_validation_id: string }
        Returns: Json
      }
      calculate_performance_improvement: {
        Args: {
          p_improvement_direction?: string
          p_after_value: number
          p_before_value: number
        }
        Returns: number
      }
      calculate_pool_performance_score: {
        Args: { p_hours_back?: number; p_environment: string }
        Returns: number
      }
      calculate_regional_performance_scores: {
        Args: Record<PropertyKey, never>
        Returns: {
          performance_score: number
          health_status: string
          performance_grade: string
          improvement_recommendations: Json
          region: string
        }[]
      }
      calculate_security_score: {
        Args: { p_scan_id: string }
        Returns: number
      }
      check_performance_thresholds: {
        Args: {
          p_function_name: string
          p_metric_name: string
          p_metric_value: number
        }
        Returns: undefined
      }
      check_pool_alerts: {
        Args: { p_environment: string }
        Returns: undefined
      }
      check_rls_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_count: number
          table_schema: string
          table_name: string
          rls_enabled: boolean
        }[]
      }
      check_security_compliance: {
        Args: { p_validation_id: string }
        Returns: Json
      }
      check_usage_limit: {
        Args: { p_user_id: string; p_usage_type: string; p_limit: number }
        Returns: boolean
      }
      cleanup_connection_pool_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_batch_jobs: {
        Args: { p_days_old?: number }
        Returns: number
      }
      cleanup_performance_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_security_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_webhook_monitoring_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      copy_global_item_to_personal: {
        Args: { custom_cost?: number; p_global_item_id: string }
        Returns: string
      }
      create_default_property_for_client: {
        Args: { client_uuid: string }
        Returns: string
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      evaluate_feature_flag: {
        Args: { p_flag_key: string; p_user_id?: string; p_context?: Json }
        Returns: boolean
      }
      execute_automatic_rollback: {
        Args: { p_migration_id: string; p_reason: string }
        Returns: boolean
      }
      generate_optimization_recommendations: {
        Args: { p_region?: string }
        Returns: Json
      }
      generate_performance_recommendations: {
        Args: { p_function_name: string }
        Returns: undefined
      }
      generate_performance_report: {
        Args: { p_validation_id: string }
        Returns: Json
      }
      generate_pool_recommendations: {
        Args: { p_environment: string }
        Returns: undefined
      }
      generate_quote_number: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_assessment_dashboard: {
        Args: { p_user_id: string }
        Returns: {
          scheduled_date: string
          assessment_id: string
          assessment_number: string
          property_name: string
          priority_level: number
          estimated_total_cost: number
          photo_count: number
          client_name: string
          assessment_status: Database["public"]["Enums"]["assessment_status"]
          complexity_score: number
        }[]
      }
      get_batch_job_status: {
        Args: { p_job_id: string }
        Returns: {
          execution_time_ms: number
          id: string
          operation_type: string
          total_items: number
          processed_items: number
          failed_items: number
          progress_percent: number
          status: string
          created_at: string
          completed_at: string
          error_summary: string
        }[]
      }
      get_connection_pool_status: {
        Args: { p_environment?: string }
        Returns: {
          current_config: Json
          latest_metrics: Json
          health_score: number
          active_alerts: number
          pending_recommendations: number
          environment: string
        }[]
      }
      get_current_usage: {
        Args: { p_user_id: string }
        Returns: {
          api_calls_count: number
          bulk_operations_count: number
          quotes_count: number
          pdf_exports_count: number
        }[]
      }
      get_global_optimization_status: {
        Args: { p_optimization_id?: string; p_limit?: number }
        Returns: {
          optimization_summary: Json
          optimization_id: string
          created_at: string
          auto_applied: boolean
          performance_improvement: number
          recommendations_count: number
          overall_performance: Json
          regional_health_score: number
          total_optimizations: number
        }[]
      }
      get_migration_status: {
        Args: { p_migration_id?: string }
        Returns: {
          error_rate: number
          active_alerts: Json
          duration_minutes: number
          rollback_count: number
          function_health: Json
          migration_id: string
          current_state: string
          progress_percent: number
          health_score: number
          traffic_split_percent: number
          performance_improvement: number
        }[]
      }
      get_onboarding_stats: {
        Args: {
          user_id_param?: string
          end_date?: string
          start_date?: string
          tour_id_param?: string
        }
        Returns: {
          completion_rate: number
          skipped_tours: number
          completed_tours: number
          average_completion_time: unknown
          total_users: number
          in_progress_tours: number
        }[]
      }
      get_or_create_user_template: {
        Args: { p_template_id?: string; p_user_id: string }
        Returns: {
          company_id: string | null
          created_at: string | null
          css_styles: string
          description: string | null
          html_template: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
      }
      get_pdf_generation_stats: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: Json
      }
      get_pending_admin_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          type: string
          title: string
          message: string
          severity: string
          created_at: string
          metadata: Json
        }[]
      }
      get_performance_baseline: {
        Args: {
          p_baseline_type: string
          p_environment: string
          p_function_name: string
        }
        Returns: number
      }
      get_performance_summary: {
        Args: { p_days_back?: number; p_function_name?: string }
        Returns: {
          function_name: string
          operation_type: string
          avg_execution_time_ms: number
          min_execution_time_ms: number
          max_execution_time_ms: number
          total_invocations: number
          avg_db_queries: number
          avg_api_calls: number
          error_rate: number
          improvement_vs_baseline: number
        }[]
      }
      get_production_validation_status: {
        Args: { p_validation_id?: string; p_limit?: number }
        Returns: {
          created_at: string
          validation_id: string
          overall_status: string
          overall_score: number
          deployment_ready: boolean
          estimated_risk: string
          critical_issues: number
          performance_score: number
          security_score: number
          reliability_score: number
          business_score: number
          validation_summary: Json
        }[]
      }
      get_security_status_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_edge_case_summary: {
        Args: { p_user_id: string }
        Returns: {
          failed_events: number
          total_events: number
          successful_events: number
          recent_failures: number
          unread_notifications: number
          active_disputes: number
        }[]
      }
      get_user_folder_from_path: {
        Args: { path: string }
        Returns: string
      }
      get_user_onboarding_completion: {
        Args: { user_id_param: string }
        Returns: {
          total_tours: number
          completed_tours: number
          completion_percentage: number
        }[]
      }
      get_user_tier: {
        Args: { user_id?: string }
        Returns: string
      }
      get_webhook_performance_summary: {
        Args: { p_event_type?: string; p_days_back?: number }
        Returns: {
          total_events: number
          event_type: string
          avg_processing_time_ms: number
          success_rate: number
          retry_rate: number
          dead_letter_rate: number
          improvement_vs_baseline: number
        }[]
      }
      increment_usage: {
        Args: { p_amount?: number; p_user_id: string; p_usage_type: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_onboarding_complete: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_quotes_to_default_properties: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      log_pdf_generation: {
        Args: {
          p_user_id: string
          p_template_id: string
          p_generation_type: string
          p_status: string
          p_file_size_kb?: number
          p_generation_time_ms?: number
          p_storage_path?: string
          p_error_message?: string
          p_metadata?: Json
          p_quote_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_source_ip: unknown
          p_threat_level: string
          p_function_name: string
          p_event_type: string
          p_user_id: string
          p_details?: Json
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      record_edge_function_performance: {
        Args: {
          p_user_id?: string
          p_function_name: string
          p_operation_type: string
          p_execution_time_ms: number
          p_database_queries?: number
          p_api_calls_made?: number
          p_memory_usage_mb?: number
          p_error_count?: number
          p_metadata?: Json
        }
        Returns: string
      }
      record_webhook_stage: {
        Args: {
          p_status: string
          p_handler_name?: string
          p_execution_time_ms?: number
          p_database_queries?: number
          p_api_calls?: number
          p_error_message?: string
          p_retry_attempt?: number
          p_metadata?: Json
          p_stripe_event_id: string
          p_event_type: string
          p_stage: string
        }
        Returns: string
      }
      schedule_function_warmup: {
        Args: {
          p_strategy?: string
          p_function_name: string
          p_frequency?: number
        }
        Returns: undefined
      }
      send_to_dead_letter_queue: {
        Args: {
          p_requires_manual_review?: boolean
          p_error_stack?: string
          p_error_message?: string
          p_failure_reason: string
          p_event_data: Json
          p_event_type: string
          p_stripe_event_id: string
        }
        Returns: string
      }
      should_trigger_rollback: {
        Args: { p_migration_id: string }
        Returns: boolean
      }
      sync_admin_users_to_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      toggle_global_item_favorite: {
        Args: { global_item_id: string }
        Returns: boolean
      }
      update_daily_cost_metrics: {
        Args: {
          p_function_invocations?: number
          p_bandwidth_usage_gb?: number
          p_date?: string
        }
        Returns: undefined
      }
      update_item_last_used: {
        Args: { item_id: string }
        Returns: undefined
      }
      update_migration_performance_benchmarks: {
        Args: { p_migration_id: string }
        Returns: undefined
      }
      update_onboarding_progress: {
        Args: { mark_completed?: boolean; progress_data: Json }
        Returns: undefined
      }
      update_performance_baseline: {
        Args: {
          p_baseline_type: string
          p_baseline_value: number
          p_sample_size?: number
          p_measurement_unit: string
          p_function_name: string
          p_environment: string
        }
        Returns: undefined
      }
      update_security_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_webhook_benchmarks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_cost_targets: {
        Args: { p_validation_id: string }
        Returns: Json
      }
      verify_admin_access: {
        Args: { check_user_id?: string }
        Returns: {
          last_login: string
          user_email: string
          is_valid: boolean
          error_code: string
        }[]
      }
    }
    Enums: {
      assessment_media_type:
        | "photo"
        | "video"
        | "document"
        | "audio_note"
        | "360_photo"
      assessment_overall_condition:
        | "excellent"
        | "good"
        | "fair"
        | "poor"
        | "critical"
      assessment_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "reviewed"
        | "requires_followup"
      client_status: "lead" | "active" | "inactive" | "archived"
      client_type: "residential" | "commercial"
      equipment_category:
        | "mowing"
        | "landscaping"
        | "irrigation"
        | "soil_care"
        | "tree_care"
        | "cleanup"
        | "specialized"
        | "safety"
      irrigation_status:
        | "none"
        | "excellent"
        | "good"
        | "needs_repair"
        | "outdated"
        | "broken"
      lawn_condition: "pristine" | "healthy" | "patchy" | "poor" | "dead"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      property_access: "easy" | "moderate" | "difficult" | "gate_required"
      property_type: "residential" | "commercial" | "municipal" | "industrial"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "converted"
      soil_condition:
        | "excellent"
        | "good"
        | "compacted"
        | "sandy"
        | "clay"
        | "contaminated"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assessment_media_type: [
        "photo",
        "video",
        "document",
        "audio_note",
        "360_photo",
      ],
      assessment_overall_condition: [
        "excellent",
        "good",
        "fair",
        "poor",
        "critical",
      ],
      assessment_status: [
        "scheduled",
        "in_progress",
        "completed",
        "reviewed",
        "requires_followup",
      ],
      client_status: ["lead", "active", "inactive", "archived"],
      client_type: ["residential", "commercial"],
      equipment_category: [
        "mowing",
        "landscaping",
        "irrigation",
        "soil_care",
        "tree_care",
        "cleanup",
        "specialized",
        "safety",
      ],
      irrigation_status: [
        "none",
        "excellent",
        "good",
        "needs_repair",
        "outdated",
        "broken",
      ],
      lawn_condition: ["pristine", "healthy", "patchy", "poor", "dead"],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      property_access: ["easy", "moderate", "difficult", "gate_required"],
      property_type: ["residential", "commercial", "municipal", "industrial"],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "converted",
      ],
      soil_condition: [
        "excellent",
        "good",
        "compacted",
        "sandy",
        "clay",
        "contaminated",
      ],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const

