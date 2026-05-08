import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { X, User, CreditCard, Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import SubscriptionModal from './SubscriptionModal'

const keySubscribed = (uid) => `nv_trial_subscribed_${uid}`

export default function TrialPopup() {
    const { trialInfo, theme, user } = useAuth()
    const navigate = useNavigate()
    const [visible, setVisible] = useState(false)
    const [showSubModal, setShowSubModal] = useState(false)
    const [leaving, setLeaving] = useState(false)

    useEffect(() => {
        if (!trialInfo || !user) return
        if (user.role === 'superAdmin' || user.role === 'client') return
        if (!trialInfo.isOnTrial || trialInfo.trialExpired) return

        const uid = user.uid || user._id || user.id

        // Subscription li hai → kabhi mat dikha
        if (localStorage.getItem(keySubscribed(uid))) return

        // Page refresh pe mat dikha (session already chal raha hai)
        if (sessionStorage.getItem(`nv_trial_shown_${uid}`)) return

        // ✅ Fresh login — dikhao aur session mein mark karo
        sessionStorage.setItem(`nv_trial_shown_${uid}`, '1')
        setVisible(true)
    }, [trialInfo, user])

    if (!visible || !trialInfo) return null

    const uid = user.uid || user._id || user.id
    const profileCompleted = trialInfo.profileCompleted
    const days = trialInfo.daysRemaining ?? 0
    const isUrgent = days <= 2
    const accentColor = isUrgent ? '#EF4444' : '#F59E0B'

    const dismiss = () => {
        setLeaving(true)
        setTimeout(() => setVisible(false), 260)
    }

    const handleSubscriptionSuccess = () => {
        localStorage.setItem(keySubscribed(uid), '1')
        setShowSubModal(false)
        setLeaving(true)
        setTimeout(() => {
            setVisible(false)
            window.location.reload()
        }, 260)
    }

    const handleProfileClick = () => { dismiss(); navigate('/settings/profile') }
    const handleSubscribeClick = () => setShowSubModal(true)

    return (
        <>
            <div
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9990,
                    padding: '16px',
                    animation: leaving ? 'nvTPFadeOut .26s ease forwards' : 'nvTPFadeIn .22s ease',
                }}
            >
                <style>{`
                    @keyframes nvTPFadeIn  { from { opacity: 0 }                                         to { opacity: 1 } }
                    @keyframes nvTPFadeOut { from { opacity: 1 }                                         to { opacity: 0 } }
                    @keyframes nvTPPopIn   { from { opacity: 0; transform: scale(.93) translateY(20px) } to { opacity: 1; transform: scale(1) translateY(0) } }
                    @keyframes nvTPPopOut  { from { opacity: 1; transform: scale(1) }                    to { opacity: 0; transform: scale(.93) } }
                    .nv-tp-card:hover { opacity: .92 !important; transform: translateY(-1px) !important; }
                `}</style>

                <div style={{
                    width: '100%', maxWidth: '480px',
                    animation: leaving ? 'nvTPPopOut .26s ease forwards' : 'nvTPPopIn .32s cubic-bezier(.34,1.56,.64,1)',
                }}>
                    <div style={{
                        background: theme.bg2,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '22px',
                        overflow: 'hidden',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.35)',
                    }}>
                        {/* Accent top bar */}
                        <div style={{ height: '4px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }} />

                        {/* Header */}
                        <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                                    background: `${accentColor}18`, border: `1px solid ${accentColor}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Clock size={20} style={{ color: accentColor }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.1px', color: accentColor }}>
                                        Free Trial Active
                                    </div>
                                    <div style={{ fontSize: '17px', fontWeight: 800, color: theme.text, marginTop: '2px', lineHeight: 1.3 }}>
                                        {days === 0 ? 'Trial expires today!' : `${days} day${days !== 1 ? 's' : ''} remaining`}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={dismiss}
                                style={{
                                    background: `${theme.text}10`, border: 'none', borderRadius: '8px',
                                    width: '30px', height: '30px', flexShrink: 0, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: theme.muted, transition: 'background .15s',
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = `${theme.text}20`)}
                                onMouseOut={e => (e.currentTarget.style.background = `${theme.text}10`)}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Subtitle */}
                        <div style={{ padding: '8px 22px 0', fontSize: '13px', color: theme.muted, lineHeight: 1.6 }}>
                            {profileCompleted
                                ? 'Your profile is complete! Subscribe to a plan before your trial ends to keep your data.'
                                : 'Complete the steps below to get the most out of NetVault and keep your data safe.'}
                        </div>

                        {/* Action cards */}
                        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                            {/* Profile card — only when not completed */}
                            {!profileCompleted && (
                                <button
                                    className="nv-tp-card"
                                    onClick={handleProfileClick}
                                    style={{
                                        width: '100%', textAlign: 'left', cursor: 'pointer',
                                        background: `${theme.accent}12`, border: `1px solid ${theme.accent}33`,
                                        borderRadius: '14px', padding: '14px 16px',
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        transition: 'all .18s ease',
                                    }}
                                >
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                        background: `${theme.accent}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <User size={18} style={{ color: theme.accent }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Complete Your Profile</div>
                                        <div style={{ fontSize: '11px', color: theme.muted, marginTop: '2px' }}>Add company details, phone &amp; address</div>
                                    </div>
                                    <ChevronRight size={16} style={{ color: theme.accent, flexShrink: 0 }} />
                                </button>
                            )}

                            {/* Profile done indicator */}
                            {profileCompleted && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 14px', borderRadius: '12px',
                                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                                }}>
                                    <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>Profile completed ✓</span>
                                </div>
                            )}

                            {/* Subscribe card — always shown */}
                            <button
                                className="nv-tp-card"
                                onClick={handleSubscribeClick}
                                style={{
                                    width: '100%', textAlign: 'left', cursor: 'pointer',
                                    background: `linear-gradient(135deg, ${theme.accent}18, ${theme.accent2}18)`,
                                    border: `1px solid ${theme.accent}44`,
                                    borderRadius: '14px', padding: '14px 16px',
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    transition: 'all .18s ease',
                                }}
                            >
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                    background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent2}33)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CreditCard size={18} style={{ color: theme.accent }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Update Subscription Plan</div>
                                    <div style={{ fontSize: '11px', color: theme.muted, marginTop: '2px' }}>Choose a plan · coupon &amp; referral codes accepted</div>
                                </div>
                                <ChevronRight size={16} style={{ color: theme.accent, flexShrink: 0 }} />
                            </button>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '0 22px 18px', fontSize: '11px', color: theme.muted, textAlign: 'center' }}>
                            You can revisit these from Settings at any time.
                        </div>
                    </div>
                </div>
            </div>

            {showSubModal && (
                <SubscriptionModal
                    trialExpired={false}
                    onClose={() => setShowSubModal(false)}
                    onSuccess={handleSubscriptionSuccess}
                />
            )}
        </>
    )
}