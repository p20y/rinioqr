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
    const exchangeSession = async () => {
      const code = searchParams.get('code')
      if (!code) {
        setError('Missing authentication code. Please try signing in again.')
        return
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        setError(exchangeError.message)
        return
      }

      router.replace(safeRedirectTo)
    }

    exchangeSession()
  }, [router, searchParams, safeRedirectTo])

  return (
    <div className="w-full max-w-md text-center space-y-4">
      <div className="flex justify-center">
        <QrCode className="h-12 w-12 text-blue-600" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900">Signing you in</h1>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finalizing your session...
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
