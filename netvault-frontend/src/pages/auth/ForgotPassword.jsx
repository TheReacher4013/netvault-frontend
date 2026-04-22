import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/api'
import { ROLE_THEMES } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const theme = ROLE_THEMES.admin

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.forgotPassword({ email })
      setSent(true)
      toast.success('Reset link sent!')
    } catch { toast.error('Failed to send reset link') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: theme.bg }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-7" style={{ background: `${theme.surface}ee`, border: `1px solid ${theme.border}` }}>
          <h2 className="font-display font-bold text-xl mb-1" style={{ color: theme.text }}>Forgot Password</h2>
          <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>We'll send a reset link to your email</p>
          {sent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">📧</div>
              <p className="font-semibold text-sm mb-1" style={{ color: theme.text }}>Check your inbox</p>
              <p className="text-xs" style={{ color: theme.muted }}>Reset link sent to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Email ID</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text, fontFamily: "'DM Sans',sans-serif" }} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ background: theme.accent, color: theme.bg }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
            <Link to="/login" className="hover:underline" style={{ color: theme.accent }}>← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
