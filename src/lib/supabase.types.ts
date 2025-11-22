export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'user' | 'admin' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'user' | 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'user' | 'admin' | 'super_admin'
          updated_at?: string
        }
      }
      parking_slots: {
        Row: {
          id: string
          name: string
          latitude: number
          longitude: number
          address: string | null
          status: 'Available' | 'Reserved' | 'Occupied'
          type: 'Car' | 'Bike' | 'SUV' | 'Minivan' | 'Truck'
          price_per_hour: number
          features: string[] | null
          operating_hours: string | null
          rating: number | null
          reviews: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          latitude: number
          longitude: number
          address?: string | null
          status?: 'Available' | 'Reserved' | 'Occupied'
          type: 'Car' | 'Bike' | 'SUV' | 'Minivan' | 'Truck'
          price_per_hour: number
          features?: string[] | null
          operating_hours?: string | null
          rating?: number | null
          reviews?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          latitude?: number
          longitude?: number
          address?: string | null
          status?: 'Available' | 'Reserved' | 'Occupied'
          type?: 'Car' | 'Bike' | 'SUV' | 'Minivan' | 'Truck'
          price_per_hour?: number
          features?: string[] | null
          operating_hours?: string | null
          rating?: number | null
          reviews?: number | null
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          slot_id: string
          start_time: string
          end_time: string
          total_cost: number
          status: 'Active' | 'Completed' | 'Cancelled'
          payment_method: 'Card' | 'bKash' | 'Nagad' | 'Rocket' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slot_id: string
          start_time: string
          end_time: string
          total_cost: number
          status?: 'Active' | 'Completed' | 'Cancelled'
          payment_method?: 'Card' | 'bKash' | 'Nagad' | 'Rocket' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          end_time?: string
          total_cost?: number
          status?: 'Active' | 'Completed' | 'Cancelled'
          updated_at?: string
        }
      }
      saved_payment_methods: {
        Row: {
          id: string
          user_id: string
          type: 'Card' | 'bKash' | 'Nagad' | 'Rocket'
          cardholder_name: string | null
          last4: string | null
          expiry_date: string | null
          account_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'Card' | 'bKash' | 'Nagad' | 'Rocket'
          cardholder_name?: string | null
          last4?: string | null
          expiry_date?: string | null
          account_number?: string | null
          created_at?: string
        }
        Update: {
          cardholder_name?: string | null
          last4?: string | null
          expiry_date?: string | null
          account_number?: string | null
        }
      }
      system_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details: string
          created_at?: string
        }
        Update: never
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
  }
}
