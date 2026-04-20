import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, Modal, Input, Select } from '../../components/ui/index'
import { useState } from 'react'
import { ArrowLeft, Plus, Eye, EyeOff, Trash2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CredentialVault() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [reveal, setReveal] = useState({})
  const [form, setForm] = useState({ label: '', type: 'cpanel', data: { username: '', password: '', url: '' }, notes: '' })

  const { data, isLoading } = useQuery({ queryKey: ['creds', id], queryFn: () => clientService.getCredentials(id) })

  const addMut = useMutation({
    mutationFn: d => clientService.addCredential(id, d),
    onSuccess: () => { toast.success('Credential stored'); qc.invalidateQueries(['creds', id]); setShowAdd(false) },
  })
  const delMut = useMutation({
    mutationFn: cid => clientService.deleteCredential(id, cid),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['creds', id]) },
  })

  const creds = data?.data?.data?.credentials || []
  if (isLoading) return <Loader text="Loading vault..." />

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="🔒 Credential Vault" subtitle="AES-256 encrypted storage"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${id}`)}><ArrowLeft size={13} />Back</Button>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} />Add Credential</Button>
          </div>
        } />
      <div className="space-y-3">
        {creds.length === 0 && <div className="text-center py-16 text-sm" style={{ color: theme.muted }}>No credentials stored yet.</div>}
        {creds.map(c => (
          <Card key={c._id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock size={14} style={{ color: theme.accent }} />
                <span className="text-sm font-semibold" style={{ color: theme.text }}>{c.label}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${theme.accent}15`, color: theme.accent }}>{c.type}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setReveal(r => ({ ...r, [c._id]: !r[c._id] }))} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}>
                  {reveal[c._id] ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button onClick={() => delMut.mutate(c._id)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }}><Trash2 size={13} /></button>
              </div>
            </div>
            {reveal[c._id] && c.data && (
              <div className="grid sm:grid-cols-3 gap-2 mt-2 p-3 rounded-xl" style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                {Object.entries(c.data).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[9px] uppercase font-mono mb-0.5" style={{ color: theme.muted }}>{k}</p>
                    <p className="text-xs font-mono" style={{ color: theme.text }}>{v || '—'}</p>
                  </div>
                ))}
              </div>
            )}
            {c.notes && <p className="text-xs mt-2" style={{ color: theme.muted }}>{c.notes}</p>}
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Credential">
        <div className="space-y-3">
          <Input label="Label" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Main cPanel" />
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {['cpanel','ftp','sftp','database','email','ssh','other'].map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Username" value={form.data.username} onChange={e => setForm(f => ({ ...f, data: { ...f.data, username: e.target.value } }))} />
          <Input label="Password" type="password" value={form.data.password} onChange={e => setForm(f => ({ ...f, data: { ...f.data, password: e.target.value } }))} />
          <Input label="URL / Host" value={form.data.url} onChange={e => setForm(f => ({ ...f, data: { ...f.data, url: e.target.value } }))} />
          <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button loading={addMut.isPending} onClick={() => { if (!form.label) return toast.error('Label required'); addMut.mutate(form) }}>Store Securely</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
