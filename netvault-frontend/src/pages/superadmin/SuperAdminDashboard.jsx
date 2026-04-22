import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    Building2, Users, Globe, Server, TrendingUp,
    ToggleRight, ToggleLeft, Plus, Eye, AlertTriangle,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { superAdminService } from '../../services/api'
import { StatCard, Card, CardHeader, Loader } from '../../components/ui/index'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function SuperAdminDashboard() {
    const { theme } = useAuth()
    const navigate = useNavigate()
    const qc = useQueryClient()

    // ── Data fetching ───────
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['sa-platform-stats'],
        queryFn: () => superAdminService.getStats(),
        refetchInterval: 60000,
    })

    const { data: tenantsData } = useQuery({
        queryKey: ['sa-tenants-recent'],
        queryFn: () => superAdminService.getTenants({ limit: 6 }),
    })

    const toggleMut = useMutation({
        mutationFn: id => superAdminService.toggleTenant(id),
        onSuccess: (_, id) => {
            toast.success('Company status updated')
            qc.invalidateQueries(['sa-tenants-recent'])
            qc.invalidateQueries(['sa-platform-stats'])
        },
    })

    const stats = statsData?.data?.data || {}
    const recentTenants = tenantsData?.data?.data?.tenants || []

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const chartData = (stats.revenue?.monthly || []).map(m => ({
        month: monthNames[m._id.month - 1],
        revenue: m.revenue,
        count: m.count,
    }))

    const topTenants = stats.topTenantsByDomains || []

    if (isLoading) return <Loader text="Loading platform overview..." />

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display font-bold text-2xl" style={{ color: theme.text }}>
                        Platform <span style={{ color: theme.accent }}>Overview</span>
                    </h1>
                    <p className="text-xs font-mono mt-1" style={{ color: theme.muted }}>
                        {format(new Date(), 'EEEE, MMMM d yyyy')} · Super Admin
                    </p>
                </div>
                <button
                    onClick={() => navigate('/super-admin/tenants/create')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: theme.accent, color: theme.bg }}
                >
                    <Plus size={14} /> New Company
                </button>
            </div>

            {/* KPI Cards — platform-wide */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    label="Total Companies"
                    value={stats.tenants?.total || 0}
                    icon={Building2}
                    trend={`${stats.tenants?.active || 0} active`}
                    trendUp
                    delay={0}
                    onClick={() => navigate('/super-admin/tenants')}
                />
                <StatCard
                    label="Platform Revenue"
                    value={`₹${(stats.revenue?.allTime || 0).toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    trend="all time"
                    trendUp
                    delay={60}
                />
            </div>

            {/* Secondary row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active Companies', value: stats.tenants?.active || 0, color: '#62B849' },
                    { label: 'Suspended', value: stats.tenants?.suspended || 0, color: '#C94040' },
                    { label: 'Total Clients', value: stats.clients?.total || 0, color: theme.accent },
                ].map(({ label, value, color }) => (
                    <Card key={label} className="p-4 text-center">
                        <div className="font-display font-bold text-2xl mb-1" style={{ color }}>{value}</div>
                        <div className="text-xs font-mono" style={{ color: theme.muted }}>{label}</div>
                    </Card>
                ))}
            </div>

            {/* Charts + Top tenants */}
            <div className="grid lg:grid-cols-3 gap-5">

                {/* Revenue chart */}
                <Card className="lg:col-span-2">
                    <CardHeader title="Platform Revenue" subtitle="Paid invoices across all companies — last 6 months" />
                    <div className="p-5">
                        {chartData.length === 0 ? (
                            <div className="py-12 text-center text-xs" style={{ color: theme.muted }}>
                                No revenue data yet. Companies need to create and collect invoices.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={chartData} barSize={28}>
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: theme.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: theme.muted, fontSize: 10 }}
                                        axisLine={false} tickLine={false}
                                        tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }}
                                        labelStyle={{ color: theme.text, fontWeight: 600 }}
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
                    </div>
                </Card>

                {/* Top companies by domain count */}
                <Card>
                    <CardHeader title="🏆 Top Companies" subtitle="By domain count" />
                    <div className="divide-y" style={{ borderColor: theme.border }}>
                        {topTenants.length === 0 ? (
                            <div className="py-10 text-center text-xs" style={{ color: theme.muted }}>No data yet</div>
                        ) : topTenants.map((t, i) => (
                            <div key={t._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                                onClick={() => navigate(`/super-admin/tenants/${t._id}`)}>
                                <span className="text-xs font-mono w-5 text-center" style={{ color: theme.muted }}>
                                    #{i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{t.orgName}</p>
                                    <p className="text-[10px] font-mono capitalize" style={{ color: theme.accent }}>{t.planName}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.muted }}>
                                    <Globe size={11} style={{ color: theme.accent }} />
                                    {t.domainCount}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recent companies table */}
            <Card>
                <CardHeader
                    title="Recent Companies"
                    subtitle="Newly registered agencies"
                    actions={
                        <button
                            onClick={() => navigate('/super-admin/tenants')}
                            className="text-xs font-mono hover:underline"
                            style={{ color: theme.accent }}
                        >
                            View all →
                        </button>
                    }
                />
                {recentTenants.length === 0 ? (
                    <div className="py-10 text-center">
                        <Building2 size={28} className="mx-auto mb-3 opacity-20" style={{ color: theme.muted }} />
                        <p className="text-xs" style={{ color: theme.muted }}>No companies yet.</p>
                        <button
                            onClick={() => navigate('/super-admin/tenants/create')}
                            className="mt-3 text-xs font-semibold hover:underline"
                            style={{ color: theme.accent }}
                        >
                            Create the first company →
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    {['Company', 'Admin', 'Plan', 'Domains', 'Clients', 'Status', 'Joined', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider"
                                            style={{ color: theme.muted }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentTenants.map(t => (
                                    <tr key={t._id}
                                        className="hover:bg-white/[0.02] transition-colors"
                                        style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                                                    {t.orgName?.charAt(0)}
                                                </div>
                                                <span className="text-xs font-semibold" style={{ color: theme.text }}>{t.orgName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>
                                            {t.adminId?.name || '—'}
                                            <div className="text-[10px]">{t.adminId?.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                                                style={{ background: `${theme.accent}12`, color: theme.accent }}>
                                                {t.planName || 'free'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-center" style={{ color: theme.muted }}>
                                            {t.domainCount ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-center" style={{ color: theme.muted }}>
                                            {t.clientCount ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-mono" style={{ color: t.isActive ? '#62B849' : '#C94040' }}>
                                                {t.isActive ? '● ACTIVE' : '● SUSPENDED'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                            {t.createdAt ? format(new Date(t.createdAt), 'dd MMM yy') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/super-admin/tenants/${t._id}`)}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                    style={{ color: theme.accent }}
                                                    title="View details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => toggleMut.mutate(t._id)}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                    style={{ color: t.isActive ? '#62B849' : theme.muted }}
                                                    title={t.isActive ? 'Suspend' : 'Activate'}
                                                >
                                                    {t.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}