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
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          asin: string
          marketplace: string
          image_url: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          asin: string
          marketplace: string
          image_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          asin?: string
          marketplace?: string
          image_url?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      users_metadata: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          subscription_status: 'free' | 'starter' | 'pro' | 'enterprise'
          product_limit: number
          current_product_count: number
          total_scans: number
          payment_provider: 'stripe' | 'razorpay' | null
          customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          subscription_status?: 'free' | 'starter' | 'pro' | 'enterprise'
          product_limit?: number
          current_product_count?: number
          total_scans?: number
          payment_provider?: 'stripe' | 'razorpay' | null
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          subscription_status?: 'free' | 'starter' | 'pro' | 'enterprise'
          product_limit?: number
          current_product_count?: number
          total_scans?: number
          payment_provider?: 'stripe' | 'razorpay' | null
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_metadata_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          display_name: string
          product_limit: number
          price_usd: number
          price_inr: number
          stripe_price_id: string | null
          razorpay_plan_id: string | null
          features: Json | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          product_limit: number
          price_usd?: number
          price_inr?: number
          stripe_price_id?: string | null
          razorpay_plan_id?: string | null
          features?: Json | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          product_limit?: number
          price_usd?: number
          price_inr?: number
          stripe_price_id?: string | null
          razorpay_plan_id?: string | null
          features?: Json | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
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