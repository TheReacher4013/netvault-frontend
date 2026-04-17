import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reportService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, StatusBadge, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import { Globe, Server, Shield, Clock } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function RenewalReport() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const [days, setDays] = useState(30)

  const { data, isLoading } = useQuery({
    queryKey: ['renewals', days],
    queryFn: () => reportService.getRenewals(days),
  })

  const renewals = data?.data?.data || {}
  const domains = renewals.domains || []
  const hosting = renewals.hosting || []
  const ssl = renewals.sslExpiring || []

  const dLeft = (d) => differenceInDays(new Date(d), new Date())
  const dColor = (n) => n <= 7 ? '#C94040' : n <= 15 ? '#F0A045' : '#62B849'

  if (isLoading) return <Loader text="Loading renewals..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Renewal Report"
        subtitle="Upcoming expirations that need attention"
        actions={
          <div className="flex gap-2">
            {[7, 15, 30, 60, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all"
                style={{
                  background: days === d ? theme.accent : `${theme.accent}10`,
                  color: days === d ? theme.bg : theme.text,
                  border: `1px solid ${days === d ? theme.accent : theme.border}`,
                }}>
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Globe, label: 'Domains', count: domains.length, color: theme.accent },
          { icon: Server, label: 'Hosting Plans', count: hosting.length, color: '#F0A045' },
          { icon: Shield, label: 'SSL Certs', count: ssl.length, color: '#C94040' },
        ].map(({ icon: Icon, label, count, color }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="font-display font-bold text-xl" style={{ color }}>{count}</div>
              <div className="text-xs" style={{ color: theme.muted }}>{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Domains expiring */}
      <Card>
        <CardHeader title={`🌐 Domains Expiring (${domains.length})`} subtitle={`Within ${days} days`} />
        {domains.length === 0
          ? <EmptyState icon={Globe} title="No domain renewals due" description={`All domains are safe for the next ${days} days`} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Domain', 'Client', 'Expiry Date', 'Days Left', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domains.map(d => {
                    const dl = dLeft(d.expiryDate)
                    return (
                      <tr key={d._id} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${theme.border}` }}
                        onClick={() => navigate(`/domains/${d._id}`)}>
                        <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: theme.text }}>{d.name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{d.clientId?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(d.expiryDate), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-bold" style={{ color: dColor(dl) }}>{dl}d</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>

      {/* Hosting expiring */}
      <Card>
        <CardHeader title={`🖥️ Hosting Expiring (${hosting.length})`} subtitle={`Within ${days} days`} />
        {hosting.length === 0
          ? <EmptyState icon={Server} title="No hosting renewals due" description={`All hosting plans are safe for the next ${days} days`} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Label', 'Client', 'Type', 'Expiry Date', 'Days Left'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hosting.map(h => {
                    const dl = dLeft(h.expiryDate)
                    return (
                      <tr key={h._id} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${theme.border}` }}
                        onClick={() => navigate(`/hosting/${h._id}`)}>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: theme.text }}>{h.label}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{h.clientId?.name || '—'}</td>
                        <td className="px-4 py-3"><span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize" style={{ background: `${theme.accent}12`, color: theme.accent }}>{h.planType}</span></td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-bold" style={{ color: dColor(dl) }}>{dl}d</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>

      {/* SSL expiring */}
      {ssl.length > 0 && (
        <Card>
          <CardHeader title={`🔒 SSL Certs Expiring (${ssl.length})`} />
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {ssl.map(h => {
              const dl = dLeft(h.ssl?.expiryDate)
              return (
                <div key={h._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => navigate(`/hosting/${h._id}`)}>
                  <Shield size={14} style={{ color: '#C94040' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: theme.text }}>{h.label}</p>
                    <p className="text-[11px]" style={{ color: theme.muted }}>{h.clientId?.name}</p>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: dColor(dl) }}>{dl}d</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
