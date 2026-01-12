import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { Navigate } from 'react-router-dom'
import type { JSX } from 'react'

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: RootState) => state.auth.accessToken)
  const isInitialized = useSelector((state: RootState) => state.auth.isInitialized)
  const isAdmin = useSelector((state: RootState) => state.auth.is_admin)

  // Wait for auth initialization before checking token
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Check if user is admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminProtectedRoute
