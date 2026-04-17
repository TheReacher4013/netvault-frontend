// src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import PageTransition from './components/ui/PageTransition'

// ── Auth pages ────────────────────────────────────────────────────────────
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// ── Shared dashboard (role-aware — routes to SuperAdminDashboard or AdminDashboard) ─
import Dashboard from './pages/Dashboard'

// ── Admin/Staff pages ─────────────────────────────────────────────────────
import DomainList from './pages/domains/DomainList'
import DomainDetail from './pages/domains/DomainDetail'
import AddDomain from './pages/domains/AddDomain'
import DNSManager from './pages/domains/DNSManager'
import HostingList from './pages/hosting/HostingList'
import HostingDetail from './pages/hosting/HostingDetail'
import AddHosting from './pages/hosting/AddHosting'
import ClientList from './pages/clients/ClientList'
import ClientProfile from './pages/clients/ClientProfile'
import CredentialVault from './pages/clients/CredentialVault'
import InvoiceList from './pages/billing/InvoiceList'
import CreateInvoice from './pages/billing/CreateInvoice'
import InvoiceDetail from './pages/billing/InvoiceDetail'
import RenewalReport from './pages/reports/RenewalReport'
import RevenueReport from './pages/reports/RevenueReport'
import UptimeMonitor from './pages/uptime/UptimeMonitor'
import AlertCenter from './pages/alerts/AlertCenter'
import UserManagement from './pages/settings/UserManagement'
import ProfileSettings from './pages/settings/ProfileSettings'

// ── Super Admin pages ─────────────────────────────────────────────────────
import TenantList from './pages/superadmin/TenantList'
import TenantDetail from './pages/superadmin/TenantDetail'   // ← NEW
import CreateTenant from './pages/superadmin/CreateTenant'   // ← NEW
import PlanManagement from './pages/superadmin/PlanManagement'
import CompanySettings from './pages/settings/CompanySettings'
import AllDomains from './pages/superadmin/AllDomains'

// ── Other ─────────────────────────────────────────────────────────────────
import NotFound from './pages/NotFound'

export default function App() {
  const { loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ background: 'var(--nv-bg, #0B1209)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--nv-accent, #797B2D)', borderTopColor: 'transparent' }} />
          <p className="font-mono text-sm" style={{ color: 'var(--nv-muted)' }}>Loading NetVault...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ── Public routes ───────────────────────────────────────────── */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />

        {/* ── Protected routes ────────────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard — role-aware: shows SuperAdminDashboard or AdminDashboard */}
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />

            {/* ── Domain routes (admin/staff) ──────────────────────── */}
            <Route path="/domains" element={<PageTransition><DomainList /></PageTransition>} />
            <Route path="/domains/add" element={<PageTransition><AddDomain /></PageTransition>} />
            <Route path="/domains/:id" element={<PageTransition><DomainDetail /></PageTransition>} />
            <Route path="/domains/:id/dns" element={<PageTransition><DNSManager /></PageTransition>} />

            {/* ── Hosting routes ───────────────────────────────────── */}
            <Route path="/hosting" element={<PageTransition><HostingList /></PageTransition>} />
            <Route path="/hosting/add" element={<PageTransition><AddHosting /></PageTransition>} />
            <Route path="/hosting/:id" element={<PageTransition><HostingDetail /></PageTransition>} />

            {/* ── Client routes ────────────────────────────────────── */}
            <Route path="/clients" element={<PageTransition><ClientList /></PageTransition>} />
            <Route path="/clients/:id" element={<PageTransition><ClientProfile /></PageTransition>} />
            <Route path="/clients/:id/vault" element={<PageTransition><CredentialVault /></PageTransition>} />

            {/* ── Billing routes ───────────────────────────────────── */}
            <Route path="/billing" element={<PageTransition><InvoiceList /></PageTransition>} />
            <Route path="/billing/create" element={<PageTransition><CreateInvoice /></PageTransition>} />
            <Route path="/billing/:id" element={<PageTransition><InvoiceDetail /></PageTransition>} />

            {/* ── Report routes ────────────────────────────────────── */}
            <Route path="/reports/renewals" element={<PageTransition><RenewalReport /></PageTransition>} />
            <Route path="/reports/revenue" element={<PageTransition><RevenueReport /></PageTransition>} />

            {/* ── System routes ────────────────────────────────────── */}
            <Route path="/uptime" element={<PageTransition><UptimeMonitor /></PageTransition>} />
            <Route path="/alerts" element={<PageTransition><AlertCenter /></PageTransition>} />

            {/* ── Settings ─────────────────────────────────────────── */}
            <Route path="/settings/profile" element={<PageTransition><ProfileSettings /></PageTransition>} />
            <Route path="/settings/users"
              element={
                <RoleRoute roles={['admin', 'superAdmin']}>
                  <PageTransition><UserManagement /></PageTransition>
                </RoleRoute>
              }
            />

            {/* ── Super Admin only ──────────────────────────────────── */}
            <Route path="/super-admin/tenants"
              element={
                <RoleRoute roles={['superAdmin']}>
                  <PageTransition><TenantList /></PageTransition>
                </RoleRoute>
              }
            />
            <Route path="/super-admin/tenants/create"
              element={
                <RoleRoute roles={['superAdmin']}>
                  <PageTransition><CreateTenant /></PageTransition>    {/* ← NEW */}
                </RoleRoute>
              }
            />
            <Route path="/super-admin/tenants/:id"
              element={
                <RoleRoute roles={['superAdmin']}>
                  <PageTransition><TenantDetail /></PageTransition>    {/* ← NEW */}
                </RoleRoute>
              }
            />
            <Route path="/super-admin/plans"
              element={
                <RoleRoute roles={['superAdmin']}>
                  <PageTransition><PlanManagement /></PageTransition>
                </RoleRoute>
              }
            />

            {/* Cross-tenant views for SuperAdmin — reuses existing list pages
                with superAdmin-scoped data from new API endpoints */}
            <Route path="/super-admin/domains"
              element={
                <RoleRoute roles={['superAdmin']}>
                  <PageTransition><DomainList superAdminMode /></PageTransition>
                </RoleRoute>
              }
            />
            <Route path="/super-admin/clients"
              element={
                <RoleRoute roles={['superAdmin']}>
                  <PageTransition><ClientList superAdminMode /></PageTransition>
                </RoleRoute>
              }
            />
            <Route path="/settings/company" element={<PageTransition><CompanySettings /></PageTransition>} />
            <Route path="/super-admin/domains" element={<RoleRoute roles={['superAdmin']}><PageTransition><AllDomains /></PageTransition></RoleRoute>} />
            
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}
