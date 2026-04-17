// CreateInvoice.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input, Select } from '../../components/ui/index'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateInvoice() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({ clientId: '', dueDate: '', taxRate: 0, discount: 0, notes: '', currency: 'INR' })
  const [items, setItems] = useState([{ description: '', type: 'service', quantity: 1, unitPrice: 0, total: 0 }])

  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientService.getAll({ limit: 100 }) })
  const clients = clientsData?.data?.data?.docs || []

  const mut = useMutation({
    mutationFn: d => billingService.create(d),
    onSuccess: () => { toast.success('Invoice created & PDF generated!'); qc.invalidateQueries(['invoices']); navigate('/billing') },
  })

  const updateItem = (i, field, val) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: val }
      updated.total = updated.quantity * updated.unitPrice
      return updated
    }))
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const taxAmt = (subtotal * form.taxRate) / 100
  const total = subtotal + taxAmt - (form.discount || 0)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Create Invoice" subtitle="Generate a professional PDF invoice"
        actions={<Button variant="ghost" onClick={() => navigate('/billing')}>Cancel</Button>} />

      <Card className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Client *" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
            <option value="">Select client</option>
            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Due Date *" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: theme.muted }}>Line Items</p>
            <Button size="sm" variant="secondary" onClick={() => setItems(p => [...p, { description: '', type: 'service', quantity: 1, unitPrice: 0, total: 0 }])}>
              <Plus size={12} />Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><Input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></div>
                <div className="col-span-2"><Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} /></div>
                <div className="col-span-2"><Input type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', +e.target.value)} /></div>
                <div className="col-span-2">
                  <p className="text-[10px] font-mono mb-1.5" style={{ color: theme.muted }}>Total</p>
                  <p className="text-sm font-mono font-bold" style={{ color: theme.accent }}>₹{item.total.toLocaleString('en-IN')}</p>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg hover:bg-red-500/10 mb-0.5" style={{ color: '#C94040' }}><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="grid sm:grid-cols-2 gap-4" style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
          <div className="space-y-3">
            <Input label="Tax %" type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: +e.target.value }))} />
            <Input label="Discount (₹)" type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))} />
            <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment instructions..." />
          </div>
          <div className="p-4 rounded-xl space-y-2" style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
            {[['Subtotal', `₹${subtotal.toLocaleString('en-IN')}`], [`Tax (${form.taxRate}%)`, `₹${taxAmt.toLocaleString('en-IN')}`], ['Discount', `-₹${(form.discount||0).toLocaleString('en-IN')}`]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>{k}</span>
                <span className="font-mono" style={{ color: theme.text }}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
              <span className="font-bold text-sm" style={{ color: theme.text }}>Total</span>
              <span className="font-mono font-bold text-lg" style={{ color: theme.accent }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button loading={mut.isPending} onClick={() => {
            if (!form.clientId || !form.dueDate) return toast.error('Client and due date required')
            if (items.some(i => !i.description)) return toast.error('All items need a description')
            mut.mutate({ ...form, items })
          }}>Generate Invoice</Button>
          <Button variant="ghost" onClick={() => navigate('/billing')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
