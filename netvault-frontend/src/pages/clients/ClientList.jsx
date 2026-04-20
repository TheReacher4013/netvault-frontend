import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, EmptyState, PageHeader, Modal, Input, ConfirmDialog } from '../../components/ui/index'
import {
  Users, Plus, Eye, Trash2, Globe, Server, Search,
  Mail, Lock, Unlock, KeyRound,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientList() {
  const { user, theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin'

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [delId, setDelId] = useState(null)
  const [revokeId, setRevokeId] = useState(null)

  // Form state — portalAccess toggle controls whether password is required
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    portalAccess: false,
    password: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientService.getAll({ search, limit: 20 }),
  })

  const addMut = useMutation({
    mutationFn: d => clientService.create(d),
    onSuccess: (res) => {
      const portal = res?.data?.data?.portalAccess
      toast.success(portal
        ? 'Client added with portal access — they can log in now'
        : 'Client added')
      qc.invalidateQueries(['clients'])
      setShowAdd(false)
      setForm({ name: '', email: '', phone: '', company: '', portalAccess: false, password: '' })
    },
  })

  const delMut = useMutation({
    mutationFn: id => clientService.remove(id),
    onSuccess: () => { toast.success('Client deleted'); qc.invalidateQueries(['clients']); setDelId(null) },
  })

  const inviteMut = useMutation({
    mutationFn: id => clientService.sendInvite(id),
    onSuccess: () => {
      toast.success('Invite email sent — valid for 7 days')
      qc.invalidateQueries(['clients'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invite failed'),
  })

  const revokeMut = useMutation({
    mutationFn: id => clientService.revokePortalAccess(id),
    onSuccess: () => {
      toast.success('Portal access revoked')
      qc.invalidateQueries(['clients'])
      setRevokeId(null)
    },
  })

  const clients = data?.data?.data?.docs || []
  if (isLoading) return <Loader text="Loading clients..." />

  const handleAdd = () => {
    if (!form.name || !form.email) return toast.error('Name and email required')
    if (form.portalAccess) {
      if (!form.password) return toast.error('Set a password or turn off portal access')
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    }
    const payload = {
      name: form.name, email: form.email, phone: form.phone, company: form.company,
      ...(form.portalAccess && form.password ? { password: form.password } : {}),
    }
    addMut.mutate(payload)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Clients" subtitle={`${data?.data?.data?.totalDocs || 0} clients`}
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add Client</Button>} />

      <Card className="p-4 flex gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      </Card>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client"
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add Client</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c, i) => {
            const hasAccess = !!c.userId  // backend virtual also returns hasPortalAccess; userId is authoritative
            return (
              <Card key={c._id} className="p-5 transition-transform animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start gap-3 mb-3 cursor-pointer"
                  onClick={() => navigate(`/clients/${c._id}`)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{c.name}</p>
                    <p className="text-xs truncate" style={{ color: theme.muted }}>{c.company || c.email}</p>
                  </div>
                </div>

                {/* Portal-access badge */}
                <div className="mb-3">
                  {hasAccess ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgba(98,184,73,0.12)', color: '#62B849' }}>
                      <Unlock size={10} />Portal access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: `${theme.accent}10`, color: theme.muted }}>
                      <Lock size={10} />No portal access
                    </span>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs" style={{ color: theme.muted }}>
                    <span className="flex items-center gap-1"><Globe size={11} style={{ color: theme.accent }} /></span>
                    <span className="flex items-center gap-1"><Server size={11} style={{ color: theme.accent }} /></span>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {/* Invite / Revoke button */}
                    {isAdmin && !hasAccess && (
                      <button onClick={() => inviteMut.mutate(c._id)}
                        disabled={inviteMut.isPending}
                        title="Send portal invite email"
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-40"
                        style={{ color: theme.accent }}>
                        <Mail size={12} />
                      </button>
                    )}
                    {isAdmin && hasAccess && (
                      <button onClick={() => setRevokeId(c._id)}
                        title="Revoke portal access"
                        className="p-1.5 rounded-lg hover:bg-orange-500/10"
                        style={{ color: '#F0A045' }}>
                        <KeyRound size={12} />
                      </button>
                    )}
                    <button onClick={() => navigate(`/clients/${c._id}`)}
                      className="p-1.5 rounded-lg hover:bg-white/10"
                      style={{ color: theme.accent }}>
                      <Eye size={12} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => setDelId(c._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10"
                        style={{ color: '#C94040' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Client">
        <div className="space-y-3">
          <Input label="Name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Client name" />
          <Input label="Email *" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="client@email.com" />
          <Input label="Company" value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            placeholder="Company name" />
          <Input label="Phone" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+91..." />

          {/* Portal-access toggle */}
          <div className="pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox"
                checked={form.portalAccess}
                onChange={e => setForm(f => ({ ...f, portalAccess: e.target.checked }))}
                className="w-4 h-4 rounded mt-0.5"
                style={{ accentColor: theme.accent }} />
              <div className="flex-1">
                <span className="text-sm font-semibold block" style={{ color: theme.text }}>
                  Give portal login access now
                </span>
                <span className="text-xs" style={{ color: theme.muted }}>
                  Client will be able to log in with this email + the password below.
                  (You can also skip this and send an invite link later.)
                </span>
              </div>
            </label>
          </div>

          {form.portalAccess && (
            <Input label="Password *" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min 6 characters" />
          )}

          <div className="flex gap-3 pt-2">
            <Button loading={addMut.isPending} onClick={handleAdd}>Add Client</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)}
        onConfirm={() => delMut.mutate(delId)}
        loading={delMut.isPending}
        title="Delete Client"
        message="Delete this client permanently? If they had portal access, their login will also be removed." />

      {/* Revoke confirm */}
      <ConfirmDialog open={!!revokeId} onClose={() => setRevokeId(null)}
        onConfirm={() => revokeMut.mutate(revokeId)}
        loading={revokeMut.isPending}
        title="Revoke Portal Access"
        message="Client will no longer be able to log in. Their data is preserved — you can re-invite them later." />
    </div>
  )
}