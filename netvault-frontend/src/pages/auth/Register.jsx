import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/api'
import { ROLE_THEMES } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const theme = ROLE_THEMES.admin

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.orgName || !form.name || !form.email || !form.password) return toast.error('All fields required')
    setLoading(true)
    try {
      await authService.register(form)
      toast.success('Account created! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = {
    background: `${theme.accent}08`,
    border: `1px solid ${theme.border}`,
    color: theme.text,
    fontFamily: "'DM Sans',sans-serif",
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: theme.bg }}>
      <div className="absolute inset-0 opacity-10">
        <img src={theme.loginBg} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0" style={{ background: theme.loginOverlay }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl mx-auto mb-3"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>N</div>
          <h1 className="font-display font-bold text-2xl" style={{ color: theme.text }}>
            Join Net<span style={{ color: theme.accent }}>Vault</span>
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: theme.muted }}>Create your agency account</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: `${theme.surface}ee`, backdropFilter: 'blur(20px)', border: `1px solid ${theme.border}` }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'orgName', label: 'Organisation Name', placeholder: 'TechZone Agency', type: 'text' },
              { name: 'name',    label: 'Your Name',          placeholder: 'Rahul Kumar',    type: 'text' },
              { name: 'email',   label: 'Email',              placeholder: 'you@agency.com', type: 'email' },
              { name: 'password',label: 'Password',           placeholder: '••••••••',       type: 'password' },
              { name: 'phone',   label: 'Phone (optional)',   placeholder: '+91 9876543210', type: 'tel' },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>{f.label}</label>
                <input
                  type={f.type} name={f.name} placeholder={f.placeholder}
                  value={form[f.name]} onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={fieldStyle}
                  onFocus={e => { e.target.style.borderColor = theme.accent }}
                  onBlur={e => { e.target.style.borderColor = theme.border }}
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm mt-2 transition-all active:scale-95 disabled:opacity-60"
              style={{ background: theme.accent, color: theme.bg }}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: theme.accent }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
