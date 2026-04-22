import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import {
    Clock, XCircle, CheckCircle2, LogOut, Mail, RefreshCw,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PendingApproval() {
    const { user, logout } = useAuth()
    const { theme } = useTheme()
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)

    const fetchStatus = async () => {
        try {
            const res = await api.get('/tenant/status')
            const data = res.data.data
            setStatus(data)
            if (data.planStatus === 'active') {
                toast.success('🎉 Your plan has been activated!')
                setTimeout(() => { window.location.href = '/dashboard' }, 1200)
            }
        } catch (err) {
         
        }
    }

    useEffect(() => {
        fetchStatus()
        const id = setInterval(fetchStatus, 30000)  
        return () => clearInterval(id)
       
    }, [])

    const handleRefresh = async () => {
        setLoading(true)
        await fetchStatus()
        setLoading(false)
        toast.success('Status refreshed')
    }

    const isRejected = status?.planStatus === 'rejected'
    const isSuspended = status?.planStatus === 'suspended'

    const cfg = isRejected ? {
        icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
        title: 'Plan Request Rejected',
        description: 'Your plan request was not approved at this time.',
    } : isSuspended ? {
        icon: XCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)',
        title: 'Account Suspended',
        description: 'Your account has been temporarily suspended.',
    } : {
        icon: Clock, color: theme.accent, bg: `${theme.accent}10`, border: theme.border,
        title: 'Awaiting Approval',
        description: 'Your plan is pending Super Admin approval.',
    }
    const Icon = cfg.icon

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative"
            style={{ background: theme.bg, color: theme.text }}>

            
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${cfg.color}10, transparent)` }} />

            <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
                <ThemeToggle />
                <button onClick={logout}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: `${theme.accent}10`, color: theme.text, border: `1px solid ${theme.border}` }}>
                    <LogOut size={12} /> Sign out
                </button>
            </div>

         
            <div className="absolute top-5 left-5 flex items-center gap-2 z-20">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                    N
                </div>
                <span className="font-display font-bold text-lg">
                    Net<span style={{ color: theme.accent }}>Vault</span>
                </span>
            </div>

            <div className="relative z-10 w-full max-w-lg rounded-2xl p-8"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>

                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon size={28} style={{ color: cfg.color }} />
                    </div>
                </div>

                <h1 className="font-display font-bold text-2xl text-center mb-2">
                    {cfg.title}
                </h1>
                <p className="text-sm text-center mb-6" style={{ color: theme.muted }}>
                    {cfg.description}
                </p>

                
                <div className="p-4 rounded-xl mb-5 space-y-2 text-sm"
                    style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                    <div className="flex justify-between">
                        <span style={{ color: theme.muted }}>Organisation</span>
                        <span className="font-semibold" style={{ color: theme.text }}>{status?.orgName || user?.tenantId?.orgName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span style={{ color: theme.muted }}>Plan requested</span>
                        <span className="font-semibold" style={{ color: theme.accent }}>
                            {status?.planDisplay || status?.planName || '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span style={{ color: theme.muted }}>Signed up as</span>
                        <span className="font-mono text-xs" style={{ color: theme.text }}>{user?.email}</span>
                    </div>
                </div>

                {isRejected && status?.rejectionReason && (
                    <div className="p-3 rounded-xl mb-5 text-sm"
                        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.20)' }}>
                        <p className="text-[10px] font-mono uppercase mb-1" style={{ color: '#EF4444' }}>
                            Rejection reason
                        </p>
                        <p style={{ color: theme.text }}>{status.rejectionReason}</p>
                    </div>
                )}

                {!isRejected && !isSuspended && (
                    <div className="space-y-3 mb-5">
                        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: theme.muted }}>
                            What happens next
                        </p>
                        <ol className="space-y-2 text-sm" style={{ color: theme.text }}>
                            <li className="flex gap-2">
                                <span style={{ color: theme.accent }}>1.</span>
                                <span>Super Admin reviews your plan request (usually within 1 business day)</span>
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: theme.accent }}>2.</span>
                                <span>You'll receive an email confirmation once approved</span>
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: theme.accent }}>3.</span>
                                <span>Full dashboard access unlocks automatically</span>
                            </li>
                        </ol>
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={handleRefresh} disabled={loading}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: theme.accent, color: '#fff' }}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Check status
                    </button>
                    <a href="mailto:support@netvault.app"
                        className="py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}>
                        <Mail size={13} /> Contact support
                    </a>
                </div>
                <p className="text-[10px] text-center mt-4" style={{ color: theme.muted }}>
                    This page checks status automatically every 30 seconds
                </p>
            </div>
        </div>
    )
}