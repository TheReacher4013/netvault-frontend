// src/routes/RoleRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ✅ FIX (Bug #8): Original RoleRoute had no loading check.
 *
 * What broke:
 *   On page refresh, AuthContext fetches /auth/me asynchronously.
 *   During that fetch, `user` is null. The original code saw `!user`
 *   and immediately redirected to /dashboard — even for valid superAdmins
 *   trying to access /super-admin/tenants.
 *
 * Fix:
 *   Return null while auth is still loading. Once loading is false,
 *   evaluate the role. Only then redirect if access is truly denied.
 */
export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth()

  // Auth hasn't resolved yet — don't redirect, just render nothing
  if (loading) return null

  // Auth resolved: user is either null (not logged in) or has a role
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
