import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import {
  Building2, ToggleLeft, ToggleRight, Search, Plus, Eye, Globe, Users,
  Trash2, LayoutGrid, List, AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function PaginationBar({ page, totalPages, total, perPage, perPageInput, onPageChange, onPerPageChange }) {
  const { theme } = useAuth()
  const pages = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : page <= 4
      ? [...Array.from({ length: 5 }, (_, i) => i + 1), '…', totalPages]
      : page >= totalPages - 3
        ? [1, '…', ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)]
        : [1, '…', page - 1, page, page + 1, '…', totalPages]

  return (
    <div className="flex items-center justify-between gap-3 p-4 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
        <input
          type="number" min="1" max="100" value={perPageInput}
          onChange={e => onPerPageChange(e.target.value, false)}
          onBlur={() => onPerPageChange(perPageInput, true)}
          onKeyDown={e => e.key === 'Enter' && onPerPageChange(perPageInput, true)}
          className="w-14 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
          style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }}
        />
        <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
            className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
            style={{ background: `${theme.accent}10`, color: theme.muted }}>prev</button>
          {pages.map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} className="w-7 text-center text-xs font-mono" style={{ color: theme.muted }}>…</span>
              : <button key={p} onClick={() => onPageChange(p)}
                className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>{p}</button>
          )}
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
            style={{ background: `${theme.accent}10`, color: theme.muted }}>next</button>
        </div>
      )}
      <span className="text-[11px] font-mono" style={{ color: theme.muted }}>{total} total</span>
    </div>
  )
}

export default function TenantList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')
  const [viewMode, setViewMode] = useState('list')
  const [deleteId, setDeleteId] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteInputValue, setDeleteInputValue] = useState('')

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

  const deleteMut = useMutation({
    mutationFn: id => superAdminService.deleteTenant(id),
    onSuccess: () => {
      toast.success('Company and all data permanently deleted')
      qc.invalidateQueries(['sa-tenants'])
      qc.invalidateQueries(['sa-platform-stats'])
      setDeleteId(null)
      setDeleteConfirmName('')
      setDeleteInputValue('')
    },
    onError: err => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const tenants = data?.data?.data?.tenants || []
  const totalPages = data?.data?.data?.totalPages || 1
  const totalDocs = data?.data?.data?.total || tenants.length
  const stats = statsData?.data?.data || {}

  const handlePerPage = (val, commit) => {
    setPerPageInput(val)
    if (commit) {
      const v = parseInt(val, 10)
      if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage))
    }
  }

  const openDelete = (e, t) => {
    e.stopPropagation()
    setDeleteId(t._id)
    setDeleteConfirmName(t.orgName)
    setDeleteInputValue('')
  }

  if (isLoading) return <Loader text="Loading companies..." />

  const paginationProps = {
    page, totalPages, total: totalDocs, perPage, perPageInput,
    onPageChange: setPage,
    onPerPageChange: handlePerPage,
  }

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

      {/* Search + View Toggle */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        
        
        {/* <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search companies by name..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }}
              className="text-xs opacity-50 hover:opacity-80" style={{ color: theme.muted }}>✕</button>
          )}
        </div> */}


        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
          <button onClick={() => setViewMode('list')} title="List view"
            className="p-2 transition-colors"
            style={{ background: viewMode === 'list' ? `${theme.accent}20` : 'transparent', color: viewMode === 'list' ? theme.accent : theme.muted }}>
            <List size={14} />
          </button>
          <button onClick={() => setViewMode('grid')} title="Grid view"
            className="p-2 transition-colors"
            style={{ background: viewMode === 'grid' ? `${theme.accent}20` : 'transparent', color: viewMode === 'grid' ? theme.accent : theme.muted, borderLeft: `1px solid ${theme.border}` }}>
            <LayoutGrid size={14} />
          </button>
        </div>
      </Card>

      {/* Content */}
      {tenants.length === 0 ? (
        <EmptyState icon={Building2} title="No companies yet" description="Create the first company to get started"
          action={<Button onClick={() => navigate('/super-admin/tenants/create')}><Plus size={14} /> Create Company</Button>} />
      ) : viewMode === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Company', 'Admin', 'Plan', 'Domains', 'Clients', 'Users', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t._id} className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                    onClick={() => navigate(`/super-admin/tenants/${t._id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>{t.orgName?.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: theme.text }}>{t.orgName}</p>
                          {t.website && <p className="text-[10px] font-mono truncate max-w-32" style={{ color: theme.muted }}>{t.website.replace(/^https?:\/\//, '')}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: theme.text }}>{t.adminId?.name || '—'}</p>
                      <p className="text-[10px] font-mono" style={{ color: theme.muted }}>{t.adminId?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                        style={{ background: `${theme.accent}12`, color: theme.accent }}>{t.planName || 'free'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.muted }}>
                        <Globe size={11} style={{ color: theme.accent }} />{t.domainCount ?? '—'}<span className="text-[9px]">/ {t.maxDomains}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.muted }}>
                        <Users size={11} style={{ color: theme.accent }} />{t.clientCount ?? '—'}<span className="text-[9px]">/ {t.maxClients}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-center" style={{ color: theme.muted }}>{t.userCount ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono" style={{ color: t.isActive ? '#62B849' : '#C94040' }}>
                        {t.isActive ? '● ACTIVE' : '● SUSPENDED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                      {t.createdAt ? format(new Date(t.createdAt), 'dd MMM yy') : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/super-admin/tenants/${t._id}`)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          style={{ color: theme.accent }} title="View details"><Eye size={14} /></button>
                        <button onClick={() => toggleMut.mutate(t._id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          style={{ color: t.isActive ? '#62B849' : theme.muted }}
                          title={t.isActive ? 'Suspend' : 'Activate'}>
                          {t.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button onClick={e => openDelete(e, t)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          style={{ color: '#C94040' }} title="Delete company"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar {...paginationProps} />
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map(t => (
              <Card key={t._id} className="p-5 cursor-pointer transition-all hover:ring-1"
                onClick={() => navigate(`/super-admin/tenants/${t._id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>{t.orgName?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: theme.text }}>{t.orgName}</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded capitalize"
                        style={{ background: `${theme.accent}12`, color: theme.accent }}>{t.planName || 'free'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: t.isActive ? '#62B849' : '#C94040' }}>
                    {t.isActive ? '● ACTIVE' : '● SUSP.'}
                  </span>
                </div>
                <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <p className="text-[10px] font-mono uppercase mb-1" style={{ color: theme.muted }}>Admin</p>
                  <p className="text-xs font-semibold" style={{ color: theme.text }}>{t.adminId?.name || '—'}</p>
                  <p className="text-[11px] font-mono truncate" style={{ color: theme.muted }}>{t.adminId?.email}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Globe, label: 'Domains', val: `${t.domainCount ?? 0}/${t.maxDomains}` },
                    { icon: Users, label: 'Clients', val: `${t.clientCount ?? 0}/${t.maxClients}` },
                    { icon: Building2, label: 'Users', val: t.userCount ?? 0 },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="text-center p-2 rounded-lg" style={{ background: `${theme.accent}06` }}>
                      <Icon size={11} className="mx-auto mb-1" style={{ color: theme.accent }} />
                      <p className="text-[10px] font-mono font-bold" style={{ color: theme.text }}>{val}</p>
                      <p className="text-[9px]" style={{ color: theme.muted }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: theme.muted }}>
                    {t.createdAt ? format(new Date(t.createdAt), 'dd MMM yy') : '—'}
                  </span>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleMut.mutate(t._id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: t.isActive ? '#62B849' : theme.muted }}
                      title={t.isActive ? 'Suspend' : 'Activate'}>
                      {t.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                    <button onClick={e => openDelete(e, t)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      style={{ color: '#C94040' }} title="Delete company"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card><PaginationBar {...paginationProps} /></Card>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,64,64,0.15)' }}>
                <AlertTriangle size={20} style={{ color: '#C94040' }} />
              </div>
              <div>
                <h3 className="font-semibold text-base" style={{ color: theme.text }}>Delete Company</h3>
                <p className="text-xs font-mono" style={{ color: '#C94040' }}>This action is irreversible</p>
              </div>
            </div>
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: 'rgba(201,64,64,0.08)', border: '1px solid rgba(201,64,64,0.25)', color: theme.text }}>
              <p className="font-semibold mb-1">Permanently deletes all company data:</p>
              <ul className="list-disc list-inside space-y-0.5" style={{ color: theme.muted }}>
                <li>All users, domains, hosting plans</li>
                <li>All clients and portal accounts</li>
                <li>All invoices and billing records</li>
              </ul>
            </div>
            <p className="text-xs mb-2" style={{ color: theme.muted }}>
              Type <span className="font-mono font-bold" style={{ color: theme.text }}>{deleteConfirmName}</span> to confirm deletion:
            </p>
            <input
              value={deleteInputValue}
              onChange={e => setDeleteInputValue(e.target.value)}
              placeholder={deleteConfirmName}
              autoFocus
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-4"
              style={{
                background: `${theme.accent}08`,
                border: `1px solid ${deleteInputValue === deleteConfirmName && deleteInputValue ? '#C94040' : theme.border}`,
                color: theme.text,
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteId(null); setDeleteConfirmName(''); setDeleteInputValue('') }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>Cancel</button>
              <button
                onClick={() => deleteMut.mutate(deleteId)}
                disabled={deleteInputValue !== deleteConfirmName || !deleteInputValue || deleteMut.isPending}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: '#C94040', color: '#fff' }}>
                {deleteMut.isPending ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}