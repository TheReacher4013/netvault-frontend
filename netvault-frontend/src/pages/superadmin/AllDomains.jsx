// src/pages/superadmin/AllDomains.jsx
// Cross-tenant domain view — SuperAdmin sees ALL domains across ALL companies
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Globe, Search, Filter, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { superAdminService } from '../../services/api'
import { Card, Loader, PageHeader, StatusBadge, EmptyState } from '../../components/ui/index'
import { format } from 'date-fns'

export default function AllDomains() {
    const { theme } = useAuth()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['sa-all-domains', { search, status, page }],
        queryFn: () => superAdminService.getAllDomains({ search, status, page, limit: 25 }),
        keepPreviousData: true,
    })

    const docs = data?.data?.data?.docs || []
    const totalPages = data?.data?.data?.totalPages || 1
    const totalDocs = data?.data?.data?.totalDocs || 0

    const daysLeft = (expiry) =>
        Math.ceil((new Date(expiry) - new Date()) / 86400000)

    if (isLoading) return <Loader text="Loading all domains..." />

    return (
        <div className="space-y-5">
            <PageHeader
                title="All Domains"
                subtitle={`${totalDocs} domains across all companies`}
            />

            {/* Filters */}
            <Card className="p-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                    <Search size={13} style={{ color: theme.muted }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search domain name..."
                        className="bg-transparent outline-none text-xs flex-1"
                        style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
                    />
                </div>
                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1) }}
                    className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="expiring">Expiring</option>
                    <option value="expired">Expired</option>
                    <option value="transfer">Transfer</option>
                </select>
            </Card>

            {/* Table */}
            <Card>
                {docs.length === 0 ? (
                    <EmptyState icon={Globe} title="No domains found" />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Domain', 'Company', 'Client', 'Status', 'Expiry', 'Days', 'Registrar'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider"
                                                style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {docs.map(d => {
                                        const dl = daysLeft(d.expiryDate)
                                        return (
                                            <tr key={d._id}
                                                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                style={{ borderBottom: `1px solid ${theme.border}` }}
                                                onClick={() => navigate(`/super-admin/tenants/${d.tenantId?._id || d.tenantId}`)}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Globe size={12} style={{ color: theme.accent }} />
                                                        <span className="text-xs font-mono font-semibold" style={{ color: theme.text }}>{d.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: theme.muted }}>
                                                        <Building2 size={11} style={{ color: theme.accent }} />
                                                        {d.tenantId?.orgName || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>
                                                    {d.clientId?.name || '—'}
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                                <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                    {d.expiryDate ? format(new Date(d.expiryDate), 'dd MMM yyyy') : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono"
                                                    style={{ color: dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : theme.muted }}>
                                                    {dl > 0 ? `${dl}d` : 'Expired'}
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>
                                                    {d.registrar || '—'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3"
                                style={{ borderTop: `1px solid ${theme.border}` }}>
                                <span className="text-xs font-mono" style={{ color: theme.muted }}>
                                    Page {page} of {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => p - 1)}
                                        className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30 transition-all"
                                        style={{ background: `${theme.accent}12`, color: theme.accent, border: `1px solid ${theme.border}` }}
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                        className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30 transition-all"
                                        style={{ background: `${theme.accent}12`, color: theme.accent, border: `1px solid ${theme.border}` }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}
