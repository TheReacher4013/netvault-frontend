import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import {
    Button, Card, Loader, PageHeader, EmptyState, Modal, StatusBadge,
} from '../../components/ui/index'
import { Clock, Check, X, Building2, User as UserIcon, Mail, Calendar } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PendingApprovals() {
    const { theme } = useAuth()
    const qc = useQueryClient()

    const [rejectModalId, setRejectModalId] = useState(null)
    const [rejectReason, setRejectReason] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['sa-pending-tenants'],
        queryFn: () => api.get('/super-admin/pending-tenants'),
        refetchInterval: 15000,  // poll every 15s — new pending tenants appear automatically
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

    if (isLoading) return <Loader text="Loading pending approvals..." />

    const tenants = data?.data?.data?.tenants || []
    const count = data?.data?.data?.count || 0

    return (
        <div className="space-y-5">
            <PageHeader
                title="Pending Approvals"
                subtitle={count === 0 ? 'No requests waiting' : `${count} tenant(s) awaiting approval`}
            />

            {tenants.length === 0 ? (
                <EmptyState
                    icon={Check}
                    title="All caught up"
                    description="No pending plan approvals right now. New requests will appear here automatically." />
            ) : (
                <div className="space-y-3">
                    {tenants.map(t => (
                        <Card key={t._id} className="p-5">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">

                                {/* Avatar + org name */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                                        {t.orgName.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 size={13} style={{ color: theme.accent }} />
                                            <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>
                                                {t.orgName}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
                                                style={{ background: `${theme.accent}15`, color: theme.accent }}>
                                                <Clock size={9} /> PENDING
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs" style={{ color: theme.muted }}>
                                            <span className="flex items-center gap-1">
                                                <UserIcon size={11} /> {t.adminId?.name || '—'}
                                            </span>
                                            <span className="flex items-center gap-1 font-mono">
                                                <Mail size={11} /> {t.adminId?.email || '—'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} /> {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Plan info */}
                                <div className="flex flex-col items-start md:items-end md:min-w-[120px]">
                                    <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Requested plan</p>
                                    <p className="font-display font-bold text-base" style={{ color: theme.accent }}>
                                        {t.planId?.displayName || t.planName}
                                    </p>
                                    <p className="text-xs font-mono" style={{ color: theme.muted }}>
                                        ₹{t.planId?.price ?? 0}/mo
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button size="sm"
                                        onClick={() => approveMut.mutate(t._id)}
                                        loading={approveMut.isPending && approveMut.variables === t._id}
                                        disabled={approveMut.isPending}>
                                        <Check size={13} /> Approve
                                    </Button>
                                    <Button size="sm" variant="ghost"
                                        onClick={() => { setRejectModalId(t._id); setRejectReason('') }}
                                        style={{ color: '#EF4444' }}>
                                        <X size={13} /> Reject
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject modal */}
            <Modal open={!!rejectModalId} onClose={() => setRejectModalId(null)}
                title="Reject plan request">
                <div className="space-y-3">
                    <p className="text-sm" style={{ color: theme.muted }}>
                        The admin will receive an email with this reason. Be clear and professional —
                        they can contact support to appeal.
                    </p>

                    <div>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                            Reason for rejection
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            rows={4}
                            placeholder="E.g. We were unable to verify your organization's payment details. Please contact support with proof of business registration."
                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                            style={{
                                background: `${theme.accent}08`, border: `1px solid ${theme.border}`,
                                color: theme.text, fontFamily: "'DM Sans',sans-serif"
                            }} />
                        <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                            Min 10 characters. {rejectReason.length} typed.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="ghost" onClick={() => setRejectModalId(null)}>Cancel</Button>
                        <Button
                            loading={rejectMut.isPending}
                            onClick={handleReject}
                            style={{ background: '#EF4444', color: '#fff' }}>
                            Reject request
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}