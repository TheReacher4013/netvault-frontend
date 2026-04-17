import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, EmptyState, PageHeader, Modal, Input, ConfirmDialog } from '../../components/ui/index'
import { Users, Plus, Eye, Trash2, Globe, Server, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [delId, setDelId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientService.getAll({ search, limit: 20 }),
  })

  const addMut = useMutation({
    mutationFn: d => clientService.create(d),
    onSuccess: () => { toast.success('Client added!'); qc.invalidateQueries(['clients']); setShowAdd(false); setForm({ name: '', email: '', phone: '', company: '' }) },
  })
  const delMut = useMutation({
    mutationFn: id => clientService.remove(id),
    onSuccess: () => { toast.success('Client deleted'); qc.invalidateQueries(['clients']); setDelId(null) },
  })

  const clients = data?.data?.data?.docs || []
  if (isLoading) return <Loader text="Loading clients..." />

  return (
    <div className="space-y-5">
      <PageHeader title="Clients" subtitle={`${data?.data?.data?.totalDocs || 0} clients`}
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add Client</Button>} />

      <Card className="p-4 flex gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            className="bg-transparent outline-none text-xs flex-1" style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      </Card>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client"
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} />Add Client</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c, i) => (
            <Card key={c._id} className="p-5 cursor-pointer hover:scale-[1.01] transition-transform animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => navigate(`/clients/${c._id}`)}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: theme.muted }}>{c.company || c.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs" style={{ color: theme.muted }}>
                  <span className="flex items-center gap-1"><Globe size={11} style={{ color: theme.accent }} />Domains</span>
                  <span className="flex items-center gap-1"><Server size={11} style={{ color: theme.accent }} />Hosting</span>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/clients/${c._id}`)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}><Eye size={12} /></button>
                  <button onClick={() => setDelId(c._id)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }}><Trash2 size={12} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Client">
        <div className="space-y-3">
          <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name" />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@email.com" />
          <Input label="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
          <div className="flex gap-3 pt-2">
            <Button loading={addMut.isPending} onClick={() => { if (!form.name || !form.email) return toast.error('Name and email required'); addMut.mutate(form) }}>Add Client</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => delMut.mutate(delId)}
        loading={delMut.isPending} title="Delete Client" message="Delete this client permanently?" />
    </div>
  )
}
