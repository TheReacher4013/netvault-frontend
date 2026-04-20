import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { Eye, EyeOff, CheckCircle2, XCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { theme } = useTheme()

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorState, setErrorState] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        if (password !== confirm) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await authService.resetPassword(token, { password })
            setSuccess(true)
            toast.success('Password reset successfully')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reset password'
            // If token invalid/expired, show a dedicated error screen with retry link
            if (/invalid|expired/i.test(msg)) {
                setErrorState(msg)
            } else {
                toast.error(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Layout shell used by all states ─────────────────────────────────
    const shell = (content) => (
        <div className="min-h-screen flex items-center justify-center p-6 relative"
            style={{ background: theme.bg, color: theme.text }}>

            <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${theme.accent}15, transparent)` }} />

            {/* Top bar */}
            <div className="absolute top-5 right-5 z-20"><ThemeToggle /></div>
            <Link to="/" className="absolute top-5 left-5 z-20 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>N</div>
                <span className="font-display font-bold text-lg">
                    Net<span style={{ color: theme.accent }}>Vault</span>
                </span>
            </Link>

            {/* Card */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl p-7"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                {content}
            </div>
        </div>
    )

    // ── SUCCESS state ────────────
    if (success) {
        return shell(
            <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.30)' }}>
                    <CheckCircle2 size={28} style={{ color: '#10B981' }} />
                </div>
                <h1 className="font-display font-bold text-2xl mb-2">Password reset</h1>
                <p className="text-sm mb-5" style={{ color: theme.muted }}>
                    Your password has been updated successfully.
                </p>
                <p className="text-xs font-mono" style={{ color: theme.muted }}>
                    Redirecting to login...
                </p>
            </div>
        )
    }

    // ── ERROR state (invalid/expired token) ─────────────────────────────
    if (errorState) {
        return shell(
            <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)' }}>
                    <XCircle size={28} style={{ color: '#EF4444' }} />
                </div>
                <h1 className="font-display font-bold text-2xl mb-2">Reset link invalid</h1>
                <p className="text-sm mb-5" style={{ color: theme.muted }}>
                    {errorState}
                </p>
                <p className="text-xs mb-5" style={{ color: theme.muted }}>
                    Reset links expire after 15 minutes. Request a new one if needed.
                </p>

                <div className="space-y-2">
                    <Link to="/forgot-password"
                        className="block w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: theme.accent, color: '#fff' }}>
                        Request new link
                    </Link>
                    <Link to="/login"
                        className="block w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
                        style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}>
                        Back to login
                    </Link>
                </div>
            </div>
        )
    }

    // ── FORM state (default) ─────────────────
    return shell(
        <>
            <div className="flex items-center gap-2 mb-1">
                <Lock size={18} style={{ color: theme.accent }} />
                <h1 className="font-display font-bold text-2xl">Set new password</h1>
            </div>
            <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                Choose a strong password you haven't used before
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                        New password
                    </label>
                    <div className="relative">
                        <input
                            type={showPass ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            autoComplete="new-password"
                            autoFocus
                            className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                            style={{
                                background: `${theme.accent}08`,
                                border: `1px solid ${theme.border}`,
                                color: theme.text,
                                fontFamily: "'DM Sans',sans-serif",
                            }}
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                            style={{ color: theme.text }}>
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                        Confirm password
                    </label>
                    <input
                        type={showPass ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repeat the password"
                        autoComplete="new-password"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{
                            background: `${theme.accent}08`,
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                            fontFamily: "'DM Sans',sans-serif",
                        }}
                    />
                </div>

                {/* Password match indicator */}
                {confirm.length > 0 && (
                    <div className="flex items-center gap-2 text-xs"
                        style={{ color: password === confirm ? '#10B981' : '#F59E0B' }}>
                        {password === confirm
                            ? <><CheckCircle2 size={12} /> Passwords match</>
                            : <><XCircle size={12} /> Passwords don't match</>}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 mt-2"
                    style={{ background: theme.accent, color: '#fff' }}
                >
                    {loading ? 'Resetting...' : 'Reset password'}
                </button>
            </form>

            <p className="text-center text-xs mt-5" style={{ color: theme.muted }}>
                Remember your password?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: theme.accent }}>
                    Sign in
                </Link>
            </p>
        </>
    )
}