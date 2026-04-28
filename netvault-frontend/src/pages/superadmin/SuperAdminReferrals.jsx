import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Gift, Users, TrendingUp, Check } from 'lucide-react'

const referralService = {
    getAll: () => api.get('/referrals').then(r => r.data?.data?.referrals || []),
    markRewarded: (id, tenantId) => api.patch(`/referrals/${id}/reward`, { tenantId }),
}

export default function SuperAdminReferrals() {
    const { theme } = useAuth()
    const qc = useQueryClient()

    const { data: referrals = [], isLoading } = useQuery({
        queryKey: ['all-referrals'],
        queryFn: referralService.getAll,
    })

    const rewardMutation = useMutation({
        mutationFn: ({ id, tenantId }) => referralService.markRewarded(id, tenantId),
        onSuccess: () => { qc.invalidateQueries(['all-referrals']); toast.success('Marked as rewarded!') },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    })

    const totalReferrals = referrals.reduce((s, r) => s + r.totalReferrals, 0)
    const totalPending = referrals.reduce((s, r) => s + r.referredTenants.filter(t => t.status === 'pending').length, 0)
    const totalRewarded = referrals.reduce((s, r) => s + r.referredTenants.filter(t => t.status === 'rewarded').length, 0)

    return (
        <div style={{ padding: '0 0 40px' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ color: theme.text, fontWeight: 700, fontSize: 22, margin: 0 }}>Referral Overview</h1>
                <p style={{ color: theme.muted, fontSize: 13, margin: '4px 0 0' }}>All referrals across the platform</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total Programs', value: referrals.length, icon: Gift, color: theme.accent },
                    { label: 'Total Referrals', value: totalReferrals, icon: Users, color: '#8b5cf6' },
                    { label: 'Pending Rewards', value: totalPending, icon: TrendingUp, color: '#f59e0b' },
                    { label: 'Rewarded', value: totalRewarded, icon: Check, color: '#16a34a' },
                ].map(s => (
                    <div key={s.label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={18} style={{ color: s.color }} />
                        </div>
                        <div>
                            <div style={{ color: theme.text, fontWeight: 700, fontSize: 20 }}>{s.value}</div>
                            <div style={{ color: theme.muted, fontSize: 11 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Referrals list */}
            {isLoading ? (
                <div style={{ color: theme.muted, textAlign: 'center', padding: 60 }}>Loading...</div>
            ) : referrals.length === 0 ? (
                <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 60, textAlign: 'center', color: theme.muted }}>
                    <Gift size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No referrals yet</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {referrals.map(ref => (
                        <div key={ref._id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden' }}>
                            {/* Referrer header */}
                            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>
                                        {ref.referrerTenantId?.orgName || 'Unknown Agency'}
                                    </span>
                                    <span style={{
                                        marginLeft: 10, background: `${theme.accent}15`, color: theme.accent,
                                        border: `1px solid ${theme.accent}30`, borderRadius: 6,
                                        padding: '2px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                                    }}>{ref.referralCode}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: theme.muted }}>
                                    <span>Total: <strong style={{ color: theme.text }}>{ref.totalReferrals}</strong></span>
                                    <span>Earned: <strong style={{ color: '#16a34a' }}>₹{ref.totalRewardEarned}</strong></span>
                                </div>
                            </div>

                            {/* Referred tenants */}
                            {ref.referredTenants.length === 0 ? (
                                <div style={{ padding: '16px 18px', color: theme.muted, fontSize: 13 }}>No referrals yet</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            {['Agency', 'Date', 'Status', 'Action'].map(h => (
                                                <th key={h} style={{ padding: '9px 16px', textAlign: 'left', color: theme.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ref.referredTenants.map((t, i) => (
                                            <tr key={i} style={{ borderBottom: i < ref.referredTenants.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                                                <td style={{ padding: '11px 16px', color: theme.text, fontSize: 13 }}>{t.tenantId?.orgName || 'Unknown'}</td>
                                                <td style={{ padding: '11px 16px', color: theme.muted, fontSize: 12 }}>{new Date(t.usedAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '11px 16px' }}>
                                                    <span style={{
                                                        background: t.status === 'rewarded' ? '#16a34a20' : '#f59e0b20',
                                                        color: t.status === 'rewarded' ? '#16a34a' : '#f59e0b',
                                                        border: `1px solid ${t.status === 'rewarded' ? '#16a34a40' : '#f59e0b40'}`,
                                                        borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                                                    }}>{t.status}</span>
                                                </td>
                                                <td style={{ padding: '11px 16px' }}>
                                                    {t.status === 'pending' && (
                                                        <button
                                                            onClick={() => rewardMutation.mutate({ id: ref._id, tenantId: t.tenantId?._id })}
                                                            disabled={rewardMutation.isPending}
                                                            style={{
                                                                background: '#16a34a20', color: '#16a34a',
                                                                border: '1px solid #16a34a40', borderRadius: 7,
                                                                padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                            }}>
                                                            <Check size={11} /> Mark Rewarded
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}