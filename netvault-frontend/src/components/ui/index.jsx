import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  const { theme } = useAuth()
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-base' }
  const base = 'inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const styles = {
    primary: { background: theme.accent, color: theme.bg, border: 'none' },
    secondary: { background: `${theme.accent}12`, color: theme.accent, border: `1px solid ${theme.border}` },
    ghost: { background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` },
    danger: { background: '#C9404015', color: '#C94040', border: '1px solid rgba(201,64,64,0.25)' },
  }

  return (
    <button
      className={clsx(base, sizes[size], className)}
      style={styles[variant]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

// ── StatCard ─────
export function StatCard({ label, value, trend, trendUp, icon: Icon, delay = 0, onClick }) {
  const { theme } = useAuth()
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: `${theme.accent}08`,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}40, transparent)` }} />
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
        style={{ background: theme.accent }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${theme.accent}18` }}>
          {Icon && <Icon size={16} style={{ color: theme.accent }} />}
        </div>
        {trend && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: trendUp ? 'rgba(98,184,73,0.12)' : 'rgba(201,64,64,0.12)',
              color: trendUp ? '#62B849' : '#C94040',
            }}>
            {trend}
          </span>
        )}
      </div>
      <div className="font-display font-bold text-3xl leading-none mb-1" style={{ color: theme.accent }}>
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: theme.muted }}>{label}</div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}60, transparent)` }} />
    </div>
  )
}

// ── StatusBadge ───────
export function StatusBadge({ status }) {
  const map = {
    active: 'badge-active',
    expiring: 'badge-expiring',
    expired: 'badge-expired',
    transfer: 'badge-transfer',
    paid: 'badge-paid',
    pending: 'badge-pending',
    overdue: 'badge-overdue',
    up: 'badge-active',
    down: 'badge-expired',
    suspended: 'badge-expired',
    draft: 'badge-pending',
    sent: 'badge-transfer',
  }
  return <span className={map[status] || 'badge-pending'}>{status?.toUpperCase()}</span>
}

// ── Loader ───────
export function Loader({ text = 'Loading...' }) {
  const { theme } = useAuth()
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
      <p className="text-xs font-mono" style={{ color: theme.muted }}>{text}</p>
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  const { theme } = useAuth()
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl leading-tight" style={{ color: theme.text }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5 font-mono" style={{ color: theme.muted }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  const { theme } = useAuth()
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
          style={{ background: `${theme.accent}12` }}>
          <Icon size={24} style={{ color: theme.accent }} />
        </div>
      )}
      <p className="font-semibold text-base" style={{ color: theme.text }}>{title}</p>
      {description && <p className="text-sm max-w-xs" style={{ color: theme.muted }}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className, style, ...props }) {
  const { theme } = useAuth()
  return (
    <div
      className={clsx('rounded-2xl relative overflow-hidden', className)}
      style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}`, ...style }}
      {...props}
    >
      {/* Top shimmer */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}30, transparent)` }} />
      {children}
    </div>
  )
}

// ── CardHeader ────────────────────────────────────────────────────────────
export function CardHeader({ title, subtitle, actions }) {
  const { theme } = useAuth()
  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <div>
        <p className="font-display font-bold text-sm" style={{ color: theme.text }}>{title}</p>
        {subtitle && <p className="text-[11px] mt-0.5 font-mono" style={{ color: theme.muted }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  const { theme } = useAuth()
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold" style={{ color: theme.muted }}>{label}</label>}
      <input
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
        style={{
          background: `${theme.accent}08`,
          border: `1px solid ${error ? '#C94040' : theme.border}`,
          color: theme.text,
          fontFamily: "'DM Sans', sans-serif",
        }}
        onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}15` }}
        onBlur={e => { e.target.style.borderColor = error ? '#C94040' : theme.border; e.target.style.boxShadow = 'none' }}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  const { theme } = useAuth()
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold" style={{ color: theme.muted }}>{label}</label>}
      <select
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer"
        style={{
          background: `${theme.accent}08`,
          border: `1px solid ${error ? '#C94040' : theme.border}`,
          color: theme.text,
          fontFamily: "'DM Sans', sans-serif",
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const { theme } = useAuth()
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={clsx('relative w-full rounded-2xl shadow-2xl', widths[size])}
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <p className="font-display font-bold text-base" style={{ color: theme.text }}>{title}</p>
            <button onClick={onClose} className="text-lg opacity-40 hover:opacity-80 transition-opacity" style={{ color: theme.text }}>✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm mb-5 opacity-70">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  )
}