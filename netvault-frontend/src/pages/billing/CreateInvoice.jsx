import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input, Select } from '../../components/ui/index'
import { Plus, Trash2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const toNum = (v) => (v === '' || v === undefined || v === null ? 0 : parseFloat(v) || 0)

const todayStr = () => new Date().toISOString().split('T')[0]

const TotalDisplay = ({ label, value, accent }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8b9aa4' }}>
      {label}
    </span>
    <span
      className="text-sm font-mono font-bold px-3 py-2 rounded-lg"
      style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}35` }}
    >
      {value}
    </span>
  </div>
)

const INPUT_STYLE = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  color: '#111827',
  caretColor: '#111827',
}

const NumberInput = ({ label, placeholder, value, onChange, min, step, hint, suffix }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#94a3b8' }}>
        {label}
      </label>
    )}
    <div className="relative">
      <input
        type="number"
        min={min ?? 0}
        step={step ?? 'any'}
        placeholder={placeholder}
        value={value === 0 ? '' : value}
        onChange={onChange}
        className="w-full px-3 py-2 rounded-lg text-sm font-medium outline-none transition-all"
        style={{
          ...INPUT_STYLE,
          paddingRight: suffix ? '2.5rem' : undefined,
        }}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none"
          style={{ color: '#6b7280' }}>
          {suffix}
        </span>
      )}
    </div>
    {hint && <span className="text-[10px]" style={{ color: '#64748b' }}>{hint}</span>}
  </div>
)

export default function CreateInvoice() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    clientId: '',
    dueDate: '',
    taxRate: 0,
    discountType: 'flat',
    discount: 0,
    notes: '',
    currency: 'INR',
  })

  const [items, setItems] = useState([
    { description: '', type: 'service', quantity: '', unitPrice: '', total: 0 },
  ])

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientService.getAll({ limit: 100 }),
  })
  const clients = clientsData?.data?.data?.docs || []

  const mut = useMutation({
    mutationFn: (d) => billingService.create(d),
    onSuccess: () => {
      toast.success('Invoice created! PDF generated & emailed to client.')
      qc.invalidateQueries(['invoices'])
      navigate('/billing')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create invoice')
    },
  })

  const updateItem = (i, field, val) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== i) return item
        const updated = { ...item, [field]: val }
        updated.total = toNum(updated.quantity) * toNum(updated.unitPrice)
        return updated
      })
    )
  }

  const addItem = () =>
    setItems((p) => [...p, { description: '', type: 'service', quantity: '', unitPrice: '', total: 0 }])

  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((s, item) => s + item.total, 0)
  const taxAmt = (subtotal * toNum(form.taxRate)) / 100
  const discountAmt =
    form.discountType === 'percent'
      ? (subtotal * toNum(form.discount)) / 100
      : toNum(form.discount)
  const total = Math.max(0, subtotal + taxAmt - discountAmt)

  const fmtINR = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [dueDateError, setDueDateError] = useState('')

  const handleDueDateChange = (val) => {
    setForm(f => ({ ...f, dueDate: val }))
    if (!val) setDueDateError('Due date is required')
    else if (val < todayStr()) setDueDateError('Due date cannot be in the past')
    else setDueDateError('')
  }

  const handleSubmit = () => {
    if (!form.clientId) return toast.error('Please select a client')
    if (!form.dueDate) return toast.error('Please set a due date')
    if (form.dueDate < todayStr()) return toast.error('Due date cannot be in the past')
    if (items.some((i) => !i.description.trim())) return toast.error('All items need a description')
    if (items.some((i) => toNum(i.quantity) <= 0)) return toast.error('All items need a quantity > 0')
    if (items.some((i) => toNum(i.unitPrice) <= 0)) return toast.error('All items need a unit price > 0')
    if (form.discountType === 'percent' && toNum(form.discount) > 100)
      return toast.error('Discount % cannot exceed 100')

    const normalisedItems = items.map((item) => ({
      description: item.description.trim(),
      type: item.type,
      quantity: toNum(item.quantity),
      unitPrice: toNum(item.unitPrice),
      total: item.total,
    }))

    mut.mutate({
      clientId: form.clientId,
      dueDate: form.dueDate,
      taxRate: toNum(form.taxRate),
      discount: discountAmt,
      notes: form.notes,
      currency: form.currency,
      items: normalisedItems,
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Create Invoice"
        subtitle="Fill in the details — a PDF will be generated and emailed to the client automatically"
        actions={<Button variant="ghost" onClick={() => navigate('/billing')}>Cancel</Button>}
      />

      {/* Client & Date */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Invoice Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Client *"
            value={form.clientId}
            onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
          >
            <option value="">Select a client…</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
            ))}
          </Select>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#94a3b8' }}>
              Due Date *
            </label>
            <input
              type="date"
              min={todayStr()}
              value={form.dueDate}
              onChange={e => handleDueDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium outline-none transition-all"
              style={{
                ...INPUT_STYLE,
                border: `1px solid ${dueDateError ? '#ef4444' : '#d1d5db'}`,
                colorScheme: 'light',
              }}
            />
            {dueDateError && (
              <span className="text-[11px]" style={{ color: '#ef4444' }}>⚠ {dueDateError}</span>
            )}
            {!dueDateError && form.dueDate && (
              <span className="text-[11px]" style={{ color: '#22c55e' }}>✓ Valid due date</span>
            )}
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Line Items</h3>
            <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>
              Total = Quantity × Unit Price (calculated automatically)
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={addItem}><Plus size={12} /> Add Item</Button>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-2 px-1">
          {[
            { label: 'Description *', cls: 'col-span-4' },
            { label: 'Type', cls: 'col-span-2' },
            { label: 'Quantity *', cls: 'col-span-2' },
            { label: 'Unit Price (₹) *', cls: 'col-span-2' },
            { label: 'Total (auto)', cls: 'col-span-2' },
          ].map(({ label, cls }) => (
            <div key={label} className={`${cls} text-[10px] font-mono uppercase tracking-wider`} style={{ color: theme.muted }}>
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl"
              style={{ background: `${theme.accent}05`, border: `1px solid ${theme.border}` }}>

              <div className="col-span-12 sm:col-span-4">
                <label className="sm:hidden text-[10px] font-mono uppercase mb-1 block" style={{ color: theme.muted }}>Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Domain Registration — example.com"
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium outline-none transition-all"
                  style={INPUT_STYLE}
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="sm:hidden text-[10px] font-mono uppercase mb-1 block" style={{ color: theme.muted }}>Type</label>
                <Select value={item.type} onChange={e => updateItem(i, 'type', e.target.value)}>
                  <option value="service">Service</option>
                  <option value="domain">Domain</option>
                  <option value="hosting">Hosting</option>
                  <option value="ssl">SSL</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="col-span-6 sm:col-span-2">
                <NumberInput
                  label="Quantity *"
                  placeholder="e.g. 1"
                  min={1} step={1}
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <NumberInput
                  label="Unit Price (₹) *"
                  placeholder="e.g. 999"
                  min={0} step={0.01}
                  value={item.unitPrice}
                  onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                />
              </div>

              <div className="col-span-5 sm:col-span-2">
                <TotalDisplay label="Total" value={fmtINR(item.total)} accent={theme.accent} />
              </div>

              <div className="col-span-1 flex items-end justify-center pb-0.5">
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} title="Remove item"
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl text-[11px]"
          style={{ background: `${theme.accent}08`, color: theme.muted }}>
          <Info size={13} className="mt-0.5 shrink-0" style={{ color: theme.accent }} />
          <span>
            <strong style={{ color: theme.text }}>Calculation logic: </strong>
            Line Total = Qty × Unit Price &nbsp;·&nbsp;
            Subtotal = Σ all lines &nbsp;·&nbsp;
            Tax = Subtotal × Tax% &nbsp;·&nbsp;
            Invoice Total = Subtotal + Tax − Discount
          </span>
        </div>
      </Card>

      {/* Adjustments & Summary */}
      <Card className="p-6">
        <div className="grid sm:grid-cols-2 gap-6">

          <div className="space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Adjustments & Notes</h3>

            <NumberInput
              label="Tax Rate (%)"
              placeholder="e.g. 18 for 18% GST"
              min={0} step={0.5}
              suffix="%"
              value={form.taxRate}
              onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
              hint="Enter 0 if no tax applies"
            />

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                Discount
              </label>
              <div className="flex rounded-lg overflow-hidden mb-1"
                style={{ border: '1px solid #d1d5db', width: 'fit-content' }}>
                {[
                  { val: 'flat', label: '₹ Flat' },
                  { val: 'percent', label: '% Percent' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, discountType: opt.val, discount: 0 }))}
                    className="px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: form.discountType === opt.val ? theme.accent : '#ffffff',
                      color: form.discountType === opt.val ? '#fff' : '#6b7280',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={form.discountType === 'percent' ? 100 : undefined}
                  step={form.discountType === 'percent' ? 0.5 : 1}
                  placeholder={form.discountType === 'percent' ? 'e.g. 10 for 10% off' : 'e.g. 500'}
                  value={form.discount === 0 ? '' : form.discount}
                  onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium outline-none transition-all"
                  style={{ ...INPUT_STYLE, paddingRight: '2.5rem' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none"
                  style={{ color: '#6b7280' }}>
                  {form.discountType === 'percent' ? '%' : '₹'}
                </span>
              </div>

              {toNum(form.discount) > 0 && (
                <span className="text-[11px]" style={{ color: '#22c55e' }}>
                  = {fmtINR(discountAmt)} off
                  {form.discountType === 'percent' ? ` (${toNum(form.discount)}% of subtotal)` : ''}
                </span>
              )}
              {form.discountType === 'percent' && toNum(form.discount) > 100 && (
                <span className="text-[11px]" style={{ color: '#ef4444' }}>⚠ Discount % cannot exceed 100</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                Notes / Payment Instructions
              </label>
              <textarea
                placeholder="e.g. Payment via UPI: example@upi  |  Bank: HDFC IFSC HDFC0001234"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium outline-none resize-none transition-all"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Invoice Summary</h3>
            <div className="p-5 rounded-xl space-y-3"
              style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>

              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Subtotal</span>
                <span className="font-mono" style={{ color: theme.text }}>{fmtINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Tax ({toNum(form.taxRate)}%)</span>
                <span className="font-mono" style={{ color: theme.text }}>+ {fmtINR(taxAmt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>
                  Discount{form.discountType === 'percent' && toNum(form.discount) > 0 ? ` (${toNum(form.discount)}%)` : ''}
                </span>
                <span className="font-mono" style={{ color: discountAmt > 0 ? '#22c55e' : theme.text }}>
                  − {fmtINR(discountAmt)}
                </span>
              </div>
              <div className="flex justify-between pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                <span className="font-bold text-sm" style={{ color: theme.text }}>Invoice Total</span>
                <span className="font-mono font-bold text-xl" style={{ color: theme.accent }}>{fmtINR(total)}</span>
              </div>
              <p className="text-[10px] text-center pt-1" style={{ color: theme.muted }}>
                📧 PDF invoice will be emailed to the client on creation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5" style={{ borderTop: `1px solid ${theme.border}` }}>
          <Button loading={mut.isPending} onClick={handleSubmit}>
            Generate &amp; Send Invoice
          </Button>
          <Button variant="ghost" onClick={() => navigate('/billing')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}