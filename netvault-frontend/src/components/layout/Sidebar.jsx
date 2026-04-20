import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Globe, Server, Users, FileText,
  BarChart2, Bell, Activity, Settings, LogOut,
  Shield, Building2, X, TrendingUp, Key, AlertTriangle,
  Search, KeyRound, History, Clock
} from 'lucide-react'
import clsx from 'clsx'


const ADMIN_NAV = {
  main: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/domains', icon: Globe, label: 'Domains' },
    { to: '/hosting', icon: Server, label: 'Hosting' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/settings/company', icon: Building2, label: 'Company', roles: ['admin'] },
  ],
  finance: [
    { to: '/billing', icon: FileText, label: 'Billing' },
    { to: '/reports/renewals', icon: BarChart2, label: 'Renewals' },
    { to: '/reports/revenue', icon: TrendingUp, label: 'Revenue' },
  ],
  system: [
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/uptime', icon: Activity, label: 'Uptime' },
  ],
  tools: [
    { to: '/tools/availability', icon: Search, label: 'Domain Check' },
    { to: '/tools/password', icon: KeyRound, label: 'Password Gen' },
  ],
  settings: [
    { to: '/settings/profile', icon: Settings, label: 'Profile' },
    { to: '/settings/users', icon: Key, label: 'Team', roles: ['admin'] },
    { to: '/settings/activity-log', icon: History, label: 'Activity Log', roles: ['admin'] },
  ],
}

// Super Admin nav — platform-wide (no tenant-scoped items)
const SUPER_ADMIN_NAV = {
  platform: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/super-admin/pending', icon: Clock, label: 'Pending Approvals' },
    { to: '/super-admin/tenants', icon: Building2, label: 'Companies' },
    { to: '/super-admin/plans', icon: Shield, label: 'Plans' },
    { to: '/super-admin/domains', icon: Globe, label: 'All Domains' },
    { to: '/super-admin/clients', icon: Users, label: 'All Clients' },
    { to: '/super-admin/alerts', icon: AlertTriangle, label: 'Alerts' },
  ],
  settings: [
    { to: '/settings/profile', icon: Settings, label: 'Profile' },
    { to: '/settings/activity-log', icon: History, label: 'Activity Log' },
  ],
}

function NavItem({ item, theme, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
        isActive ? 'font-semibold' : 'opacity-50 hover:opacity-80'
      )}
      style={({ isActive }) => isActive ? {
        background: `${theme.accent}18`,
        color: theme.accent,
        borderLeft: `3px solid ${theme.accent}`,
        paddingLeft: '10px',
        boxShadow: `0 0 12px ${theme.accent}15`,
      } : { color: theme.text }}
    >
      <item.icon size={16} className="flex-shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function SectionLabel({ label, theme }) {
  return (
    <p className="text-[9px] font-mono uppercase tracking-[2.5px] px-3 pt-4 pb-1 font-semibold"
      style={{ color: theme.muted }}>
      {label}
    </p>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, theme, logout } = useAuth()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'superAdmin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 bottom-0 w-60 z-50 flex flex-col transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ background: theme.bg2, borderRight: `1px solid ${theme.border}` }}
    >

      <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
            N
          </div>
          <div>
            <div className="font-display font-bold text-base leading-none" style={{ color: theme.text }}>
              Net<span style={{ color: theme.accent }}>Vault</span>
            </div>
            <div className="text-[9px] font-mono uppercase tracking-widest mt-0.5" style={{ color: theme.muted }}>
              {isSuperAdmin ? 'Platform Admin' : user?.role}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: theme.text }}>
          <X size={16} />
        </button>
      </div>

      <div className="mx-3 my-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
        style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: theme.text }}>{user?.name}</div>
          <div className="text-[10px] truncate font-mono" style={{ color: theme.accent }}>{user?.email}</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {isSuperAdmin ? (

          <>
            <SectionLabel label="Platform" theme={theme} />
            {SUPER_ADMIN_NAV.platform.map(i => (
              <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
            ))}

            <SectionLabel label="Settings" theme={theme} />
            {SUPER_ADMIN_NAV.settings.map(i => (
              <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
            ))}
          </>
        ) : (
          <>
            <SectionLabel label="Main" theme={theme} />
            {ADMIN_NAV.main
              .filter(i => !i.roles || i.roles.includes(user?.role))
              .map(i => (
                <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
              ))}

            <SectionLabel label="Finance" theme={theme} />
            {ADMIN_NAV.finance.map(i => (
              <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
            ))}

            <SectionLabel label="System" theme={theme} />
            {ADMIN_NAV.system.map(i => (
              <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
            ))}


            <SectionLabel label="Tools" theme={theme} />
            {ADMIN_NAV.tools.map(i => (
              <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
            ))}

            <SectionLabel label="Settings" theme={theme} />
            {ADMIN_NAV.settings
              .filter(i => !i.roles || i.roles.includes(user?.role))
              .map(i => (
                <NavItem key={i.to} item={i} theme={theme} onClick={onClose} />
              ))}
          </>
        )}
      </nav>

      <div className="p-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium opacity-50 hover:opacity-90 transition-all duration-200 hover:bg-red-500/10"
          style={{ color: theme.text }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}