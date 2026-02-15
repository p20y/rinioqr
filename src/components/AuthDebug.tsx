'use client'

import { useAuth } from '@/contexts/AuthContext'

export function AuthDebug() {
  const { user, userMetadata, loading } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? '✅ Yes' : '❌ No'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌ null'}</div>
        <div>Metadata: {userMetadata ? `✅ ${userMetadata.email}` : '❌ null'}</div>
        {userMetadata && (
          <>
            <div>Plan: {userMetadata.subscription_status}</div>
            <div>Products: {userMetadata.current_product_count}/{userMetadata.product_limit}</div>
          </>
        )}
      </div>
    </div>
  )
}
