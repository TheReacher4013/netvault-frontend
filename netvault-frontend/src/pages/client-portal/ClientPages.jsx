import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { clientPortalService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, StatusBadge, Loader, EmptyState, PageHeader, Button } from '../../components/ui/index'
import { Globe, Server, FileText, Bell, Download, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ExternalLink, RefreshCw, Info } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

// ── My Domains ────────────────────────────────────────────────────────────────
export function ClientDomains() {
  const { theme } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['client-domains'],
    queryFn: () => clientPortalService.domains(),
  })
  if (isLoading) return <Loader text="Loading your domains..." />
  const domains = data?.data?.data?.domains || []

  return (
    <div className="space-y-5">
      <PageHeader title="My Domains" subtitle={`${domains.length} domains under management`} />
      {domains.length === 0 ? (
        <Card><EmptyState icon={Globe} title="No domains" description="Your agency has not linked any domains to you yet." /></Card>
      ) : (
        <div className="space-y-4">
          {domains.map(d => {
            const dl = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000)
            const isDown = d.monitoring?.currentState === 'down'
            const isExpired = d.status === 'expired'

            return (
              <Card key={d._id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Domain info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${theme.accent}15` }}>
                      <Globe size={16} style={{ color: theme.accent }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold font-mono text-sm" style={{ color: theme.text }}>{d.name}</p>
                        <StatusBadge status={d.status} />
                        {/* Live status dot */}
                        {d.monitoring?.currentState === 'up' && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            Online
                          </span>
                        )}
                        {d.monitoring?.currentState === 'down' && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                            <XCircle size={10} /> Down
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>
                        {d.registrar || 'Unknown registrar'} · Expires {format(new Date(d.expiryDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Days left + open site */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Days left</p>
                      <p className="font-mono font-bold text-sm" style={{
                        color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849'
                      }}>
                        {dl < 0 ? `Expired ${Math.abs(dl)}d ago` : `${dl}d`}
                      </p>
                    </div>
                    <button onClick={() => window.open(`https://${d.name}`, '_blank')}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: `${theme.accent}10`, color: theme.accent }}
                      title="Visit website">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                {/* Down / expired warning with explanation */}
                {(isDown || isExpired) && (
                  <div className="mt-4 p-3 rounded-xl text-xs space-y-1.5"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
                    <p className="font-semibold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
                      <AlertTriangle size={12} />
                      {isExpired ? 'Domain Expired' : 'Domain Appears Offline'}
                    </p>
                    <p style={{ color: theme.muted }}>
                      {isExpired
                        ? 'This domain has expired and may no longer be active. Contact your agency to renew it immediately.'
                        : 'Your website is currently unreachable. This could be due to a server issue, DNS misconfiguration, or the domain expiring soon. Contact your agency for assistance.'}
                    </p>
                  </div>
                )}

                {/* Auto renewal status */}
                {d.autoRenewal && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px]"
                    style={{ color: '#10B981' }}>
                    <RefreshCw size={11} />
                    Auto-renewal is enabled — your domain renews automatically
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── My Hosting ────────────────────────────────────────────────────────────────
export function ClientHosting() {
  const { theme } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['client-hosting'],
    queryFn: () => clientPortalService.hosting(),
  })
  if (isLoading) return <Loader text="Loading hosting..." />
  const hosting = data?.data?.data?.hosting || []

  return (
    <div className="space-y-5">
      <PageHeader title="My Hosting" subtitle={`${hosting.length} hosting plans`} />

      {/* Usage guide */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Info size={16} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>How Your Hosting Works</p>
            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
              Your hosting plan is the server where your website files live. Your domain name points to this server
              via DNS, making your website accessible worldwide. If your hosting expires or goes down, your website
              will become unavailable. Contact your agency if you notice any issues.
            </p>
          </div>
        </div>
      </Card>

      {hosting.length === 0 ? (
        <Card><EmptyState icon={Server} title="No hosting" description="Your agency has not linked any hosting plans to you yet." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosting.map(h => {
            const dl = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)
            const isDown = h.uptime?.currentStatus === 'down'
            return (
              <Card key={h._id} className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${theme.accent}18` }}>
                    <Server size={16} style={{ color: theme.accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{h.label}</p>
                    <p className="text-xs capitalize" style={{ color: theme.muted }}>{h.planType} · {h.provider || '—'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: theme.muted }}>Status</span>
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.muted }}>Server</span>
                    <span className="font-mono" style={{ color: isDown ? '#EF4444' : '#10B981' }}>
                      {h.uptime?.currentStatus === 'up' ? '● Online' : h.uptime?.currentStatus === 'down' ? '● Offline' : '● Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.muted }}>Expiry</span>
                    <span className="font-mono" style={{ color: theme.text }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.muted }}>Days left</span>
                    <span className="font-mono font-bold"
                      style={{ color: dl < 0 ? '#C94040' : dl <= 30 ? '#F0A045' : theme.accent }}>
                      {dl < 0 ? `Expired ${Math.abs(dl)}d ago` : `${dl}d`}
                    </span>
                  </div>
                  {h.uptime?.uptimePercent != null && (
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Uptime</span>
                      <span className="font-mono font-bold"
                        style={{ color: h.uptime.uptimePercent >= 99 ? '#62B849' : '#F0A045' }}>
                        {h.uptime.uptimePercent}%
                      </span>
                    </div>
                  )}
                </div>
                {isDown && (
                  <div className="mt-3 p-2 rounded-lg text-[11px]"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                    ⚠ Server appears offline. Contact your agency.
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export function ClientInvoicesList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['client-invoices', status],
    queryFn: () => clientPortalService.invoices({ status }),
  })
  if (isLoading) return <Loader text="Loading invoices..." />
  const invoices = data?.data?.data?.invoices || []

  return (
    <div className="space-y-5">
      <PageHeader title="My Invoices" subtitle={`${invoices.length} invoices`} />
      <Card className="p-4">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
          <option value="">All Status</option>
          {['draft', 'sent', 'pending', 'paid', 'overdue'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Card>
      {invoices.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No invoices" description="No invoices have been issued to you yet." /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Invoice', 'Amount', 'Due Date', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] cursor-pointer"
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                    onClick={() => navigate(`/client-portal/invoices/${inv._id}`)}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: theme.text }}>{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: theme.text }}>₹{inv.total?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                      {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={async () => {
                        try {
                          const res = await clientPortalService.downloadInvoice(inv._id)
                          const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
                          Object.assign(document.createElement('a'), { href: url, download: `${inv.invoiceNo}.pdf` }).click()
                        } catch { toast.error('Download failed') }
                      }} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: theme.accent }}>
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Invoice Detail ────────────────────────────────────────────────────────────
export function ClientInvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['client-invoice', id], queryFn: () => clientPortalService.invoice(id) })
  if (isLoading) return <Loader text="Loading invoice..." />
  const inv = data?.data?.data?.invoice
  if (!inv) return <div style={{ color: theme.muted }} className="text-center py-20">Invoice not found</div>

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title={inv.invoiceNo} subtitle={`₹${inv.total?.toLocaleString()}`}
        actions={<Button variant="ghost" size="sm" onClick={() => navigate('/client-portal/invoices')}><ArrowLeft size={13} />Back</Button>} />
      <Card className="p-6 space-y-4">
        {[
          ['Invoice #', inv.invoiceNo],
          ['Status', <StatusBadge status={inv.status} />],
          ['Amount', `₹${inv.total?.toLocaleString()}`],
          ['Due Date', inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'],
          ['Notes', inv.notes || '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <span className="text-xs" style={{ color: theme.muted }}>{k}</span>
            <span className="text-xs font-semibold" style={{ color: theme.text }}>{v}</span>
          </div>
        ))}
        <Button onClick={async () => {
          try {
            const res = await clientPortalService.downloadInvoice(id)
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
            Object.assign(document.createElement('a'), { href: url, download: `${inv.invoiceNo}.pdf` }).click()
          } catch { toast.error('Download failed') }
        }}>
          <Download size={14} /> Download PDF
        </Button>
      </Card>
    </div>
  )
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function ClientAlerts() {
  const { theme } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['client-alerts'], queryFn: () => clientPortalService.alerts() })
  if (isLoading) return <Loader text="Loading alerts..." />
  const alerts = data?.data?.data?.alerts || []
  const severityColor = { danger: '#EF4444', warning: '#F0A045', info: theme.accent }

  return (
    <div className="space-y-5">
      <PageHeader title="My Alerts" subtitle={`${alerts.length} notifications`} />
      {alerts.length === 0 ? (
        <Card><EmptyState icon={Bell} title="No alerts" description="You have no active alerts." /></Card>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => (
            <Card key={a._id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: severityColor[a.severity] || theme.muted }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{a.message}</p>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: theme.muted }}>
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function ClientProfile() {
  const { theme, user } = useAuth()
  return (
    <div className="space-y-5 max-w-lg">
      <PageHeader title="My Profile" subtitle="Your account information" />
      <Card className="p-6 space-y-4">
        {[
          ['Name', user?.name],
          ['Email', user?.email],
          ['Role', user?.role],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <span className="text-xs" style={{ color: theme.muted }}>{k}</span>
            <span className="text-xs font-semibold font-mono" style={{ color: theme.text }}>{v || '—'}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
