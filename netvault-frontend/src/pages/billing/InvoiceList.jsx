import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, EmptyState, PageHeader, Modal, Input, Select } from '../../components/ui/index'
import { FileText, Plus, Eye, Download, Search, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function InvoiceList() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status, page, perPage],
    queryFn: () => billingService.getAll({ status, page, limit: perPage }),
    keepPreviousData: true,
  })

  const statusMut = useMutation({
    mutationFn: ({ id, s }) => billingService.updateStatus(id, s),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['invoices']) },
  })

  const invoices = data?.data?.data?.docs || []
  const totalPages = data?.data?.data?.totalPages || 1
  const totalDocs = data?.data?.data?.totalDocs || 0
  if (isLoading) return <Loader text="Loading invoices..." />

  const handleDownload = async (id, no) => {
    try {
      const res = await billingService.downloadPDF(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `${no}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download PDF') }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Billing & Invoices" subtitle={`${totalDocs} invoices`}
        actions={<Button onClick={() => navigate('/billing/create')}><Plus size={14} />Create Invoice</Button>} />

      <Card className="p-4 flex flex-wrap gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
          <option value="">All Status</option>
          {['draft', 'sent', 'paid', 'pending', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </Card>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="Create your first invoice"
            action={<Button onClick={() => navigate('/billing/create')}><Plus size={14} />Create Invoice</Button>} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Sr', 'Invoice #', 'Client', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => {
                    const srNo = (page - 1) * perPage + i + 1
                    return (
                      <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                        style={{ borderBottom: `1px solid ${theme.border}` }}
                        onClick={() => navigate(`/billing/${inv._id}`)}>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{srNo}</td>
                        <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: theme.accent }}>{inv.invoiceNo}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: theme.text }}>{inv.clientId?.name}</td>
                        <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: theme.text }}>₹{inv.total?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(inv.dueDate), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => navigate(`/billing/${inv._id}`)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}><Eye size={13} /></button>
                            <button onClick={() => handleDownload(inv._id, inv.invoiceNo)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.muted }}><Download size={13} /></button>
                            {(inv.status === 'pending' || inv.status === 'sent') && (
                              <button onClick={() => statusMut.mutate({ id: inv._id, s: 'paid' })} className="text-[10px] px-2 py-1 rounded-lg font-mono"
                                style={{ background: 'rgba(98,184,73,0.12)', color: '#62B849' }}>PAID</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y" style={{ borderColor: theme.border }}>
              {invoices.map((inv, i) => {
                const srNo = (page - 1) * perPage + i + 1
                return (
                  <div key={inv._id} className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate(`/billing/${inv._id}`)}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: `${theme.accent}15`, color: theme.muted }}>#{srNo}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-mono font-bold" style={{ color: theme.accent }}>{inv.invoiceNo}</p>
                          <p className="text-xs" style={{ color: theme.muted }}>{inv.clientId?.name}</p>
                        </div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Amount</p>
                        <p className="text-lg font-mono font-bold mt-0.5" style={{ color: theme.text }}>₹{inv.total?.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Due Date</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: theme.muted }}>{format(new Date(inv.dueDate), 'dd MMM yyyy')}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      {(inv.status === 'pending' || inv.status === 'sent') && (
                        <button onClick={() => statusMut.mutate({ id: inv._id, s: 'paid' })}
                          className="text-[10px] px-2 py-1 rounded-lg font-mono"
                          style={{ background: 'rgba(98,184,73,0.12)', color: '#62B849' }}>PAID</button>
                      )}
                      <button onClick={() => navigate(`/billing/${inv._id}`)}
                        className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}>
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDownload(inv._id, inv.invoiceNo)}
                        className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.muted }}>
                        <Download size={14} />
                      </button>
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
            <input
              type="number" min="1" max="100"
              value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={() => {
                const v = parseInt(perPageInput, 10)
                if (v > 0) { setPerPage(v); setPage(1) }
                else setPerPageInput(String(perPage))
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = parseInt(perPageInput, 10)
                  if (v > 0) { setPerPage(v); setPage(1) }
                  else setPerPageInput(String(perPageInput))
                }
              }}
              className="w-12 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
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
            {totalDocs} total
          </span>
        </div>
      </Card>
    </div>
  )
}