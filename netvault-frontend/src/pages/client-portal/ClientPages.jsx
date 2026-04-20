import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { clientPortalService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, StatusBadge, Loader, EmptyState, PageHeader, Button } from '../../components/ui/index'
import { Globe, Server, FileText, Bell, Download, ArrowLeft } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

// ── Domains ─────────────────
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
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Domain', 'Registrar', 'Expiry', 'Days Left', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {domains.map(d => {
                  const dl = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000)
                  return (
                    <tr key={d._id} className="hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: theme.text }}>{d.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{d.registrar || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                        {format(new Date(d.expiryDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold"
                          style={{ color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849' }}>
                          {dl < 0 ? `${Math.abs(dl)}d ago` : `${dl}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Hosting ───────────
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
      {hosting.length === 0 ? (
        <Card><EmptyState icon={Server} title="No hosting" description="Your agency has not linked any hosting plans to you yet." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosting.map(h => {
            const dl = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)
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
                    <span style={{ color: theme.muted }}>Expiry</span>
                    <span className="font-mono" style={{ color: theme.text }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.muted }}>Days left</span>
                    <span className="font-mono font-bold" style={{ color: dl <= 30 ? '#F0A045' : theme.accent }}>{dl}d</span>
                  </div>
                  {h.uptime && (
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Uptime</span>
                      <span className="font-mono font-bold"
                        style={{ color: h.uptime.uptimePercent >= 99 ? '#62B849' : '#F0A045' }}>
                        {h.uptime.uptimePercent ?? '—'}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Invoices list ───────────
export function ClientInvoicesList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: () => clientPortalService.invoices(),
  })
  if (isLoading) return <Loader text="Loading invoices..." />
  const invoices = data?.data?.data?.invoices || []

  const handleDownload = async (id, no) => {
    try {
      const res = await clientPortalService.downloadInvoice(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `${no}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download PDF') }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Invoices" subtitle={`${invoices.length} total`} />
      {invoices.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No invoices yet" /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Invoice #', 'Amount', 'Status', 'Due', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] cursor-pointer" style={{ borderBottom: `1px solid ${theme.border}` }}
                    onClick={() => navigate(`/client-portal/invoices/${inv._id}`)}>
                    <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: theme.accent }}>{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: theme.text }}>₹{inv.total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(inv.dueDate), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDownload(inv._id, inv.invoiceNo)}
                        className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}>
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

// ── Invoice detail ─────────
export function ClientInvoiceDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['client-invoice', id],
    queryFn: () => clientPortalService.invoice(id),
  })
  if (isLoading) return <Loader text="Loading invoice..." />
  const inv = data?.data?.data?.invoice
  if (!inv) return <div className="text-center py-20" style={{ color: theme.muted }}>Invoice not found</div>

  const handleDownload = async () => {
    try {
      const res = await clientPortalService.downloadInvoice(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `${inv.invoiceNo}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download PDF') }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title={inv.invoiceNo} subtitle={`Created ${format(new Date(inv.createdAt), 'dd MMM yyyy')}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client-portal/invoices')}><ArrowLeft size={13} />Back</Button>
            <Button size="sm" onClick={handleDownload}><Download size={13} />PDF</Button>
          </div>
        } />
      <Card>
        <CardHeader title="Invoice Details" />
        <div className="p-5">
          <table className="w-full mb-5">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                  <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.items?.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td className="py-2.5 text-xs" style={{ color: theme.text }}>{item.description}</td>
                  <td className="py-2.5 text-xs font-mono" style={{ color: theme.muted }}>{item.quantity}</td>
                  <td className="py-2.5 text-xs font-mono" style={{ color: theme.muted }}>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 text-sm font-mono font-bold" style={{ color: theme.accent }}>₹{item.total?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1.5 text-xs ml-auto max-w-xs">
            {[
              ['Subtotal', `₹${inv.subtotal?.toLocaleString('en-IN')}`],
              [`Tax (${inv.taxRate}%)`, `₹${inv.taxAmount?.toLocaleString('en-IN')}`],
              ['Discount', `-₹${inv.discount?.toLocaleString('en-IN')}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span style={{ color: theme.muted }}>{k}</span>
                <span className="font-mono" style={{ color: theme.text }}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-base font-bold" style={{ borderTop: `1px solid ${theme.border}` }}>
              <span style={{ color: theme.text }}>Total</span>
              <span className="font-mono" style={{ color: theme.accent }}>₹{inv.total?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span style={{ color: theme.muted }}>Status</span>
              <StatusBadge status={inv.status} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── Alerts ──────────────────────────────────────────────────────────────
export function ClientAlerts() {
  const { theme } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['client-alerts'],
    queryFn: () => clientPortalService.alerts(),
    refetchInterval: 60000,
  })
  if (isLoading) return <Loader text="Loading alerts..." />
  const notifs = data?.data?.data?.notifications || []

  const SEVERITY = { danger: '#C94040', warning: '#F0A045', success: '#62B849', info: theme.accent }

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Alerts" subtitle={`${notifs.length} shown`} />
      <Card>
        {notifs.length === 0 ? (
          <EmptyState icon={Bell} title="No alerts" description="All caught up." />
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {notifs.map(n => (
              <div key={n._id} className="flex items-start gap-4 px-5 py-4" style={{ opacity: n.read ? 0.6 : 1 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${SEVERITY[n.severity] || theme.accent}12` }}>
                  <Bell size={14} style={{ color: SEVERITY[n.severity] || theme.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{n.message}</p>
                  <p className="text-[10px] mt-1.5 font-mono" style={{ color: theme.muted }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Minimal Profile page ────────────────────────────────────────────────
export function ClientProfile() {
  const { user, theme } = useAuth()
  return (
    <div className="max-w-lg space-y-5">
      <PageHeader title="Profile" subtitle="Your account details" />
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-base" style={{ color: theme.text }}>{user?.name}</p>
            <p className="text-xs font-mono" style={{ color: theme.muted }}>{user?.email}</p>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded mt-1 inline-block capitalize"
              style={{ background: `${theme.accent}15`, color: theme.accent }}>{user?.role}</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: theme.muted }}>
          Need to update your details? Please contact your agency.
        </p>
      </Card>
    </div>
  )
}
