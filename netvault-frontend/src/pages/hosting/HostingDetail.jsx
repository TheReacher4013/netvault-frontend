import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader, Input, Select } from '../../components/ui/index'
import { ArrowLeft, Eye, EyeOff, Edit3, Save, X, ToggleLeft, ToggleRight, Copy, Mail, Shield, AlertTriangle } from 'lucide-react'
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

  const { data, isLoading } = useQuery({ queryKey: ['hosting', id], queryFn: () => hostingService.getOne(id) })
  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientService.getAll({ limit: 100 }) })
  const { data: uptimeData } = useQuery({ queryKey: ['uptime-hosting', id], queryFn: () => hostingService.getUptimeLogs(id) })

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
        autoRenewal: h.autoRenewal || false,
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
    // Validate future date
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (new Date(form.expiryDate) <= today) return toast.error('Expiry date must be in the future')
    updateMut.mutate({
      ...form,
      renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined,
      clientId: form.clientId || null,
    })
  }

  if (isLoading) return <Loader text="Loading hosting..." />

  const h = data?.data?.data?.hosting
  if (!h) return <div className="text-center py-20" style={{ color: theme.muted }}>Hosting not found</div>

  const clients = clientsData?.data?.data?.docs || []
  const uptimePct = uptimeData?.data?.data?.uptimePercent
  const daysLeft = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const expiryInPast = form.expiryDate && new Date(form.expiryDate) <= new Date()

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={h.label}
        subtitle={`${h.planType} · ${h.provider || 'Unknown provider'}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate('/hosting')}><ArrowLeft size={13} />Back</Button>
            {!editing ? (
              <Button size="sm" onClick={() => setEditing(true)}><Edit3 size={13} />Edit</Button>
            ) : (
              <>
                <Button size="sm" loading={updateMut.isPending} onClick={handleSave}><Save size={13} />Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={13} />Cancel</Button>
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
                  {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input label="Provider" name="provider" value={form.provider} onChange={handleChange} />
                <Input label="Server IP" name="serverIP" value={form.serverIP} onChange={handleChange} />
                <Input label="Location" name="serverLocation" value={form.serverLocation} onChange={handleChange} />
                <Input label="Disk Space" name="diskSpace" value={form.diskSpace} onChange={handleChange} />
                <Input label="Bandwidth" name="bandwidth" value={form.bandwidth} onChange={handleChange} />
                <div>
                  <Input label="Expiry Date *" name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} min={minDate} />
                  {expiryInPast && <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>⚠ Must be a future date</p>}
                </div>
                <Select label="Control Panel" name="controlPanel" value={form.controlPanel} onChange={handleChange}>
                  {CONTROL_PANELS.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Select label="Assign Client" name="clientId" value={form.clientId} onChange={handleChange}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
                <Input label="Renewal Cost (₹)" name="renewalCost" type="number" value={form.renewalCost} onChange={handleChange} />

                {/* Auto Renewal toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl col-span-full"
                  style={{ background: `${theme.accent}08`, border: `1px solid ${form.autoRenewal ? theme.accent + '50' : theme.border}` }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>Auto Renewal</p>
                    <p className="text-[11px]" style={{ color: theme.muted }}>Renews automatically 7 days before expiry</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, autoRenewal: !f.autoRenewal }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                      background: form.autoRenewal ? `${theme.accent}20` : `${theme.border}40`,
                      color: form.autoRenewal ? theme.accent : theme.muted,
                      border: `1px solid ${form.autoRenewal ? theme.accent : theme.border}`,
                    }}>
                    {form.autoRenewal ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    <span className="text-xs font-mono font-bold">{form.autoRenewal ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {[
                  ['Server IP', h.serverIP, true],
                  ['Location', h.serverLocation, false],
                  ['Control Panel', h.controlPanel, false],
                  ['Disk Space', h.diskSpace, false],
                  ['Bandwidth', h.bandwidth, false],
                  ['Client', h.clientId?.name, false],
                  ['Expiry', h.expiryDate ? format(new Date(h.expiryDate), 'dd MMM yyyy') : '—', true],
                  ['Renewal Cost', h.renewalCost ? `₹${h.renewalCost}` : '—', false],
                  ['Auto Renewal', h.autoRenewal ? '✓ Enabled' : 'Disabled', false],
                ].map(([label, val, mono]) => (
                  <div key={label}>
                    <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: theme.muted }}>{label}</p>
                    <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: theme.text }}>{val || '—'}</p>
                  </div>
                ))}
                {/* Server IP copy button */}
                {h.serverIP && (
                  <div className="col-span-full">
                    <button
                      onClick={() => { navigator.clipboard.writeText(h.serverIP); toast.success('Server IP copied!') }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: `${theme.accent}15`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
                      <Copy size={11} /> Copy Server IP ({h.serverIP})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Status */}
          <Card className="p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Status</p>
            <StatusBadge status={h.status} />
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Days Left</span>
                <span className="font-mono font-bold" style={{ color: daysLeft <= 7 ? '#EF4444' : daysLeft <= 30 ? '#F0A045' : theme.accent }}>
                  {daysLeft > 0 ? `${daysLeft}d` : `Expired ${Math.abs(daysLeft)}d ago`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Uptime</span>
                <span className="font-mono font-bold" style={{ color: uptimePct >= 99 ? '#62B849' : '#F0A045' }}>{uptimePct ?? 'N/A'}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Server</span>
                <StatusBadge status={h.uptime?.currentStatus || 'unknown'} />
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Auto Renewal</span>
                <span className="font-mono" style={{ color: h.autoRenewal ? '#62B849' : theme.muted }}>
                  {h.autoRenewal ? '✓ ON' : 'OFF'}
                </span>
              </div>
            </div>
          </Card>

          {/* Credentials */}
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
              ) : <p className="text-xs" style={{ color: theme.muted }}>Click Show to reveal credentials</p>}
            </Card>
          )}
        </div>
      </div>

      {/* Email Hosting */}
      {h.emailHosting?.enabled && (
        <Card className="p-5">
          <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
            <Mail size={14} style={{ color: theme.accent }} />
            Email Hosting
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            {[
              ['Provider', h.emailHosting.provider],
              ['Accounts', h.emailHosting.accounts ? `${h.emailHosting.accounts} accounts` : null],
              ['Storage', h.emailHosting.storageGB ? `${h.emailHosting.storageGB} GB / account` : null],
              ['Expiry', h.emailHosting.expiryDate ? format(new Date(h.emailHosting.expiryDate), 'dd MMM yyyy') : null],
              ['Renewal Cost', h.emailHosting.renewalCost ? `₹${h.emailHosting.renewalCost}` : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>{label}</p>
                <p className="font-mono font-semibold" style={{ color: theme.text }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Backup */}
      <Card className="p-5">
        <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: theme.text }}>
          <Shield size={14} style={{ color: h.backup?.enabled ? '#10B981' : theme.muted }} />
          Backup Status
        </p>
        {h.backup?.enabled ? (
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>Status</p>
              <span className="font-mono font-semibold" style={{ color: '#10B981' }}>✓ Enabled</span>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>Frequency</p>
              <span className="font-mono capitalize" style={{ color: theme.text }}>{h.backup?.frequency || 'weekly'}</span>
            </div>
            {h.backup?.location && (
              <div>
                <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>Location</p>
                <span className="font-mono" style={{ color: theme.text }}>{h.backup.location}</span>
              </div>
            )}
            {h.backup?.lastBackup && (
              <div>
                <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>Last Backup</p>
                <span className="font-mono" style={{ color: theme.text }}>{format(new Date(h.backup.lastBackup), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs" style={{ color: '#F0A045' }}>
            <AlertTriangle size={13} />
            <span>Backups not configured — recommend enabling daily or weekly backups.</span>
          </div>
        )}
      </Card>

    </div>
  )
}
