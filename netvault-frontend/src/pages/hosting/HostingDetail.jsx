import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader, Input, Select } from '../../components/ui/index'
import { ArrowLeft, Eye, EyeOff, Edit3, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PLAN_TYPES = ['shared', 'vps', 'dedicated', 'cloud', 'reseller']
const CONTROL_PANELS = ['cpanel', 'plesk', 'directadmin', 'webmin', 'none']

export default function HostingDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showCreds, setShowCreds] = useState(false)
  const [creds, setCreds] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hosting', id],
    queryFn: () => hostingService.getOne(id),
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientService.getAll({ limit: 100 }),
  })

  const { data: uptimeData } = useQuery({
    queryKey: ['uptime-hosting', id],
    queryFn: () => hostingService.getUptimeLogs(id),
  })
  useEffect(() => {
    const h = data?.data?.data?.hosting
    if (h) {
      setForm({
        label: h.label || '',
        planType: h.planType || 'shared',
        provider: h.provider || '',
        serverIP: h.serverIP || '',
        serverLocation: h.serverLocation || '',
        diskSpace: h.diskSpace || '',
        bandwidth: h.bandwidth || '',
        expiryDate: h.expiryDate ? h.expiryDate.slice(0, 10) : '',
        controlPanel: h.controlPanel || 'cpanel',
        clientId: h.clientId?._id || h.clientId || '',
        renewalCost: h.renewalCost || '',
        sellingPrice: h.sellingPrice || '',
      })
    }
  }, [data])

  const updateMut = useMutation({
    mutationFn: (d) => hostingService.update(id, d),
    onSuccess: () => {
      toast.success('Hosting updated')
      qc.invalidateQueries(['hosting', id])
      qc.invalidateQueries(['hosting'])
      setEditing(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const handleShowCreds = async () => {
    if (creds) { setShowCreds(v => !v); return }
    try {
      const res = await hostingService.getCredentials(id)
      setCreds(res.data.data.credentials)
      setShowCreds(true)
    } catch { toast.error('Failed to load credentials') }
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = () => {
    if (!form.label?.trim()) return toast.error('Label is required')
    if (!form.expiryDate) return toast.error('Expiry date is required')
    updateMut.mutate({
      ...form,
      renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined,
      sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
      clientId: form.clientId || null,
    })
  }

  if (isLoading) return <Loader text="Loading hosting..." />

  const h = data?.data?.data?.hosting
  if (!h) return <div className="text-center py-20" style={{ color: theme.muted }}>Hosting not found</div>

  const clients = clientsData?.data?.data?.docs || []
  const uptimePct = uptimeData?.data?.data?.uptimePercent
  const daysLeft = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={h.label}
        subtitle={`${h.planType} · ${h.provider || 'Unknown provider'}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate('/hosting')}>
              <ArrowLeft size={13} />Back
            </Button>
            {!editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Edit3 size={13} />Edit
              </Button>
            ) : (
              <>
                <Button size="sm" loading={updateMut.isPending} onClick={handleSave}>
                  <Save size={13} />Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X size={13} />Cancel
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Hosting Information" />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <Input label="Label *" name="label" value={form.label} onChange={handleChange} />
                <Select label="Plan Type" name="planType" value={form.planType} onChange={handleChange}>
                  {PLAN_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </Select>
                <Input label="Provider" name="provider" value={form.provider} onChange={handleChange} />
                <Input label="Server IP" name="serverIP" value={form.serverIP} onChange={handleChange} />
                <Input label="Location" name="serverLocation" value={form.serverLocation} onChange={handleChange} />
                <Input label="Disk Space" name="diskSpace" value={form.diskSpace} onChange={handleChange} />
                <Input label="Bandwidth" name="bandwidth" value={form.bandwidth} onChange={handleChange} />
                <Input label="Expiry Date *" name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />
                <Select label="Control Panel" name="controlPanel" value={form.controlPanel} onChange={handleChange}>
                  {CONTROL_PANELS.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Select label="Assign Client" name="clientId" value={form.clientId} onChange={handleChange}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
                <Input label="Renewal Cost (₹)" name="renewalCost" type="number" value={form.renewalCost} onChange={handleChange} />
                <Input label="Selling Price (₹)" name="sellingPrice" type="number" value={form.sellingPrice} onChange={handleChange} />
              </>
            ) : (
              [
                ['Server IP', h.serverIP, true],
                ['Location', h.serverLocation, false],
                ['Control Panel', h.controlPanel, false],
                ['Disk Space', h.diskSpace, false],
                ['Bandwidth', h.bandwidth, false],
                ['Client', h.clientId?.name, false],
                ['Expiry', h.expiryDate ? format(new Date(h.expiryDate), 'dd MMM yyyy') : '—', true],
                ['Renewal Cost', h.renewalCost ? `₹${h.renewalCost}` : '—', false],
                ['Selling Price', h.sellingPrice ? `₹${h.sellingPrice}` : '—', false],
              ].map(([label, val, mono]) => (
                <div key={label}>
                  <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: theme.muted }}>{label}</p>
                  <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: theme.text }}>{val || '—'}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Status</p>
            <StatusBadge status={h.status} />
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Days Left</span>
                <span className="font-mono font-bold" style={{ color: daysLeft <= 30 ? '#F0A045' : theme.accent }}>{daysLeft}d</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Uptime</span>
                <span className="font-mono font-bold" style={{ color: uptimePct >= 99 ? '#62B849' : '#F0A045' }}>{uptimePct ?? 'N/A'}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Current</span>
                <StatusBadge status={h.uptime?.currentStatus || 'unknown'} />
              </div>
            </div>
          </Card>

          {!editing && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>cPanel Credentials</p>
                <button onClick={handleShowCreds} className="text-xs font-mono flex items-center gap-1" style={{ color: theme.accent }}>
                  {showCreds ? <><EyeOff size={11} />Hide</> : <><Eye size={11} />Show</>}
                </button>
              </div>
              {showCreds && creds ? (
                <div className="space-y-2">
                  {Object.entries(creds).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] uppercase" style={{ color: theme.muted }}>{k}</p>
                      <p className="text-xs font-mono" style={{ color: theme.text }}>{v || '—'}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: theme.muted }}>Click Show to reveal</p>}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}