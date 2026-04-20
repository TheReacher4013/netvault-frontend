import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clientPortalService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { StatCard, Card, CardHeader, StatusBadge, Loader, EmptyState, PageHeader } from '../../components/ui/index'
import { Globe, Server, FileText, AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function ClientOverview() {
  const { theme, user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['client-overview'],
    queryFn: () => clientPortalService.overview(),
  })

  if (isLoading) return <Loader text="Loading your overview..." />

  const d = data?.data?.data || {}
  const { client, counts = {}, expiringDomains = [], recentInvoices = [], outstanding = 0 } = d

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: theme.text }}>
          Welcome, <span style={{ color: theme.accent }}>{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-xs font-mono mt-1" style={{ color: theme.muted }}>
          {format(new Date(), 'EEEE, MMMM d yyyy')}
          {client?.company ? ` · ${client.company}` : ''}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Your Domains"  value={counts.domains || 0} icon={Globe}
          delay={0}   onClick={() => navigate('/client-portal/domains')} />
        <StatCard label="Your Hosting"  value={counts.hosting || 0} icon={Server}
          delay={60}  onClick={() => navigate('/client-portal/hosting')} />
        <StatCard label="Outstanding"   value={`₹${outstanding.toLocaleString('en-IN')}`} icon={FileText}
          trend={outstanding > 0 ? 'Action needed' : 'All paid'} trendUp={outstanding === 0}
          delay={120} onClick={() => navigate('/client-portal/invoices')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Expiring domains */}
        <Card>
          <CardHeader title="⚠️ Expiring Soon"
            subtitle={expiringDomains.length ? `${expiringDomains.length} in next 30 days` : 'No upcoming renewals'}
          />
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {expiringDomains.length === 0 ? (
              <EmptyState icon={Globe} title="Nothing expires soon 🎉" description="All your domains are safe" />
            ) : expiringDomains.slice(0, 5).map(d => {
              const daysLeft = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000)
              return (
                <div key={d._id} className="flex items-center gap-3 px-4 py-3">
                  <Globe size={14} style={{ color: theme.accent }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate font-mono" style={{ color: theme.text }}>{d.name}</p>
                    <p className="text-[11px] font-mono" style={{ color: theme.muted }}>
                      Expires {format(new Date(d.expiryDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                  <span className="text-[10px] font-mono font-bold"
                    style={{ color: daysLeft <= 7 ? '#C94040' : '#F0A045' }}>
                    {daysLeft}d
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent invoices */}
        <Card>
          <CardHeader title="Recent Invoices" subtitle={`${recentInvoices.length} shown`}
            actions={<button onClick={() => navigate('/client-portal/invoices')}
              className="text-xs font-mono hover:underline" style={{ color: theme.accent }}>View all →</button>} />
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {recentInvoices.length === 0 ? (
              <EmptyState icon={FileText} title="No invoices yet" />
            ) : recentInvoices.map(inv => (
              <div key={inv._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => navigate(`/client-portal/invoices/${inv._id}`)}>
                <Clock size={13} style={{ color: theme.accent }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-bold" style={{ color: theme.accent }}>{inv.invoiceNo}</p>
                  <p className="text-[11px]" style={{ color: theme.muted }}>
                    Due {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                  </p>
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: theme.text }}>
                  ₹{inv.total.toLocaleString('en-IN')}
                </span>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
