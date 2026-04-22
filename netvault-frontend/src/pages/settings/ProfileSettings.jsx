import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, authService } from '../../services/api'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, PageHeader, Input, Loader } from '../../components/ui/index'
import TwoFactorSection from './TwoFactorSection'
import { AlertTriangle, Shield, Building2, User, Lock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const fetchMyTenant = () => api.get('/tenant/me')
const updateMyTenant = (data) => api.put('/tenant/me', data)

export default function ProfileSettings() {
  const { user: contextUser, theme, logout } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('personal')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  // ── Personal profile ──────────────────────────────────────
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.me(),
    staleTime: 30_000,
  })
  const user = meData?.data?.data?.user || contextUser

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  })

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' })
    }
  }, [user?._id])

  const profileMut = useMutation({
    mutationFn: d => userService.updateProfile(d),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['me']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const pwMut = useMutation({
    mutationFn: d => authService.changePassword(d),
    onSuccess: () => {
      toast.success('Password changed')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  })

  const emailChanged = user && profile.email.trim().toLowerCase() !== user.email.toLowerCase()

  const handleSaveProfile = () => {
    if (!profile.name.trim()) return toast.error('Name is required')
    if (!/^[a-zA-Z\s]+$/.test(profile.name.trim())) return toast.error('Name should contain only letters')
    if (!profile.email.trim()) return toast.error('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return toast.error('Please enter a valid email address')
    if (profile.phone && !/^\d{10}$/.test(profile.phone.trim())) return toast.error('Mobile number must be exactly 10 digits')
    if (emailChanged) {
      const confirmed = window.confirm(
        `Change email from ${user.email} to ${profile.email}?\n\n` +
        `You will use the new email the next time you log in.`
      )
      if (!confirmed) return
    }
    profileMut.mutate(profile)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    pwMut.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
  }

  // ── Company settings (admin only) ─────────────────────────
  const isAdmin = user?.role === 'admin'
  const isSuperAdmin = user?.role === 'superAdmin'
  const canEditCompany = isAdmin

  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: fetchMyTenant,
    enabled: isAdmin,
  })

  const tenant = tenantData?.data?.data?.tenant
  const plan = tenant?.planId

  const [companyForm, setCompanyForm] = useState({
    orgName: '', website: '', address: '', phone: '',
    settings: { emailAlerts: true, smsAlerts: false, currency: 'INR', alertDays: [30, 15, 7, 1] },
  })

  useEffect(() => {
    if (tenant) {
      setCompanyForm({
        orgName: tenant.orgName || '',
        website: tenant.website || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        settings: tenant.settings || companyForm.settings,
      })
    }
  }, [tenant?._id])

  const saveTenantMut = useMutation({
    mutationFn: updateMyTenant,
    onSuccess: () => { toast.success('Company settings saved'); qc.invalidateQueries(['my-tenant']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  })

  const handleSettings = (key, val) =>
    setCompanyForm(f => ({ ...f, settings: { ...f.settings, [key]: val } }))

  // ── Tabs ─────────────────────────────────────────────────
  const TABS = [
    { key: 'personal', label: 'My Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    ...(isAdmin ? [{ key: 'company', label: 'Company', icon: Building2 }] : []),
    ...(isAdmin ? [{ key: 'subscription', label: 'Subscription', icon: Shield }] : []),
  ]

  if (meLoading) return <Loader text="Loading profile..." />

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Profile & Settings" subtitle="Manage your account, security, and company details" />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === key ? theme.surface : 'transparent',
              color: activeTab === key ? theme.accent : theme.muted,
              border: activeTab === key ? `1px solid ${theme.border}` : '1px solid transparent',
            }}>
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Personal Info ── */}
      {activeTab === 'personal' && (
        <Card>
          <CardHeader title="Personal Information" />
          <div className="p-6 space-y-4">
            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: theme.text }}>{user?.name}</p>
                <p className="text-xs font-mono" style={{ color: theme.muted }}>{user?.email}</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded mt-1 inline-block capitalize"
                  style={{ background: `${theme.accent}15`, color: theme.accent }}>{user?.role}</span>
              </div>
            </div>

            <Input label="Full Name"
              value={profile.name}
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                setProfile(p => ({ ...p, name: val }))
              }}
              placeholder="Your full name (letters only)" />

            <Input label="Email ID" type="Email ID"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />

            {emailChanged && (
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
                <AlertTriangle size={14} style={{ color: '#F0A045' }} className="flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold mb-1" style={{ color: theme.text }}>You're changing your email</p>
                  <p style={{ color: theme.muted }}>
                    Next time you log in, use <span className="font-mono font-semibold" style={{ color: theme.text }}>{profile.email}</span>.
                  </p>
                </div>
              </div>
            )}

            <Input label="Contact Number"
              value={profile.phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setProfile(p => ({ ...p, phone: val }))
              }}
              placeholder="Contact Number" />

            <div className="flex gap-3 pt-2">
              <Button loading={profileMut.isPending} onClick={handleSaveProfile}>
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)}
                style={{ color: '#C94040' }}>
                <Trash2 size={13} /> Delete Account
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab: Security ── */}
      {activeTab === 'security' && (
        <>
          <Card>
            <CardHeader title="Change Password" />
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <Input label="Current Password" type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="••••••••" />
              <Input label="New Password" type="password"
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min 6 characters" />
              <Input label="Confirm New Password" type="password"
                value={passwords.confirmPassword}
                onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="••••••••" />
              <Button type="submit" loading={pwMut.isPending}>Change Password</Button>
            </form>
          </Card>

          <TwoFactorSection user={user} refetchUser={() => qc.invalidateQueries(['me'])} />
        </>
      )}

      {/* ── Tab: Company (admin only) ── */}
      {activeTab === 'company' && isAdmin && (
        <Card className="p-6">
          <CardHeader title="Company Profile" subtitle="Update your agency information" />
          {tenantLoading ? (
            <div className="py-8 text-center text-sm" style={{ color: theme.muted }}>Loading...</div>
          ) : (
            <div className="space-y-4 mt-4">
              <Input label="Company / Agency Name *" name="orgName"
                value={companyForm.orgName}
                onChange={e => setCompanyForm(f => ({ ...f, orgName: e.target.value }))}
                placeholder="Acme Digital Agency" />

              {/* Email is read-only — same as admin's registered email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.muted }}>
                  Company Email
                </label>
                <div className="px-3 py-2.5 rounded-xl text-sm font-mono"
                  style={{ background: `${theme.accent}05`, border: `1px solid ${theme.border}`, color: theme.muted }}>
                  {user?.email}
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: `${theme.accent}15`, color: theme.accent }}>
                    registered email
                  </span>
                </div>
              </div>

              <Input label="Phone" name="phone"
                value={companyForm.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setCompanyForm(f => ({ ...f, phone: val }))
                }}
                placeholder="10-digit number" />

              <Input label="Website" name="website"
                value={companyForm.website}
                onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://acme.com" />

              <Input label="Address" name="address"
                value={companyForm.address}
                onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Mumbai, Maharashtra, India" />

              {/* Alert preferences */}
              <div className="mt-2 pt-5" style={{ borderTop: `1px solid ${theme.border}` }}>
                <p className="text-xs font-semibold mb-4" style={{ color: theme.muted }}>Alert Preferences</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      checked={companyForm.settings.emailAlerts}
                      onChange={e => handleSettings('emailAlerts', e.target.checked)}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: theme.text }}>Email alerts for expiry reminders</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      checked={companyForm.settings.smsAlerts}
                      onChange={e => handleSettings('smsAlerts', e.target.checked)}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: theme.text }}>SMS alerts (requires Twilio setup)</span>
                  </label>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>
                    Alert Days (days before expiry)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7, 15, 30, 60].map(d => {
                      const active = companyForm.settings.alertDays?.includes(d)
                      return (
                        <button key={d} type="button"
                          onClick={() => {
                            const curr = companyForm.settings.alertDays || []
                            handleSettings('alertDays',
                              active ? curr.filter(x => x !== d) : [...curr, d].sort((a, b) => b - a)
                            )
                          }}
                          className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-all"
                          style={{
                            background: active ? `${theme.accent}20` : 'transparent',
                            borderColor: active ? theme.accent : theme.border,
                            color: active ? theme.accent : theme.muted,
                          }}>
                          {d}d
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button loading={saveTenantMut.isPending} onClick={() => saveTenantMut.mutate(companyForm)}>
                  Save Company Settings
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Tab: Subscription (admin only) ── */}
      {activeTab === 'subscription' && isAdmin && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${theme.accent}18` }}>
              <Shield size={16} style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-sm font-bold capitalize" style={{ color: theme.text }}>
                {tenant?.planName || 'Free'} Plan
              </p>
              <p className="text-xs" style={{ color: theme.muted }}>
                {plan?.displayName || 'Free'} — {plan?.price === 0 ? 'Free' : `₹${plan?.price}/mo`}
              </p>
            </div>
            {tenant?.subscriptionEnd && (
              <div className="ml-auto text-right">
                <p className="text-[10px] font-mono" style={{ color: theme.muted }}>Renews</p>
                <p className="text-xs font-mono" style={{ color: theme.accent }}>
                  {new Date(tenant.subscriptionEnd).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {[
              { label: 'Domains', max: tenant?.maxDomains },
              { label: 'Clients', max: tenant?.maxClients },
              { label: 'Hosting', max: tenant?.maxHosting },
              { label: 'Staff', max: tenant?.maxStaff },
            ].map(({ label, max }) => {
              const isUnlimited = max >= 99999
              return (
                <div key={label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: theme.muted }}>{label}</span>
                    <span className="font-mono" style={{ color: theme.text }}>
                      {isUnlimited ? 'Unlimited' : `— / ${max}`}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${theme.accent}15` }}>
                      <div className="h-full rounded-full transition-all" style={{ width: '0%', background: theme.accent }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-[10px] mt-4" style={{ color: theme.muted }}>
            Contact support or your platform admin to upgrade your plan.
          </p>
        </Card>
      )}

      {/* ── Delete Account Confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(201,64,64,0.12)' }}>
                <Trash2 size={16} style={{ color: '#C94040' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: theme.text }}>Delete Account</p>
                <p className="text-xs" style={{ color: theme.muted }}>This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: theme.muted }}>
              Type <span className="font-mono font-bold" style={{ color: theme.text }}>DELETE</span> to confirm account deletion.
              All your data will be permanently removed.
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="flex-1">
                Cancel
              </Button>
              <button
                disabled={deleteInput !== 'DELETE'}
                onClick={() => {
                  toast.error('Account deletion requires contacting support.')
                  setShowDeleteConfirm(false)
                  setDeleteInput('')
                }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: deleteInput === 'DELETE' ? '#C94040' : `#C9404020`,
                  color: deleteInput === 'DELETE' ? '#fff' : '#C94040',
                }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
