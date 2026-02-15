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
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    let mounted = true

    const handleCallback = async () => {
      try {
        setDebugInfo('🔄 Starting OAuth callback...')
        console.log('🔄 Starting OAuth callback...')

        // APPROACH 0: Check if Supabase already handled auth (automatic session)
        console.log('🔄 Checking if session already exists...')
        setDebugInfo('🔄 Checking for existing session...')

        const { data: { session: existingSession }, error: sessionCheckError } = await supabase.auth.getSession()

        console.log('Session check result:', {
          hasSession: !!existingSession,
          user: existingSession?.user?.email,
          error: sessionCheckError
        })

        if (existingSession) {
          console.log('✅ Found existing session! User:', existingSession.user.email)
          setDebugInfo('✅ Session already established!')
          window.location.href = safeRedirectTo
          return
        }

        console.log('❌ No existing session found, checking URL for auth data...')

        // APPROACH 1: Try PKCE flow (code in query params) with timeout
        const code = searchParams.get('code')
        console.log('📋 Authorization code:', code ? 'present' : 'missing')
        setDebugInfo(code ? '📋 Authorization code found' : '📋 No code, checking for tokens...')

        if (code) {
          console.log('🔄 Attempting PKCE flow with 5s timeout...')
          setDebugInfo('🔄 Exchanging code for session (PKCE)...')

          try {
            // Add timeout to prevent hanging
            const exchangePromise = supabase.auth.exchangeCodeForSession(code)
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('PKCE timeout after 5s')), 5000)
            )

            const result = await Promise.race([exchangePromise, timeoutPromise]) as any

            if (!mounted) return

            if (result?.error) {
              console.error('❌ PKCE exchange failed:', result.error)
              setDebugInfo('❌ PKCE failed, trying other methods...')
            } else {
              console.log('✅ PKCE success! User:', result?.data?.user?.email)
              setDebugInfo('✅ Session established via PKCE')

              const { data: { session } } = await supabase.auth.getSession()
              if (session) {
                console.log('🚀 Redirecting to:', safeRedirectTo)
                window.location.href = safeRedirectTo
                return
              }
            }
          } catch (pkceError) {
            console.error('❌ PKCE error/timeout:', pkceError)
            setDebugInfo('❌ PKCE timeout, trying implicit flow...')
          }
        }

        // APPROACH 2: Try Implicit flow (tokens in URL hash)
        console.log('🔄 Attempting implicit flow...')
        setDebugInfo('🔄 Checking for tokens in URL hash...')

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        console.log('🔑 Tokens in hash:', {
          access: accessToken ? 'present' : 'missing',
          refresh: refreshToken ? 'present' : 'missing'
        })

        if (accessToken && refreshToken) {
          console.log('🔄 Setting session with hash tokens...')
          setDebugInfo('🔄 Setting session with tokens...')

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (!mounted) return

          if (sessionError) {
            console.error('❌ Failed to set session:', sessionError)
            setError(sessionError.message)
            setTimeout(() => router.push('/login'), 2000)
            return
          }

          console.log('✅ Implicit flow success! User:', data?.user?.email)
          setDebugInfo('✅ Session established via implicit flow')

          // Redirect with hard reload to ensure cookies are set
          console.log('🚀 Redirecting to:', safeRedirectTo)
          window.location.href = safeRedirectTo
          return
        }

        // APPROACH 3: Check if we already have a session (edge case)
        console.log('🔄 Checking existing session...')
        setDebugInfo('🔄 Checking for existing session...')

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (session && !sessionError) {
          console.log('✅ Found existing session! User:', session.user.email)
          setDebugInfo('✅ Existing session found')
          window.location.href = safeRedirectTo
          return
        }

        // No session found via any method
        console.error('❌ No session established via any method')
        console.log('Debug info:', {
          code: code ? 'present' : 'missing',
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          existingSession: session ? 'present' : 'missing'
        })

        setError('Failed to establish session. Please try signing in again.')
        setTimeout(() => router.push('/login'), 3000)

      } catch (err) {
        console.error('❌ Callback error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred')
          setTimeout(() => router.push('/login'), 3000)
        }
      }
    }

    handleCallback()

    return () => {
      mounted = false
    }
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
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {debugInfo || 'Setting up your session...'}
          </div>
          <p className="text-xs text-gray-400">
            Check console for detailed logs
          </p>
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
