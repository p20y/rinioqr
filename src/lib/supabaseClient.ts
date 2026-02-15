import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create browser client with proper cookie handling for Next.js App Router
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    cookies: {
      get(name: string) {
        // Get cookie from document.cookie
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
      },
      set(name: string, value: string, options: any) {
        // Set cookie with proper options
        let cookie = `${name}=${value}`
        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`
        }
        if (options?.path) {
          cookie += `; path=${options.path}`
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`
        }
        document.cookie = cookie
      },
      remove(name: string, options: any) {
        // Remove cookie by setting max-age to 0
        let cookie = `${name}=; max-age=0`
        if (options?.path) {
          cookie += `; path=${options.path}`
        }
        document.cookie = cookie
      },
    },
  }
)

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
