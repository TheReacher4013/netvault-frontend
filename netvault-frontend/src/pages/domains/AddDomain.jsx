import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainService, clientService, hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input } from '../../components/ui/index'
import {
  Globe, Layers, ToggleLeft, ToggleRight, Server,
  CheckCircle2, ChevronRight, ChevronLeft, Info, HelpCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// Real domain registrars
const REGISTRARS = [
  'GoDaddy', 'Namecheap', 'BigRock', 'HostGator', 'Google Domains',
  'Cloudflare', 'Dynadot', '1&1 IONOS', 'Network Solutions', 'Name.com',
  'Porkbun', 'Hover', 'Reseller Club', 'Enom', 'Other'
]

// Step bar component
function StepBar({ steps, current, theme }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? theme.accent : active ? `${theme.accent}20` : `${theme.border}40`,
                  border: `2px solid ${done || active ? theme.accent : theme.border}`,
                  color: done ? '#fff' : active ? theme.accent : theme.muted,
                }}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <p className="text-[9px] font-mono mt-1 text-center whitespace-nowrap"
                style={{ color: active ? theme.accent : done ? theme.accent : theme.muted }}>
                {s}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-4 transition-all"
                style={{ background: i < current ? theme.accent : theme.border }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Info tip box
function Tip({ children, theme }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5"
      style={{ background: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
      <Info size={14} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
      <p className="text-[11px] leading-relaxed" style={{ color: theme.muted }}>{children}</p>
    </div>
  )
}

// Field with help tooltip
function FieldHelp({ label, help, theme }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-1 mb-1.5">
      <span className="text-xs font-semibold" style={{ color: theme.muted }}>{label}</span>
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="relative">
        <HelpCircle size={11} style={{ color: theme.muted }} />
        {show && (
          <div className="absolute left-5 top-0 w-52 z-50 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-xl"
            style={{ background: theme.card || '#1a1a2e', border: `1px solid ${theme.border}`, color: theme.muted }}>
            {help}
          </div>
        )}
      </button>
    </div>
  )
}

const STEPS = ['Domain Info', 'Assign', 'Settings', 'Review']

export default function AddDomain() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)

  const [form, setForm] = useState({
    name: '', registrar: '', expiryDate: '',
    clientId: '', hostingId: '', parentDomainId: '',
    autoRenewal: false, isLocal: false, localOnly: false, renewalCost: '', notes: '',
    urlProtocol: 'https',
  })

  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientService.getAll({ limit: 100 }) })
  const { data: parentsData } = useQuery({ queryKey: ['domains-parents'], queryFn: () => domainService.getAll({ limit: 100 }) })
  const { data: hostingData } = useQuery({ queryKey: ['hosting-list'], queryFn: () => hostingService.getAll({ limit: 100 }) })

  const clients = clientsData?.data?.data?.docs || []
  const parents = useMemo(() => (parentsData?.data?.data?.docs || []).filter(d => !d.isSubdomain), [parentsData])
  const hostingList = hostingData?.data?.data?.docs || []
  const selectedParent = parents.find(p => p._id === form.parentDomainId)
  const selectedHosting = hostingList.find(h => h._id === form.hostingId)
  const selectedClient = clients.find(c => c._id === form.clientId)

  const cleanDomain = raw => raw.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '')
  const fullUrl = form.name ? `${form.urlProtocol}://${cleanDomain(form.name)}` : ''

  const mut = useMutation({
    mutationFn: d => domainService.create(d),
    onSuccess: () => { toast.success('Domain added!'); qc.invalidateQueries(['domains']); navigate('/domains') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add domain'),
  })

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const validateStep = () => {
    if (step === 0) {
      const name = cleanDomain(form.name)
      if (!name) { toast.error('Domain name is required'); return false }
      if (!form.expiryDate) { toast.error('Expiry date is required'); return false }
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (new Date(form.expiryDate) <= today) { toast.error('Expiry date must be in the future'); return false }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = () => {
    const cleanName = cleanDomain(form.name)
    mut.mutate({
      ...form,
      name: cleanName,
      url: `${form.urlProtocol}://${cleanName}`,
      renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined,
      clientId: form.clientId || null,
      parentDomainId: form.parentDomainId || null,
      hostingId: form.hostingId || null,
    })
  }

  const fieldStyle = { background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }
  const selectCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader title="Add Domain" subtitle={`Step ${step + 1} of ${STEPS.length}`}
        actions={<Button variant="ghost" onClick={() => navigate('/domains')}>Cancel</Button>} />

      <Card className="p-6">
        <StepBar steps={STEPS} current={step} theme={theme} />

        {/* ── STEP 0: Domain Info ─────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <Tip theme={theme}>
              Enter the domain name exactly as it was registered with your registrar — e.g. <strong>example.com</strong>.
              Don't include https:// or www — those are added automatically.
            </Tip>

            {/* Parent domain */}
            <div>
              <FieldHelp label="Is this a Subdomain? (optional)" theme={theme}
                help="A subdomain is a prefix to a main domain — e.g. blog.example.com. Leave blank if this is a main domain." />
              <select value={form.parentDomainId}
                onChange={e => setForm(f => ({ ...f, parentDomainId: e.target.value }))}
                className={selectCls} style={fieldStyle}>
                <option value="">— Main domain (no parent)</option>
                {parents.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            {/* Domain name + protocol */}
            <div>
              <FieldHelp label="Domain Name *" theme={theme}
                help="The registered domain, e.g. example.com. The https:// prefix is stored separately. We strip www and http automatically." />
              <div className="flex gap-2">
                <select value={form.urlProtocol}
                  onChange={e => setForm(f => ({ ...f, urlProtocol: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...fieldStyle, width: '110px', flexShrink: 0 }}>
                  <option value="https">https://</option>
                  <option value="http">http://</option>
                </select>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onBlur={() => setForm(f => ({ ...f, name: cleanDomain(f.name) }))}
                  placeholder={selectedParent ? `blog.${selectedParent.name}` : 'example.com'}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                  style={fieldStyle} />
              </div>
              {form.name && (
                <p className="text-[10px] mt-1.5 font-mono" style={{ color: theme.accent }}>
                  Will open as: <strong>{fullUrl}</strong>
                </p>
              )}
            </div>

            {/* Registrar dropdown */}
            <div>
              <FieldHelp label="Registrar" theme={theme}
                help="The company where this domain was purchased/registered (e.g. GoDaddy, Namecheap). You'll log in to the registrar's panel to update DNS settings." />
              <select value={form.registrar}
                onChange={e => setForm(f => ({ ...f, registrar: e.target.value }))}
                className={selectCls} style={fieldStyle}>
                <option value="">— Select registrar</option>
                {REGISTRARS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Expiry */}
            <div>
              <FieldHelp label="Expiry Date *" theme={theme}
                help="The date the domain registration expires. After this date the domain becomes unavailable unless renewed. You'll find this in your registrar's dashboard." />
              <input type="date" value={form.expiryDate} min={minDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={fieldStyle} />
              {form.expiryDate && new Date(form.expiryDate) <= new Date() && (
                <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>⚠ Must be a future date</p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 1: Assign ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <Tip theme={theme}>
              Assign this domain to a client so they can see it in their portal.
              Linking hosting lets you auto-suggest DNS records and detect if the site is down.
            </Tip>

            <div>
              <FieldHelp label="Assign to Client (optional)" theme={theme}
                help="The client who owns this domain. They will see it in their client portal with expiry info and status." />
              <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                className={selectCls} style={fieldStyle}>
                <option value="">— No client assigned</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name} — {c.email}</option>)}
              </select>
            </div>

            <div>
              <FieldHelp label="Link Hosting Server (optional)" theme={theme}
                help="The hosting plan where this domain's website files live. Linking it lets NetVault suggest the correct A record IP and detect outages. You can add this later." />
              <select value={form.hostingId} onChange={e => setForm(f => ({ ...f, hostingId: e.target.value }))}
                className={selectCls} style={fieldStyle}>
                <option value="">— No hosting linked</option>
                {hostingList.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.label} · {h.serverIP || 'no IP'} ({h.planType})
                  </option>
                ))}
              </select>

              {selectedHosting && (
                <div className="mt-3 p-3 rounded-xl space-y-2"
                  style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                  <p className="text-[10px] font-mono uppercase font-semibold" style={{ color: theme.accent }}>
                    DNS records to add after saving:
                  </p>
                  {[
                    { type: 'A', name: '@', value: selectedHosting.serverIP || 'server IP', note: 'Points root domain to server' },
                    { type: 'A', name: 'www', value: selectedHosting.serverIP || 'server IP', note: 'Points www to server' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded text-[9px]"
                        style={{ background: `${theme.accent}20`, color: theme.accent }}>{r.type}</span>
                      <span style={{ color: theme.muted }}>{r.name}</span>
                      <span style={{ color: theme.muted }}>→</span>
                      <span style={{ color: theme.text }}>{r.value}</span>
                      <span className="ml-auto opacity-60" style={{ color: theme.muted }}>{r.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Settings ───────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <Tip theme={theme}>
              Set the renewal cost you pay (for your records) and whether NetVault should
              auto-renew this domain 7 days before it expires.
            </Tip>

            <div>
              <FieldHelp label="Renewal Cost (₹)" theme={theme}
                help="The amount you pay to renew this domain each year at the registrar. This is for your internal records — not charged automatically." />
              <input type="number" value={form.renewalCost}
                onChange={e => setForm(f => ({ ...f, renewalCost: e.target.value }))}
                placeholder="e.g. 1200"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={fieldStyle} />
            </div>

            {/* Auto Renewal */}
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: `${theme.accent}08`, border: `1px solid ${form.autoRenewal ? theme.accent + '50' : theme.border}` }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>Auto Renewal</p>
                <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>
                  NetVault marks domain as renewed 7 days before expiry (extend by 1 year)
                </p>
              </div>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, autoRenewal: !f.autoRenewal }))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: form.autoRenewal ? `${theme.accent}20` : `${theme.border}40`,
                  color: form.autoRenewal ? theme.accent : theme.muted,
                  border: `1px solid ${form.autoRenewal ? theme.accent : theme.border}`,
                }}>
                {form.autoRenewal ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                <span className="text-xs font-mono font-bold">{form.autoRenewal ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* ── Local Domain Options ── */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold block mb-0.5" style={{ color: theme.muted }}>
                Local / Internal Domain
              </span>
              {[
                { key: 'isLocal', label: 'Hosted Locally', desc: 'Domain runs on a local or internal server' },
                { key: 'localOnly', label: 'Not Registered Externally', desc: 'No external registrar — purely internal use' },
              ].map(opt => (
                <button key={opt.key} type="button"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: form[opt.key] ? theme.accent + '10' : theme.accent + '05',
                    border: '1px solid ' + (form[opt.key] ? theme.accent + '60' : theme.border),
                  }}
                  onClick={() => setForm(f => ({ ...f, [opt.key]: !f[opt.key] }))}>
                  <div>
                    <div className="text-xs font-bold" style={{ color: theme.text }}>{opt.label}</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: theme.muted }}>{opt.desc}</div>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: form[opt.key] ? theme.accent : theme.muted }}>
                    {form[opt.key] ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    <span className="text-xs font-mono font-bold">{form[opt.key] ? 'YES' : 'NO'}</span>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Internal notes — client details, special setup, etc."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={fieldStyle} />
            </div>
          </div>
        )}

        {/* ── STEP 3: Review ─────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <Tip theme={theme}>
              Review all details. After saving, go to the domain's DNS Records section
              to add A records pointing to your server.
            </Tip>

            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
              {[
                ['Domain', cleanDomain(form.name) || '—', true],
                ['Full URL', fullUrl || '—', true],
                ['Registrar', form.registrar || 'Not set'],
                ['Expiry Date', form.expiryDate ? new Date(form.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                ['Parent Domain', selectedParent?.name || 'None (main domain)'],
                ['Client', selectedClient ? `${selectedClient.name} (${selectedClient.email})` : 'Not assigned'],
                ['Hosting', selectedHosting ? `${selectedHosting.label} · ${selectedHosting.serverIP || 'no IP'}` : 'Not linked'],
                ['Renewal Cost', form.renewalCost ? `₹${form.renewalCost}/yr` : '—'],
                ['Auto Renewal', form.autoRenewal ? '✓ Enabled (auto-extends 7 days before expiry)' : 'Disabled'],
                ['Local Domain', form.isLocal ? 'Yes (locally hosted)' : 'No'],
                ['Local Only', form.localOnly ? 'Yes (not externally registered)' : 'No'],
                ['Notes', form.notes || '—'],
              ].map(([label, value, mono], i, arr) => (
                <div key={label} className="flex items-start justify-between px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none', background: i % 2 === 0 ? `${theme.accent}03` : 'transparent' }}>
                  <span className="text-xs flex-shrink-0 mr-4" style={{ color: theme.muted }}>{label}</span>
                  <span className={`text-xs font-semibold text-right ${mono ? 'font-mono' : ''}`} style={{ color: theme.text }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${theme.border}` }}>
          <Button variant="ghost" onClick={step === 0 ? () => navigate('/domains') : back}>
            {step === 0 ? 'Cancel' : <><ChevronLeft size={14} />Back</>}
          </Button>
          {step < STEPS.length - 1
            ? <Button onClick={next}>Next <ChevronRight size={14} /></Button>
            : <Button loading={mut.isPending} onClick={handleSubmit}>
                <CheckCircle2 size={14} /> Save Domain
              </Button>
          }
        </div>
      </Card>
    </div>
  )
}
