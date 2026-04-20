import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { superAdminService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Loader, EmptyState, PageHeader } from '../../components/ui/index'
import { Users, Search, Building2 } from 'lucide-react'
import { format } from 'date-fns'

export default function AllClients() {
    const { theme } = useAuth()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['sa-all-clients', { search, page }],
        queryFn: () => superAdminService.getAllClients({ search, page, limit: 30 }),
        keepPreviousData: true,
    })

    if (isLoading) return <Loader text="Loading all clients..." />

    const clients = data?.data?.data?.clients || []
    const total = data?.data?.data?.total || 0
    const totalPages = Math.max(1, Math.ceil(total / 30))

    return (
        <div className="space-y-5">
            <PageHeader
                title="All Clients"
                subtitle={`${total.toLocaleString()} clients across every tenant`}
            />

            {/* Search bar */}
            <Card className="p-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                    <Search size={13} style={{ color: theme.muted }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search by name, email, or company..."
                        className="bg-transparent outline-none text-xs flex-1"
                        style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
                    />
                </div>
            </Card>

            {/* Clients table */}
            <Card>
                {clients.length === 0 ? (
                    <EmptyState icon={Users}
                        title={search ? 'No matches' : 'No clients yet'}
                        description={search ? 'Try a different search term.' : 'Clients added by any tenant will appear here.'}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    {['Client', 'Email', 'Company', 'Tenant', 'Joined', 'Status'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider"
                                            style={{ color: theme.muted }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(c => (
                                    <tr key={c._id}
                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        style={{ borderBottom: `1px solid ${theme.border}` }}
                                        onClick={() => c.tenantId?._id && navigate(`/super-admin/tenants/${c.tenantId._id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                                                    {c.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="text-xs font-semibold" style={{ color: theme.text }}>{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                            {c.email || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>
                                            {c.company || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.tenantId?.orgName ? (
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded inline-flex items-center gap-1"
                                                    style={{ background: `${theme.accent}12`, color: theme.accent }}>
                                                    <Building2 size={10} />{c.tenantId.orgName}
                                                </span>
                                            ) : (
                                                <span className="text-[10px]" style={{ color: theme.muted }}>—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                            {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yy') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-mono"
                                                style={{ color: c.isActive ? '#62B849' : '#C94040' }}>
                                                {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4"
                        style={{ borderTop: `1px solid ${theme.border}` }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono disabled:opacity-30"
                            style={{ background: `${theme.accent}10`, color: theme.text }}>
                            ← Prev
                        </button>
                        <span className="text-xs font-mono" style={{ color: theme.muted }}>
                            {page} of {totalPages}
                        </span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono disabled:opacity-30"
                            style={{ background: `${theme.accent}10`, color: theme.text }}>
                            Next →
                        </button>
                    </div>
                )}
            </Card>
        </div>
    )
}