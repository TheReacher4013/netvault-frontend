import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Plus, Search, Trash2, Eye, Server, Filter } from 'lucide-react'
import { domainService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, StatusBadge, Loader, EmptyState, PageHeader, ConfirmDialog } from '../../components/ui/index'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DomainList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')
  const [delId, setDelId] = useState(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['domains', { search: debouncedSearch, status, page, perPage }],
    queryFn: () => domainService.getAll({ search: debouncedSearch, status, page, limit: perPage }),
    keepPreviousData: true,
  })

  const deleteMut = useMutation({
    mutationFn: (id) => domainService.remove(id),
    onSuccess: () => { toast.success('Domain deleted'); qc.invalidateQueries(['domains']); setDelId(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const domains = data?.data?.data?.docs || []
  const totalPages = data?.data?.data?.totalPages || 1
  const daysLeft = (expiry) => Math.ceil((new Date(expiry) - new Date()) / 86400000)

  if (isLoading && !data) return <Loader text="Loading domains..." />

  return (
    <div className="space-y-4">
      <PageHeader title="Domains" subtitle={`${data?.data?.data?.totalDocs || 0} total domains`}
        actions={<Button onClick={() => navigate('/domains/add')}><Plus size={14} />Add Domain</Button>} />

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search domains..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(1) }}
              className="text-xs opacity-50 hover:opacity-80"
              style={{ color: theme.muted }}>✕</button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: theme.muted }} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
            <option value="">Filter</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </Card>

      <Card>
        {domains.length === 0 ? (
          <EmptyState icon={Globe} title="No domains found" description="Add your first domain to get started"
            action={<Button onClick={() => navigate('/domains/add')}><Plus size={14} />Add Domain</Button>} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Sr', 'Domain', 'Client', 'Hosting', 'Status', 'Expiry', 'Days Left', 'Auto ↻', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: theme.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d, i) => {
                    const dl = daysLeft(d.expiryDate)
                    const srNo = (page - 1) * perPage + i + 1
                    return (
                      <tr key={d._id} className="hover:bg-white/[0.02] cursor-pointer"
                        style={{ borderBottom: `1px solid ${theme.border}` }}
                        onClick={() => navigate(`/domains/${d._id}`)}>

                        <td className="px-3 py-2 text-xs font-mono" style={{ color: theme.muted }}>{srNo}</td>

                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Globe size={12} style={{ color: theme.accent }} />
                            <div>
                              <p className="text-xs font-semibold font-mono" style={{ color: theme.text }}>{d.name}</p>
                              <p className="text-[10px]" style={{ color: theme.muted }}>{d.registrar || '—'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2 text-xs" style={{ color: theme.muted }}>{d.clientId?.name || '—'}</td>

                        <td className="px-3 py-2">
                          {d.hostingId ? (
                            <div className="flex items-center gap-1">
                              <Server size={11} style={{ color: theme.accent }} />
                              <span className="text-[11px] font-mono" style={{ color: theme.accent }}>{d.hostingId.label}</span>
                            </div>
                          ) : (
                            <span className="text-[11px]" style={{ color: theme.muted }}>—</span>
                          )}
                        </td>

                        <td className="px-3 py-2"><StatusBadge status={d.status} /></td>

                        <td className="px-3 py-2 text-xs font-mono" style={{ color: theme.muted }}>
                          {format(new Date(d.expiryDate), 'dd MMM yyyy')}
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-xs font-mono font-bold" style={{
                            color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849'
                          }}>
                            {dl < 0 ? `${Math.abs(dl)}d ago` : `${dl}d`}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-[11px] font-mono font-bold"
                            style={{ color: d.autoRenewal ? '#62B849' : theme.muted }}>
                            {d.autoRenewal ? '✓ ON' : 'OFF'}
                          </span>
                        </td>

                        <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => navigate(`/domains/${d._id}`)}
                              className="p-1.5 rounded-lg hover:bg-white/10" title="View"
                              style={{ color: theme.accent }}>
                              <Eye size={12} />
                            </button>
                            <button onClick={() => setDelId(d._id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10" title="Delete"
                              style={{ color: '#C94040' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y" style={{ borderColor: theme.border }}>
              {domains.map((d, i) => {
                const dl = daysLeft(d.expiryDate)
                const srNo = (page - 1) * perPage + i + 1
                return (
                  <div key={d._id} className="p-3 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => navigate(`/domains/${d._id}`)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: `${theme.accent}15`, color: theme.muted }}>#{srNo}</span>
                        <Globe size={12} style={{ color: theme.accent }} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold font-mono truncate" style={{ color: theme.text }}>{d.name}</p>
                          {d.registrar && <p className="text-[11px]" style={{ color: theme.muted }}>{d.registrar}</p>}
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-2">
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Client</p>
                        <p className="text-xs" style={{ color: theme.text }}>{d.clientId?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Hosting</p>
                        <p className="text-xs" style={{ color: theme.accent }}>{d.hostingId?.label || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Expiry</p>
                        <p className="text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(d.expiryDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Days Left</p>
                        <p className="text-sm font-mono font-bold" style={{
                          color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849'
                        }}>{dl < 0 ? `${Math.abs(dl)}d ago` : `${dl}d`}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold"
                        style={{ color: d.autoRenewal ? '#62B849' : theme.muted }}>
                        Auto: {d.autoRenewal ? '✓ ON' : 'OFF'}
                      </span>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/domains/${d._id}`)}
                          className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}>
                          <Eye size={13} />
                        </button>
                        <button onClick={() => setDelId(d._id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 flex-wrap"
          style={{ borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input type="number" min="1" max="100" value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={() => { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) }}
              onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(perPageInput, 10); if (v > 0) { setPerPage(v); setPage(1) } else setPerPageInput(String(perPage)) } }}
              className="w-12 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }} />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-mono"
                  style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>›</button>
            </div>
          )}
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>
            {data?.data?.data?.totalDocs || 0} total
          </span>
        </div>
      </Card>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)}
        onConfirm={() => deleteMut.mutate(delId)} loading={deleteMut.isPending}
        title="Delete Domain" message="Are you sure you want to delete this domain? This cannot be undone." />
    </div>
  )
}