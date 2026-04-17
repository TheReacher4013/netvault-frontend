import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_THEMES } from '../context/AuthContext'

export default function NotFound() {
  const navigate = useNavigate()
  const { theme } = useAuth()
  const t = theme || ROLE_THEMES.admin

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: t.bg, color: t.text }}>
      <div className="text-center">
        <p className="font-display font-black text-8xl mb-2" style={{ color: t.accent }}>404</p>
        <p className="font-display font-bold text-2xl mb-2" style={{ color: t.text }}>Page Not Found</p>
        <p className="text-sm mb-8" style={{ color: t.muted }}>The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: t.accent, color: t.bg }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
