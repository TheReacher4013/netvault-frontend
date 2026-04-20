import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ roles, children, fallback = '/dashboard' }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />
  }

  return children
}
