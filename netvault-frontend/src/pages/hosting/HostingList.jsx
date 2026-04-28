import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, StatusBadge, Loader, EmptyState, PageHeader, ConfirmDialog } from '../../components/ui/index'
import { Server, Plus, Eye, Trash2, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function HostingList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')
  const [delId, setDelId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Debounce search input — waits 400ms after typing stops before querying
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['hosting', search, statusFilter, page, perPage],
    queryFn: () => hostingService.getAll({ search, page, limit: perPage, ...(statusFilter ? { status: statusFilter } : {}) }),
    keepPreviousData: true,
  })

  const deleteMut = useMutation({
    mutationFn: id => hostingService.remove(id),
    onSuccess: () => { toast.success('Hosting deleted'); qc.invalidateQueries(['hosting']); setDelId(null) },
    onError: err => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const list = data?.data?.data?.docs || []
  const totalPages = data?.data?.data?.totalPages || 1
  if (isLoading) return <Loader text="Loading hosting plans..." />

  return (
    <div className="space-y-5">
      <PageHeader title="Hosting" subtitle={`${data?.data?.data?.totalDocs || 0} total plans`}
        actions={<Button onClick={() => navigate('/hosting/add')}><Plus size={14} />Add Hosting</Button>} />

      <Card className="p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search hosting..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch('') }}
              className="text-xs opacity-50 hover:opacity-80"
              style={{ color: theme.muted }}>✕</button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: theme.muted }} />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
            <option value="">Filter</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </Card>

      <Card>
        {list.length === 0 ? (
          <EmptyState icon={Server} title="No hosting plans" description="Add your first hosting plan"
            action={<Button onClick={() => navigate('/hosting/add')}><Plus size={14} />Add Hosting</Button>} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Sr', 'Label', 'Type', 'Server IP', 'Client', 'Status', 'Expiry', 'Auto ↻', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: theme.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((h, i) => {
                    const dl = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)
                    const srNo = (page - 1) * perPage + i + 1
                    return (
                      <tr key={h._id} className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                        style={{ borderBottom: `1px solid ${theme.border}` }}
                        onClick={() => navigate(`/hosting/${h._id}`)}>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{srNo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Server size={13} style={{ color: theme.accent }} />
                            <div>
                              <span className="text-xs font-semibold" style={{ color: theme.text }}>{h.label}</span>
                              {h.provider && <p className="text-[10px]" style={{ color: theme.muted }}>{h.provider}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                            style={{ background: `${theme.accent}12`, color: theme.accent }}>{h.planType}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{h.serverIP || '—'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{h.clientId?.name || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</p>
                            <p className="text-[10px] font-mono font-bold" style={{
                              color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849'
                            }}>{dl < 0 ? 'Expired' : `${dl}d left`}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono font-bold"
                            style={{ color: h.autoRenewal ? '#62B849' : theme.muted }}>
                            {h.autoRenewal ? '✓ ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => navigate(`/hosting/${h._id}`)}
                              className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }} title="View">
                              <Eye size={13} />
                            </button>
                            <button onClick={() => setDelId(h._id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }} title="Delete">
                              <Trash2 size={13} />
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
              {list.map((h, i) => {
                const dl = Math.ceil((new Date(h.expiryDate) - new Date()) / 86400000)
                const srNo = (page - 1) * perPage + i + 1
                return (
                  <div key={h._id} className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate(`/hosting/${h._id}`)}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: `${theme.accent}15`, color: theme.muted }}>#{srNo}</span>
                        <Server size={13} style={{ color: theme.accent }} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{h.label}</p>
                          {h.provider && <p className="text-[11px]" style={{ color: theme.muted }}>{h.provider}</p>}
                        </div>
                      </div>
                      <StatusBadge status={h.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Type</p>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded capitalize inline-block mt-0.5"
                          style={{ background: `${theme.accent}12`, color: theme.accent }}>{h.planType}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Client</p>
                        <p className="text-xs mt-0.5" style={{ color: theme.text }}>{h.clientId?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Server IP</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: theme.muted }}>{h.serverIP || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Expiry</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: theme.muted }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</p>
                        <p className="text-[11px] font-mono font-bold" style={{
                          color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849'
                        }}>{dl < 0 ? 'Expired' : `${dl}d left`}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold"
                        style={{ color: h.autoRenewal ? '#62B849' : theme.muted }}>
                        Auto: {h.autoRenewal ? '✓ ON' : 'OFF'}
                      </span>
                      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/hosting/${h._id}`)}
                          className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setDelId(h._id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }}>
                          <Trash2 size={14} />
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
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
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
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                  style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
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
        title="Delete Hosting" message="Delete this hosting plan permanently? This cannot be undone." />
    </div>
  )
}