import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const PUBLIC_PATHS = [
  '/otp/',
  '/invite/',
  '/plans',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/coupons/validate',
]

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong'
    const status = err.response?.status
    const url = err.config?.url || ''
    const isPublic = PUBLIC_PATHS.some(p => url.includes(p))

    if (status === 401 && !isPublic) {
      localStorage.removeItem('nv_token')
      window.location.href = '/login'
      return Promise.reject(err)
    }
    if (status !== 404) toast.error(msg)
    return Promise.reject(err)
  }
)

export default api

export const authService = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword: (token, d) => api.post(`/auth/reset-password/${token}`, d),
  changePassword: (d) => api.patch('/auth/change-password', d),
}

export const twoFactorService = {
  setup: () => api.post('/auth/2fa/setup'),
  verifySetup: (code) => api.post('/auth/2fa/verify-setup', { code }),
  disable: (password) => api.post('/auth/2fa/disable', { password }),
  verifyLogin: (tempToken, code) => api.post('/auth/2fa/verify-login', { tempToken, code }),
}

export const whoisService = {
  checkAvailability: (name) => api.get('/whois/availability', { params: { name } }),
  lookup: (name) => api.get('/whois/lookup', { params: { name } }),
  refresh: (id) => api.post(`/whois/refresh/${id}`),
}

export const activityService = {
  getAll: (params) => api.get('/activity', { params }),
  getEntityTimeline: (type, id) => api.get(`/activity/entity/${type}/${id}`),
  deleteMany: (ids) => api.delete('/activity', { data: { ids } }),
}

export const clientPortalService = {
  overview: () => api.get('/client-portal/overview'),
  domains: () => api.get('/client-portal/domains'),
  hosting: () => api.get('/client-portal/hosting'),
  invoices: (params) => api.get('/client-portal/invoices', { params }),
  invoice: (id) => api.get(`/client-portal/invoices/${id}`),
  downloadInvoice: (id) => api.get(`/client-portal/invoices/${id}/pdf`, { responseType: 'blob' }),
  alerts: () => api.get('/client-portal/alerts'),
}

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
  checkNow: (id) => api.post(`/domains/${id}/check`),
}

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
  sendInvite: (id) => api.post(`/clients/${id}/invite`),
  revokePortalAccess: (id) => api.delete(`/clients/${id}/portal-access`),
}

export const billingService = {
  getAll: (params) => api.get('/billing/invoices', { params }),
  getOne: (id) => api.get(`/billing/invoices/${id}`),
  create: (d) => api.post('/billing/invoices', d),
  updateStatus: (id, s) => api.patch(`/billing/invoices/${id}/status`, { status: s }),
  downloadPDF: (id) => api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
  remove: (id) => api.delete(`/billing/invoices/${id}`),
  getSummary: () => api.get('/billing/summary'),
}

// System alerts (auto-generated by cron/events) — shown in Alert Center
export const alertService = {
  getAll: (params) => api.get('/alerts', { params }),
  markRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.patch('/alerts/read-all'),
  remove: (id) => api.delete(`/alerts/${id}`),
}

// Broadcast notifications (admin-sent to roles) — managed in Notifications page
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
}

// Aliases used by NotificationPage, AnnouncementsPage, ReportsPage
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  create: (d) => api.post('/notifications', d),
  update: (id, d) => api.put(`/notifications/${id}`, d),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
}

export const announcementAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  getOne: (id) => api.get(`/announcements/${id}`),
  create: (d) => api.post('/announcements', d),
  update: (id, d) => api.put(`/announcements/${id}`, d),
  remove: (id) => api.delete(`/announcements/${id}`),
  publish: (id) => api.patch(`/announcements/${id}/publish`),
}

export const reportAPI = {
  getAll: (params) => api.get('/reports', { params }),
  create: (d) => api.post('/reports', d),
  update: (id, d) => api.put(`/reports/${id}`, d),
  remove: (id) => api.delete(`/reports/${id}`),
  regenerate: (id) => api.post(`/reports/${id}/regenerate`),
}

export const reportDataAPI = {
  getSuperAdminSummary: () => api.get('/report-data/superadmin-summary'),
  getAdminSummary: () => api.get('/report-data/admin-summary'),
  getEmailSchedule: () => api.get('/report-data/email-schedule'),
  saveEmailSchedule: (d) => api.post('/report-data/email-schedule', d),
  testEmailSchedule: () => api.post('/report-data/email-schedule/test'),
}

export const reportService = {
  getRenewals: (days) => api.get('/reports/renewals', { params: { days } }),
  getRevenue: (months) => api.get('/reports/revenue', { params: { months } }),
  getStatusOverview: () => api.get('/reports/status-overview'),
  getClientReport: (id) => api.get(`/reports/client/${id}`),
}

export const uptimeService = {
  getLiveStatus: () => api.get('/uptime/status'),
  getSummary: () => api.get('/uptime/summary'),
  getLogs: (id) => api.get(`/uptime/logs/${id}`),
}

export const userService = {
  getAll: () => api.get('/users'),
  add: (d) => api.post('/users', d),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  remove: (id) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (d) => api.put('/users/profile', d),
}

export const superAdminService = {
  getStats: () => api.get('/super-admin/stats'),
  getTenants: (params) => api.get('/super-admin/tenants', { params }),
  getTenant: (id) => api.get(`/super-admin/tenants/${id}`),
  createTenant: (d) => api.post('/super-admin/tenants', d),
  updateTenantPlan: (id, d) => api.patch(`/super-admin/tenants/${id}/plan`, d),
  toggleTenant: (id) => api.patch(`/super-admin/tenants/${id}/toggle`),
  deleteTenant: (id) => api.delete(`/super-admin/tenants/${id}`),
  getAllDomains: (params) => api.get('/super-admin/domains', { params }),
  getAllClients: (params) => api.get('/super-admin/clients', { params }),
  getPlans: () => api.get('/super-admin/plans'),
  createPlan: (d) => api.post('/super-admin/plans', d),
  updatePlan: (id, d) => api.put(`/super-admin/plans/${id}`, d),
  deletePlan: (id) => api.delete(`/super-admin/plans/${id}`),
  getPendingTenants: () => api.get('/super-admin/pending-tenants'),
  approveTenant: (id) => api.post(`/super-admin/tenants/${id}/approve`),
  rejectTenant: (id, reason) => api.post(`/super-admin/tenants/${id}/reject`, { reason }),
  getEmailTemplates: () => api.get('/super-admin/email-templates'),
  getEmailTemplate: (id) => api.get(`/super-admin/email-templates/${id}`),
  updateEmailTemplate: (id, data) => api.put(`/super-admin/email-templates/${id}`, data),
  resetEmailTemplate: (id) => api.post(`/super-admin/email-templates/${id}/reset`),
  sendEmailTemplatePreview: (id, data) => api.post(`/super-admin/email-templates/${id}/preview`, data),
}

export const inviteService = {
  verify: (token) => api.get(`/invite/verify/${token}`),
  accept: (token, password) => api.post(`/invite/accept/${token}`, { password }),
}

export const otpService = {
  send: (email) => api.post('/otp/send', { email }),
  verify: (email, code) => api.post('/otp/verify', { email, code }),
}

export const tenantService = {
  getStatus: () => api.get('/tenant/status'),
}