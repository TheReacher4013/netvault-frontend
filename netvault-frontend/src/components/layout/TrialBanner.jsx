import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Clock, X, User, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TrialBanner() {
    const { trialInfo, theme, user } = useAuth()
    const [dismissed, setDismissed] = useState(false)
    const navigate = useNavigate()

    if (!trialInfo || user?.role === 'superAdmin' || user?.role === 'client') return null
    if (!trialInfo.isOnTrial || trialInfo.trialExpired) return null
    if (dismissed) return null

    const days = trialInfo.daysRemaining ?? 0
    const isUrgent = days <= 2
    const profileComplete = trialInfo.profileCompleted

    const bannerColor = isUrgent ? '#EF4444' : '#F59E0B'
    const bgColor = isUrgent ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
    const borderColor = isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'

    return (
        <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3"
            style={{ background: bgColor, borderBottom: `1px solid ${borderColor}` }}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex-shrink-0">
                    {isUrgent
                        ? <AlertTriangle size={15} style={{ color: bannerColor }} />
                        : <Clock size={15} style={{ color: bannerColor }} />}
                </div>
                <p className="text-sm font-medium" style={{ color: bannerColor }}>
                    {days === 0
                        ? 'Your free trial expires today!'
                        : `Your free trial expires in ${days} day${days !== 1 ? 's' : ''}.`}
                    {' '}Subscribe before it ends to keep your data.
                </p>
                {!profileComplete && (
                    <button onClick={() => navigate('/settings/profile')}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-all hover:opacity-90"
                        style={{ background: `${bannerColor}22`, color: bannerColor, border: `1px solid ${bannerColor}44` }}>
                        <User size={11} />
                        Complete Profile
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => navigate('/settings/profile')}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                    style={{ background: bannerColor, color: '#fff' }}>
                    Subscribe Now
                </button>
                <button onClick={() => setDismissed(true)}
                    className="w-6 h-6 flex items-center justify-center rounded opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: bannerColor }}>
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}
