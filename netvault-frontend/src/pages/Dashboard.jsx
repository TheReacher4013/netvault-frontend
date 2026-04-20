import { useAuth } from '../context/AuthContext'
import SuperAdminDashboard from './superadmin/SuperAdminDashboard'
import AdminDashboard from './AdminDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  if (user?.role === 'superAdmin') {
    return <SuperAdminDashboard />
  }

  return <AdminDashboard />
}
