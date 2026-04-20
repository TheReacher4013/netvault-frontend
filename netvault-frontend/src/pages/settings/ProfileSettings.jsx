import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, PageHeader, Input, Loader } from '../../components/ui/index'
import TwoFactorSection from './TwoFactorSection'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileSettings() {
  const { user: contextUser, theme } = useAuth()
  const qc = useQueryClient()

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.me(),
    staleTime: 30_000,
  })
  const user = meData?.data?.data?.user || contextUser

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user?._id])

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const profileMut = useMutation({
    mutationFn: d => userService.updateProfile(d),
    onSuccess: (res) => {
      toast.success('Profile updated')
      qc.invalidateQueries(['me'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const pwMut = useMutation({
    mutationFn: d => authService.changePassword(d),
    onSuccess: () => {
      toast.success('Password changed')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
  })

  const emailChanged = user && profile.email.trim().toLowerCase() !== user.email.toLowerCase()

  const handleSave = () => {
    if (!profile.name.trim()) return toast.error('Name is required')
    if (!profile.email.trim()) return toast.error('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      return toast.error('Please enter a valid email address')
    }
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
    pwMut.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    })
  }

  if (meLoading) return <Loader text="Loading profile..." />

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Profile Settings" subtitle="Manage your account and security" />

      {/* Personal info */}
      <Card>
        <CardHeader title="Personal Information" />
        <div className="p-6 space-y-4">
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
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />

          <Input label="Email" type="email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />

          {/* Warning when email changes */}
          {emailChanged && (
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#F0A045' }} className="flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold mb-1" style={{ color: theme.text }}>
                  You're changing your email
                </p>
                <p style={{ color: theme.muted }}>
                  Next time you log in, use <span className="font-mono font-semibold" style={{ color: theme.text }}>{profile.email}</span>.
                  Password-reset emails and alerts will also be sent to the new address.
                </p>
              </div>
            </div>
          )}

          <Input label="Phone"
            value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />

          <Button loading={profileMut.isPending} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Password */}
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

      {/* 2FA */}
      <TwoFactorSection user={user} refetchUser={() => qc.invalidateQueries(['me'])} />
    </div>
  )
}