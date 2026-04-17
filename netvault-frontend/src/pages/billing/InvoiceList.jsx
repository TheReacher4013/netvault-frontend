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

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => billingService.getAll({ status, limit: 20 }),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, s }) => billingService.updateStatus(id, s),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['invoices']) },
  })

  const invoices = data?.data?.data?.docs || []
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
      <PageHeader title="Billing & Invoices" subtitle={`${data?.data?.data?.totalDocs || 0} invoices`}
        actions={<Button onClick={() => navigate('/billing/create')}><Plus size={14} />Create Invoice</Button>} />

      <Card className="p-4 flex flex-wrap gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
          <option value="">All Status</option>
          {['draft','sent','paid','pending','overdue','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </Card>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="Create your first invoice"
            action={<Button onClick={() => navigate('/billing/create')}><Plus size={14} />Create Invoice</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Invoice #','Client','Amount','Status','Due Date','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: `1px solid ${theme.border}` }}
                    onClick={() => navigate(`/billing/${inv._id}`)}>
                    <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: theme.accent }}>{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: theme.text }}>{inv.clientId?.name}</td>
                    <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: theme.text }}>₹{inv.total?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{format(new Date(inv.dueDate), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/billing/${inv._id}`)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.accent }}><Eye size={13} /></button>
                        <button onClick={() => handleDownload(inv._id, inv.invoiceNo)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: theme.muted }}><Download size={13} /></button>
                        {inv.status === 'pending' || inv.status === 'sent' ? (
                          <button onClick={() => statusMut.mutate({ id: inv._id, s: 'paid' })} className="text-[10px] px-2 py-1 rounded-lg font-mono"
                            style={{ background: 'rgba(98,184,73,0.12)', color: '#62B849' }}>PAID</button>
                        ) : null}
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
