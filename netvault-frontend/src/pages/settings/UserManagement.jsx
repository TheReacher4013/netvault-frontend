import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, Modal, Input, Select, ConfirmDialog } from '../../components/ui/index'
import { Users, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ROLE_COLORS = {
  admin:      '#797B2D',
  staff:      '#4A8FA8',
  client:     '#BBAE64',
  superAdmin: '#62B849',
}

export default function UserManagement() {
  const { theme } = useAuth()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [delId, setDelId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' })

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.getAll })

  const addMut = useMutation({
    mutationFn: d => userService.add(d),
    onSuccess: () => { toast.success('User added'); qc.invalidateQueries(['users']); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'staff', phone: '' }) },
  })
  const toggleMut = useMutation({
    mutationFn: id => userService.toggleActive(id),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['users']) },
  })
  const delMut = useMutation({
    mutationFn: id => userService.remove(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries(['users']); setDelId(null) },
  })

  const users = data?.data?.data?.users || []
  if (isLoading) return <Loader text="Loading users..." />

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="User Management" subtitle="Manage team members and roles"
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add User</Button>} />

      <Card>
        <CardHeader title={`Team Members (${users.length})`} />
        {users.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>No team members yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${ROLE_COLORS[u.role] || theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                          {u.name?.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: theme.text }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                        style={{ background: `${ROLE_COLORS[u.role] || theme.accent}15`, color: ROLE_COLORS[u.role] || theme.accent }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono"
                        style={{ color: u.isActive ? '#62B849' : '#C94040' }}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                      {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => toggleMut.mutate(u._id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          style={{ color: u.isActive ? '#62B849' : theme.muted }}>
                          {u.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button onClick={() => setDelId(u._id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#C94040' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Team Member">
        <div className="space-y-3">
          <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Default: ChangeMe@123" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button loading={addMut.isPending} onClick={() => { if (!form.name || !form.email) return toast.error('Name and email required'); addMut.mutate(form) }}>Add User</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => delMut.mutate(delId)}
        loading={delMut.isPending} title="Delete User" message="Delete this team member permanently?" />
    </div>
  )
}
