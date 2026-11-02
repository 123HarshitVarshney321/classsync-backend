import { Navigate } from 'react-router'
import { useAuth } from './AuthContext.jsx'
import Loading from '../components/Loading.jsx'
import NotAllowedPage from '../pages/NotAllowedPage.jsx'

export default function RequireRole({ allowedRoles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Restoring session..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotAllowedPage />
  }

  return children
}
