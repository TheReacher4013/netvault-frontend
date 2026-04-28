import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../context/AuthContext'
import DashboardChatbot from '../DashboardChatbot'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useAuth()

  return (
    <div className="min-h-screen flex" style={{ background: theme.bg, color: theme.text }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Dashboard AI Help Chatbot */}
      <DashboardChatbot />
    </div>
  )
}