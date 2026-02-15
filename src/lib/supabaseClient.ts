import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create browser client - @supabase/ssr handles cookies automatically
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey)

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to get user metadata
export async function getUserMetadata(userId: string) {
  const { data } = await supabase
    .from('users_metadata')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}
