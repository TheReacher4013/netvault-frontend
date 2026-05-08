import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, authService } from '../../services/api'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, PageHeader, Input, Loader } from '../../components/ui/index'
import TwoFactorSection from './TwoFactorSection'
import { AlertTriangle, Shield, Building2, User, Lock, Trash2, Camera, Upload, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

const fetchMyTenant = () => api.get('/tenant/me')
const updateMyTenant = (data) => api.put('/tenant/me', data)

// Country codes list
const COUNTRY_CODES = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', phoneLength: 11, phonePattern: /^\d{10,11}$/ },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', phoneLength: 9, phonePattern: /^\d{9,10}$/ },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka', phoneLength: 9, phonePattern: /^\d{9}$/ },
]

// Map country code → subscription plans currency
const COUNTRY_PLAN_MAP = {
  IN: 'INR', US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD',
  DE: 'EUR', FR: 'EUR', AE: 'AED', SG: 'SGD', NZ: 'NZD',
}

export default function ProfileSettings() {
  // ── CHANGE 1: markProfileUpdated added ──────────────────────────────
  const { user: contextUser, theme, logout, refreshTrialInfo, markProfileUpdated, refreshUser } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('personal')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const avatarInputRef = useRef(null)
  const logoInputRef = useRef(null)

  // ── Personal profile ────────────────────────────────
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.me(),
    staleTime: 30_000,
  })
  const user = meData?.data?.data?.user || contextUser

  // ── isAdmin derived early so tenant query can use it ──
  const isAdmin = user?.role === 'admin'

  // ── Company settings (admin only) — declared BEFORE useEffects that reference tenant ──
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: fetchMyTenant,
    enabled: isAdmin,
  })

  const tenant = tenantData?.data?.data?.tenant
  const plan = tenant?.planId

  // ── State ──────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', countryCode: '+91', orgName: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [companyForm, setCompanyForm] = useState({
    orgName: '', website: '', address: '', phone: '', countryCode: '+91', country: 'IN',
    settings: { emailAlerts: true, smsAlerts: false, currency: 'INR', alertDays: [30, 15, 7, 1] },
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace('/api', '')

  const getAvatarUrl = (av) => {
    if (!av) return null
    if (av.startsWith('http')) return av
    return `${API_BASE}${av}`
  }

  // ── useEffects — tenant is declared above, no TDZ ──
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        countryCode: user.countryCode || '+91',
      }))
      if (user.avatar) setAvatarPreview(getAvatarUrl(user.avatar))
    }
  }, [user?._id])

  // Populate orgName from tenant when available
  useEffect(() => {
    if (tenant?.orgName) {
      setProfile(prev => ({ ...prev, orgName: tenant.orgName }))
    }
  }, [tenant?._id])

  useEffect(() => {
    if (tenant) {
      setCompanyForm({
        orgName: tenant.orgName || '',
        website: tenant.website || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        countryCode: tenant.countryCode || '+91',
        country: tenant.country || 'IN',
        settings: tenant.settings || companyForm.settings,
      })
      if (tenant.logo) setLogoPreview(getAvatarUrl(tenant.logo))
    }
  }, [tenant?._id])

  // ── Avatar upload ──────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Only image files are allowed')
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')

    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)

    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await api.post('/users/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Profile photo updated!')
      qc.invalidateQueries(['me'])
      refreshUser?.()
      refreshTrialInfo?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

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
    if (!profile.email.trim()) return toast.error('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return toast.error('Please enter a valid email address')
    if (profile.name.trim() && !/^[a-zA-Z\s'.,-]+$/.test(profile.name.trim())) return toast.error('Name should contain only letters')

    if (profile.phone) {
      const digits = profile.phone.replace(/\D/g, '')
      const selectedCC = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
      if (selectedCC && !selectedCC.phonePattern.test(digits)) {
        return toast.error(`Enter a valid ${selectedCC.phoneLength}-digit number for ${selectedCC.name}`)
      }
      if (!selectedCC && (digits.length < 6 || digits.length > 15)) {
        return toast.error('Please enter a valid contact number (6-15 digits)')
      }
    }

    if (emailChanged) {
      const confirmed = window.confirm(
        `Change email from ${user.email} to ${profile.email}?\n\nYou will use the new email the next time you log in.`
      )
      if (!confirmed) return
    }

    if (isAdmin && profile.orgName !== undefined && profile.orgName !== (tenant?.orgName || '')) {
      saveTenantMut.mutate({ ...companyForm, orgName: profile.orgName })
    }
    profileMut.mutate(profile)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    pwMut.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Only image files are allowed')
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')

    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      await api.post('/tenant/me/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Company logo updated!')
      qc.invalidateQueries(['my-tenant'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  // ── CHANGE 2: markProfileUpdated() called on company settings save ──
  const saveTenantMut = useMutation({
    mutationFn: updateMyTenant,
    onSuccess: () => {
      toast.success('Company settings saved')
      qc.invalidateQueries(['my-tenant'])
      markProfileUpdated?.()   // instantly flips profileCompleted=true in AuthContext
      // → TrialPopup will show only "Subscribe" card next session
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  })

  const handleSettings = (key, val) =>
    setCompanyForm(f => ({ ...f, settings: { ...f.settings, [key]: val } }))

  const handleCountryChange = (countryCode) => {
    const entry = COUNTRY_CODES.find(c => c.code === countryCode)
    setCompanyForm(f => ({
      ...f,
      country: countryCode,
      countryCode: entry?.dial || '+91',
      settings: { ...f.settings, currency: COUNTRY_PLAN_MAP[countryCode] || 'USD' },
    }))
  }

  // ── Tabs ──────────────────────────────────────────
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
            {/* Avatar upload row */}
            <div className="flex items-center gap-4 mb-2">
              <div className="relative group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar"
                    className="w-16 h-16 rounded-2xl object-cover"
                    style={{ border: `2px solid ${theme.border}` }} />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.55)' }}>
                  {avatarUploading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={18} color="#fff" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: theme.text }}>{user?.name}</p>
                <p className="text-xs font-mono" style={{ color: theme.muted }}>{user?.email}</p>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-[11px] mt-1 flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: theme.accent }}>
                  <Upload size={10} /> Upload Photo
                </button>
              </div>
            </div>

            {/* Setup completion notice if profile is incomplete */}
            {(!user?.name || user.name === user?.email?.split('@')[0]) && (
              <div className="flex items-start gap-3 p-3 rounded-xl mb-2"
                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.accent}30` }}>
                <div className="text-xs">
                  <p className="font-semibold mb-1" style={{ color: theme.accent }}>👋 Complete your profile</p>
                  <p style={{ color: theme.muted }}>
                    Add your name and organisation name to personalise your experience.
                  </p>
                </div>
              </div>
            )}

            <Input label="Full Name"
              value={profile.name}
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\s'.,-]/g, '')
                setProfile(p => ({ ...p, name: val }))
              }}
              placeholder="e.g. Rahul Kumar" />

            {isAdmin && (
              <Input label="Organisation / Company Name"
                value={profile.orgName}
                onChange={e => setProfile(p => ({ ...p, orgName: e.target.value }))}
                placeholder="e.g. Acme Digital Agency" />
            )}

            <Input label="Email ID" type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />

            {emailChanged && (
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
                <AlertTriangle size={14} style={{ color: '#F0A045' }} className="flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold mb-1" style={{ color: theme.text }}>You're changing your email</p>
                  <p style={{ color: theme.muted }}>
                    Next login, use <span className="font-mono font-semibold" style={{ color: theme.text }}>{profile.email}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Contact number with country code */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.muted }}>Contact Number</label>
              <div className="flex gap-2">
                <select
                  value={profile.countryCode}
                  onChange={e => setProfile(p => ({ ...p, countryCode: e.target.value, phone: '' }))}
                  className="px-2 py-2.5 rounded-xl border text-sm outline-none flex-shrink-0"
                  style={{ background: theme.surface, color: theme.text, borderColor: theme.border, minWidth: '90px' }}>
                  {COUNTRY_CODES.map(c => (
                    <option key={`${c.code}-${c.dial}`} value={c.dial}>{c.flag} {c.dial}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => {
                    const cc = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
                    const maxLen = cc?.phoneLength || 15
                    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen)
                    setProfile(p => ({ ...p, phone: val }))
                  }}
                  placeholder={
                    (() => {
                      const cc = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
                      return cc ? `${cc.phoneLength}-digit number` : 'Enter contact number'
                    })()
                  }
                  className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                {(() => {
                  const cc = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
                  return cc ? `Format: ${cc.dial} + ${cc.phoneLength}-digit number (${cc.name})` : 'Enter your contact number'
                })()}
              </p>
            </div>

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
              {/* Logo upload */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: theme.muted }}>Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="logo"
                        className="w-16 h-16 rounded-xl object-cover"
                        style={{ border: `2px solid ${theme.border}` }} />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
                        style={{ background: `${theme.accent}18`, color: theme.accent, border: `2px dashed ${theme.border}` }}>
                        {companyForm.orgName?.charAt(0) || '?'}
                      </div>
                    )}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      {logoUploading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={18} color="#fff" />}
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </div>
                  <div>
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="text-sm flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      style={{ color: theme.accent }}>
                      <Upload size={13} /> Upload Logo
                    </button>
                    <p className="text-xs mt-1" style={{ color: theme.muted }}>PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              <Input label="Company / Agency Name *" name="orgName"
                value={companyForm.orgName}
                onChange={e => setCompanyForm(f => ({ ...f, orgName: e.target.value }))}
                placeholder="Acme Digital Agency" />

              {/* Country selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: theme.muted }}>
                  <Globe size={11} /> Country
                </label>
                <select
                  value={companyForm.country}
                  onChange={e => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}>
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: theme.muted }}>
                  Your country determines available subscription plans and currency.
                </p>
              </div>

              {/* Company contact with country code */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.muted }}>Company Phone</label>
                <div className="flex gap-2">
                  <select
                    value={companyForm.countryCode}
                    onChange={e => setCompanyForm(f => ({ ...f, countryCode: e.target.value }))}
                    className="px-2 py-2.5 rounded-xl border text-sm outline-none flex-shrink-0"
                    style={{ background: theme.surface, color: theme.text, borderColor: theme.border, minWidth: '90px' }}>
                    {COUNTRY_CODES.map(c => (
                      <option key={`${c.code}-${c.dial}`} value={c.dial}>{c.flag} {c.dial}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={companyForm.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 15)
                      setCompanyForm(f => ({ ...f, phone: val }))
                    }}
                    placeholder="Company phone number"
                    className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}
                  />
                </div>
              </div>

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
                  {[
                    { key: 'emailAlerts', label: 'Email alerts for expiry reminders' },
                    { key: 'smsAlerts', label: 'SMS alerts (requires Twilio setup)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                        checked={companyForm.settings[key]}
                        onChange={e => handleSettings(key, e.target.checked)}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm" style={{ color: theme.text }}>{label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>Alert Days (days before expiry)</p>
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

      {/* ── Tab: Subscription ── */}
      {activeTab === 'subscription' && isAdmin && (
        <div className="space-y-4">
          {tenantLoading ? (
            <div className="py-8 text-center text-sm" style={{ color: theme.muted }}>Loading subscription info...</div>
          ) : (
            <>
              {/* Plan header card */}
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)` }}>
                    <Shield size={20} style={{ color: theme.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-bold capitalize" style={{ color: theme.text }}>
                        {plan?.displayName || tenant?.planName || 'Free Plan'}
                      </p>
                      {tenant?.isOnTrial && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B40' }}>
                          🕐 Trial
                        </span>
                      )}
                      {tenant?.planStatus === 'active' && !tenant?.isOnTrial && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#16a34a22', color: '#16a34a', border: '1px solid #16a34a40' }}>
                          ✓ Active
                        </span>
                      )}
                      {tenant?.planStatus === 'trial_expired' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#dc262622', color: '#dc2626', border: '1px solid #dc262640' }}>
                          ⚠ Trial Expired
                        </span>
                      )}
                      {tenant?.planStatus === 'pending' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#6366f122', color: '#6366f1', border: '1px solid #6366f140' }}>
                          ⏳ Pending Approval
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: theme.muted }}>
                      {plan?.price === 0 ? 'Free forever' :
                        plan?.price ? `${tenant?.settings?.currency || '₹'}${plan.price} / ${plan.billingCycle || 'month'}` :
                          'Contact admin for pricing'}
                    </p>
                  </div>
                  {/* Dates */}
                  <div className="text-right flex-shrink-0">
                    {tenant?.isOnTrial && tenant?.trialEndDate && (
                      <>
                        <p className="text-[10px] font-mono" style={{ color: theme.muted }}>Trial ends</p>
                        <p className="text-sm font-mono font-bold" style={{ color: '#F59E0B' }}>
                          {new Date(tenant.trialEndDate).toLocaleDateString('en-IN')}
                        </p>
                        {(() => {
                          const days = Math.max(0, Math.ceil((new Date(tenant.trialEndDate) - new Date()) / 86400000))
                          return <p className="text-[10px]" style={{ color: days <= 2 ? '#dc2626' : theme.muted }}>{days} day{days !== 1 ? 's' : ''} left</p>
                        })()}
                      </>
                    )}
                    {tenant?.subscriptionEnd && !tenant?.isOnTrial && (
                      <>
                        <p className="text-[10px] font-mono" style={{ color: theme.muted }}>Renews</p>
                        <p className="text-sm font-mono font-bold" style={{ color: theme.accent }}>
                          {new Date(tenant.subscriptionEnd).toLocaleDateString('en-IN')}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Trial warning */}
                {tenant?.isOnTrial && (
                  <div className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    <span>You're on a free trial. Subscribe before it expires to retain all your data and features.</span>
                  </div>
                )}
                {tenant?.planStatus === 'trial_expired' && (
                  <div className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
                    style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    <span>Your trial has expired. Contact support to reactivate your subscription.</span>
                  </div>
                )}
              </Card>

              {/* Plan features + limits */}
              <Card className="p-5">
                <p className="text-xs font-semibold mb-4" style={{ color: theme.muted }}>PLAN DETAILS & LIMITS</p>

                {/* Limits grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Domains', max: tenant?.maxDomains, icon: '🌐' },
                    { label: 'Clients', max: tenant?.maxClients, icon: '👥' },
                    { label: 'Hosting Accounts', max: tenant?.maxHosting, icon: '🖥' },
                    { label: 'Staff Members', max: tenant?.maxStaff, icon: '👤' },
                  ].map(({ label, max, icon }) => {
                    const isUnlimited = !max || max >= 99999
                    return (
                      <div key={label} className="p-3 rounded-xl"
                        style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs flex items-center gap-1" style={{ color: theme.muted }}>
                            <span>{icon}</span> {label}
                          </span>
                          <span className="text-xs font-mono font-bold" style={{ color: isUnlimited ? '#16a34a' : theme.text }}>
                            {isUnlimited ? '∞ Unlimited' : max}
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

                {/* Plan features list */}
                {(plan?.features || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold mb-3" style={{ color: theme.muted }}>INCLUDED FEATURES</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs" style={{ color: theme.text }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#16a34a20' }}>
                            <span style={{ color: '#16a34a', fontSize: 9 }}>✓</span>
                          </div>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Billing cycle */}
                {plan && (
                  <div className="mt-4 pt-4 flex flex-wrap gap-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                    {[
                      { label: 'Billing Cycle', value: plan.billingCycle || 'Monthly' },
                      { label: 'Trial Period', value: `${plan.trialDays || 7} days` },
                      { label: 'Currency', value: tenant?.settings?.currency || plan.currency || 'INR' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{label}</p>
                        <p className="text-sm font-semibold capitalize" style={{ color: theme.text }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <p className="text-[10px] text-center" style={{ color: theme.muted }}>
                To upgrade, downgrade, or cancel your subscription, contact your platform administrator.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Delete Account Confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,64,64,0.12)' }}>
                <Trash2 size={16} style={{ color: '#C94040' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: theme.text }}>Delete Account</p>
                <p className="text-xs" style={{ color: theme.muted }}>This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: theme.muted }}>
              Type <span className="font-mono font-bold" style={{ color: theme.text }}>DELETE</span> to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }} className="flex-1">
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