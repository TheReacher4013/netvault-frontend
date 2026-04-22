import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import { Building2, ToggleLeft, ToggleRight, Search, Plus, Eye, Globe, Users } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TenantList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')
  const { data, isLoading } = useQuery({
    queryKey: ['sa-tenants', search, page, perPage],
    queryFn: () => superAdminService.getTenants({ search, page, limit: perPage }),
    keepPreviousData: true,
  })

  const { data: statsData } = useQuery({
    queryKey: ['sa-platform-stats'],
    queryFn: () => superAdminService.getStats(),
  })

  const toggleMut = useMutation({
    mutationFn: id => superAdminService.toggleTenant(id),
    onSuccess: () => {
      toast.success('Company status updated')
      qc.invalidateQueries(['sa-tenants'])
      qc.invalidateQueries(['sa-platform-stats'])
    },
  })

  const tenants = data?.data?.data?.tenants || []
  const totalPages = data?.data?.data?.totalPages || 1
  const totalDocs = data?.data?.data?.total || tenants.length
  const stats = statsData?.data?.data || {}

  if (isLoading) return <Loader text="Loading companies..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Companies"
        subtitle="Every agency/company registered on the platform"
        actions={
          <Button onClick={() => navigate('/super-admin/tenants/create')}>
            <Plus size={14} /> New Company
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Companies', value: stats.tenants?.total || 0, color: theme.accent },
          { label: 'Active', value: stats.tenants?.active || 0, color: '#62B849' },
          { label: 'Suspended', value: stats.tenants?.suspended || 0, color: '#C94040' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <div className="font-display font-bold text-2xl mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs font-mono" style={{ color: theme.muted }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies by name..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {tenants.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Create the first company to get started"
            action={
              <Button onClick={() => navigate('/super-admin/tenants/create')}>
                <Plus size={14} /> Create Company
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Company', 'Admin', 'Plan', 'Domains', 'Clients', 'Users', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider"
                      style={{ color: theme.muted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr
                    key={t._id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                    onClick={() => navigate(`/super-admin/tenants/${t._id}`)}
                  >
                    {/* Company */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                          {t.orgName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: theme.text }}>{t.orgName}</p>
                          {t.website && (
                            <p className="text-[10px] font-mono truncate max-w-32" style={{ color: theme.muted }}>
                              {t.website.replace(/^https?:\/\//, '')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: theme.text }}>{t.adminId?.name || '—'}</p>
                      <p className="text-[10px] font-mono" style={{ color: theme.muted }}>{t.adminId?.email}</p>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                        style={{ background: `${theme.accent}12`, color: theme.accent }}>
                        {t.planName || 'free'}
                      </span>
                    </td>

                    {/* Domains */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.muted }}>
                        <Globe size={11} style={{ color: theme.accent }} />
                        {t.domainCount ?? '—'}
                        <span className="text-[9px]">/ {t.maxDomains}</span>
                      </div>
                    </td>

                    {/* Clients */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.muted }}>
                        <Users size={11} style={{ color: theme.accent }} />
                        {t.clientCount ?? '—'}
                        <span className="text-[9px]">/ {t.maxClients}</span>
                      </div>
                    </td>

                    {/* Users */}
                    <td className="px-4 py-3 text-xs font-mono text-center" style={{ color: theme.muted }}>
                      {t.userCount ?? '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono"
                        style={{ color: t.isActive ? '#62B849' : '#C94040' }}>
                        {t.isActive ? '● ACTIVE' : '● SUSPENDED'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                      {t.createdAt ? format(new Date(t.createdAt), 'dd MMM yy') : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
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
                          {t.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 p-4 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input type="number" min="1" max="100" value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={() => { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) }}
              onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) } }}
              className="w-14 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }} />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                  style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>›</button>
            </div>
          )}
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>{totalDocs} total</span>
        </div>
      </Card>
    </div>
  )
}