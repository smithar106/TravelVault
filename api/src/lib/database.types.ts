export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          travelvault_email: string
          created_at: string
          subscription_status: 'free' | 'pro'
          subscription_expires_at: string | null
          quiz_completed: boolean
          acquisition_source: string | null
        }
        Insert: {
          id: string
          email: string
          travelvault_email: string
          created_at?: string
          subscription_status?: 'free' | 'pro'
          subscription_expires_at?: string | null
          quiz_completed?: boolean
          acquisition_source?: string | null
        }
        Update: {
          id?: string
          email?: string
          travelvault_email?: string
          created_at?: string
          subscription_status?: 'free' | 'pro'
          subscription_expires_at?: string | null
          quiz_completed?: boolean
          acquisition_source?: string | null
        }
      }
      travel_profiles: {
        Row: {
          id: string
          user_id: string
          travel_style_tags: string[]
          preferred_accommodation: 'budget' | 'boutique' | 'luxury'
          trip_pace: 'relaxed' | 'moderate' | 'packed'
          interests: string[]
          total_trips: number
          countries_visited: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          travel_style_tags?: string[]
          preferred_accommodation?: 'budget' | 'boutique' | 'luxury'
          trip_pace?: 'relaxed' | 'moderate' | 'packed'
          interests?: string[]
          total_trips?: number
          countries_visited?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          travel_style_tags?: string[]
          preferred_accommodation?: 'budget' | 'boutique' | 'luxury'
          trip_pace?: 'relaxed' | 'moderate' | 'packed'
          interests?: string[]
          total_trips?: number
          countries_visited?: string[]
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          name: string
          destination_city: string
          destination_country: string
          departure_date: string
          return_date: string
          status: 'upcoming' | 'active' | 'completed'
          cover_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          destination_city: string
          destination_country: string
          departure_date: string
          return_date: string
          status?: 'upcoming' | 'active' | 'completed'
          cover_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          destination_city?: string
          destination_country?: string
          departure_date?: string
          return_date?: string
          status?: 'upcoming' | 'active' | 'completed'
          cover_image_url?: string | null
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          booking_type: 'flight' | 'hotel' | 'car' | 'activity' | 'other'
          raw_email: string
          parsed_data: Record<string, unknown>
          confirmation_number: string
          provider_name: string
          starts_at: string
          ends_at: string
          location: string | null
          status: 'confirmed' | 'cancelled'
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          booking_type: 'flight' | 'hotel' | 'car' | 'activity' | 'other'
          raw_email: string
          parsed_data: Record<string, unknown>
          confirmation_number: string
          provider_name: string
          starts_at: string
          ends_at: string
          location?: string | null
          status?: 'confirmed' | 'cancelled'
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          booking_type?: 'flight' | 'hotel' | 'car' | 'activity' | 'other'
          raw_email?: string
          parsed_data?: Record<string, unknown>
          confirmation_number?: string
          provider_name?: string
          starts_at?: string
          ends_at?: string
          location?: string | null
          status?: 'confirmed' | 'cancelled'
        }
      }
      destination_guides: {
        Row: {
          id: string
          trip_id: string
          city: string
          country: string
          neighborhood_tips: Record<string, unknown>
          packing_list: Record<string, unknown>
          practical_info: Record<string, unknown>
          weather_summary: string
          generated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          city: string
          country: string
          neighborhood_tips?: Record<string, unknown>
          packing_list?: Record<string, unknown>
          practical_info?: Record<string, unknown>
          weather_summary?: string
          generated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          city?: string
          country?: string
          neighborhood_tips?: Record<string, unknown>
          packing_list?: Record<string, unknown>
          practical_info?: Record<string, unknown>
          weather_summary?: string
          generated_at?: string
        }
      }
      trip_ratings: {
        Row: {
          id: string
          user_id: string
          trip_id: string
          overall_rating: number
          style_tags_confirmed: string[]
          notes: string | null
          rated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trip_id: string
          overall_rating: number
          style_tags_confirmed?: string[]
          notes?: string | null
          rated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trip_id?: string
          overall_rating?: number
          style_tags_confirmed?: string[]
          notes?: string | null
          rated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          document_type: 'passport' | 'visa' | 'insurance' | 'vaccine' | 'other'
          name: string
          file_url: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_type: 'passport' | 'visa' | 'insurance' | 'vaccine' | 'other'
          name: string
          file_url: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: 'passport' | 'visa' | 'insurance' | 'vaccine' | 'other'
          name?: string
          file_url?: string
          expires_at?: string | null
        }
      }
      quiz_leads: {
        Row: {
          id: string
          email: string
          quiz_data: Record<string, unknown>
          completed_at: string
          converted_to_user: boolean
        }
        Insert: {
          id?: string
          email: string
          quiz_data: Record<string, unknown>
          completed_at?: string
          converted_to_user?: boolean
        }
        Update: {
          id?: string
          email?: string
          quiz_data?: Record<string, unknown>
          completed_at?: string
          converted_to_user?: boolean
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
