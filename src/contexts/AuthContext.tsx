'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

// User metadata from users_metadata table
interface UserMetadata {
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

interface AuthContextType {
  user: User | null
  userMetadata: UserMetadata | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUserMetadata: () => Promise<void>
  canAddProduct: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user metadata from users_metadata table
  const fetchUserMetadata = async (userId: string, retries = 3): Promise<UserMetadata | null> => {
    try {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If no rows found and we have retries left, wait and try again
        // This handles the race condition where user is created but metadata isn't yet
        if (error.code === 'PGRST116' && retries > 0) {
          console.log(`Metadata not found for user ${userId}, retrying... (${retries} retries left)`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchUserMetadata(userId, retries - 1)
        }

        console.error('Error fetching user metadata:', error)
        return null
      }

      return data as UserMetadata
    } catch (err) {
      console.error('Error in fetchUserMetadata:', err)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserMetadata(session.user.id).then(setUserMetadata)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const metadata = await fetchUserMetadata(session.user.id)
        setUserMetadata(metadata)
      } else {
        setUserMetadata(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) return { error }

      // Wait a bit for the trigger to create metadata, then update full name
      if (data.user) {
        // Retry logic to handle race condition
        let retries = 3
        while (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const { error: updateError } = await supabase
            .from('users_metadata')
            .update({ full_name: fullName })
            .eq('id', data.user.id)

          if (!updateError) break
          retries--
        }
      }

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Sign in with Google OAuth
  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      if (redirectTo) {
        callbackUrl.searchParams.set('redirectTo', redirectTo)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      return { error }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserMetadata(null)
  }

  // Refresh user metadata (called after subscription changes)
  const refreshUserMetadata = async () => {
    if (user) {
      const metadata = await fetchUserMetadata(user.id)
      setUserMetadata(metadata)
    }
  }

  // Check if user can add more products
  const canAddProduct = (): boolean => {
    if (!userMetadata) return false
    return userMetadata.current_product_count < userMetadata.product_limit
  }

  const value = {
    user,
    userMetadata,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserMetadata,
    canAddProduct,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
