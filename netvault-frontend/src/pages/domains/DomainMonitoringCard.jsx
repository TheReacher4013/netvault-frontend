import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, Button } from '../../components/ui/index'
import { Activity, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function DomainMonitoringCard({ domain }) {
    const { theme } = useAuth()
    const qc = useQueryClient()

    const mon = domain.monitoring || {}
    const state = mon.currentState || 'unknown'
    const lastChecked = mon.lastChecked ? new Date(mon.lastChecked) : null
    const lastDownAt = mon.lastDownAt ? new Date(mon.lastDownAt) : null

    const checkMut = useMutation({
        mutationFn: () => api.post(`/domains/${domain._id}/check`),
        onSuccess: (res) => {
            const status = res.data?.data?.domain?.monitoring?.currentState
            toast[status === 'up' ? 'success' : 'error'](
                status === 'up' ? 'Domain is UP ✓' : 'Domain is DOWN ✗'
            )
            qc.invalidateQueries(['domain', domain._id])
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Check failed'),
    })
    const CONFIG = {
        up: {
            label: 'Active',
            color: '#10B981',
            bg: 'rgba(16,185,129,0.10)',
            border: 'rgba(16,185,129,0.30)',
            icon: CheckCircle2,
        },
        down: {
            label: 'Down',
            color: '#EF4444',
            bg: 'rgba(239,68,68,0.10)',
            border: 'rgba(239,68,68,0.30)',
            icon: XCircle,
        },
        unknown: {
            label: 'Not checked yet',
            color: theme.muted,
            bg: `${theme.accent}08`,
            border: theme.border,
            icon: AlertTriangle,
        },
    }
    const cfg = CONFIG[state] || CONFIG.unknown
    const Icon = cfg.icon

    return (
        <Card>
            <CardHeader
                title={
                    <span className="flex items-center gap-2">
                        <Activity size={15} style={{ color: theme.accent }} />
                        Monitoring
                    </span>
                }
                subtitle="Checks every 15 min. Alerts every 2 hrs while down."
            />

            <div className="p-5 space-y-4">

                {/* Main status chip */}
                <div className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="flex items-center gap-3">
                        <Icon size={22} style={{ color: cfg.color }} />
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>
                                Status
                            </p>
                            <p className="font-display font-bold text-lg" style={{ color: cfg.color }}>
                                {cfg.label}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant={state === 'unknown' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => checkMut.mutate()}
                        loading={checkMut.isPending}
                        disabled={checkMut.isPending}>
                        <RefreshCw size={12} className={checkMut.isPending ? 'animate-spin' : ''} />
                        Check now
                    </Button>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>
                            Last checked
                        </p>
                        <p className="font-mono" style={{ color: theme.text }}>
                            {lastChecked
                                ? formatDistanceToNow(lastChecked, { addSuffix: true })
                                : 'Never'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>
                            Last time down
                        </p>
                        <p className="font-mono" style={{ color: state === 'down' ? '#EF4444' : theme.text }}>
                            {lastDownAt
                                ? formatDistanceToNow(lastDownAt, { addSuffix: true })
                                : 'Never recorded'}
                        </p>
                    </div>
                </div>

                {/* Warning if domain is currently down */}
                {state === 'down' && (
                    <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <AlertTriangle size={13} style={{ color: '#EF4444' }} className="flex-shrink-0 mt-0.5" />
                        <p style={{ color: theme.text }}>
                            Your admin email has been alerted. Next alert in 2 hours if the
                            domain is still unreachable. Fix the issue to stop alerts.
                        </p>
                    </div>
                )}

                {/* Toggle monitoring (uses existing isLive field) */}
                {!domain.isLive && (
                    <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                        style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                        <AlertTriangle size={13} style={{ color: theme.muted }} className="flex-shrink-0 mt-0.5" />
                        <p style={{ color: theme.muted }}>
                            Monitoring is disabled for this domain (isLive = false). Re-enable
                            it by editing the domain and turning isLive back on.
                        </p>
                    </div>
                )}

            </div>
        </Card>
    )
}