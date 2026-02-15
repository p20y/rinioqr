'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthDebugPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const checkAuth = async () => {
      // Get current URL info
      const url = window.location.href
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const searchParams = new URLSearchParams(window.location.search)

      // Get session
      const { data: { session }, error } = await supabase.auth.getSession()

      // Get user
      const { data: { user } } = await supabase.auth.getUser()

      // Check cookies
      const cookies = document.cookie

      setInfo({
        url,
        search: Object.fromEntries(searchParams.entries()),
        hash: Object.fromEntries(hashParams.entries()),
        session: session ? {
          user: session.user.email,
          expiresAt: session.expires_at
        } : null,
        user: user ? user.email : null,
        error: error?.message,
        cookies: cookies.split(';').filter(c => c.includes('sb-'))
      })
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
        <pre className="bg-white p-4 rounded border overflow-auto">
          {JSON.stringify(info, null, 2)}
        </pre>

        <div className="mt-4 space-x-4">
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
