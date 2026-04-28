import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Copy, Gift, Users, TrendingUp, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

const referralService = {
    getMy: () => api.get('/referrals/my').then(r => r.data?.data?.referral),
}

function StatCard({ icon: Icon, label, value, color, theme }) {
    return (
        <div style={{
            background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: 14, padding: '20px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
        }}>
            <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div>
                <div style={{ color: theme.text, fontWeight: 700, fontSize: 22 }}>{value}</div>
                <div style={{ color: theme.muted, fontSize: 12, marginTop: 1 }}>{label}</div>
            </div>
        </div>
    )
}

export default function ReferralPage() {
    const { theme, user } = useAuth()

    const { data: referral, isLoading } = useQuery({
        queryKey: ['my-referral'],
        queryFn: referralService.getMy,
    })

    const copyCode = () => {
        if (!referral?.referralCode) return
        navigator.clipboard.writeText(referral.referralCode)
        toast.success('Referral code copied!')
    }

    const copyLink = () => {
        if (!referral?.referralCode) return
        const link = `${window.location.origin}/register?ref=${referral.referralCode}`
        navigator.clipboard.writeText(link)
        toast.success('Referral link copied!')
    }

    const rewarded = referral?.referredTenants?.filter(r => r.status === 'rewarded').length || 0
    const pending = referral?.referredTenants?.filter(r => r.status === 'pending').length || 0

    return (
        <div style={{ padding: '0 0 40px' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: theme.text, fontWeight: 700, fontSize: 22, margin: 0 }}>Referral Program</h1>
                <p style={{ color: theme.muted, fontSize: 13, margin: '4px 0 0' }}>
                    Share your referral code and earn rewards for every new agency that joins NetVault
                </p>
            </div>

            {isLoading ? (
                <div style={{ color: theme.muted, textAlign: 'center', padding: 60 }}>Loading referral info...</div>
            ) : (
                <>
                    {/* Referral Code Card */}
                    <div style={{
                        background: `linear-gradient(135deg, ${theme.accent}18, ${theme.accent}08)`,
                        border: `1px solid ${theme.accent}35`,
                        borderRadius: 16, padding: 28, marginBottom: 24,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                            <Gift size={20} style={{ color: theme.accent }} />
                            <span style={{ color: theme.text, fontWeight: 700, fontSize: 16 }}>Your Referral Code</span>
                        </div>

                        {/* Code display */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                            <div style={{
                                background: theme.surface, border: `2px dashed ${theme.accent}50`,
                                borderRadius: 12, padding: '12px 24px',
                                fontFamily: 'monospace', fontSize: 28, fontWeight: 900,
                                color: theme.accent, letterSpacing: 4,
                            }}>
                                {referral?.referralCode || '—'}
                            </div>
                            <button onClick={copyCode} style={{
                                background: theme.accent, color: '#fff', border: 'none',
                                borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Copy size={14} /> Copy Code
                            </button>
                            <button onClick={copyLink} style={{
                                background: theme.surface, color: theme.text,
                                border: `1px solid ${theme.border}`,
                                borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Share2 size={14} /> Copy Link
                            </button>
                        </div>

                        {/* Referral link preview */}
                        <div style={{
                            background: theme.surface, border: `1px solid ${theme.border}`,
                            borderRadius: 8, padding: '8px 14px',
                            fontSize: 12, color: theme.muted, fontFamily: 'monospace',
                            wordBreak: 'break-all',
                        }}>
                            {window.location.origin}/register?ref={referral?.referralCode || 'YOUR_CODE'}
                        </div>
                    </div>

                    {/* Rewards info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                        <div style={{
                            background: theme.surface, border: `1px solid ${theme.border}`,
                            borderRadius: 14, padding: 20,
                        }}>
                            <div style={{ color: theme.accent, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🎁 You Earn (Referrer)</div>
                            <div style={{ color: theme.text, fontWeight: 700, fontSize: 20 }}>
                                {referral?.referrerReward?.type === 'flat'
                                    ? `₹${referral.referrerReward.value} credit`
                                    : referral?.referrerReward?.type === 'percentage'
                                        ? `${referral.referrerReward.value}% off`
                                        : `${referral?.referrerReward?.value || 1} month free`}
                            </div>
                            <div style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>for every successful referral</div>
                        </div>
                        <div style={{
                            background: theme.surface, border: `1px solid ${theme.border}`,
                            borderRadius: 14, padding: 20,
                        }}>
                            <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🎉 They Get (New User)</div>
                            <div style={{ color: theme.text, fontWeight: 700, fontSize: 20 }}>
                                {referral?.referredReward?.type === 'percentage'
                                    ? `${referral.referredReward.value}% off`
                                    : `₹${referral?.referredReward?.value} discount`}
                            </div>
                            <div style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>on their first invoice</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                        <StatCard icon={Users} label="Total Referrals" value={referral?.totalReferrals || 0} color={theme.accent} theme={theme} />
                        <StatCard icon={TrendingUp} label="Rewarded" value={rewarded} color="#16a34a" theme={theme} />
                        <StatCard icon={Gift} label="Pending" value={pending} color="#f59e0b" theme={theme} />
                        <StatCard icon={TrendingUp} label="Total Earned" value={`₹${referral?.totalRewardEarned || 0}`} color="#8b5cf6" theme={theme} />
                    </div>

                    {/* Referred list */}
                    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
                            <span style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>Referred Agencies</span>
                        </div>
                        {!referral?.referredTenants?.length ? (
                            <div style={{ padding: 48, textAlign: 'center', color: theme.muted }}>
                                <Users size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                                <div style={{ fontSize: 14, fontWeight: 600 }}>No referrals yet</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>Share your code to start earning!</div>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Agency', 'Joined', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '10px 18px', textAlign: 'left', color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {referral.referredTenants.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: i < referral.referredTenants.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                                            <td style={{ padding: '13px 18px', color: theme.text, fontSize: 13 }}>
                                                {r.tenantId?.orgName || 'Unknown Agency'}
                                            </td>
                                            <td style={{ padding: '13px 18px', color: theme.muted, fontSize: 13 }}>
                                                {r.usedAt ? new Date(r.usedAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ padding: '13px 18px' }}>
                                                <span style={{
                                                    background: r.status === 'rewarded' ? '#16a34a20' : r.status === 'pending' ? '#f59e0b20' : '#dc262620',
                                                    color: r.status === 'rewarded' ? '#16a34a' : r.status === 'pending' ? '#f59e0b' : '#dc2626',
                                                    border: `1px solid ${r.status === 'rewarded' ? '#16a34a40' : r.status === 'pending' ? '#f59e0b40' : '#dc262640'}`,
                                                    borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                                                    textTransform: 'capitalize',
                                                }}>{r.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* How it works */}
                    <div style={{ marginTop: 24, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 22 }}>
                        <div style={{ color: theme.text, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>How it works</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            {[
                                { step: '1', text: 'Share your referral code or link with other agencies', icon: '📤' },
                                { step: '2', text: 'They sign up using your code and get a discount', icon: '✅' },
                                { step: '3', text: 'Once they activate their plan, you earn your reward', icon: '🎁' },
                            ].map(s => (
                                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: `${theme.accent}20`, color: theme.accent,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 12, flexShrink: 0,
                                    }}>{s.step}</div>
                                    <div style={{ color: theme.muted, fontSize: 12, lineHeight: 1.6 }}>
                                        {s.icon} {s.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}