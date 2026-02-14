
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
            products: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    asin: string
                    image_url: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    asin: string
                    image_url?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    asin?: string
                    image_url?: string | null
                    is_active?: boolean
                }
            }
        }
    }
}
