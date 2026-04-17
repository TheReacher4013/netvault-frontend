import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, Input, Select } from '../../components/ui/index'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const DNS_TYPES = ['A','AAAA','CNAME','MX','TXT','NS','SRV']

export default function DNSManager() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({ type: 'A', name: '', value: '', ttl: 3600, priority: '' })
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['domain', id], queryFn: () => domainService.getOne(id) })
  const domain = data?.data?.data?.domain

  const addMut = useMutation({
    mutationFn: (d) => domainService.addDNS(id, d),
    onSuccess: () => { toast.success('DNS record added'); qc.invalidateQueries(['domain', id]); setShowAdd(false); setForm({ type: 'A', name: '', value: '', ttl: 3600, priority: '' }) },
  })
  const delMut = useMutation({
    mutationFn: (rid) => domainService.deleteDNS(id, rid),
    onSuccess: () => { toast.success('DNS record deleted'); qc.invalidateQueries(['domain', id]) },
  })

  if (isLoading) return <Loader text="Loading DNS records..." />

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="DNS Manager" subtitle={domain?.name}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/domains/${id}`)}><ArrowLeft size={13} />Back</Button>
            <Button size="sm" onClick={() => setShowAdd(v => !v)}><Plus size={13} />Add Record</Button>
          </div>
        } />

      {/* Add form */}
      {showAdd && (
        <Card className="p-5 animate-fade-up">
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>New DNS Record</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {DNS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="@ or subdomain" />
            <Input label="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="IP or target" />
            <Input label="TTL" type="number" value={form.ttl} onChange={e => setForm(f => ({ ...f, ttl: parseInt(e.target.value) }))} />
            {form.type === 'MX' && <Input label="Priority" type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} />}
          </div>
          <div className="flex gap-2">
            <Button loading={addMut.isPending} onClick={() => { if (!form.name || !form.value) return toast.error('Name and value required'); addMut.mutate(form) }}>Add Record</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Records table */}
      <Card>
        <CardHeader title="DNS Records" subtitle={`${domain?.dnsRecords?.length || 0} records`} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {['Type','Name','Value','TTL',''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domain?.dnsRecords?.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-xs" style={{ color: theme.muted }}>No DNS records. Click "Add Record" to add one.</td></tr>
              )}
              {domain?.dnsRecords?.map(r => (
                <tr key={r._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="px-4 py-3"><span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${theme.accent}15`, color: theme.accent }}>{r.type}</span></td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.text }}>{r.name}</td>
                  <td className="px-4 py-3 text-xs font-mono max-w-xs truncate" style={{ color: theme.muted }}>{r.value}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{r.ttl}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => delMut.mutate(r._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#C94040' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
