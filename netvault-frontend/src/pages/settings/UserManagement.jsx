import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, Modal, Input, ConfirmDialog } from '../../components/ui/index'
import { Users, Plus, Trash2, ToggleLeft, ToggleRight, Shield, Info } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    color: '#F0A045',
    desc: 'Full access — all domains, hosting, billing, clients, settings',
  },
  {
    value: 'staff',
    label: 'Staff',
    color: '#4A8FA8',
    desc: 'General access — add/edit everything, no delete permissions',
  },
]

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

/* ── User Card (replaces table row) ── */
function UserCard({ u, onToggle, onDelete, theme }) {
  const role = ROLE_MAP[u.role] || { label: u.role, color: theme.muted }
  return (
    <div style={{
      background: theme.bg || '#fff',
      border: `1px solid ${theme.border}`,
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'box-shadow .15s',
    }}>
      {/* Top row: avatar + name + role badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 800, flexShrink: 0,
          background: `${role.color}25`, color: role.color,
        }}>
          {u.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
          <div style={{ fontSize: '11px', color: theme.muted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={() => onToggle(u._id)}
            className="flex items-center gap-1"
            style={{ background: u.isActive !== false ? '#ECFDF5' : `${theme.accent}10`, border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: u.isActive !== false ? '#10B981' : theme.muted }}>
            {u.isActive !== false ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            <span className="hidden sm:inline">{u.isActive !== false ? 'Active' : 'Inactive'}</span>
          </button>
          <button onClick={() => onDelete(u._id)}
            style={{ background: '#FEF2F2', border: 'none', borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: '#C94040' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Bottom row: role pill + joined date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <span style={{
          fontSize: '10px', fontFamily: 'monospace', fontWeight: 700,
          padding: '3px 10px', borderRadius: '6px',
          background: `${role.color}15`, color: role.color,
        }}>{role.label || u.role}</span>
        <span style={{ fontSize: '11px', color: theme.muted, fontFamily: 'monospace' }}>
          Joined {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
        </span>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const { theme } = useAuth()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [delId, setDelId] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [perPageInput, setPerPageInput] = useState('12')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' })

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.getAll })

  const addMut = useMutation({
    mutationFn: d => userService.add(d),
    onSuccess: () => {
      toast.success('User added')
      qc.invalidateQueries(['users'])
      setShowAdd(false)
      setForm({ name: '', email: '', password: '', role: 'staff', phone: '' })
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add user'),
  })
  const toggleMut = useMutation({
    mutationFn: id => userService.toggleActive(id),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['users']) },
  })
  const delMut = useMutation({
    mutationFn: id => userService.remove(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries(['users']); setDelId(null) },
  })

  const allUsers = (data?.data?.data?.users || []).filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(allUsers.length / perPage))
  const users = allUsers.slice((page - 1) * perPage, page * perPage)

  if (isLoading) return <Loader text="Loading users..." />

  return (
    <div className="space-y-5 max-w-5xl">
      <style>{`
        .um-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .um-search { padding: 8px 12px; border-radius: 10px; font-size: 13px; outline: none; width: 100%; max-width: 280px; }
        @media (max-width: 480px) {
          .um-grid { grid-template-columns: 1fr; }
          .um-search { max-width: 100%; }
        }
      `}</style>

      <PageHeader title="User Management" subtitle="Manage team members and their roles"
        actions={
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowRoles(v => !v)}
              className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: `${theme.accent}12`, color: theme.accent }}>
              <Info size={11} /> Role Guide
            </button>
            <Button onClick={() => setShowAdd(true)}><Plus size={14} />Add User</Button>
          </div>
        }
      />

      {/* Role Guide */}
      {showRoles && (
        <Card className="p-5">
          <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Shield size={14} style={{ color: theme.accent }} />
            Role Permissions Guide
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLES.map(r => (
              <div key={r.value} className="p-3 rounded-xl"
                style={{ background: `${r.color}08`, border: `1px solid ${r.color}25` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-xs font-bold" style={{ color: r.color }}>{r.label}</span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>{r.desc}</p>
              </div>
            ))}
            <div className="p-3 rounded-xl"
              style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: theme.muted }} />
                <span className="text-xs font-bold" style={{ color: theme.muted }}>Client</span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>
                Client portal only — read-only view of own domains, hosting, invoices. No admin access.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {/* Header with search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <CardHeader title={`Team Members (${allUsers.length})`} />
          <input
            className="um-search"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>
            {search ? 'No users match your search' : 'No team members yet'}
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            <div className="um-grid">
              {users.map(u => (
                <UserCard
                  key={u._id}
                  u={u}
                  theme={theme}
                  onToggle={(id) => toggleMut.mutate(id)}
                  onDelete={(id) => setDelId(id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 p-4 flex-wrap"
          style={{ borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input type="number" min="1" max="100" value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={() => { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) }}
              onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } } }}
              className="w-14 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }} />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                  style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>›</button>
            </div>
          )}
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>{allUsers.length} total</span>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Team Member">
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@agency.com" />
          <Input label="Password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />

          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: theme.muted }}>Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                  style={{
                    background: form.role === r.value ? `${r.color}15` : `${theme.accent}04`,
                    border: `1.5px solid ${form.role === r.value ? r.color : theme.border}`,
                  }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-xs font-semibold" style={{ color: form.role === r.value ? r.color : theme.text }}>{r.label}</span>
                </button>
              ))}
            </div>
            {form.role && (
              <p className="text-[10px] mt-2 px-1" style={{ color: theme.muted }}>
                {ROLES.find(r => r.value === form.role)?.desc}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button loading={addMut.isPending} onClick={() => {
              if (!form.name || !form.email || !form.password) return toast.error('Name, email and password are required')
              if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
              addMut.mutate(form)
            }}>Add User</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)}
        onConfirm={() => delMut.mutate(delId)} loading={delMut.isPending}
        title="Remove User" message="Remove this team member? They will lose all access immediately." />
    </div>
  )
}