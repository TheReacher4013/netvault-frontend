import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, ROLE_THEMES } from '../../context/AuthContext'
import { Eye, EyeOff, Globe, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'superAdmin', label: 'Super Admin', desc: 'Platform Owner' },
  { value: 'admin',      label: 'Admin',       desc: 'Agency Owner' },
  { value: 'staff',      label: 'Staff',        desc: 'Team Member' },
  { value: 'client',     label: 'Client',       desc: 'End Customer' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('admin')
  const [roleOpen, setRoleOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const theme = ROLE_THEMES[selectedRole]
  const currentRole = ROLES.find(r => r.value === selectedRole)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden transition-all duration-700"
      style={{ background: theme.bg }}>

      {/* Background image with overlay - changes per role */}
      <div className="absolute inset-0 transition-all duration-700">
        <img
          src={theme.loginBg}
          alt="bg"
          className="w-full h-full object-cover transition-all duration-700"
          style={{ opacity: 0.18 }}
        />
        <div className="absolute inset-0" style={{ background: theme.loginOverlay }} />
        {/* Gradient mesh */}
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 60% at 70% 50%, ${theme.accent}10, transparent)` }} />
      </div>

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>N</div>
          <span className="font-display font-bold text-xl" style={{ color: theme.text }}>
            Net<span style={{ color: theme.accent }}>Vault</span>
          </span>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6"
            style={{ background: `${theme.accent}15`, color: theme.accent, border: `1px solid ${theme.border}` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
            {currentRole?.desc} Portal
          </div>
          <h1 className="font-display font-bold text-5xl leading-tight mb-4" style={{ color: theme.text }}>
            Manage Domains<br />
            <span style={{ color: theme.accent }}>& Hosting</span><br />
            Like a Pro.
          </h1>
          <p className="text-base max-w-sm leading-relaxed" style={{ color: theme.muted }}>
            One dashboard for all your domains, hosting plans, clients, SSL certificates, and billing — fully automated.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="grid grid-cols-2 gap-3">
          {['Auto expiry alerts', 'Encrypted vault', 'Uptime monitoring', 'PDF invoices'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm" style={{ color: theme.muted }}>
              <span style={{ color: theme.accent }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-base"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>N</div>
            <span className="font-display font-bold text-lg" style={{ color: theme.text }}>
              Net<span style={{ color: theme.accent }}>Vault</span>
            </span>
          </div>

          <div className="rounded-2xl p-7 transition-all duration-500"
            style={{ background: `${theme.surface}ee`, backdropFilter: 'blur(20px)', border: `1px solid ${theme.border}` }}>

            <h2 className="font-display font-bold text-2xl mb-1" style={{ color: theme.text }}>Sign In</h2>
            <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role selector dropdown */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Login As</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: `${theme.accent}10`,
                      border: `1px solid ${roleOpen ? theme.accent : theme.border}`,
                      color: theme.text,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
                      <span className="font-semibold">{currentRole?.label}</span>
                      <span className="text-xs opacity-60">— {currentRole?.desc}</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${roleOpen ? 'rotate-180' : ''}`}
                      style={{ color: theme.muted }} />
                  </button>

                  {roleOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 shadow-2xl animate-fade-up"
                      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                      {ROLES.map(r => {
                        const rt = ROLE_THEMES[r.value]
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => { setSelectedRole(r.value); setRoleOpen(false) }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                            style={{ color: selectedRole === r.value ? rt.accent : theme.text }}>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rt.accent }} />
                            <div>
                              <div className="font-semibold text-xs">{r.label}</div>
                              <div className="text-[10px] opacity-60">{r.desc}</div>
                            </div>
                            {selectedRole === r.value && <span className="ml-auto text-xs" style={{ color: rt.accent }}>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
                  onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}15` }}
                  onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: theme.muted }}>Password</label>
                  <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: theme.accent }}>Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
                    onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}15` }}
                    onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                    style={{ color: theme.text }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: theme.accent, color: theme.bg }}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: theme.bg, borderTopColor: 'transparent' }} />Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs mt-5" style={{ color: theme.muted }}>
              New agency?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: theme.accent }}>
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
