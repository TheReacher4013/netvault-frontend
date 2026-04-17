// ── HostingList.jsx ───────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, StatusBadge, Loader, EmptyState, PageHeader, ConfirmDialog } from '../../components/ui/index'
import { Server, Plus, Eye, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function HostingList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [delId, setDelId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hosting', search],
    queryFn: () => hostingService.getAll({ search, limit: 20 }),
  })

  const deleteMut = useMutation({
    mutationFn: id => hostingService.remove(id),
    onSuccess: () => { toast.success('Hosting deleted'); qc.invalidateQueries(['hosting']); setDelId(null) },
  })

  const list = data?.data?.data?.docs || []
  if (isLoading) return <Loader text="Loading hosting plans..." />

  return (
    <div className="space-y-5">
      <PageHeader title="Hosting" subtitle={`${data?.data?.data?.totalDocs || 0} total plans`}
        actions={<Button onClick={() => navigate('/hosting/add')}><Plus size={14} />Add Hosting</Button>} />
      <Card className="p-4 flex gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hosting..."
            className="bg-transparent outline-none text-xs flex-1" style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      </Card>
      <Card>
        {list.length === 0 ? (
          <EmptyState icon={Server} title="No hosting plans" description="Add your first hosting plan"
            action={<Button onClick={() => navigate('/hosting/add')}><Plus size={14} />Add Hosting</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Label','Type','Server IP','Client','Status','Expiry',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(h => (
                  <tr key={h._id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: `1px solid ${theme.border}` }}
                    onClick={() => navigate(`/hosting/${h._id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Server size={13} style={{ color: theme.accent }} />
                        <span className="text-xs font-semibold" style={{ color: theme.text }}>{h.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize" style={{ background: `${theme.accent}12`, color: theme.accent }}>{h.planType}</span></td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{h.serverIP || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{h.clientId?.name || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(h.expiryDate), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/hosting/${h._id}`)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}><Eye size={13} /></button>
                        <button onClick={() => setDelId(h._id)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#C94040' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={() => deleteMut.mutate(delId)}
        loading={deleteMut.isPending} title="Delete Hosting" message="Delete this hosting plan permanently?" />
    </div>
  )
}
