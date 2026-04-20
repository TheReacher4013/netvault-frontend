import { useState } from 'react'
import { whoisService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input } from '../../components/ui/index'
import { Search, CheckCircle2, XCircle, HelpCircle, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export default function DomainAvailability() {
  const { theme } = useAuth()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [whois, setWhois] = useState(null)
  const [loading, setLoading] = useState(false)
  const [whoisLoading, setWhoisLoading] = useState(false)

  const isValid = DOMAIN_RE.test(query.trim())

  const check = async () => {
    const name = query.trim().toLowerCase()
    if (!name) return toast.error('Enter a domain')
    if (!isValid) return toast.error('Invalid domain format')
    setLoading(true); setResult(null); setWhois(null)
    try {
      const res = await whoisService.checkAvailability(name)
      setResult(res.data.data)
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
    } catch (err) {
      toast.error('WHOIS lookup failed')
    } finally { setWhoisLoading(false) }
  }

  const Icon = result?.registered === true
    ? XCircle
    : result?.registered === false
      ? CheckCircle2
      : HelpCircle

  const statusColor = result?.registered === true
    ? '#C94040'
    : result?.registered === false
      ? '#62B849'
      : '#F0A045'

  const statusText = result?.registered === true
    ? 'Already Registered'
    : result?.registered === false
      ? 'Likely Available'
      : 'Uncertain — verify manually'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Domain Availability" subtitle="Quickly check if a domain is already registered" />

      <Card className="p-5">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
            <Search size={14} style={{ color: theme.muted }} />
            <input value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="example.com"
              autoCapitalize="none" spellCheck="false"
              className="flex-1 bg-transparent outline-none text-sm font-mono"
              style={{ color: theme.text }}
            />
          </div>
          <Button onClick={check} loading={loading} disabled={!isValid}>Check</Button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: theme.muted }}>
          Uses DNS lookup (SOA/NS records) to detect registration. Fast, no external API keys needed.
        </p>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${statusColor}15` }}>
              <Icon size={22} style={{ color: statusColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-lg font-bold" style={{ color: theme.text }}>{result.domain}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: statusColor }}>{statusText}</p>
              <p className="text-xs mt-1" style={{ color: theme.muted }}>{result.reason}</p>
              {result.source && (
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded mt-1.5"
                  style={{ background: `${theme.accent}10`, color: theme.accent }}>
                  via {result.source === 'rdap' ? 'RDAP (authoritative)' : result.source === 'dns' ? 'DNS lookup' : result.source}
                </span>
              )}

              {result.nameservers?.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <p className="text-[10px] font-mono uppercase mb-1.5" style={{ color: theme.muted }}>Nameservers</p>
                  {result.nameservers.map((ns, i) => (
                    <p key={i} className="text-xs font-mono" style={{ color: theme.text }}>{ns}</p>
                  ))}
                </div>
              )}

              {result.registered && (
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={fetchWhois} loading={whoisLoading}>
                    <ExternalLink size={12} /> Fetch WHOIS details
                  </Button>
                </div>
              )}

              {result.registered === false && (
                <p className="text-xs mt-3 leading-relaxed" style={{ color: theme.muted }}>
                  Domain appears unregistered. Always confirm at your registrar (GoDaddy, Namecheap, etc.) before purchasing.
                </p>
              )}
              {result.registered === null && (
                <p className="text-xs mt-3 leading-relaxed" style={{ color: theme.muted }}>
                  Result is inconclusive — DNS gave ambiguous signals. Please check directly at a domain registrar to confirm availability.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* WHOIS panel */}
      {whois?.found && (
        <Card className="p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: theme.muted }}>WHOIS via RDAP</p>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {[
              ['Registrar', whois.registrar],
              ['Registration', whois.registrationDate ? format(new Date(whois.registrationDate), 'dd MMM yyyy') : null],
              ['Expiry', whois.expiryDate ? format(new Date(whois.expiryDate), 'dd MMM yyyy') : null],
              ['Last Changed', whois.lastChanged ? format(new Date(whois.lastChanged), 'dd MMM yyyy') : null],
              ['Registrant', whois.registrantName],
              ['Registrant Org', whois.registrantOrg],
              ['Registrant Email', whois.registrantEmail],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>{k}</p>
                <p className="font-mono" style={{ color: theme.text }}>{v || '—'}</p>
              </div>
            ))}
          </div>
          {whois.statuses?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {whois.statuses.map(s => (
                <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: `${theme.accent}12`, color: theme.accent }}>{s}</span>
              ))}
            </div>
          )}
          <p className="text-[10px] mt-4" style={{ color: theme.muted }}>
            Many registries redact personal info under GDPR — fields may appear empty even though the domain is registered.
          </p>
        </Card>
      )}
    </div>
  )
}

