import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import {
    Button, Card, Loader, PageHeader, EmptyState, Modal, StatusBadge,
} from '../../components/ui/index'
import {
    Clock, Check, X, Building2, User as UserIcon, Mail, Calendar,
    Timer, AlertTriangle, Hourglass,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
    trial: {
        label: 'On Trial',
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.25)',
        Icon: Timer,
    },
    trial_expired: {
        label: 'Trial Expired',
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.12)',
        border: 'rgba(239,68,68,0.25)',
        Icon: AlertTriangle,
    },
    pending: {
        label: 'Pending Approval',
        color: '#6366F1',
        bg: 'rgba(99,102,241,0.12)',
        border: 'rgba(99,102,241,0.25)',
        Icon: Hourglass,
    },
}

export default function PendingApprovals() {
    const { theme } = useAuth()
    const qc = useQueryClient()

    const [rejectModalId, setRejectModalId] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    const [filter, setFilter] = useState('all')

    const { data, isLoading } = useQuery({
        queryKey: ['sa-pending-tenants'],
        queryFn: () => api.get('/super-admin/pending-tenants'),
        refetchInterval: 15000,
    })

    const approveMut = useMutation({
        mutationFn: (id) => api.post(`/super-admin/tenants/${id}/approve`),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Approved')
            qc.invalidateQueries(['sa-pending-tenants'])
            qc.invalidateQueries(['sa-tenants'])
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
    })

    const rejectMut = useMutation({
        mutationFn: ({ id, reason }) => api.post(`/super-admin/tenants/${id}/reject`, { reason }),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Rejected')
            qc.invalidateQueries(['sa-pending-tenants'])
            qc.invalidateQueries(['sa-tenants'])
            setRejectModalId(null)
            setRejectReason('')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
    })

    const handleReject = () => {
        if (!rejectReason.trim()) return toast.error('Please provide a reason')
        if (rejectReason.trim().length < 10) return toast.error('Reason should be at least 10 characters')
        rejectMut.mutate({ id: rejectModalId, reason: rejectReason.trim() })
    }

    if (isLoading) return <Loader text="Loading pending companies..." />

    const allTenants = data?.data?.data?.tenants || []
    const count = data?.data?.data?.count || 0

    const filtered = filter === 'all'
        ? allTenants
        : allTenants.filter(t => t.planStatus === filter)

    const tabCounts = {
        all: allTenants.length,
        trial: allTenants.filter(t => t.planStatus === 'trial').length,
        trial_expired: allTenants.filter(t => t.planStatus === 'trial_expired').length,
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Company Subscriptions"
                subtitle={count === 0 ? 'No companies to review' : `${count} company/companies — on trial or trial expired`}
            />

            {/* Filter tabs */}
            {count > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'trial', label: 'On Trial' },
                        { key: 'trial_expired', label: 'Trial Expired' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: filter === tab.key ? theme.accent : `${theme.accent}10`,
                                color: filter === tab.key ? '#fff' : theme.muted,
                                border: `1px solid ${filter === tab.key ? theme.accent : theme.border}`,
                            }}>
                            {tab.label}
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                                style={{ background: filter === tab.key ? 'rgba(255,255,255,0.2)' : `${theme.accent}20`, color: filter === tab.key ? '#fff' : theme.accent }}>
                                {tabCounts[tab.key]}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {filtered.length === 0 ? (
                <EmptyState
                    icon={Check}
                    title="All caught up"
                    description="No companies in this category right now." />
            ) : (
                <div className="space-y-3">
                    {filtered.map(t => {
                        const cfg = STATUS_CONFIG[t.planStatus] || STATUS_CONFIG.pending
                        const StatusIcon = cfg.Icon

                        return (
                            <Card key={t._id} className="p-5">
                                <div className="flex flex-col md:flex-row md:items-start gap-4">

                                    {/* Avatar + org name */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                                            {t.orgName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold" style={{ color: theme.text }}>{t.orgName}</span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                                                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                                    <StatusIcon size={9} />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className="text-xs mt-0.5 space-y-0.5">
                                                <div className="flex items-center gap-1.5" style={{ color: theme.muted }}>
                                                    <UserIcon size={10} />
                                                    <span>{t.adminId?.name || '—'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" style={{ color: theme.muted }}>
                                                    <Mail size={10} />
                                                    <span className="font-mono">{t.adminId?.email || '—'}</span>
                                                </div>
                                                {t.adminId?.phone && (
                                                    <div className="flex items-center gap-1.5" style={{ color: theme.muted }}>
                                                        <span>📞</span>
                                                        <span className="font-mono">{t.adminId.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trial / dates */}
                                    <div className="flex-shrink-0 space-y-2 md:min-w-[200px]">
                                        {/* Trial start date */}
                                        {t.trialStartDate && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Calendar size={11} style={{ color: theme.muted }} />
                                                <span style={{ color: theme.muted }}>Trial Started:</span>
                                                <span className="font-mono font-semibold" style={{ color: theme.text }}>
                                                    {format(new Date(t.trialStartDate), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        )}
                                        {/* Trial end date */}
                                        {t.trialEndDate && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Clock size={11} style={{ color: t.planStatus === 'trial_expired' ? '#EF4444' : theme.muted }} />
                                                <span style={{ color: theme.muted }}>Trial Ends:</span>
                                                <span className="font-mono font-semibold"
                                                    style={{ color: t.planStatus === 'trial_expired' ? '#EF4444' : '#F59E0B' }}>
                                                    {format(new Date(t.trialEndDate), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        )}
                                        {/* Days remaining */}
                                        {t.planStatus === 'trial' && typeof t.trialDaysRemaining === 'number' && (
                                            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                                                style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                <Timer size={10} />
                                                {t.trialDaysRemaining === 0
                                                    ? 'Expires today'
                                                    : `${t.trialDaysRemaining} day${t.trialDaysRemaining !== 1 ? 's' : ''} remaining`}
                                            </div>
                                        )}
                                        {t.planStatus === 'trial_expired' && (
                                            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                <AlertTriangle size={10} />
                                                Trial Expired — Awaiting Subscription
                                            </div>
                                        )}
                                        {/* Plan name */}
                                        {(t.planName || t.planId?.displayName) && (
                                            <div className="text-xs" style={{ color: theme.muted }}>
                                                Plan: <span className="font-semibold" style={{ color: theme.text }}>
                                                    {t.planId?.displayName || t.planName}
                                                </span>
                                                {t.planId?.price !== undefined && (
                                                    <span className="ml-1">
                                                        — ₹{t.planId.price}/mo
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {/* Registered */}
                                        <div className="text-[10px]" style={{ color: theme.muted }}>
                                            Registered {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0 md:flex-col md:items-end">
                                        <button
                                            onClick={() => approveMut.mutate(t._id)}
                                            disabled={approveMut.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                                            style={{ background: `${theme.accent}18`, color: theme.accent, border: `1px solid ${theme.accent}33` }}>
                                            <Check size={12} />
                                            {t.planStatus === 'trial_expired' ? 'Activate' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => { setRejectModalId(t._id); setRejectReason('') }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                            <X size={12} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
                        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(239,68,68,0.12)' }}>
                                <X size={16} style={{ color: '#EF4444' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: theme.text }}>Reject Company</p>
                                <p className="text-xs" style={{ color: theme.muted }}>This will notify the admin by email</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1.5 block" style={{ color: theme.muted }}>Reason *</label>
                            <textarea
                                rows={3}
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Explain why this request is being rejected (min 10 characters)"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setRejectModalId(null); setRejectReason('') }}
                                className="flex-1 py-2 rounded-xl text-sm font-medium"
                                style={{ background: 'transparent', color: theme.muted, border: `1px solid ${theme.border}` }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectMut.isPending || rejectReason.trim().length < 10}
                                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                                style={{ background: '#EF4444', color: '#fff' }}>
                                {rejectMut.isPending ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}