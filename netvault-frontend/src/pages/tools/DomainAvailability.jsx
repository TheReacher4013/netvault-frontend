import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { whoisService, domainService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Modal, Input } from '../../components/ui/index'
import {
  Search, CheckCircle2, XCircle, HelpCircle, ExternalLink,
  ShoppingCart, Globe, ChevronRight, Info
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/

// Mock registrar pricing per TLD
const PRICING = {
  GoDaddy: {
    '.com': 899, '.in': 599, '.net': 999, '.org': 849,
    '.io': 3499, '.co': 1999, '.info': 399, default: 999,
  },
  Namecheap: {
    '.com': 799, '.in': 499, '.net': 899, '.org': 749,
    '.io': 3199, '.co': 1799, '.info': 299, default: 899,
  },
  BigRock: {
    '.com': 849, '.in': 449, '.net': 949, '.org': 799,
    '.io': 3299, '.co': 1899, '.info': 349, default: 949,
  },
  Hostinger: {
    '.com': 749, '.in': 429, '.net': 849, '.org': 699,
    '.io': 2999, '.co': 1699, '.info': 279, default: 849,
  },
  ResellerClub: {
    '.com': 699, '.in': 399, '.net': 799, '.org': 649,
    '.io': 2899, '.co': 1599, '.info': 249, default: 799,
  },
}

const REGISTRAR_URLS = {
  GoDaddy: 'https://godaddy.com/domainsearch/find?domainToCheck=',
  Namecheap: 'https://namecheap.com/domains/registration/results/?domain=',
  BigRock: 'https://bigrock.in/domain-registration/index?q=',
  Hostinger: 'https://hostinger.in/domain-name-search?q=',
  ResellerClub: 'https://resellerclub.com/domain-registration/?q=',
}

const getTLD = (domain) => {
  const parts = domain.split('.')
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3)
    return `.${parts[parts.length - 2]}.${parts[parts.length - 1]}`
  return `.${parts[parts.length - 1]}`
}

const getPrice = (registrar, domain) => {
  const tld = getTLD(domain)
  const reg = PRICING[registrar]
  return reg[tld] || reg.default
}

const getPricing = (domain) =>
  Object.keys(PRICING).map(r => ({
    registrar: r,
    price: getPrice(r, domain),
    currency: 'INR',
    url: REGISTRAR_URLS[r] + domain,
  })).sort((a, b) => a.price - b.price)

export default function DomainAvailability() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [whois, setWhois] = useState(null)
  const [loading, setLoading] = useState(false)
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [selectedRegistrar, setSelectedRegistrar] = useState(null)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [addForm, setAddForm] = useState({ registrar: '', expiryDate: '' })

  const isValid = DOMAIN_RE.test(query.trim())

  const check = async () => {
    const name = query.trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
    if (!name) return toast.error('Enter a domain name')
    if (!name.includes('.')) return toast.error('Enter a valid domain — e.g. example.com')
    if (name.length < 4) return toast.error('Domain too short')
    setLoading(true); setResult(null); setWhois(null); setShowRegister(false)
    setQuery(name)  // update input with clean name
    try {
      const res = await whoisService.checkAvailability(name)
      setResult(res.data.data)
      if (res.data.data.registered === false) setShowRegister(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lookup failed')
    } finally { setLoading(false) }
  }

  const fetchWhois = async () => {
    if (!result?.domain) return
    setWhoisLoading(true)
    try {
      const res = await whoisService.lookup(result.domain)
      setWhois(res.data.data)
    } catch {
      toast.error('WHOIS lookup failed')
    } finally { setWhoisLoading(false) }
  }

  const addMut = useMutation({
    mutationFn: d => domainService.create(d),
    onSuccess: () => {
      toast.success('Domain added to NetVault!')
      qc.invalidateQueries(['domains'])
      setShowAddDomain(false)
      navigate('/domains')
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add'),
  })

  const Icon = result?.registered === true ? XCircle
    : result?.registered === false ? CheckCircle2 : HelpCircle
  const statusColor = result?.registered === true ? '#C94040'
    : result?.registered === false ? '#62B849' : '#F0A045'
  const statusText = result?.registered === true ? 'Already Registered'
    : result?.registered === false ? '✓ Available — Ready to Register'
      : 'Uncertain — verify manually'

  const pricing = result?.domain ? getPricing(result.domain) : []

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Domain Availability" subtitle="Check availability and register via your registrar" />

      {/* Search */}
      <Card className="p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
            <Search size={14} style={{ color: theme.muted, flexShrink: 0 }} />
            <input value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="example.com"
              autoCapitalize="none" spellCheck="false"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm font-mono"
              style={{ color: theme.text }} />
          </div>
          <Button onClick={check} loading={loading} className="flex-shrink-0">Check</Button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: theme.muted }}>
          Uses DNS/RDAP lookup. No external API keys needed.
        </p>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${statusColor}15` }}>
              <Icon size={22} style={{ color: statusColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-lg font-bold" style={{ color: theme.text }}>{result.domain}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: statusColor }}>{statusText}</p>
              <p className="text-xs mt-1" style={{ color: theme.muted }}>{result.reason}</p>

              {result.nameservers?.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <p className="text-[10px] font-mono uppercase mb-1.5" style={{ color: theme.muted }}>Nameservers</p>
                  {result.nameservers.map((ns, i) => (
                    <p key={i} className="text-xs font-mono" style={{ color: theme.text }}>{ns}</p>
                  ))}
                </div>
              )}

              {result.registered && (
                <div className="mt-3">
                  <Button variant="secondary" size="sm" onClick={fetchWhois} loading={whoisLoading}>
                    <ExternalLink size={12} /> Fetch WHOIS details
                  </Button>
                </div>
              )}

              {/* If already registered — offer to add to NetVault for tracking */}
              {result.registered && (
                <div className="mt-3 p-3 rounded-xl text-xs"
                  style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                  <p style={{ color: theme.muted }}>
                    <Info size={11} className="inline mr-1" style={{ color: theme.accent }} />
                    Is this your domain? You can add it to NetVault for tracking.
                  </p>
                  <button onClick={() => { setAddForm({ registrar: '', expiryDate: '' }); setShowAddDomain(true) }}
                    className="mt-2 text-[10px] font-mono underline" style={{ color: theme.accent }}>
                    + Add to NetVault
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* AVAILABLE — Show registrar pricing + Register buttons */}
      {showRegister && result?.registered === false && (
        <Card>
          <div className="p-5">
            <p className="text-sm font-bold mb-1" style={{ color: theme.text }}>
              Register This Domain
            </p>
            <p className="text-[11px] mb-4" style={{ color: theme.muted }}>
              Compare prices across registrars. Click "Register" to go to the registrar's website
              and complete the purchase. After purchasing, come back and add it to NetVault.
            </p>

            {/* Pricing table */}
            <div className="space-y-2 mb-4">
              {pricing.map((p, i) => (
                <div key={p.registrar}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: i === 0 ? `${theme.accent}10` : `${theme.accent}04`,
                    border: `1px solid ${i === 0 ? theme.accent + '40' : theme.border}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <Globe size={14} style={{ color: i === 0 ? theme.accent : theme.muted }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: i === 0 ? theme.accent : theme.text }}>
                        {p.registrar}
                        {i === 0 && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: `${theme.accent}20`, color: theme.accent }}>
                            BEST PRICE
                          </span>
                        )}
                      </p>
                      <p className="text-[10px]" style={{ color: theme.muted }}>1 year registration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono" style={{ color: i === 0 ? theme.accent : theme.text }}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: i === 0 ? theme.accent : `${theme.accent}12`,
                          color: i === 0 ? theme.bg : theme.accent,
                        }}>
                        <ShoppingCart size={11} />
                        Register
                        <ChevronRight size={11} />
                      </button>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-xl text-[10px] leading-relaxed"
              style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
              <p style={{ color: '#F0A045' }}>⚠ Prices are indicative — actual prices may vary at registrar.</p>
              <p className="mt-1" style={{ color: theme.muted }}>
                After purchasing on the registrar's website, come back to NetVault → Domains → Add Domain to start tracking it.
              </p>
            </div>

            {/* After purchase — add to NetVault */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: theme.text }}>
                Already purchased this domain?
              </p>
              <Button size="sm" onClick={() => { setAddForm({ registrar: '', expiryDate: '' }); setShowAddDomain(true) }}>
                <Globe size={13} /> Add to NetVault
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* WHOIS panel */}
      {whois?.found && (
        <Card className="p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: theme.muted }}>WHOIS via RDAP</p>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {[
              ['Registrar', whois.registrar],
              ['Registration Date', whois.registrationDate ? format(new Date(whois.registrationDate), 'dd MMM yyyy') : null],
              ['Expiry Date', whois.expiryDate ? format(new Date(whois.expiryDate), 'dd MMM yyyy') : null],
              ['Last Updated', whois.lastChanged ? format(new Date(whois.lastChanged), 'dd MMM yyyy') : null],
              ['Registrant', whois.registrantName],
              ['Registrant Org', whois.registrantOrg],
              ['Registrant Email', whois.registrantEmail],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>{k}</p>
                <p className="font-mono" style={{ color: theme.text }}>{v || '— (private)'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add to NetVault Modal */}
      <Modal open={showAddDomain} onClose={() => setShowAddDomain(false)} title="Add Domain to NetVault">
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-[10px]"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
            <p style={{ color: theme.text }}>
              Domain: <strong className="font-mono">{result?.domain}</strong>
            </p>
            <p className="mt-1" style={{ color: theme.muted }}>
              Fill in the details to start tracking this domain in NetVault.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Registrar</label>
            <select value={addForm.registrar}
              onChange={e => setAddForm(f => ({ ...f, registrar: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">— Select registrar</option>
              {Object.keys(PRICING).map(r => <option key={r} value={r}>{r}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Expiry Date *</label>
            <input type="date" min={minDate} value={addForm.expiryDate}
              onChange={e => setAddForm(f => ({ ...f, expiryDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button loading={addMut.isPending} onClick={() => {
              if (!addForm.expiryDate) return toast.error('Expiry date is required')
              const today = new Date(); today.setHours(0, 0, 0, 0)
              if (new Date(addForm.expiryDate) <= today) return toast.error('Expiry must be in the future')
              addMut.mutate({
                name: result?.domain,
                url: `https://${result?.domain}`,
                registrar: addForm.registrar,
                expiryDate: addForm.expiryDate,
              })
            }}>Add to NetVault</Button>
            <Button variant="ghost" onClick={() => setShowAddDomain(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}