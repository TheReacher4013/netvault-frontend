import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Plus, Search, Filter, Trash2, Eye, Wifi , Activity} from 'lucide-react'
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
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [delId, setDelId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['domains', { search, status, page }],
    queryFn: () => domainService.getAll({ search, status, page, limit: 15 }),
    keepPreviousData: true,
  })

  const deleteMut = useMutation({
    mutationFn: (id) => domainService.remove(id),
    onSuccess: () => { toast.success('Domain deleted'); qc.invalidateQueries(['domains']); setDelId(null) },
  })

  const domains = data?.data?.data?.docs || []
  const totalPages = data?.data?.data?.totalPages || 1

  const daysLeft = (expiry) => Math.ceil((new Date(expiry) - new Date()) / 86400000)

  if (isLoading) return <Loader text="Loading domains..." />

  return (
    <div className="space-y-5">
      <PageHeader title="Domains" subtitle={`${data?.data?.data?.totalDocs || 0} total domains`}
        actions={<Button onClick={() => navigate('/domains/add')}><Plus size={14} />Add Domain</Button>} />
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search domains..." className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
          <option value="transfer">Transfer</option>
        </select>
      </Card>

      {/* Table */}
      <Card>
        {domains.length === 0 ? (
          <EmptyState icon={Globe} title="No domains found" description="Add your first domain to get started"
            action={<Button onClick={() => navigate('/domains/add')}><Plus size={14} />Add Domain</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Domain','Client','Status','Expiry','Days Left','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider"
                      style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {domains.map((d, i) => {
                  const dl = daysLeft(d.expiryDate)
                  return (
                    <tr key={d._id} className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: `1px solid ${theme.border}`, animationDelay: `${i * 40}ms` }}
                      onClick={() => navigate(`/domains/${d._id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Globe size={13} style={{ color: theme.accent }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: theme.text }}>{d.name}</p>
                            <p className="text-[10px]" style={{ color: theme.muted }}>{d.registrar || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{d.clientId?.name || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                        {format(new Date(d.expiryDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold"
                          style={{ color: dl < 0 ? '#C94040' : dl <= 7 ? '#C94040' : dl <= 30 ? '#F0A045' : '#62B849' }}>
                          {dl < 0 ? `${Math.abs(dl)}d ago` : `${dl}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/domains/${d._id}`)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: theme.accent }}>
                            <Eye size={13} />
                          </button>
                          <button onClick={() => navigate(`/domains/${d._id}/dns`)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: theme.muted }}>
                            <Wifi size={13} />
                          </button>
                          <button onClick={() => setDelId(d._id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: '#C94040' }}>
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4" style={{ borderTop: `1px solid ${theme.border}` }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => deleteMut.mutate(delId)}
        loading={deleteMut.isPending} title="Delete Domain" message="Are you sure you want to delete this domain? This action cannot be undone." />
    </div>
  )
}
