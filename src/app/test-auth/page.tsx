'use client'

import { useSimpleAuth } from '@/hooks/useSimpleAuth'

export default function TestAuthPage() {
  const { user, loading, error } = useSimpleAuth()

  if (loading) {
    return <div className="p-8">Loading authentication...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-sm text-gray-600">
          Check the browser console for more details.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      {user ? (
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-green-800">✅ User Authenticated</h2>
          <p className="text-green-700">User ID: {user.id}</p>
          <p className="text-green-700">Email: {user.email}</p>
        </div>
      ) : (
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-blue-800">ℹ️ No User Session</h2>
          <p className="text-blue-700">No authenticated user found. This is normal for anonymous users.</p>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({ 
            hasUser: !!user,
            loading,
            error,
            timestamp: new Date().toISOString()
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}