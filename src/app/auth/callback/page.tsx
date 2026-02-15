'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK START ===')

        // Check if we already have a session (Supabase auto-handles this)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (session) {
          console.log('✅ Session found for:', session.user.email)
          setStatus('Success! Redirecting to dashboard...')

          const redirectTo = searchParams.get('redirectTo') || '/seller'
          console.log('Redirecting to:', redirectTo)

          // Use hard redirect to ensure clean state
          setTimeout(() => {
            window.location.href = redirectTo
          }, 500)
          return
        }

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setStatus(`Error: ${sessionError.message}`)
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          return
        }

        // No session - redirect to login
        console.log('❌ No session found')
        setStatus('No session found. Redirecting to login...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)

      } catch (error) {
        console.error('❌ Callback error:', error)
        setStatus('An error occurred. Redirecting to login...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4 bg-white p-8 rounded-lg shadow-lg">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-800">{status}</h1>
        <p className="text-sm text-gray-600">Please wait...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
