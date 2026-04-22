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
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')

  const { data, isLoading } = useQuery({
    queryKey: ['renewals', days],
    queryFn: () => reportService.getRenewals(days),
  })

  const renewals = data?.data?.data || {}
  const allDomains = renewals.domains || []
  const allHosting = renewals.hosting || []
  const ssl = renewals.sslExpiring || []
  const totalPages = Math.ceil(Math.max(allDomains.length, allHosting.length) / perPage) || 1
  const domains = allDomains.slice((page - 1) * perPage, page * perPage)
  const hosting = allHosting.slice((page - 1) * perPage, page * perPage)

  const dLeft = (d) => differenceInDays(new Date(d), new Date())
  const dColor = (n) => n <= 7 ? '#C94040' : n <= 15 ? '#F0A045' : '#62B849'

  if (isLoading) return <Loader text="Loading renewals..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Renewal Report"
        subtitle="Upcoming expirations that need attention"
        actions={
          <div className="flex gap-2 flex-wrap">
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
          { icon: Globe, label: 'Domains', count: allDomains.length, color: theme.accent },
          { icon: Server, label: 'Hosting Plans', count: allHosting.length, color: '#F0A045' },
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
        <CardHeader title={`🌐 Domains Expiring (${allDomains.length})`} subtitle={`Within ${days} days`} />
        {domains.length === 0
          ? <EmptyState icon={Globe} title="No domain renewals due" description={`All domains are safe for the next ${days} days`} />
          : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                      {['Sr', 'Domain', 'Client', 'Expiry Date', 'Days Left', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((d, i) => {
                      const dl = dLeft(d.expiryDate)
                      const srNo = (page - 1) * perPage + i + 1
                      return (
                        <tr key={d._id} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                          style={{ borderBottom: `1px solid ${theme.border}` }}
                          onClick={() => navigate(`/domains/${d._id}`)}>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{srNo}</td>
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

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden divide-y" style={{ borderColor: theme.border }}>
                {domains.map((d, i) => {
                  const dl = dLeft(d.expiryDate)
                  const srNo = (page - 1) * perPage + i + 1
                  return (
                    <div key={d._id} className="p-4 hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => navigate(`/domains/${d._id}`)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${theme.accent}15`, color: theme.muted }}>#{srNo}</span>
                          <p className="text-sm font-mono font-semibold truncate" style={{ color: theme.text }}>{d.name}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Client</p>
                          <p className="text-xs mt-0.5" style={{ color: theme.text }}>{d.clientId?.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Expiry</p>
                          <p className="text-xs font-mono mt-0.5" style={{ color: theme.muted }}>{format(new Date(d.expiryDate), 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Days Left</p>
                          <p className="text-lg font-mono font-bold mt-0.5" style={{ color: dColor(dl) }}>{dl}d</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        }
      </Card>

      {/* Hosting expiring */}
      <Card>
        <CardHeader title={`🖥️ Hosting Expiring (${allHosting.length})`} subtitle={`Within ${days} days`} />
        {hosting.length === 0
          ? <EmptyState icon={Server} title="No hosting renewals due" description={`All hosting plans are safe for the next ${days} days`} />
          : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                      {['Sr', 'Label', 'Client', 'Type', 'Expiry Date', 'Days Left'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hosting.map((h, i) => {
                      const dl = dLeft(h.expiryDate)
                      const srNo = (page - 1) * perPage + i + 1
                      return (
                        <tr key={h._id} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                          style={{ borderBottom: `1px solid ${theme.border}` }}
                          onClick={() => navigate(`/hosting/${h._id}`)}>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{srNo}</td>
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

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden divide-y" style={{ borderColor: theme.border }}>
                {hosting.map((h, i) => {
                  const dl = dLeft(h.expiryDate)
                  const srNo = (page - 1) * perPage + i + 1
                  return (
                    <div key={h._id} className="p-4 hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => navigate(`/hosting/${h._id}`)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: `${theme.accent}15`, color: theme.muted }}>#{srNo}</span>
                        <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{h.label}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Client</p>
                          <p className="text-xs mt-0.5" style={{ color: theme.text }}>{h.clientId?.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Type</p>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded capitalize inline-block mt-0.5"
                            style={{ background: `${theme.accent}12`, color: theme.accent }}>{h.planType}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Expiry</p>
                          <p className="text-xs font-mono mt-0.5" style={{ color: theme.muted }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Days Left</p>
                          <p className="text-lg font-mono font-bold mt-0.5" style={{ color: dColor(dl) }}>{dl}d</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        }
      </Card>

      {/* SSL expiring */}
      {ssl.length > 0 && (
        <Card>
          <CardHeader title={`🔒 SSL Certs Expiring (${ssl.length})`} />
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {ssl.map((h, i) => {
              const dl = dLeft(h.ssl?.expiryDate)
              return (
                <div key={h._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => navigate(`/hosting/${h._id}`)}>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${theme.accent}15`, color: theme.muted }}>#{i + 1}</span>
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

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
          <input type="number" min="1" max="100" value={perPageInput}
            onChange={e => setPerPageInput(e.target.value)}
            onBlur={() => { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) }}
            onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) } }}
            className="w-14 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
            style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }} />
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
              style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
              style={{ background: `${theme.accent}10`, color: theme.muted }}>›</button>
          </div>
        )}
        <span className="text-[11px] font-mono" style={{ color: theme.muted }}>{allDomains.length + allHosting.length} total items</span>
      </div>
    </div>
  )
}