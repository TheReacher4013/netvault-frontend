// src/services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong'
    const status = err.response?.status

    if (status === 401) {
      localStorage.removeItem('nv_token')
      window.location.href = '/login'
      return Promise.reject(err)
    }
    if (status !== 404) toast.error(msg)
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────
export const authService = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword: (token, d) => api.post(`/auth/reset-password/${token}`, d),
  changePassword: (d) => api.patch('/auth/change-password', d),
}

// ── Domains ───────────────────────────────────────────────────────────────
export const domainService = {
  getAll: (params) => api.get('/domains', { params }),
  getOne: (id) => api.get(`/domains/${id}`),
  create: (d) => api.post('/domains', d),
  update: (id, d) => api.put(`/domains/${id}`, d),
  remove: (id) => api.delete(`/domains/${id}`),
  getExpiring: (days) => api.get('/domains/expiring', { params: { days } }),
  getStats: () => api.get('/domains/stats'),
  addDNS: (id, d) => api.post(`/domains/${id}/dns`, d),
  updateDNS: (id, rid, d) => api.put(`/domains/${id}/dns/${rid}`, d),
  deleteDNS: (id, rid) => api.delete(`/domains/${id}/dns/${rid}`),
  importCSV: (form) => api.post('/domains/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ── Hosting ───────────────────────────────────────────────────────────────
export const hostingService = {
  getAll: (params) => api.get('/hosting', { params }),
  getOne: (id) => api.get(`/hosting/${id}`),
  create: (d) => api.post('/hosting', d),
  update: (id, d) => api.put(`/hosting/${id}`, d),
  remove: (id) => api.delete(`/hosting/${id}`),
  getCredentials: (id) => api.get(`/hosting/${id}/credentials`),
  getSSLStatus: (id) => api.get(`/hosting/${id}/ssl-status`),
  getUptimeLogs: (id) => api.get(`/hosting/${id}/uptime`),
  getStats: () => api.get('/hosting/stats'),
}

// ── Clients ───────────────────────────────────────────────────────────────
export const clientService = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (d) => api.post('/clients', d),
  update: (id, d) => api.put(`/clients/${id}`, d),
  remove: (id) => api.delete(`/clients/${id}`),
  getAssets: (id) => api.get(`/clients/${id}/assets`),
  addNote: (id, d) => api.post(`/clients/${id}/notes`, d),
  addCredential: (id, d) => api.post(`/clients/${id}/credentials`, d),
  getCredentials: (id) => api.get(`/clients/${id}/credentials`),
  deleteCredential: (id, cid) => api.delete(`/clients/${id}/credentials/${cid}`),
}

// ── Billing ───────────────────────────────────────────────────────────────
export const billingService = {
  getAll: (params) => api.get('/billing/invoices', { params }),
  getOne: (id) => api.get(`/billing/invoices/${id}`),
  create: (d) => api.post('/billing/invoices', d),
  updateStatus: (id, s) => api.patch(`/billing/invoices/${id}/status`, { status: s }),
  downloadPDF: (id) => api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
  remove: (id) => api.delete(`/billing/invoices/${id}`),
  getSummary: () => api.get('/billing/summary'),
}

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
}

// ── Reports ───────────────────────────────────────────────────────────────
export const reportService = {
  getRenewals: (days) => api.get('/reports/renewals', { params: { days } }),
  getRevenue: (months) => api.get('/reports/revenue', { params: { months } }),
  getStatusOverview: () => api.get('/reports/status-overview'),
  getClientReport: (id) => api.get(`/reports/client/${id}`),
}

// ── Uptime ────────────────────────────────────────────────────────────────
export const uptimeService = {
  getLiveStatus: () => api.get('/uptime/status'),
  getSummary: () => api.get('/uptime/summary'),
  getLogs: (id) => api.get(`/uptime/logs/${id}`),
}

// ── Users ─────────────────────────────────────────────────────────────────
export const userService = {
  getAll: () => api.get('/users'),
  add: (d) => api.post('/users', d),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  remove: (id) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (d) => api.put('/users/profile', d),
}

// ── Super Admin ───────────────────────────────────────────────────────────
export const superAdminService = {
  // Platform stats — feeds SuperAdminDashboard
  getStats: () => api.get('/super-admin/stats'),

  // Company (Tenant) management
  getTenants: (params) => api.get('/super-admin/tenants', { params }),
  getTenant: (id) => api.get(`/super-admin/tenants/${id}`),
  createTenant: (d) => api.post('/super-admin/tenants', d),          // ← NEW
  updateTenantPlan: (id, d) => api.patch(`/super-admin/tenants/${id}/plan`, d),
  toggleTenant: (id) => api.patch(`/super-admin/tenants/${id}/toggle`),
  deleteTenant: (id) => api.delete(`/super-admin/tenants/${id}`),      // ← NEW

  // Cross-tenant data views
  getAllDomains: (params) => api.get('/super-admin/domains', { params }),     // ← NEW
  getAllClients: (params) => api.get('/super-admin/clients', { params }),     // ← NEW

  // Subscription plans
  getPlans: () => api.get('/super-admin/plans'),
  createPlan: (d) => api.post('/super-admin/plans', d),
  updatePlan: (id, d) => api.put(`/super-admin/plans/${id}`, d),
}
