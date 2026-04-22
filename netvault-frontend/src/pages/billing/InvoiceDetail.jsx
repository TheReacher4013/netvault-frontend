import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader } from '../../components/ui/index'
import { ArrowLeft, Download, CheckCircle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingService.getOne(id),
  })

  const statusMut = useMutation({
    mutationFn: (s) => billingService.updateStatus(id, s),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['invoice', id]); qc.invalidateQueries(['invoices']) },
  })

  const deleteMut = useMutation({
    mutationFn: () => billingService.remove(id),
    onSuccess: () => {
      toast.success('Invoice deleted')
      qc.invalidateQueries(['invoices'])
      navigate('/billing')
    },
    onError: () => toast.error('Failed to delete invoice'),
  })

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    deleteMut.mutate()
  }

  const handleDownload = async () => {
    try {
      const res = await billingService.downloadPDF(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `${inv.invoiceNo}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download PDF') }
  }

  if (isLoading) return <Loader text="Loading invoice..." />

  const inv = data?.data?.data?.invoice
  if (!inv) return <div className="text-center py-20" style={{ color: theme.muted }}>Invoice not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title={inv.invoiceNo}
        subtitle={`Created ${format(new Date(inv.createdAt), 'dd MMM yyyy')}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/billing')}><ArrowLeft size={13} />Back</Button>
            <Button variant="secondary" size="sm" onClick={handleDownload}><Download size={13} />PDF</Button>
            {(inv.status === 'pending' || inv.status === 'sent') && (
              <Button size="sm" onClick={() => statusMut.mutate('paid')} loading={statusMut.isPending}>
                <CheckCircle size={13} />Mark Paid
              </Button>
            )}
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: confirmDelete ? '#C94040' : '#C9404018',
                color: confirmDelete ? '#fff' : '#C94040',
                border: '1px solid #C9404040',
              }}
            >
              <Trash2 size={13} />
              {deleteMut.isPending ? 'Deleting…' : confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Invoice details */}
        <Card className="lg:col-span-2">
          <CardHeader title="Invoice Details" />
          <div className="p-5">
            {/* Client info */}
            <div className="p-4 rounded-xl mb-5" style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: theme.muted }}>Bill To</p>
              <p className="font-semibold text-sm" style={{ color: theme.text }}>{inv.clientId?.name}</p>
              <p className="text-xs" style={{ color: theme.muted }}>{inv.clientId?.company}</p>
              <p className="text-xs font-mono" style={{ color: theme.muted }}>{inv.clientId?.email}</p>
              <p className="text-xs" style={{ color: theme.muted }}>{inv.clientId?.phone}</p>
            </div>

            {/* Line items */}
            <table className="w-full mb-5">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} className="pb-2 text-left text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td className="py-2.5 text-xs" style={{ color: theme.text }}>{item.description}</td>
                    <td className="py-2.5 text-xs font-mono" style={{ color: theme.muted }}>{item.quantity}</td>
                    <td className="py-2.5 text-xs font-mono" style={{ color: theme.muted }}>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-sm font-mono font-bold" style={{ color: theme.accent }}>₹{item.total?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1.5 text-xs ml-auto max-w-xs">
              {[
                ['Subtotal', `₹${inv.subtotal?.toLocaleString('en-IN')}`],
                [`Tax (${inv.taxRate}%)`, `₹${inv.taxAmount?.toLocaleString('en-IN')}`],
                ['Discount', `-₹${inv.discount?.toLocaleString('en-IN')}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span style={{ color: theme.muted }}>{k}</span>
                  <span className="font-mono" style={{ color: theme.text }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-base font-bold" style={{ borderTop: `1px solid ${theme.border}` }}>
                <span style={{ color: theme.text }}>Total</span>
                <span className="font-mono" style={{ color: theme.accent }}>₹{inv.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {inv.notes && (
              <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: `${theme.accent}06`, color: theme.muted }}>
                <strong style={{ color: theme.text }}>Notes: </strong>{inv.notes}
              </div>
            )}
          </div>
        </Card>

        {/* Status sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Status</p>
            <StatusBadge status={inv.status} />
            <div className="mt-4 space-y-2 text-xs">
              {[
                ['Due Date', format(new Date(inv.dueDate), 'dd MMM yyyy')],
                ['Currency', inv.currency],
                ['Created By', inv.createdBy?.name || 'System'],
                ...(inv.paidAt ? [['Paid On', format(new Date(inv.paidAt), 'dd MMM yyyy')]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span style={{ color: theme.muted }}>{k}</span>
                  <span className="font-mono" style={{ color: theme.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Status actions */}
          <Card className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Update Status</p>
            <div className="space-y-2">
              {['paid', 'pending', 'overdue', 'cancelled'].map(s => (
                <button key={s} onClick={() => statusMut.mutate(s)}
                  disabled={inv.status === s}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30 capitalize"
                  style={{ background: `${theme.accent}10`, color: theme.text, border: `1px solid ${inv.status === s ? theme.accent : theme.border}` }}>
                  Mark as {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="p-4">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: theme.muted }}>Danger Zone</p>
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: confirmDelete ? '#C94040' : '#C9404015',
                color: confirmDelete ? '#fff' : '#C94040',
                border: '1px solid #C9404040',
              }}
            >
              <Trash2 size={15} />
              {deleteMut.isPending ? 'Deleting…' : confirmDelete ? 'Tap again to confirm' : 'Delete Invoice'}
            </button>
            <p className="text-[10px] mt-2 text-center" style={{ color: theme.muted }}>This action cannot be undone</p>
          </Card>
        </div>
      </div>
    </div>
  )
}