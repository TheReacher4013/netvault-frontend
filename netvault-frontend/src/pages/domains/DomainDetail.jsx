import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader, Input, Select } from '../../components/ui/index'
import { Globe, Edit3, Save, X, Wifi, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DomainDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['domain', id],
    queryFn: () => domainService.getOne(id),
    onSuccess: (res) => setForm(res.data.data.domain),
  })
  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientService.getAll({ limit: 100 }) })

  const updateMut = useMutation({
    mutationFn: (d) => domainService.update(id, d),
    onSuccess: () => { toast.success('Domain updated'); qc.invalidateQueries(['domain', id]); setEditing(false) },
  })

  const domain = data?.data?.data?.domain
  const clients = clientsData?.data?.data?.docs || []

  if (isLoading) return <Loader text="Loading domain..." />
  if (!domain) return <div className="text-center py-20" style={{ color: theme.muted }}>Domain not found</div>

  const daysLeft = Math.ceil((new Date(domain.expiryDate) - new Date()) / 86400000)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const fields = [
    { key: 'name', label: 'Domain Name', mono: true },
    { key: 'registrar', label: 'Registrar' },
    { key: 'expiryDate', label: 'Expiry Date', format: v => format(new Date(v), 'dd MMM yyyy') },
    { key: 'renewalCost', label: 'Renewal Cost', format: v => v ? `₹${v}` : '—' },
    { key: 'sellingPrice', label: 'Selling Price', format: v => v ? `₹${v}` : '—' },
    { key: 'autoRenewal', label: 'Auto Renewal', format: v => v ? 'Yes' : 'No' },
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title={domain.name} subtitle={`${daysLeft > 0 ? daysLeft + ' days left' : 'EXPIRED'} · ${domain.registrar || 'No registrar'}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/domains')}><ArrowLeft size={13} />Back</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/domains/${id}/dns`)}><Wifi size={13} />DNS Manager</Button>
            {!editing
              ? <Button size="sm" onClick={() => setEditing(true)}><Edit3 size={13} />Edit</Button>
              : <>
                  <Button size="sm" loading={updateMut.isPending} onClick={() => updateMut.mutate(form)}><Save size={13} />Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={13} />Cancel</Button>
                </>}
          </div>
        } />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main info */}
        <Card className="lg:col-span-2">
          <CardHeader title="Domain Information" />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <Input label="Domain Name" name="name" value={form.name || ''} onChange={handleChange} />
                <Input label="Registrar" name="registrar" value={form.registrar || ''} onChange={handleChange} />
                <Input label="Expiry Date" name="expiryDate" type="date" value={form.expiryDate?.slice(0,10) || ''} onChange={handleChange} />
                <Select label="Assign Client" name="clientId" value={form.clientId?._id || form.clientId || ''} onChange={handleChange}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
                <Input label="Renewal Cost (₹)" name="renewalCost" type="number" value={form.renewalCost || ''} onChange={handleChange} />
                <Input label="Selling Price (₹)" name="sellingPrice" type="number" value={form.sellingPrice || ''} onChange={handleChange} />
              </>
            ) : fields.map(f => (
              <div key={f.key}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: theme.muted }}>{f.label}</p>
                <p className={`text-sm font-semibold ${f.mono ? 'font-mono' : ''}`} style={{ color: theme.text }}>
                  {domain[f.key] !== undefined && domain[f.key] !== '' ? (f.format ? f.format(domain[f.key]) : domain[f.key]) : '—'}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Status card */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Status</p>
            <StatusBadge status={domain.status} />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Days left</span>
                <span className="font-mono font-bold" style={{ color: daysLeft <= 7 ? '#C94040' : daysLeft <= 30 ? '#F0A045' : theme.accent }}>
                  {daysLeft > 0 ? `${daysLeft}d` : `Expired ${Math.abs(daysLeft)}d ago`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Auto Renewal</span>
                <span className="font-mono" style={{ color: domain.autoRenewal ? '#62B849' : theme.muted }}>
                  {domain.autoRenewal ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Client</span>
                <span className="font-mono" style={{ color: theme.text }}>{domain.clientId?.name || 'Unassigned'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Nameservers</p>
            {domain.nameservers?.length > 0
              ? domain.nameservers.map((ns, i) => <p key={i} className="text-xs font-mono py-1" style={{ color: theme.text }}>{ns}</p>)
              : <p className="text-xs" style={{ color: theme.muted }}>No nameservers set</p>}
          </Card>
        </div>
      </div>

      {/* DNS Records */}
      <Card>
        <CardHeader title="DNS Records" subtitle={`${domain.dnsRecords?.length || 0} records`}
          actions={<Button size="sm" onClick={() => navigate(`/domains/${id}/dns`)}>Manage DNS</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {['Type','Name','Value','TTL'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domain.dnsRecords?.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-xs" style={{ color: theme.muted }}>No DNS records. <button onClick={() => navigate(`/domains/${id}/dns`)} className="underline" style={{ color: theme.accent }}>Add records →</button></td></tr>
              )}
              {domain.dnsRecords?.map(r => (
                <tr key={r._id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="px-4 py-2.5"><span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${theme.accent}15`, color: theme.accent }}>{r.type}</span></td>
                  <td className="px-4 py-2.5 text-xs font-mono" style={{ color: theme.text }}>{r.name}</td>
                  <td className="px-4 py-2.5 text-xs font-mono max-w-xs truncate" style={{ color: theme.muted }}>{r.value}</td>
                  <td className="px-4 py-2.5 text-xs font-mono" style={{ color: theme.muted }}>{r.ttl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
