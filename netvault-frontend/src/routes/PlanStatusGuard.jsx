
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PendingApproval from '../pages/auth/PendingApproval'

export default function PlanStatusGuard({ children }) {
    const { user } = useAuth()
    const [status, setStatus] = useState('loading')

    useEffect(() => {
     
        if (!user || user.role === 'superAdmin' || user.role === 'client') {
            setStatus('active')
            return
        }

        let cancelled = false
        api.get('/tenant/status')
            .then(res => {
                if (cancelled) return
                const planStatus = res.data?.data?.planStatus
                setStatus(planStatus === 'active' ? 'active' : 'blocked')
            })
            .catch(() => {
                if (!cancelled) setStatus('active')
            })
        return () => { cancelled = true }
    }, [user?._id, user?.role])

    if (status === 'loading') {
        return (
            <div style={{ background: 'var(--nv-bg, #0A0B0F)' }}
                className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--nv-accent, #6366F1)', borderTopColor: 'transparent' }} />
            </div>
        )
    }

    if (status === 'blocked') return <PendingApproval />

    return children
}