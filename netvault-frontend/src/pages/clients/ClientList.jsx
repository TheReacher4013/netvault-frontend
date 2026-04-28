import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, EmptyState, PageHeader, Modal, Input, ConfirmDialog } from '../../components/ui/index'
import {
  Users, Plus, Eye, Trash2, Globe, Server, Search,
  Mail, Lock, Unlock, KeyRound, LayoutGrid, List,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientList() {
  const { user, theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin'

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [perPageInput, setPerPageInput] = useState('12')
  const [showAdd, setShowAdd] = useState(false)
  const [delId, setDelId] = useState(null)
  const [revokeId, setRevokeId] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    portalAccess: false,
    password: '',
  })

  // Debounce search input — waits 400ms after typing stops before querying
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page, perPage],
    queryFn: () => clientService.getAll({ search, page, limit: perPage }),
    keepPreviousData: true,
  })

  const addMut = useMutation({
    mutationFn: d => clientService.create(d),
    onSuccess: (res) => {
      const portal = res?.data?.data?.portalAccess
      toast.success(portal ? 'Client added with portal access' : 'Client added')
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
    onSuccess: () => { toast.success('Invite email sent — valid for 7 days'); qc.invalidateQueries(['clients']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Invite failed'),
  })

  const revokeMut = useMutation({
    mutationFn: id => clientService.revokePortalAccess(id),
    onSuccess: () => { toast.success('Portal access revoked'); qc.invalidateQueries(['clients']); setRevokeId(null) },
  })

  const clients = data?.data?.data?.docs || []
  const totalPages = data?.data?.data?.totalPages || 1
  if (isLoading) return <Loader text="Loading clients..." />

  const handleAdd = () => {
    if (!form.name.trim()) return toast.error('Name is required')
    if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) return toast.error('Name should contain only letters')
    if (!form.email.trim()) return toast.error('Email is required')
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) return toast.error('Mobile number must be exactly 10 digits')
    if (form.portalAccess) {
      if (!form.password) return toast.error('Set a password or turn off portal access')
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    }
    addMut.mutate({
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), company: form.company.trim(),
      ...(form.portalAccess && form.password ? { password: form.password } : {}),
    })
  }

  const ActionButtons = ({ c, hasAccess }) => (
    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
      {isAdmin && !hasAccess && (
        <button onClick={() => inviteMut.mutate(c._id)} disabled={inviteMut.isPending}
          title="Send portal invite" className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-40"
          style={{ color: theme.accent }}><Mail size={12} /></button>
      )}
      {isAdmin && hasAccess && (
        <button onClick={() => setRevokeId(c._id)} title="Revoke portal access"
          className="p-1.5 rounded-lg hover:bg-orange-500/10" style={{ color: '#F0A045' }}>
          <KeyRound size={12} /></button>
      )}
      <button onClick={() => navigate(`/clients/${c._id}`)}
        className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}>
        <Eye size={12} /></button>
      {isAdmin && (
        <button onClick={() => setDelId(c._id)}
          className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }}>
          <Trash2 size={12} /></button>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader title="Clients" subtitle={`${data?.data?.data?.totalDocs || 0} clients`}
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add Client</Button>} />

      {/* Search + View Toggle */}
      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search clients..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch('') }}
              className="text-xs opacity-50 hover:opacity-80"
              style={{ color: theme.muted }}>✕</button>
          )}
        </div>

        {/* Grid / List toggle */}
        <div className="flex items-center rounded-xl overflow-hidden"
          style={{ border: `1px solid ${theme.border}` }}>
          <button
            onClick={() => setViewMode('grid')}
            className="p-2 transition-colors"
            style={{
              background: viewMode === 'grid' ? `${theme.accent}20` : 'transparent',
              color: viewMode === 'grid' ? theme.accent : theme.muted,
            }}>
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="p-2 transition-colors"
            style={{
              background: viewMode === 'list' ? `${theme.accent}20` : 'transparent',
              color: viewMode === 'list' ? theme.accent : theme.muted,
              borderLeft: `1px solid ${theme.border}`,
            }}>
            <List size={14} />
          </button>
        </div>
      </Card>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client"
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add Client</Button>} />
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c, i) => {
            const hasAccess = !!c.userId
            const srNo = (page - 1) * perPage + i + 1
            return (
              <Card key={c._id} className="p-5">
                <div className="flex items-start gap-3 mb-3 cursor-pointer"
                  onClick={() => navigate(`/clients/${c._id}`)}>
                  <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-mono font-bold leading-none"
                      style={{ color: theme.muted }}>#{srNo}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                      {c.name.charAt(0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{c.name}</p>
                    <p className="text-xs truncate" style={{ color: theme.muted }}>{c.company || c.email}</p>
                  </div>
                </div>

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

                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs" style={{ color: theme.muted }}>
                    <span className="flex items-center gap-1"><Globe size={11} style={{ color: theme.accent }} /></span>
                    <span className="flex items-center gap-1"><Server size={11} style={{ color: theme.accent }} /></span>
                  </div>
                  <ActionButtons c={c} hasAccess={hasAccess} />
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* ── List View ── */
        <Card>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Sr', 'Client', 'Email', 'Company', 'Phone', 'Portal', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider"
                      style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => {
                  const hasAccess = !!c.userId
                  const srNo = (page - 1) * perPage + i + 1
                  return (
                    <tr key={c._id} className="hover:bg-white/[0.02] cursor-pointer"
                      style={{ borderBottom: `1px solid ${theme.border}` }}
                      onClick={() => navigate(`/clients/${c._id}`)}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{srNo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                            {c.name.charAt(0)}
                          </div>
                          <p className="text-xs font-semibold" style={{ color: theme.text }}>{c.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{c.email}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{c.company || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{c.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {hasAccess ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(98,184,73,0.12)', color: '#62B849' }}>
                            <Unlock size={10} />Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{ background: `${theme.accent}10`, color: theme.muted }}>
                            <Lock size={10} />No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <ActionButtons c={c} hasAccess={hasAccess} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="lg:hidden divide-y" style={{ borderColor: theme.border }}>
            {clients.map((c, i) => {
              const hasAccess = !!c.userId
              const srNo = (page - 1) * perPage + i + 1
              return (
                <div key={c._id} className="p-4 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => navigate(`/clients/${c._id}`)}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${theme.accent}15`, color: theme.muted }}>#{srNo}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{c.name}</p>
                      <p className="text-xs truncate" style={{ color: theme.muted }}>{c.email}</p>
                    </div>
                    {hasAccess
                      ? <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(98,184,73,0.12)', color: '#62B849' }}>Portal</span>
                      : <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${theme.accent}10`, color: theme.muted }}>No portal</span>
                    }
                  </div>
                  <div className="flex justify-end">
                    <ActionButtons c={c} hasAccess={hasAccess} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {(clients.length > 0 || page > 1) && (
        <div className="flex items-center justify-between gap-3 flex-wrap py-2">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input type="number" min="1" max="100" value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={() => { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) }}
              onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) } }}
              className="w-12 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }} />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
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
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>
            {data?.data?.data?.totalDocs || 0} total
          </span>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Client">
        <div className="space-y-3">
          <Input label="Name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
            placeholder="Client name (letters only)" />
          <Input label="Email ID *" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="client@email.com" />
          <Input label="Company" value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            placeholder="Company name" />
          <Input label="Contact Number" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            placeholder="10 digit number" />
          <div className="pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.portalAccess}
                onChange={e => setForm(f => ({ ...f, portalAccess: e.target.checked }))}
                className="w-4 h-4 rounded mt-0.5" style={{ accentColor: theme.accent }} />
              <div className="flex-1">
                <span className="text-sm font-semibold block" style={{ color: theme.text }}>Give portal login access now</span>
                <span className="text-xs" style={{ color: theme.muted }}>Client can log in with email + password below.</span>
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

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)}
        onConfirm={() => delMut.mutate(delId)} loading={delMut.isPending}
        title="Delete Client" message="Delete this client permanently? Portal access will also be removed." />

      <ConfirmDialog open={!!revokeId} onClose={() => setRevokeId(null)}
        onConfirm={() => revokeMut.mutate(revokeId)} loading={revokeMut.isPending}
        title="Revoke Portal Access" message="Client will no longer be able to log in. Data is preserved." />
    </div>
  )
}