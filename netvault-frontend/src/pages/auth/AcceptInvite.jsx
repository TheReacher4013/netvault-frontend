import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { inviteService } from '../../services/api'
import { useAuth, ROLE_THEMES } from '../../context/AuthContext'
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const theme = ROLE_THEMES.client 

export default function AcceptInvite() {
    const { token } = useParams()
    const navigate = useNavigate()
    const auth = useAuth()

    const [state, setState] = useState('verifying') 
    const [clientInfo, setClientInfo] = useState(null)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Step 1: verify token
    useEffect(() => {
        let alive = true
        inviteService.verify(token)
            .then(res => {
                if (!alive) return
                setClientInfo(res.data.data)
                setState('ready')
            })
            .catch(err => {
                if (!alive) return
                setErrorMessage(err.response?.data?.message || 'This invite link is invalid or has expired.')
                setState('invalid')
            })
        return () => { alive = false }
    }, [token])

    // Step 2: submit password
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password.length < 6) return toast.error('Password must be at least 6 characters')
        if (password !== confirm) return toast.error('Passwords do not match')
        setSubmitting(true)
        try {
            const res = await inviteService.accept(token, password)
            const { token: authToken, user } = res.data.data
            localStorage.setItem('nv_token', authToken)
            setState('success')
            toast.success(`Welcome, ${user.name}!`)
            setTimeout(() => { window.location.href = '/client-portal' }, 1200)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to set password')
        } finally {
            setSubmitting(false)
        }
    }


    const shell = (content) => (
        <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: theme.bg }}>
            <div className="absolute inset-0">
                <img src={theme.loginBg} alt="" className="w-full h-full object-cover" style={{ opacity: 0.18 }} />
                <div className="absolute inset-0" style={{ background: theme.loginOverlay }} />
            </div>
            <div className="relative w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl mx-auto mb-3"
                        style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>N</div>
                    <h1 className="font-display font-bold text-2xl" style={{ color: theme.text }}>
                        Net<span style={{ color: theme.accent }}>Vault</span>
                    </h1>
                    <p className="text-xs font-mono mt-1" style={{ color: theme.muted }}>Client Portal Access</p>
                </div>
                <div className="rounded-2xl p-7"
                    style={{ background: `${theme.surface}ee`, backdropFilter: 'blur(20px)', border: `1px solid ${theme.border}` }}>
                    {content}
                </div>
            </div>
        </div>
    )

    if (state === 'verifying') {
        return shell(
            <div className="text-center py-4">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                    style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
                <p className="text-sm font-mono" style={{ color: theme.muted }}>Verifying your invite...</p>
            </div>
        )
    }

    if (state === 'invalid') {
        return shell(
            <div className="text-center">
                <XCircle size={36} style={{ color: '#C94040' }} className="mx-auto mb-3" />
                <h2 className="font-display font-bold text-lg mb-2" style={{ color: theme.text }}>
                    Invite link invalid
                </h2>
                <p className="text-sm mb-5" style={{ color: theme.muted }}>{errorMessage}</p>
                <Link to="/login" className="text-sm font-semibold hover:underline" style={{ color: theme.accent }}>
                    Go to login →
                </Link>
            </div>
        )
    }

    if (state === 'success') {
        return shell(
            <div className="text-center py-4">
                <CheckCircle2 size={36} style={{ color: '#62B849' }} className="mx-auto mb-3" />
                <h2 className="font-display font-bold text-lg mb-2" style={{ color: theme.text }}>
                    All set!
                </h2>
                <p className="text-sm" style={{ color: theme.muted }}>
                    Redirecting to your portal...
                </p>
            </div>
        )
    }
    return shell(
        <>
            <h2 className="font-display font-bold text-xl mb-1" style={{ color: theme.text }}>
                Hi, {clientInfo?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-xs mb-5 font-mono" style={{ color: theme.muted }}>
                Set a password to access your client portal
            </p>
            <div className="text-xs mb-5 p-3 rounded-xl"
                style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}>
                <p style={{ color: theme.muted }}>Email</p>
                <p className="font-mono font-semibold" style={{ color: theme.text }}>{clientInfo?.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                        Password
                    </label>
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'}
                            value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                            style={{
                                background: `${theme.accent}08`, border: `1px solid ${theme.border}`,
                                color: theme.text, fontFamily: "'DM Sans',sans-serif"
                            }} />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                            style={{ color: theme.text }}>
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                        Confirm Password
                    </label>
                    <input type={showPass ? 'text' : 'password'}
                        value={confirm} onChange={e => setConfirm(e.target.value)}
                        placeholder="Repeat the password"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{
                            background: `${theme.accent}08`, border: `1px solid ${theme.border}`,
                            color: theme.text, fontFamily: "'DM Sans',sans-serif"
                        }} />
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 mt-2"
                    style={{ background: theme.accent, color: theme.bg }}>
                    {submitting ? 'Setting up...' : 'Set Password & Continue'}
                </button>
            </form>

            <p className="text-[10px] mt-4 text-center" style={{ color: theme.muted }}>
                By continuing, you agree to access the portal for legitimate purposes only.
            </p>
        </>
    )
}