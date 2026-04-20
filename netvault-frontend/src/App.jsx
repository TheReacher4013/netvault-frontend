import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import PageTransition from './components/ui/PageTransition'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AcceptInvite from './pages/auth/AcceptInvite'

import Dashboard from './pages/Dashboard'

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
import CompanySettings from './pages/settings/CompanySettings'
import ActivityLog from './pages/settings/ActivityLog'

import TenantList from './pages/superadmin/TenantList'
import TenantDetail from './pages/superadmin/TenantDetail'
import CreateTenant from './pages/superadmin/CreateTenant'
import PlanManagement from './pages/superadmin/PlanManagement'
import AllDomains from './pages/superadmin/AllDomains'
import AllClients from './pages/superadmin/AllClients'
import PendingApprovals from './pages/superadmin/PendingApprovals'

import PlanStatusGuard from './routes/PlanStatusGuard'

import ClientPortalLayout from './pages/client-portal/ClientPortalLayout'
import ClientOverview from './pages/client-portal/Overview'
import {
  ClientDomains, ClientHosting, ClientInvoicesList, ClientInvoiceDetail,
  ClientAlerts, ClientProfile as ClientPortalProfile,
} from './pages/client-portal/ClientPages'

import DomainAvailability from './pages/tools/DomainAvailability'
import PasswordGenerator from './pages/tools/PasswordGenerator'
import NotFound from './pages/NotFound'

export default function App() {
  const { loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ background: 'var(--nv-bg, #0A0B0F)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--nv-accent, #6366F1)', borderTopColor: 'transparent' }} />
          <p className="font-mono text-sm" style={{ color: 'var(--nv-muted)' }}>Loading NetVault...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ── Public ─────────────────────────────────────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password/:token" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/accept-invite/:token" element={<PageTransition><AcceptInvite /></PageTransition>} />

        {/* ── Client Portal ─────────────────────────────────────── */}
        {/* Clients bypass PlanStatusGuard — they access their data via
            /api/client-portal/* which has its own scoping */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={['client']} fallback="/dashboard"><ClientPortalLayout /></RoleRoute>}>
            <Route path="/client-portal" element={<PageTransition><ClientOverview /></PageTransition>} />
            <Route path="/client-portal/domains" element={<PageTransition><ClientDomains /></PageTransition>} />
            <Route path="/client-portal/hosting" element={<PageTransition><ClientHosting /></PageTransition>} />
            <Route path="/client-portal/invoices" element={<PageTransition><ClientInvoicesList /></PageTransition>} />
            <Route path="/client-portal/invoices/:id" element={<PageTransition><ClientInvoiceDetail /></PageTransition>} />
            <Route path="/client-portal/alerts" element={<PageTransition><ClientAlerts /></PageTransition>} />
            <Route path="/client-portal/profile" element={<PageTransition><ClientPortalProfile /></PageTransition>} />
          </Route>
        </Route>

        {/* ── Admin / Staff / SuperAdmin-----*/}
        <Route element={<ProtectedRoute />}>
          <Route element={
            <PlanStatusGuard>
              <Layout />
            </PlanStatusGuard>
          }>
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />

            {/* Domains */}
            <Route path="/domains" element={<PageTransition><DomainList /></PageTransition>} />
            <Route path="/domains/add" element={<PageTransition><AddDomain /></PageTransition>} />
            <Route path="/domains/:id" element={<PageTransition><DomainDetail /></PageTransition>} />
            <Route path="/domains/:id/dns" element={<PageTransition><DNSManager /></PageTransition>} />

            {/* Hosting */}
            <Route path="/hosting" element={<PageTransition><HostingList /></PageTransition>} />
            <Route path="/hosting/add" element={<PageTransition><AddHosting /></PageTransition>} />
            <Route path="/hosting/:id" element={<PageTransition><HostingDetail /></PageTransition>} />

            {/* Clients */}
            <Route path="/clients" element={<PageTransition><ClientList /></PageTransition>} />
            <Route path="/clients/:id" element={<PageTransition><ClientProfile /></PageTransition>} />
            <Route path="/clients/:id/vault" element={<PageTransition><CredentialVault /></PageTransition>} />

            {/* Billing */}
            <Route path="/billing" element={<PageTransition><InvoiceList /></PageTransition>} />
            <Route path="/billing/create" element={<PageTransition><CreateInvoice /></PageTransition>} />
            <Route path="/billing/:id" element={<PageTransition><InvoiceDetail /></PageTransition>} />

            {/* Reports */}
            <Route path="/reports/renewals" element={<PageTransition><RenewalReport /></PageTransition>} />
            <Route path="/reports/revenue" element={<PageTransition><RevenueReport /></PageTransition>} />

            {/* System */}
            <Route path="/uptime" element={<PageTransition><UptimeMonitor /></PageTransition>} />
            <Route path="/alerts" element={<PageTransition><AlertCenter /></PageTransition>} />

            {/* Tools */}
            <Route path="/tools/availability" element={<PageTransition><DomainAvailability /></PageTransition>} />
            <Route path="/tools/password" element={<PageTransition><PasswordGenerator /></PageTransition>} />

            {/* Settings */}
            <Route path="/settings/profile" element={<PageTransition><ProfileSettings /></PageTransition>} />
            <Route path="/settings/company" element={<PageTransition><CompanySettings /></PageTransition>} />
            <Route path="/settings/users"
              element={<RoleRoute roles={['admin', 'superAdmin']}>
                <PageTransition><UserManagement /></PageTransition></RoleRoute>} />
            <Route path="/settings/activity-log"
              element={<RoleRoute roles={['admin', 'superAdmin']}>
                <PageTransition><ActivityLog /></PageTransition></RoleRoute>} />

            {/* Super Admin */}
            <Route path="/super-admin/tenants"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><TenantList /></PageTransition></RoleRoute>} />
            <Route path="/super-admin/tenants/create"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><CreateTenant /></PageTransition></RoleRoute>} />
            <Route path="/super-admin/tenants/:id"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><TenantDetail /></PageTransition></RoleRoute>} />
            <Route path="/super-admin/plans"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><PlanManagement /></PageTransition></RoleRoute>} />
            <Route path="/super-admin/domains"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><AllDomains /></PageTransition></RoleRoute>} />
            <Route path="/super-admin/clients"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><AllClients /></PageTransition></RoleRoute>} />


            <Route path="/super-admin/alerts"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><AlertCenter /></PageTransition></RoleRoute>} />

            <Route path="/super-admin/pending"
              element={<RoleRoute roles={['superAdmin']}>
                <PageTransition><PendingApprovals /></PageTransition></RoleRoute>} />

          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}