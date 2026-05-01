import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, completeLoginWith2FA } = useAuth()
  const { theme: modeTheme, mode } = useTheme()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [twoFactor, setTwoFactor] = useState(null)
  const [code, setCode] = useState('')

  const theme = modeTheme
  const imageOpacity = mode === 'dark' ? 0.18 : 0.35
  const overlayAlpha = mode === 'dark' ? 'rgba(10,11,15,0.72)' : 'rgba(248,250,252,0.78)'

  // Restore remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem('nv_remember_email')
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  const afterLogin = (user) => {
    if (rememberMe) {
      localStorage.setItem('nv_remember_email', email.trim().toLowerCase())
    } else {
      localStorage.removeItem('nv_remember_email')
    }
    toast.success(`Welcome back, ${user.name}!`)
    if (user.role === 'client') navigate('/client-portal')
    else if (user.role === 'superAdmin') navigate('/super-admin/tenants')
    else navigate('/dashboard')
  }

  const isInvalidCreds = (err) => {
    const status = err?.response?.status
    const msg = (err?.response?.data?.message || '').toLowerCase()
    return status === 401 || /invalid email|invalid password|invalid credentials/.test(msg)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter your email and password'); return }
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result?.requires2FA) setTwoFactor({ tempToken: result.tempToken })
      else afterLogin(result)
    } catch (err) {
      if (isInvalidCreds(err)) toast.error('Invalid email or password')
      else toast.error(err.response?.data?.message || 'Login failed — please try again')
    } finally { setLoading(false) }
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    if (!code || code.length < 6) { toast.error('Enter your 6-digit code'); return }
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

  const loginBg = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80'

  return (
    <div className="min-h-screen flex relative overflow-hidden transition-all duration-500"
      style={{ background: theme.bg }}>
      <div className="absolute inset-0 transition-all duration-500">
        <img src={loginBg} alt="bg" className="w-full h-full object-cover" style={{ opacity: imageOpacity }} />
        <div className="absolute inset-0" style={{ background: overlayAlpha }} />
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 60% at 70% 50%, ${theme.accent}12, transparent)` }} />
      </div>
      <div className="absolute top-5 right-5 z-20"><ThemeToggle /></div>

      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C' }}>N</div>
          <span className="font-display font-bold text-xl" style={{ color: theme.text }}>
            Net<span style={{ color: theme.accent }}>Vault</span>
          </span>
        </div>
        <div>
          <h1 className="font-display font-bold text-5xl leading-tight mb-4" style={{ color: theme.text }}>
            Manage Domains<br />
            <span style={{ color: theme.accent }}>& Hosting</span><br />
            Like a Pro.
          </h1>
          <p className="text-base max-w-sm leading-relaxed" style={{ color: theme.muted }}>
            One dashboard for domains, hosting, clients, SSL, and billing — fully automated.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Auto expiry alerts', 'Encrypted vault', 'Uptime monitoring', 'PDF invoices'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm" style={{ color: theme.muted }}>
              <span style={{ color: theme.accent }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-base"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C' }}>N</div>
            <span className="font-display font-bold text-lg" style={{ color: theme.text }}>
              Net<span style={{ color: theme.accent }}>Vault</span>
            </span>
          </div>

          <div className="rounded-2xl p-7 transition-all duration-500"
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
                    className="w-full py-2.5 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-60"
                    style={{ background: theme.accent, color: '#fff' }}>
                    {loading ? 'Verifying…' : 'Verify'}
                  </button>
                  <button type="button" onClick={() => { setTwoFactor(null); setCode('') }}
                    className="w-full text-xs hover:underline" style={{ color: theme.muted }}>← Back</button>
                </form>
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-2xl mb-1" style={{ color: theme.text }}>Log In</h2>
                <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>Enter your credentials to continue</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Email ID</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: theme.muted }}>Password</label>
                      <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: theme.accent }}>Forgot Password?</Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                        style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                        style={{ color: theme.text }}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* ── Remember Me ── */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        onClick={() => setRememberMe(v => !v)}
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: rememberMe ? theme.accent : 'transparent',
                          border: `1.5px solid ${rememberMe ? theme.accent : theme.border}`,
                          cursor: 'pointer',
                        }}>
                        {rememberMe && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: theme.muted }}>Remember me</span>
                    </label>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: theme.accent, color: '#fff' }}>
                    {loading ? 'Logging in…' : 'Log In'}
                  </button>
                </form>

                <p className="text-center text-xs mt-5" style={{ color: theme.muted }}>
                  New agency?{' '}
                  <Link to="/register" className="font-semibold hover:underline" style={{ color: theme.accent }}>
                    Create account
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
