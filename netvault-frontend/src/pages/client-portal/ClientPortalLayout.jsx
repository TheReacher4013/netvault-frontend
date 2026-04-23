import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Globe, Server, FileText, Bell, Settings, LogOut, Menu, X } from 'lucide-react'
import ThemeToggle from '../../components/ui/ThemeToggle'
import clsx from 'clsx'

const NAV = [
    { to: '/client-portal', icon: LayoutDashboard, label: 'Overview' },
    { to: '/client-portal/domains', icon: Globe, label: 'My Domains' },
    { to: '/client-portal/hosting', icon: Server, label: 'My Hosting' },
    { to: '/client-portal/invoices', icon: FileText, label: 'Invoices' },
    { to: '/client-portal/alerts', icon: Bell, label: 'Alerts' },
    { to: '/client-portal/profile', icon: Settings, label: 'Profile' },
]

export default function ClientPortalLayout() {
    const { user, theme, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <div className="min-h-screen flex" style={{ background: theme.bg, color: theme.text }}>
            {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

            <aside
                className={clsx(
                    'fixed top-0 left-0 bottom-0 w-60 z-50 flex flex-col transition-transform duration-300',
                    'lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full'
                )}
                style={{ background: theme.bg2, borderRight: `1px solid ${theme.border}` }}
            >
                {/* Brand */}
                <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}
                        >
                            N
                        </div>
                        <div>
                            <div className="font-bold text-base leading-none" style={{ color: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                                Net<span style={{ color: theme.accent }}>Vault</span>
                            </div>
                            <div className="text-[9px] font-mono uppercase tracking-widest mt-0.5" style={{ color: theme.muted }}>
                                Client Portal
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} className="lg:hidden p-1 opacity-40 hover:opacity-70" style={{ color: theme.text }}>
                        <X size={16} />
                    </button>
                </div>

                {/* User pill */}
                <div
                    className="mx-3 my-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
                    style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}
                >
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: theme.text }}>{user?.name}</div>
                        <div className="text-[10px] truncate font-mono" style={{ color: theme.accent }}>{user?.email}</div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
                    {NAV.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/client-portal'}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) => clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive ? 'font-semibold' : 'opacity-50 hover:opacity-80'
                            )}
                            style={({ isActive }) => isActive ? {
                                background: `${theme.accent}18`, color: theme.accent,
                                borderLeft: `3px solid ${theme.accent}`, paddingLeft: '10px',
                            } : { color: theme.text }}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium opacity-50 hover:opacity-90 hover:bg-red-500/10"
                        style={{ color: theme.text }}
                    >
                        <LogOut size={15} /><span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
                {/* Client portal topbar */}
                <header
                    className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 gap-3"
                    style={{ background: `${theme.bg2}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.border}` }}
                >
                    <div className="flex items-center gap-3">
                        <button onClick={() => setOpen(true)} className="lg:hidden p-2 opacity-60 hover:opacity-100" style={{ color: theme.text }}>
                            <Menu size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
                            <span className="text-xs font-mono" style={{ color: theme.muted }}>Client view</span>
                        </div>
                    </div>

                    {/* Theme toggle visible for clients too */}
                    <ThemeToggle />
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}