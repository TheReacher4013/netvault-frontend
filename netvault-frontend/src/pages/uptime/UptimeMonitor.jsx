import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { uptimeService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function UptimeMonitor() {
  const { theme } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['uptime-summary'],
    queryFn: () => uptimeService.getSummary(),
    refetchInterval: 60000,
  })

  const servers = data?.data?.data?.summary || []
  const downCount = data?.data?.data?.downCount || 0
  const total = data?.data?.data?.totalMonitored || 0

  if (isLoading) return <Loader text="Checking server status..." />

  return (
    <div className="space-y-5">
      <PageHeader title="Uptime Monitor" subtitle="Real-time server health tracking" />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Monitored', value: total, icon: Activity, color: theme.accent },
          { label: 'Online', value: total - downCount, icon: CheckCircle, color: '#62B849' },
          { label: 'Down', value: downCount, icon: XCircle, color: '#C94040' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="font-display font-bold text-2xl" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: theme.muted }}>{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Server list */}
      <Card>
        <CardHeader title="Server Status" subtitle="Updates every 5 minutes via cron" />
        {servers.length === 0 ? (
          <EmptyState icon={Activity} title="No servers monitored" description="Add hosting plans with a server IP to enable monitoring" />
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {servers.map((s) => {
              const isUp = s.status === 'up'
              const isUnknown = s.status === 'unknown'
              const statusColor = isUp ? '#62B849' : isUnknown ? '#F0A045' : '#C94040'

              return (
                <div key={s._id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => navigate(`/hosting/${s._id}`)}>

                  {/* Status indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor }}>
                      {isUp && (
                        <div className="absolute inset-0 rounded-full animate-ping opacity-60"
                          style={{ background: statusColor }} />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>{s.label}</p>
                    <p className="text-xs font-mono" style={{ color: theme.muted }}>{s.serverIP || 'No IP'}</p>
                  </div>

                  {/* Uptime % */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-mono font-bold" style={{ color: s.uptimePercent >= 99 ? '#62B849' : s.uptimePercent >= 95 ? '#F0A045' : '#C94040' }}>
                      {s.uptimePercent ?? '--'}%
                    </p>
                    <p className="text-[10px]" style={{ color: theme.muted }}>uptime</p>
                  </div>

                  {/* Status label */}
                  <div className="flex-shrink-0">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full"
                      style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                      {s.status?.toUpperCase() ?? 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Last checked */}
                  <div className="flex-shrink-0 hidden md:flex items-center gap-1 text-[11px]" style={{ color: theme.muted }}>
                    <Clock size={11} />
                    {s.lastChecked ? formatDistanceToNow(new Date(s.lastChecked), { addSuffix: true }) : 'Never'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
