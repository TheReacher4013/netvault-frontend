import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme, ROLE_ACCENTS } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SuperAdminLogin() {
    const { login, completeLoginWith2FA } = useAuth()
    const { theme: modeTheme, mode } = useTheme()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [twoFactor, setTwoFactor] = useState(null)
    const [code, setCode] = useState('')

    const roleAccent = ROLE_ACCENTS['superAdmin']
    const theme = { ...modeTheme, accent: roleAccent.accent, accent2: roleAccent.accent2 }
    const imageOpacity = mode === 'dark' ? 0.12 : 0.25
    const overlayAlpha = mode === 'dark' ? 'rgba(10,11,15,0.85)' : 'rgba(248,250,252,0.88)'

    const afterLogin = (user) => {
        if (user.role !== 'superAdmin') {
            toast.error('Access denied. Super Admin only.')
            return
        }
        toast.success(`Welcome, ${user.name}!`)
        navigate('/super-admin/tenants')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) { alert('Enter email and password'); return }
        setLoading(true)
        try {
            const result = await login(email, password)
            if (result?.requires2FA) setTwoFactor({ tempToken: result.tempToken })
            else afterLogin(result)
        } catch (err) {
            const status = err?.response?.status
            const msg = (err?.response?.data?.message || '').toLowerCase()
            if (status === 401 || /invalid/.test(msg)) alert('Invalid credentials')
            else toast.error(err.response?.data?.message || 'Login failed')
        } finally { setLoading(false) }
    }

    const handle2FASubmit = async (e) => {
        e.preventDefault()
        if (!code || code.length < 6) { alert('Enter your 6-digit code'); return }
        setLoading(true)
        try {
            const user = await completeLoginWith2FA(twoFactor.tempToken, code.trim())
            afterLogin(user)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid code')
            if (err.response?.status === 401 && err.response?.data?.message?.includes('expired')) {
                setTwoFactor(null); setCode('')
            }
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex relative overflow-hidden"
            style={{ background: theme.bg }}>
            <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80"
                    alt="bg" className="w-full h-full object-cover" style={{ opacity: imageOpacity }} />
                <div className="absolute inset-0" style={{ background: overlayAlpha }} />
                <div className="absolute inset-0"
                    style={{ background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${theme.accent}15, transparent)` }} />
            </div>

            <div className="absolute top-5 right-5 z-20"><ThemeToggle /></div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C' }}>N</div>
                        <span className="font-display font-bold text-xl" style={{ color: theme.text }}>
                            Net<span style={{ color: theme.accent }}>Vault</span>
                        </span>
                    </div>

                    {/* Super Admin badge */}
                    <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full w-fit mx-auto"
                        style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}40` }}>
                        <Lock size={12} style={{ color: theme.accent }} />
                        <span className="text-xs font-mono font-semibold" style={{ color: theme.accent }}>
                            SUPER ADMIN ACCESS
                        </span>
                    </div>

                    <div className="rounded-2xl p-7"
                        style={{ background: `${theme.surface}ee`, backdropFilter: 'blur(20px)', border: `1px solid ${theme.border}` }}>

                        {twoFactor ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck size={18} style={{ color: theme.accent }} />
                                    <h2 className="font-display font-bold text-2xl" style={{ color: theme.text }}>Two-Factor</h2>
                                </div>
                                <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                                    Enter the 6-digit code from your authenticator app
                                </p>
                                <form onSubmit={handle2FASubmit} className="space-y-4">
                                    <input autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={8}
                                        value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123 456"
                                        className="w-full px-3 py-3 rounded-xl text-center text-2xl font-mono tracking-[0.3em] outline-none"
                                        style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                                    <button type="submit" disabled={loading}
                                        className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-60"
                                        style={{ background: theme.accent, color: '#fff' }}>
                                        {loading ? 'Verifying…' : 'Verify'}
                                    </button>
                                    <button type="button" onClick={() => { setTwoFactor(null); setCode('') }}
                                        className="w-full text-xs hover:underline" style={{ color: theme.muted }}>← Back</button>
                                </form>
                            </>
                        ) : (
                            <>
                                <h2 className="font-display font-bold text-2xl mb-1" style={{ color: theme.text }}>Super Admin</h2>
                                <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>Restricted access — authorised personnel only</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Email ID</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            placeholder="superadmin@example.com"
                                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Password</label>
                                        <div className="relative">
                                            <input type={showPass ? 'text' : 'password'} value={password}
                                                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                                className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                                                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                                            <button type="button" onClick={() => setShowPass(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70" style={{ color: theme.text }}>
                                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                                        style={{ background: theme.accent, color: '#fff' }}>
                                        {loading ? 'Signing in…' : 'Sign In'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    <p className="text-center text-[10px] font-mono mt-4" style={{ color: theme.muted }}>
                        Not a super admin?{' '}
                        <a href="/login" className="underline" style={{ color: theme.accent }}>Go to regular login</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
