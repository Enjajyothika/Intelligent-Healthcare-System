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
      appointment_slots: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          is_booked: boolean | null
          slot_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          is_booked?: boolean | null
          slot_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          is_booked?: boolean | null
          slot_date?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmation_code: string | null
          created_at: string | null
          doctor_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          rescheduled_from: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_type?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          doctor_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          rescheduled_from?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_type?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          doctor_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          rescheduled_from?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profiles: {
        Row: {
          bio: string | null
          clinic_address: string | null
          clinic_phone: string | null
          consultation_fee: number | null
          created_at: string | null
          education: string | null
          experience_years: number
          full_name: string
          id: string
          is_available: boolean | null
          languages: string[] | null
          license_number: string
          phone: string | null
          profile_image: string | null
          specialization: string
          updated_at: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          bio?: string | null
          clinic_address?: string | null
          clinic_phone?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          education?: string | null
          experience_years: number
          full_name: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          license_number: string
          phone?: string | null
          profile_image?: string | null
          specialization: string
          updated_at?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          bio?: string | null
          clinic_address?: string | null
          clinic_phone?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          education?: string | null
          experience_years?: number
          full_name?: string
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          license_number?: string
          phone?: string | null
          profile_image?: string | null
          specialization?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          blood_sugar: number | null
          bmi: number | null
          created_at: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string | null
          temperature: number | null
          weight_kg: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          bmi?: number | null
          created_at?: string | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string | null
          temperature?: number | null
          weight_kg?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          bmi?: number | null
          created_at?: string | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string | null
          temperature?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_reports: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          hash: string
          id: string
          is_verified: boolean | null
          patient_id: string
          report_date: string
          report_type: string
          title: string
          updated_at: string
          uploaded_by_doctor_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          hash: string
          id?: string
          is_verified?: boolean | null
          patient_id: string
          report_date?: string
          report_type: string
          title: string
          updated_at?: string
          uploaded_by_doctor_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          hash?: string
          id?: string
          is_verified?: boolean | null
          patient_id?: string
          report_date?: string
          report_type?: string
          title?: string
          updated_at?: string
          uploaded_by_doctor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_reports_uploaded_by_doctor_id_fkey"
            columns: ["uploaded_by_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          medical_history: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medication_name: string
          notes: string | null
          patient_id: string
          prescribed_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribed_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescriptions_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prescriptions_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_access_log: {
        Row: {
          accessed_at: string
          accessed_by_type: string
          accessed_by_user_id: string
          action: string
          id: string
          ip_address: string | null
          report_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_by_type: string
          accessed_by_user_id: string
          action: string
          id?: string
          ip_address?: string | null
          report_id: string
        }
        Update: {
          accessed_at?: string
          accessed_by_type?: string
          accessed_by_user_id?: string
          action?: string
          id?: string
          ip_address?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_access_log_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "medical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment_slot: {
        Args: {
          p_doctor_id: string
          p_end_time: string
          p_notes: string
          p_patient_id: string
          p_reason: string
          p_slot_date: string
          p_start_time: string
        }
        Returns: Json
      }
      generate_file_hash: { Args: { file_content: string }; Returns: string }
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
