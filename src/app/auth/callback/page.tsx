'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, QrCode } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const safeRedirectTo = redirectTo?.startsWith('/') ? redirectTo : '/seller'
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The Supabase client will automatically handle the OAuth callback
        // and set the session from URL fragments or query params

        // Check if we have a code in the URL (PKCE flow)
        const code = searchParams.get('code')

        if (code) {
          // Exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError)
            setError(exchangeError.message)
            return
          }
        }

        // Wait a moment for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if we now have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.error('No session after callback:', sessionError)
          setError('Failed to establish session. Please try signing in again.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        console.log('✅ Session established for:', session.user.email)

        // Redirect to the intended destination
        router.push(safeRedirectTo)
      } catch (err) {
        console.error('Callback error:', err)
        setError('An unexpected error occurred. Please try again.')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    handleCallback()
  }, [router, searchParams, safeRedirectTo])

  return (
    <div className="w-full max-w-md text-center space-y-4">
      <div className="flex justify-center">
        <QrCode className="h-12 w-12 text-blue-600" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900">
        {error ? 'Sign In Failed' : 'Signing you in'}
      </h1>
      {error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-gray-500">Redirecting to login...</p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Setting up your session...
        </div>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <QrCode className="h-12 w-12 text-blue-600" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading authentication...
          </div>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}
