import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PendingApproval from '../pages/auth/PendingApproval'
import SubscriptionModal from '../components/layout/SubscriptionModal'

/**
 * PlanStatusGuard
 *
 * Wraps protected routes and enforces plan/trial rules:
 *
 *  planStatus === 'active'        → render children normally
 *  planStatus === 'trial'         → render children normally (TrialPopup handles nudges)
 *  planStatus === 'pending'       → render children normally (treated as active trial fallback)
 *  planStatus === 'trial_expired' → render children + mandatory SubscriptionModal
 *                                   (no close button, Free plan hidden)
 *  planStatus === 'suspended' /
 *               'rejected'        → show PendingApproval wall
 */
export default function PlanStatusGuard({ children }) {
    const { user, setTrialInfo } = useAuth()
    const [status, setStatus] = useState('loading')   // 'loading' | 'active' | 'blocked'
    const [planStatus, setPlanStatus] = useState(null)
    const [showSubscription, setShowSubscription] = useState(false)

    useEffect(() => {
        // superAdmin and client users bypass plan checks
        if (!user || user.role === 'superAdmin' || user.role === 'client') {
            setStatus('active')
            return
        }

        let cancelled = false
        api.get('/tenant/status')
            .then(res => {
                if (cancelled) return
                const data = res.data?.data
                const ps = data?.planStatus
                setPlanStatus(ps)

                // Sync trialInfo into AuthContext so TrialBanner / TrialPopup
                // always has fresh data after the guard finishes its fetch
                if (data) {
                    setTrialInfo({
                        isOnTrial: data.isOnTrial,
                        daysRemaining: data.trialDaysRemaining,
                        trialEndDate: data.trialEndDate,
                        trialExpired: ps === 'trial_expired',
                        planStatus: ps,
                        profileCompleted: data.profileCompleted || false,
                    })
                }

                if (ps === 'active' || ps === 'trial' || ps === 'pending') {
                    setStatus('active')
                } else if (ps === 'trial_expired') {
                    // Show app but force the subscription modal (no escape)
                    setStatus('active')
                    setShowSubscription(true)
                } else {
                    // pending / suspended / rejected → hard wall
                    setStatus('blocked')
                }
            })
            .catch(() => {
                if (!cancelled) setStatus('active') // Fail open to avoid locking users out
            })

        return () => { cancelled = true }
    }, [user?._id, user?.role]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Loading spinner ─────────────────────────────────────────────── */
    if (status === 'loading') {
        return (
            <div
                style={{ background: 'var(--nv-bg, #0A0B0F)' }}
                className="min-h-screen flex items-center justify-center"
            >
                <div
                    className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--nv-accent, #6366F1)', borderTopColor: 'transparent' }}
                />
            </div>
        )
    }

    /* ── Hard wall ───────────────────────────────────────────────────── */
    if (status === 'blocked') return <PendingApproval />

    /* ── Normal render (with optional mandatory subscription modal) ──── */
    return (
        <>
            {children}

            {showSubscription && (
                <SubscriptionModal
                    // trialExpired=true → hides close button + removes Free plan
                    trialExpired={planStatus === 'trial_expired'}
                    // No onClose prop → modal cannot be dismissed when trial expired
                    onClose={planStatus !== 'trial_expired' ? () => setShowSubscription(false) : undefined}
                    onSuccess={() => {
                        setShowSubscription(false)
                        setPlanStatus('active')
                        // Refresh the page so all plan-gated features unlock
                        window.location.reload()
                    }}
                />
            )}
        </>
    )
}