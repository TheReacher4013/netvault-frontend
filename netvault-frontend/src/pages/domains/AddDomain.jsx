// src/pages/domains/AddDomain.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, Info, AlertCircle, CheckCircle2 } from 'lucide-react'
import { domainService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input, Select } from '../../components/ui/index'
import toast from 'react-hot-toast'

// ── Domain name examples ──────────────────────────────────────────────────
const DOMAIN_EXAMPLES = [
  { label: 'Standard domain', value: 'example.com' },
  { label: 'Country code (ccTLD)', value: 'mybusiness.in' },
  { label: 'New TLD', value: 'agency.io' },
  { label: 'Subdomain (track separately)', value: 'shop.example.com' },
]

// ── Helper: validate domain format ───────────────────────────────────────
const isValidDomain = (val) =>
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(val.trim())

export default function AddDomain() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    registrar: '',
    expiryDate: '',
    clientId: '',
    autoRenewal: false,
    renewalCost: '',
    sellingPrice: '',
    notes: '',
  })

  const [domainValid, setDomainValid] = useState(null) // null | true | false

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientService.getAll({ limit: 100 }),
  })
  const clients = clientsData?.data?.data?.docs || []

  const mut = useMutation({
    mutationFn: (d) => domainService.create(d),
    onSuccess: () => {
      toast.success(`Domain ${form.name} added successfully!`)
      qc.invalidateQueries(['domains'])
      navigate('/domains')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to add domain'
      // Show plan limit message prominently
      if (err.response?.status === 403) {
        toast.error(msg, { duration: 6000 })
      } else {
        toast.error(msg)
      }
    },
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))

    if (name === 'name') {
      if (!value) return setDomainValid(null)
      setDomainValid(isValidDomain(value))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Domain name is required')
    if (!form.expiryDate) return toast.error('Expiry date is required')
    if (!isValidDomain(form.name)) return toast.error('Enter a valid domain name (e.g. example.com)')
    mut.mutate({ ...form, name: form.name.toLowerCase().trim() })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader
        title="Add Domain"
        subtitle="Track an existing domain — enter its details below"
        actions={<Button variant="ghost" onClick={() => navigate('/domains')}>Cancel</Button>}
      />

      {/* What "Add Domain" means — info box */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: theme.accent }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: theme.text }}>
              What does "Add Domain" mean?
            </p>
            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
              This does <strong style={{ color: theme.text }}>NOT</strong> register or purchase a domain.
              It adds an <strong style={{ color: theme.text }}>existing domain</strong> you already own
              (purchased from GoDaddy, Namecheap, etc.) into NetVault so you can track its expiry,
              DNS, SSL, and renewal cost — all in one place.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section 1: Domain identity */}
          <SectionTitle title="Domain Information" theme={theme} />

          {/* Domain Name field with live validation */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
              Domain Name <span style={{ color: '#C94040' }}>*</span>
            </label>
            <div className="relative">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="example.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono transition-all"
                style={{
                  background: `${theme.accent}08`,
                  border: `1px solid ${domainValid === false ? '#C94040' : domainValid === true ? '#62B849' : theme.border}`,
                  color: theme.text,
                }}
              />
              {domainValid !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {domainValid
                    ? <CheckCircle2 size={14} style={{ color: '#62B849' }} />
                    : <AlertCircle size={14} style={{ color: '#C94040' }} />}
                </div>
              )}
            </div>

            {/* Validation message */}
            {domainValid === false && (
              <p className="text-[11px] mt-1" style={{ color: '#C94040' }}>
                Invalid format. Enter just the domain without http:// — e.g. <code>example.com</code>
              </p>
            )}

            {/* Examples */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DOMAIN_EXAMPLES.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, name: value })); setDomainValid(true) }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.border}` }}
                  title={label}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: theme.muted }}>
              Click an example above or type your domain. No <code>http://</code>, no path, just the domain.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Registrar */}
            <div>
              <Input
                label="Registrar (where you bought it)"
                name="registrar"
                value={form.registrar}
                onChange={handleChange}
                placeholder="GoDaddy, Namecheap, BigRock..."
              />
              <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                The company you purchased this domain from.
              </p>
            </div>

            {/* Expiry Date */}
            <div>
              <Input
                label="Expiry / Renewal Date *"
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
              />
              <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                The date this domain expires. Find it in your registrar dashboard.
              </p>
            </div>
          </div>

          {/* Section 2: Assignment */}
          <SectionTitle title="Assignment" theme={theme} />

          <Select
            label="Assign to Client (optional)"
            name="clientId"
            value={form.clientId}
            onChange={handleChange}
          >
            <option value="">— No client (company-owned) —</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name} — {c.email}</option>
            ))}
          </Select>

          {/* Section 3: Billing */}
          <SectionTitle title="Billing & Costs" theme={theme} />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Your Cost (₹/year)"
                name="renewalCost"
                type="number"
                value={form.renewalCost}
                onChange={handleChange}
                placeholder="799"
              />
              <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                What you pay the registrar to renew this domain.
              </p>
            </div>
            <div>
              <Input
                label="Client Billing Price (₹/year)"
                name="sellingPrice"
                type="number"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="1199"
              />
              <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                What you charge your client. Profit = Billing − Cost.
              </p>
            </div>
          </div>

          {/* Profit preview */}
          {form.renewalCost && form.sellingPrice && (
            <div className="px-4 py-3 rounded-xl flex items-center justify-between"
              style={{ background: 'rgba(98,184,73,0.08)', border: '1px solid rgba(98,184,73,0.2)' }}>
              <span className="text-xs" style={{ color: theme.muted }}>Profit per renewal</span>
              <span className="text-sm font-mono font-bold" style={{ color: '#62B849' }}>
                ₹{Math.max(0, Number(form.sellingPrice) - Number(form.renewalCost)).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Section 4: Options */}
          <SectionTitle title="Options" theme={theme} />

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any notes — e.g. 'Transferred from old registrar', 'Client manages DNS directly'..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
              style={{
                background: `${theme.accent}08`,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="autoRenewal"
              name="autoRenewal"
              checked={form.autoRenewal}
              onChange={handleChange}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="autoRenewal" className="text-sm cursor-pointer" style={{ color: theme.text }}>
              Auto-renewal is ON at the registrar
            </label>
          </div>
          <p className="text-[11px] -mt-2 ml-7" style={{ color: theme.muted }}>
            Checking this means the registrar will auto-charge your card before expiry.
            You'll still get alerts from NetVault regardless.
          </p>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mut.isPending}>
              <Globe size={14} /> Add Domain
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/domains')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function SectionTitle({ title, theme }) {
  return (
    <div className="flex items-center gap-3 pt-1" style={{ borderTop: `1px solid ${theme.border}` }}>
      <span className="text-[10px] font-mono uppercase tracking-widest font-semibold pt-4 pb-1"
        style={{ color: theme.muted }}>
        {title}
      </span>
    </div>
  )
}
