import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader } from '../../components/ui/index'
import { ArrowLeft, Download, CheckCircle, Trash2, ChevronDown, FileJson, FileImage, File } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)

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

  const handleDownloadPDF = async () => {
    setDownloadOpen(false)
    try {
      const res = await billingService.downloadPDF(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `${inv.invoiceNo}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download PDF') }
  }

  const handleDownloadJSON = () => {
    setDownloadOpen(false)
    try {
      const data = {
        invoiceNo: inv.invoiceNo, client: inv.clientId?.name,
        email: inv.clientId?.email, company: inv.clientId?.company,
        status: inv.status, currency: inv.currency,
        subtotal: inv.subtotal, taxRate: inv.taxRate, taxAmount: inv.taxAmount,
        discount: inv.discount, total: inv.total,
        dueDate: inv.dueDate, createdAt: inv.createdAt,
        items: inv.items, notes: inv.notes,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${inv.invoiceNo}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to export JSON') }
  }

  const handleDownloadImage = async (format = 'png') => {
    setDownloadOpen(false)
    try {
      // Capture the invoice card via html2canvas-like approach using SVG
      const inv2 = inv
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
        <rect width="600" height="800" fill="#0E0F13"/>
        <rect x="30" y="30" width="540" height="740" rx="12" fill="#16171D" stroke="#2A2B35" stroke-width="1"/>
        <text x="50" y="75" font-family="monospace" font-size="22" font-weight="bold" fill="#FFFFFF">${inv2.invoiceNo}</text>
        <text x="50" y="100" font-family="monospace" font-size="12" fill="#6B7280">Invoice</text>
        <line x1="50" y1="115" x2="550" y2="115" stroke="#2A2B35" stroke-width="1"/>
        <text x="50" y="145" font-family="sans-serif" font-size="11" fill="#6B7280">Bill To</text>
        <text x="50" y="165" font-family="sans-serif" font-size="14" font-weight="600" fill="#FFFFFF">${inv2.clientId?.name || ''}</text>
        <text x="50" y="183" font-family="sans-serif" font-size="12" fill="#6B7280">${inv2.clientId?.email || ''}</text>
        <text x="400" y="145" font-family="sans-serif" font-size="11" fill="#6B7280">Status</text>
        <text x="400" y="165" font-family="monospace" font-size="13" font-weight="bold" fill="${inv2.status === 'paid' ? '#62B849' : inv2.status === 'overdue' ? '#C94040' : '#F0A045'}">${(inv2.status || '').toUpperCase()}</text>
        <text x="400" y="183" font-family="sans-serif" font-size="11" fill="#6B7280">Due: ${inv2.dueDate ? new Date(inv2.dueDate).toLocaleDateString('en-IN') : ''}</text>
        <line x1="50" y1="200" x2="550" y2="200" stroke="#2A2B35" stroke-width="1"/>
        <text x="50" y="225" font-family="monospace" font-size="10" fill="#6B7280">DESCRIPTION</text>
        <text x="380" y="225" font-family="monospace" font-size="10" fill="#6B7280">QTY</text>
        <text x="430" y="225" font-family="monospace" font-size="10" fill="#6B7280">PRICE</text>
        <text x="490" y="225" font-family="monospace" font-size="10" fill="#6B7280">TOTAL</text>
        ${(inv2.items || []).map((item, idx) => `
        <text x="50" y="${250 + idx * 28}" font-family="sans-serif" font-size="12" fill="#E5E7EB">${(item.description || '').slice(0, 35)}</text>
        <text x="380" y="${250 + idx * 28}" font-family="monospace" font-size="12" fill="#9CA3AF">${item.quantity}</text>
        <text x="430" y="${250 + idx * 28}" font-family="monospace" font-size="12" fill="#9CA3AF">₹${(item.unitPrice || 0).toLocaleString('en-IN')}</text>
        <text x="490" y="${250 + idx * 28}" font-family="monospace" font-size="12" fill="#6366F1">₹${(item.total || 0).toLocaleString('en-IN')}</text>
        `).join('')}
        <line x1="50" y1="${250 + (inv2.items?.length || 0) * 28 + 10}" x2="550" y2="${250 + (inv2.items?.length || 0) * 28 + 10}" stroke="#2A2B35" stroke-width="1"/>
        <text x="400" y="${280 + (inv2.items?.length || 0) * 28 + 10}" font-family="sans-serif" font-size="12" fill="#6B7280">Subtotal</text>
        <text x="490" y="${280 + (inv2.items?.length || 0) * 28 + 10}" font-family="monospace" font-size="12" fill="#E5E7EB">₹${(inv2.subtotal || 0).toLocaleString('en-IN')}</text>
        <text x="400" y="${305 + (inv2.items?.length || 0) * 28 + 10}" font-family="sans-serif" font-size="12" fill="#6B7280">Tax (${inv2.taxRate}%)</text>
        <text x="490" y="${305 + (inv2.items?.length || 0) * 28 + 10}" font-family="monospace" font-size="12" fill="#E5E7EB">₹${(inv2.taxAmount || 0).toLocaleString('en-IN')}</text>
        <text x="400" y="${340 + (inv2.items?.length || 0) * 28 + 10}" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">Total</text>
        <text x="470" y="${340 + (inv2.items?.length || 0) * 28 + 10}" font-family="monospace" font-size="18" font-weight="bold" fill="#6366F1">₹${(inv2.total || 0).toLocaleString('en-IN')}</text>
        <text x="50" y="760" font-family="monospace" font-size="10" fill="#374151">Generated by NetVault · ${new Date().toLocaleDateString('en-IN')}</text>
      </svg>`

      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      if (format === 'svg') {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${inv2.invoiceNo}.svg`; a.click()
        URL.revokeObjectURL(url)
      } else {
        // Convert SVG → Canvas → JPEG
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 600; canvas.height = 800
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)
          canvas.toBlob(jpgBlob => {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(jpgBlob)
            a.download = `${inv2.invoiceNo}.jpg`; a.click()
          }, 'image/jpeg', 0.92)
        }
        img.src = url
      }
    } catch { toast.error('Failed to export image') }
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
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setDownloadOpen(v => !v)}>
                <Download size={13} />Download<ChevronDown size={11} className={`transition-transform ${downloadOpen ? 'rotate-180' : ''}`} />
              </Button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl min-w-[160px]"
                  style={{ background: 'var(--nv-surface, #16171D)', border: '1px solid var(--nv-border, #2A2B35)' }}
                  onMouseLeave={() => setDownloadOpen(false)}>
                  {[
                    { icon: <File size={13} />, label: 'PDF', action: handleDownloadPDF, color: '#C94040' },
                    { icon: <FileJson size={13} />, label: 'JSON', action: handleDownloadJSON, color: '#62B849' },
                    { icon: <FileImage size={13} />, label: 'SVG', action: () => handleDownloadImage('svg'), color: '#4A8FA8' },
                    { icon: <FileImage size={13} />, label: 'JPEG', action: () => handleDownloadImage('jpeg'), color: '#F0A045' },
                  ].map(({ icon, label, action, color }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors text-left"
                      style={{ color }}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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