import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, StatusBadge, Loader, PageHeader, ConfirmDialog } from '../../components/ui/index'
import {
  Server, ArrowLeft, Edit2, Trash2, Shield, Eye, EyeOff, Copy, Check,
  Calendar, User, Cpu, Mail, ToggleLeft, ToggleRight, Save, X
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const PLAN_COLORS = {
  shared: '#62B849', vps: '#4A8FA8', dedicated: '#F0A045', cloud: '#8B5CF6', reseller: '#EC4899',
}
const PLAN_LABELS = {
  shared: 'Shared Hosting', vps: 'VPS', dedicated: 'Dedicated', cloud: 'Cloud', reseller: 'Reseller',
}

function InfoRow({ label, value, mono = false, accent = false }) {
  const { theme } = useAuth()
  return (
    <div className="flex items-start justify-between gap-3 py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <span className="text-[11px] font-mono uppercase tracking-wide flex-shrink-0" style={{ color: theme.muted }}>{label}</span>
      <span className={`text-xs text-right ${mono ? 'font-mono' : ''}`} style={{ color: accent ? theme.accent : theme.text }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function CopyField({ label, value }) {
  const { theme } = useAuth()
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-2 py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <span className="text-[11px] font-mono uppercase tracking-wide" style={{ color: theme.muted }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono" style={{ color: theme.text }}>{show ? value : '••••••••'}</span>
        <button onClick={() => setShow(s => !s)} className="p-1 rounded opacity-60 hover:opacity-100" style={{ color: theme.muted }}>
          {show ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
        <button onClick={copy} className="p-1 rounded opacity-60 hover:opacity-100" style={{ color: copied ? '#62B849' : theme.muted }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
    </div>
  )
}

export default function HostingDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [delOpen, setDelOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [showCreds, setShowCreds] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['hosting', id],
    queryFn: () => hostingService.getOne(id),
    retry: false,
  })

  const { data: credsData } = useQuery({
    queryKey: ['hosting-creds', id],
    queryFn: () => hostingService.getCredentials(id),
    enabled: showCreds,
    retry: false,
  })

  const { data: sslData } = useQuery({
    queryKey: ['hosting-ssl', id],
    queryFn: () => hostingService.getSSLStatus(id),
    retry: false,
  })

  const updateMut = useMutation({
    mutationFn: d => hostingService.update(id, d),
    onSuccess: () => {
      toast.success('Hosting updated')
      qc.invalidateQueries(['hosting', id])
      qc.invalidateQueries(['hosting'])
      setEditing(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: () => hostingService.remove(id),
    onSuccess: () => { toast.success('Hosting deleted'); qc.invalidateQueries(['hosting']); navigate('/hosting') },
    onError: err => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  if (isLoading) return <Loader text="Loading hosting details..." />

  const h = data?.data?.data?.hosting
  if (!h) return (
    <div className="text-center py-20" style={{ color: theme.muted }}>
      <Server size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">Hosting not found.</p>
    </div>
  )

  // Safe date helpers — guards against null/undefined/invalid dates
  const safeDate = (val) => { if (!val) return null; const d = new Date(val); return isNaN(d.getTime()) ? null : d }
  const safeFmt = (val, fmt) => { const d = safeDate(val); return d ? format(d, fmt) : '—' }
  const safeDist = (val) => { const d = safeDate(val); return d ? formatDistanceToNow(d, { addSuffix: true }) : '—' }

  const expiryD = safeDate(h.expiryDate)
  const dl = expiryD ? Math.ceil((expiryD - new Date()) / 86400000) : null
  const expiryColor = dl === null ? '#94a3b8' : dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849'
  const planColor = PLAN_COLORS[h.planType] || theme.accent
  const creds = credsData?.data?.data?.credentials
  const ssl = sslData?.data?.data?.ssl

  const startEdit = () => {
    setEditForm({
      label: h.label,
      provider: h.provider || '',
      serverIP: h.serverIP || '',
      serverLocation: h.serverLocation || '',
      expiryDate: h.expiryDate ? h.expiryDate.split('T')[0] : '',
      renewalCost: h.renewalCost || '',
      autoRenewal: h.autoRenewal || false,
      notes: h.notes || '',
    })
    setEditing(true)
  }

  const handleEditChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSave = () => {
    if (!editForm.label) return toast.error('Label is required')
    updateMut.mutate({ ...editForm, renewalCost: editForm.renewalCost ? Number(editForm.renewalCost) : undefined })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/hosting')} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: theme.muted }}>
              <ArrowLeft size={16} />
            </button>
            <Server size={16} style={{ color: planColor }} />
            <span>{h.label}</span>
          </div>
        }
        subtitle={`${PLAN_LABELS[h.planType] || h.planType}${h.provider ? ` · ${h.provider}` : ''}`}
        actions={
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Button>
                <Button onClick={handleSave} loading={updateMut.isPending}><Save size={13} /> Save</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={startEdit}><Edit2 size={13} /> Edit</Button>
                <Button variant="danger" onClick={() => setDelOpen(true)}><Trash2 size={13} /> Delete</Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Status bar */}
          <Card className="p-4">
            <div className="flex items-center flex-wrap gap-4">
              <StatusBadge status={h.status} />
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg capitalize font-bold"
                style={{ background: `${planColor}18`, color: planColor }}>
                {PLAN_LABELS[h.planType] || h.planType}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} style={{ color: theme.muted }} />
                <span className="text-xs font-mono" style={{ color: expiryColor }}>
                  {dl === null ? 'No expiry set' : dl < 0 ? 'Expired' : `${dl} days left`}{expiryD ? ` · ${safeFmt(h.expiryDate, 'dd MMM yyyy')}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                {h.autoRenewal
                  ? <ToggleRight size={14} style={{ color: '#62B849' }} />
                  : <ToggleLeft size={14} style={{ color: theme.muted }} />}
                <span className="text-[11px] font-mono" style={{ color: h.autoRenewal ? '#62B849' : theme.muted }}>
                  Auto-renewal {h.autoRenewal ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </Card>

          {/* Details / Edit form */}
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Server Details</p>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono uppercase" style={{ color: theme.muted }}>Label *</label>
                  <input name="label" value={editForm.label} onChange={handleEditChange}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['serverIP', 'Server IP', 'font-mono'], ['serverLocation', 'Location', ''], ['expiryDate', 'Expiry Date', 'font-mono'], ['renewalCost', 'Renewal Cost (₹)', 'font-mono']].map(([name, lbl, cls]) => (
                    <div key={name}>
                      <label className="text-[11px] font-mono uppercase" style={{ color: theme.muted }}>{lbl}</label>
                      <input name={name} type={name === 'expiryDate' ? 'date' : name === 'renewalCost' ? 'number' : 'text'}
                        value={editForm[name]} onChange={handleEditChange}
                        className={`w-full mt-1 px-3 py-2 rounded-xl text-xs outline-none ${cls}`}
                        style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase" style={{ color: theme.muted }}>Notes</label>
                  <textarea name="notes" value={editForm.notes} onChange={handleEditChange} rows={3}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs outline-none resize-none"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                </div>
                <div className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setEditForm(f => ({ ...f, autoRenewal: !f.autoRenewal }))}>
                  {editForm.autoRenewal
                    ? <ToggleRight size={18} style={{ color: theme.accent }} />
                    : <ToggleLeft size={18} style={{ color: theme.muted }} />}
                  <span className="text-xs font-mono" style={{ color: editForm.autoRenewal ? theme.accent : theme.muted }}>
                    Auto-renewal {editForm.autoRenewal ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <InfoRow label="Label" value={h.label} />
                <InfoRow label="Provider" value={h.provider} />
                <InfoRow label="Server IP" value={h.serverIP} mono />
                <InfoRow label="Location" value={h.serverLocation} />
                <InfoRow label="Control Panel" value={h.controlPanel?.toUpperCase()} mono accent />
                <InfoRow label="Disk Space" value={h.diskSpace} />
                <InfoRow label="Bandwidth" value={h.bandwidth} />
                <InfoRow label="Expiry" value={safeFmt(h.expiryDate, 'dd MMM yyyy')} mono />
                <InfoRow label="Renewal Cost" value={h.renewalCost ? `₹${h.renewalCost}` : '—'} mono />
                {h.notes && <InfoRow label="Notes" value={h.notes} />}
              </div>
            )}
          </Card>

          {/* Email Hosting */}
          {h.emailHosting?.enabled && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={13} style={{ color: theme.accent }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>Email Hosting</p>
              </div>
              <InfoRow label="Provider" value={h.emailHosting.provider} />
              <InfoRow label="Accounts" value={h.emailHosting.accounts} mono />
              <InfoRow label="Storage" value={h.emailHosting.storageGB ? `${h.emailHosting.storageGB} GB` : '—'} />
              {h.emailHosting.expiryDate && <InfoRow label="Expiry" value={safeFmt(h.emailHosting.expiryDate, 'dd MMM yyyy')} mono />}
              {h.emailHosting.renewalCost && <InfoRow label="Renewal Cost" value={`₹${h.emailHosting.renewalCost}`} mono />}
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Client */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={13} style={{ color: theme.accent }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>Client</p>
            </div>
            {h.clientId ? (
              <button onClick={() => navigate(`/clients/${h.clientId._id || h.clientId}`)}
                className="w-full text-left hover:bg-white/5 rounded-xl p-2 transition-colors -m-2">
                <p className="text-sm font-semibold" style={{ color: theme.accent }}>{h.clientId.name || h.clientId}</p>
                {h.clientId.email && <p className="text-[11px] font-mono mt-0.5" style={{ color: theme.muted }}>{h.clientId.email}</p>}
              </button>
            ) : (
              <p className="text-xs" style={{ color: theme.muted }}>No client assigned</p>
            )}
          </Card>

          {/* SSL */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} style={{ color: theme.accent }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>SSL Status</p>
            </div>
            {ssl ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: ssl.valid ? '#62B849' : '#C94040' }} />
                  <span className="text-xs font-semibold" style={{ color: ssl.valid ? '#62B849' : '#C94040' }}>
                    {ssl.valid ? 'Valid' : 'Invalid / Missing'}
                  </span>
                </div>
                {ssl.expiresAt && <InfoRow label="Expires" value={safeFmt(ssl.expiresAt, 'dd MMM yyyy')} mono />}
                {ssl.issuer && <InfoRow label="Issuer" value={ssl.issuer} />}
              </div>
            ) : (
              <p className="text-xs" style={{ color: theme.muted }}>SSL info not available</p>
            )}
          </Card>

          {/* Credentials */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={13} style={{ color: theme.accent }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>Credentials</p>
              </div>
              <button onClick={() => setShowCreds(s => !s)} className="text-[10px] font-mono hover:underline" style={{ color: theme.accent }}>
                {showCreds ? 'Hide' : 'Reveal'}
              </button>
            </div>
            {showCreds && creds ? (
              <div>
                <CopyField label="Username" value={creds.username} />
                <CopyField label="Password" value={creds.password} />
                {creds.url && (
                  <div className="flex items-center justify-between gap-2 py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <span className="text-[11px] font-mono uppercase tracking-wide" style={{ color: theme.muted }}>URL</span>
                    <a href={creds.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono hover:underline truncate max-w-[180px]"
                      style={{ color: theme.accent }}>{creds.url}</a>
                  </div>
                )}
                {!creds.username && !creds.password && (
                  <p className="text-xs" style={{ color: theme.muted }}>No credentials stored</p>
                )}
              </div>
            ) : !showCreds ? (
              <p className="text-xs" style={{ color: theme.muted }}>Click Reveal to view credentials</p>
            ) : (
              <p className="text-xs" style={{ color: theme.muted }}>No credentials available</p>
            )}
          </Card>

          {/* Meta */}
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Meta</p>
            <InfoRow label="Created" value={safeDist(h.createdAt)} />
            <InfoRow label="Updated" value={safeDist(h.updatedAt)} />
            <InfoRow label="ID" value={h._id} mono />
          </Card>
        </div>
      </div>

      <ConfirmDialog open={delOpen} onClose={() => setDelOpen(false)}
        onConfirm={() => deleteMut.mutate()} loading={deleteMut.isPending}
        title="Delete Hosting" message="Delete this hosting plan permanently? This cannot be undone." />
    </div>
  )
}