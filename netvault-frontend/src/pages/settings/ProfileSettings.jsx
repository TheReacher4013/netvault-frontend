import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { userService, authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, PageHeader, Input } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function ProfileSettings() {
  const { user, theme } = useAuth()
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const profileMut = useMutation({
    mutationFn: d => userService.updateProfile(d),
    onSuccess: () => toast.success('Profile updated'),
  })
  const pwMut = useMutation({
    mutationFn: d => authService.changePassword(d),
    onSuccess: () => { toast.success('Password changed'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }) },
  })

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    pwMut.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Profile Settings" subtitle="Manage your account details" />

      {/* Profile info */}
      <Card>
        <CardHeader title="Personal Information" />
        <div className="p-6 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: theme.text }}>{user?.name}</p>
              <p className="text-xs font-mono" style={{ color: theme.muted }}>{user?.email}</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded mt-1 inline-block capitalize"
                style={{ background: `${theme.accent}15`, color: theme.accent }}>{user?.role}</span>
            </div>
          </div>

          <Input label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          <Input label="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Email</label>
            <p className="text-sm font-mono px-3 py-2.5 rounded-xl" style={{ background: `${theme.accent}06`, color: theme.muted, border: `1px solid ${theme.border}` }}>
              {user?.email} <span className="text-[10px] ml-2" style={{ color: theme.muted }}>(cannot be changed)</span>
            </p>
          </div>
          <Button loading={profileMut.isPending} onClick={() => profileMut.mutate(profile)}>Save Changes</Button>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader title="Change Password" />
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <Input label="Current Password" type="password" value={passwords.currentPassword}
            onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
          <Input label="New Password" type="password" value={passwords.newPassword}
            onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
          <Input label="Confirm New Password" type="password" value={passwords.confirmPassword}
            onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
          <Button type="submit" loading={pwMut.isPending}>Change Password</Button>
        </form>
      </Card>
    </div>
  )
}
