import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Globe, Server, Users, FileText, AlertTriangle, TrendingUp, Activity, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { reportService, domainService, notificationService } from '../services/api'
import { StatCard, Card, CardHeader, StatusBadge, Loader, EmptyState } from '../components/ui/index'
import { format, formatDistanceToNow } from 'date-fns'

export default function AdminDashboard() {
    const { theme, user } = useAuth()
    const navigate = useNavigate()

    const { data: overviewData, isLoading: ovLoading } = useQuery({
        queryKey: ['status-overview'],
        queryFn: () => reportService.getStatusOverview(),
    })
    const { data: renewalData } = useQuery({
        queryKey: ['renewals-30'],
        queryFn: () => reportService.getRenewals(30),
    })
    const { data: revenueData } = useQuery({
        queryKey: ['revenue-6'],
        queryFn: () => reportService.getRevenue(6),
    })
    const { data: notifsData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.getAll({ limit: 6 }),
        refetchInterval: 30000,
    })
    const { data: expiringData } = useQuery({
        queryKey: ['expiring-domains-7'],
        queryFn: () => domainService.getExpiring(7),
    })

    const ov = overviewData?.data?.data || {}
    const domains = ov.domains || {}
    const hosting = ov.hosting || {}
    const invoices = ov.invoices || {}
    const clientCount = ov.clients || 0

    const renewals = renewalData?.data?.data || {}
    const revenue = revenueData?.data?.data || {}
    const notifs = notifsData?.data?.data?.notifications || []
    const unread = notifsData?.data?.data?.unreadCount || 0
    const expiring7 = expiringData?.data?.data?.domains || []

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const chartData = (revenue.monthly || []).map(m => ({
        month: monthNames[m._id.month - 1],
        revenue: m.revenue,
        count: m.count,
    }))

    const totalDomains = (domains.active || 0) + (domains.expiring || 0) + (domains.expired || 0)
    const totalHosting = (hosting.active || 0) + (hosting.expiring || 0) + (hosting.expired || 0)
    const pendingAmt = invoices.pending?.total || 0
    const overdueAmt = invoices.overdue?.total || 0

    const severityColor = (s) => ({ danger: '#C94040', warning: '#F0A045', success: '#62B849', info: theme.accent }[s] || theme.muted)

    if (ovLoading) return <Loader text="Loading dashboard..." />

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display font-bold text-2xl" style={{ color: theme.text }}>
                        Welcome back, <span style={{ color: theme.accent }}>{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-xs font-mono mt-1" style={{ color: theme.muted }}>
                        {format(new Date(), 'EEEE, MMMM d yyyy')} · {user?.role}
                    </p>
                </div>
                {unread > 0 && (
                    <button onClick={() => navigate('/alerts')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold animate-pulse-glow"
                        style={{ background: 'rgba(201,64,64,0.12)', color: '#C94040', border: '1px solid rgba(201,64,64,0.2)' }}>
                        <AlertTriangle size={13} /> {unread} unread alerts
                    </button>
                )}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Domains" value={totalDomains} icon={Globe} trend={`${domains.expiring || 0} expiring`} trendUp={false} delay={0} onClick={() => navigate('/domains')} />
                <StatCard label="Active Hosting" value={totalHosting} icon={Server} trend={`${hosting.expiring || 0} expiring`} trendUp={false} delay={60} onClick={() => navigate('/hosting')} />
                <StatCard label="Active Clients" value={clientCount} icon={Users} trend="this month" trendUp delay={120} onClick={() => navigate('/clients')} />
                <StatCard label="Pending Bills" value={`₹${(pendingAmt + overdueAmt).toLocaleString('en-IN')}`} icon={FileText}
                    trend={overdueAmt > 0 ? `₹${overdueAmt.toLocaleString('en-IN')} overdue` : 'All good'}
                    trendUp={overdueAmt === 0} delay={180} onClick={() => navigate('/billing')} />
            </div>

            {/* Middle row */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader title="Revenue Overview" subtitle="Last 6 months"
                        actions={<button onClick={() => navigate('/reports/revenue')} className="text-xs font-mono hover:underline" style={{ color: theme.accent }}>Full report →</button>} />
                    <div className="p-5">
                        {chartData.length === 0 ? (
                            <EmptyState icon={TrendingUp} title="No revenue data yet" description="Create invoices to see revenue trends" />
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={chartData} barSize={28}>
                                    <XAxis dataKey="month" tick={{ fill: theme.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: theme.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, fontFamily: 'DM Sans' }}
                                        labelStyle={{ color: theme.text, fontWeight: 600 }}
                                        itemStyle={{ color: theme.accent }}
                                        formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={i === chartData.length - 1 ? theme.accent : `${theme.accent}60`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                            {[
                                { label: 'Revenue', value: `₹${(invoices.paid?.total || 0).toLocaleString('en-IN')}` },
                                { label: 'Pending', value: `₹${pendingAmt.toLocaleString('en-IN')}` },
                                { label: 'Overdue', value: `₹${overdueAmt.toLocaleString('en-IN')}` },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <div className="font-mono font-bold text-base" style={{ color: theme.accent }}>{s.value}</div>
                                    <div className="text-[11px]" style={{ color: theme.muted }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Alerts */}
                <Card>
                    <CardHeader title="🔔 Live Alerts" subtitle={`${unread} unread`}
                        actions={<button onClick={() => navigate('/alerts')} className="text-xs font-mono hover:underline" style={{ color: theme.accent }}>All →</button>} />
                    <div className="divide-y" style={{ borderColor: theme.border }}>
                        {notifs.length === 0 ? (
                            <div className="py-10 text-center text-xs" style={{ color: theme.muted }}>No alerts</div>
                        ) : notifs.map(n => (
                            <div key={n._id} className="flex gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                                onClick={() => navigate('/alerts')} style={{ opacity: n.read ? 0.5 : 1 }}>
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: severityColor(n.severity) }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold leading-tight truncate" style={{ color: theme.text }}>{n.title}</p>
                                    <p className="text-[11px] mt-0.5 truncate" style={{ color: theme.muted }}>{n.message}</p>
                                    <p className="text-[10px] mt-1 font-mono" style={{ color: theme.muted }}>
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Bottom row */}
            <div className="grid lg:grid-cols-2 gap-5">
                {/* Expiring soon */}
                <Card>
                    <CardHeader title="⚠️ Expiring This Week" subtitle="Domains expiring in 7 days"
                        actions={<button onClick={() => navigate('/reports/renewals')} className="text-xs font-mono hover:underline" style={{ color: theme.accent }}>Full report →</button>} />
                    <div className="divide-y" style={{ borderColor: theme.border }}>
                        {expiring7.length === 0 ? (
                            <div className="py-8 text-center text-xs" style={{ color: theme.muted }}>No urgent renewals 🎉</div>
                        ) : expiring7.slice(0, 5).map(d => {
                            const daysLeft = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000)
                            return (
                                <div key={d._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                                    onClick={() => navigate(`/domains/${d._id}`)}>
                                    <Globe size={14} style={{ color: theme.accent }} className="flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{d.name}</p>
                                        <p className="text-[11px]" style={{ color: theme.muted }}>{d.clientId?.name || 'No client'}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <StatusBadge status={d.status} />
                                        <p className="text-[10px] font-mono mt-1" style={{ color: daysLeft <= 3 ? '#C94040' : '#F0A045' }}>
                                            {daysLeft}d left
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader title="⚡ Quick Actions" subtitle="Frequently used shortcuts" />
                    <div className="grid grid-cols-2 gap-3 p-4">
                        {[
                            { label: 'Add Domain', icon: Globe, to: '/domains/add' },
                            { label: 'Add Hosting', icon: Server, to: '/hosting/add' },
                            { label: 'New Client', icon: Users, to: '/clients' },
                            { label: 'New Invoice', icon: FileText, to: '/billing/create' },
                            { label: 'Renewals', icon: Clock, to: '/reports/renewals' },
                            { label: 'Uptime', icon: Activity, to: '/uptime' },
                        ].map(a => (
                            <button key={a.label} onClick={() => navigate(a.to)}
                                className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] text-left group"
                                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${theme.accent}15` }}>
                                    <a.icon size={14} style={{ color: theme.accent }} />
                                </div>
                                <span className="text-xs font-semibold" style={{ color: theme.text }}>{a.label}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}
