import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../context/AuthContext'
import DashboardChatbot from '../DashboardChatbot'
import AnnouncementPopup from './AnnouncementPopup'
// import TrialBanner from './TrialBanner'
import TrialPopup from './TrialPopup'   // ← new

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, user } = useAuth()
  const isSuperAdmin = user?.role === 'superAdmin'

  return (
    <div className="min-h-screen flex" style={{ background: theme.bg, color: theme.text }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Trial flash banner — disabled: using TrialPopup instead */}
        {/* {!isSuperAdmin && <TrialBanner />} */}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Announcement popup — shows once per session for non-superAdmin */}
      <AnnouncementPopup />

      {/*
             * TrialPopup — shows once per session while on active trial.
             * Displays profile + subscription nudge if profile is incomplete,
             * or subscription-only nudge if profile is already done.
             * NOT shown when trial has expired (PlanStatusGuard handles that).
             */}
      {!isSuperAdmin && <TrialPopup />}

      {/* AI Help Chatbot */}
      {!isSuperAdmin && <DashboardChatbot />}
    </div>
  )
}