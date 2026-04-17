// HostingDetail.jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader } from '../../components/ui/index'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function HostingDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const [showCreds, setShowCreds] = useState(false)
  const [creds, setCreds] = useState(null)

  const { data, isLoading } = useQuery({ queryKey: ['hosting', id], queryFn: () => hostingService.getOne(id) })
  const { data: uptimeData } = useQuery({ queryKey: ['uptime-hosting', id], queryFn: () => hostingService.getUptimeLogs(id) })

  const h = data?.data?.data?.hosting
  const uptimePct = uptimeData?.data?.data?.uptimePercent

  const handleShowCreds = async () => {
    if (creds) { setShowCreds(v => !v); return }
    try {
      const res = await hostingService.getCredentials(id)
      setCreds(res.data.data.credentials)
      setShowCreds(true)
    } catch { toast.error('Failed to load credentials') }
  }

  if (isLoading) return <Loader text="Loading hosting..." />
  if (!h) return <div className="text-center py-20" style={{ color: theme.muted }}>Hosting not found</div>

  const daysLeft = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title={h.label} subtitle={`${h.planType} · ${h.provider || 'Unknown provider'}`}
        actions={<Button variant="ghost" size="sm" onClick={() => navigate('/hosting')}><ArrowLeft size={13} />Back</Button>} />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Server IP', h.serverIP, true], ['Location', h.serverLocation, false],
              ['Control Panel', h.controlPanel, false], ['Disk Space', h.diskSpace, false],
              ['Bandwidth', h.bandwidth, false], ['Client', h.clientId?.name, false],
              ['Expiry', h.expiryDate ? format(new Date(h.expiryDate), 'dd MMM yyyy') : '—', true],
              ['Renewal Cost', h.renewalCost ? `₹${h.renewalCost}` : '—', false],
            ].map(([label, val, mono]) => (
              <div key={label}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: theme.muted }}>{label}</p>
                <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: theme.text }}>{val || '—'}</p>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  )
}
