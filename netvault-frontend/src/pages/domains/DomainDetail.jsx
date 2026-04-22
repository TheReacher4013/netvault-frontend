import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainService, clientService, whoisService, hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Button, Card, CardHeader, StatusBadge, Loader, PageHeader, Input, Select
} from '../../components/ui/index'
import {
  Edit3, Save, X, ArrowLeft, RefreshCw, Layers, ChevronRight, Globe,
  Wifi, Plus, Trash2, Server, ToggleLeft, ToggleRight, AlertTriangle,
  CheckCircle2, XCircle, Activity, ExternalLink, Copy, ChevronDown, ChevronUp
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import api from '../../services/api'
import toast from 'react-hot-toast'


const DNS_META = {
  A: { label: 'A — IPv4 Address', namePh: '@ (root) or www', valuePh: '103.x.x.x', ttlDefault: 3600, nameHelp: '@ means the root domain. "www" points www.yourdomain.com. Use subdomain names like "mail" for mail.yourdomain.com.', valueHelp: "The server's IPv4 address (4 numbers, e.g. 103.21.4.5). Find it in your hosting control panel under \"Server IP\"." },
  AAAA: { label: 'AAAA — IPv6 Address', namePh: '@ or www', valuePh: '2001:db8::1', ttlDefault: 3600, nameHelp: 'Same as A record — @ for root, www for www subdomain.', valueHelp: "Your server's IPv6 address. Find it in your hosting panel if IPv6 is enabled." },
  CNAME: { label: 'CNAME — Alias', namePh: 'www or mail', valuePh: 'yourdomain.com.', ttlDefault: 3600, nameHelp: 'The subdomain being aliased, e.g. "www". Cannot use @ (root) for CNAME.', valueHelp: 'The hostname this alias points to, e.g. yourdomain.com. (include the trailing dot). Used to point www to the root domain.' },
  MX: { label: 'MX — Mail Server', namePh: '@', valuePh: 'mail.yourdomain.com.', ttlDefault: 3600, nameHelp: '@ for the root domain. MX records tell email servers where to deliver mail for your domain.', valueHelp: 'Your mail server hostname, e.g. mail.yourdomain.com. or aspmx.l.google.com (for Google Workspace). Priority 10 = highest.' },
  TXT: { label: 'TXT — Text Record', namePh: '@', valuePh: 'v=spf1 ...', ttlDefault: 3600, nameHelp: '@ for domain-wide records. Used for SPF (email), DKIM, domain ownership verification (Google, etc.).', valueHelp: 'The text content — e.g. "v=spf1 include:sendgrid.net ~all" for SPF. Copy the exact value from your email or verification provider.' },
  NS: { label: 'NS — Nameserver', namePh: '@', valuePh: 'ns1.example.com.', ttlDefault: 86400, nameHelp: '@ for the root. NS records tell the internet which servers manage DNS for your domain.', valueHelp: "Your hosting provider's nameserver, e.g. ns1.hostgator.com. Usually set 2 — one primary and one secondary." },
  SRV: { label: 'SRV — Service', namePh: '_sip._tcp', valuePh: '10 20 5060 sip.ex.com', ttlDefault: 3600, nameHelp: 'Format: _service._protocol (e.g. _sip._tcp for SIP, _xmpp._tcp for XMPP).', valueHelp: 'Format: priority weight port target. Example: 10 20 5060 sip.example.com. Used for VoIP, chat, gaming servers.' },
}

const DNS_TYPES = Object.keys(DNS_META)

const TTL_PRESETS = [
  { label: '5 min', value: 300 },
  { label: '30 min', value: 1800 },
  { label: '1 hr', value: 3600 },
  { label: '12 hr', value: 43200 },
  { label: '1 day', value: 86400 },
]

// ─── Inline DNS Manager ───────────────────────────────────────────────────────
function InlineDNSSection({ domain, theme }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [dnsForm, setDnsForm] = useState({
    type: 'A', name: '', value: '', ttl: 3600, priority: '',
  })

  const meta = DNS_META[dnsForm.type] || DNS_META.A

  const addMut = useMutation({
    mutationFn: (d) => domainService.addDNS(domain._id, d),
    onSuccess: () => {
      toast.success('DNS record added')
      qc.invalidateQueries(['domain', domain._id])
      setShowAdd(false)
      setDnsForm({ type: 'A', name: '', value: '', ttl: 3600, priority: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add record'),
  })

  const delMut = useMutation({
    mutationFn: (rid) => domainService.deleteDNS(domain._id, rid),
    onSuccess: () => {
      toast.success('DNS record deleted')
      qc.invalidateQueries(['domain', domain._id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete record'),
  })

  const records = domain.dnsRecords || []
  const serverIP = domain.hostingId?.serverIP

  // When type changes, reset form fields and update TTL default
  const handleTypeChange = (type) => {
    setDnsForm((f) => ({
      ...f,
      type,
      name: '',
      value: '',
      ttl: DNS_META[type]?.ttlDefault || 3600,
      priority: type === 'MX' ? 10 : '',
    }))
  }

  const handleAddRecord = () => {
    if (!dnsForm.name) return toast.error('Name is required (use @ for root domain)')
    if (!dnsForm.value) return toast.error('Value / Target is required')
    addMut.mutate(dnsForm)
  }

  const formatTTL = (ttl) => {
    if (ttl >= 86400) return `${ttl / 86400}d`
    if (ttl >= 3600) return `${ttl / 3600}h`
    if (ttl >= 60) return `${ttl / 60}m`
    return `${ttl}s`
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Wifi size={15} style={{ color: theme.accent }} />
            DNS Records
          </span>
        }
        subtitle={`${records.length} record${records.length !== 1 ? 's' : ''} · Changes apply at your registrar`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="text-[10px] font-mono px-2 py-1 rounded-lg"
              style={{ background: `${theme.accent}12`, color: theme.accent }}
            >
              {showGuide ? 'Hide guide' : 'What is DNS?'}
            </button>
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              <Plus size={12} />
              {showAdd ? 'Cancel' : 'Add Record'}
            </Button>
          </div>
        }
      />

      {/* DNS Explainer */}
      {showGuide && (
        <div className="px-5 pb-4">
          <div
            className="p-4 rounded-xl text-xs space-y-3"
            style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}
          >
            <p className="font-semibold text-sm" style={{ color: theme.text }}>How DNS works</p>
            <p style={{ color: theme.muted }}>
              DNS (Domain Name System) is like a phone book for the internet. When someone types{' '}
              <strong>yourdomain.com</strong>, DNS records tell browsers{' '}
              <em>which server to connect to</em>. Records stored here are for reference —
              you must also add them at your <strong>domain registrar</strong> (GoDaddy, Namecheap,
              etc.) for them to actually work.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { type: 'A', use: 'Point domain → server IP. Most common.' },
                { type: 'CNAME', use: 'Alias one name to another (www → root).' },
                { type: 'MX', use: 'Direct emails to mail server.' },
                { type: 'TXT', use: 'Verify ownership, set SPF/DKIM.' },
                { type: 'NS', use: 'Nameservers — who manages your DNS.' },
                { type: 'AAAA', use: 'Like A record but for IPv6 addresses.' },
              ].map((r) => (
                <div key={r.type} className="flex gap-2">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded h-fit flex-shrink-0"
                    style={{ background: `${theme.accent}20`, color: theme.accent }}
                  >
                    {r.type}
                  </span>
                  <span style={{ color: theme.muted }}>{r.use}</span>
                </div>
              ))}
            </div>
            {serverIP && (
              <div
                className="p-2.5 rounded-lg"
                style={{ background: `${theme.accent}10`, border: `1px solid ${theme.accent}30` }}
              >
                <p className="font-semibold mb-1" style={{ color: theme.accent }}>
                  💡 Your server IP is {serverIP}
                </p>
                <p style={{ color: theme.muted }}>
                  Add an A record: Name = <strong>@</strong>, Value = <strong>{serverIP}</strong> to
                  connect this domain to your hosting.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Record Form */}
      {showAdd && (
        <div className="px-5 pb-5">
          <div
            className="p-4 rounded-xl space-y-4"
            style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}
          >
            <p className="text-xs font-semibold" style={{ color: theme.text }}>New DNS Record</p>

            {/* Type selector */}
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-wider mb-2 font-semibold"
                style={{ color: theme.muted }}
              >
                Record Type — what do you want to do?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {DNS_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className="px-2 py-2 rounded-lg text-[10px] font-mono text-left transition-all"
                    style={{
                      background: dnsForm.type === t ? `${theme.accent}20` : `${theme.accent}05`,
                      border: `1px solid ${dnsForm.type === t ? theme.accent : theme.border}`,
                      color: dnsForm.type === t ? theme.accent : theme.muted,
                    }}
                  >
                    <span className="font-bold block">{t}</span>
                    <span className="opacity-70 text-[9px]">
                      {t === 'A' ? 'Point to IP' :
                        t === 'AAAA' ? 'IPv6' :
                          t === 'CNAME' ? 'Alias' :
                            t === 'MX' ? 'Email' :
                              t === 'TXT' ? 'Verify/SPF' :
                                t === 'NS' ? 'Nameserver' : 'Service'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] px-1" style={{ color: theme.muted }}>{meta.label}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Name field */}
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                    style={{ color: theme.muted }}
                  >
                    Name
                  </span>
                </div>
                <input
                  value={dnsForm.name}
                  onChange={(e) => setDnsForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={meta.namePh}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                />
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: theme.muted }}>
                  {meta.nameHelp}
                </p>
              </div>

              {/* Value field */}
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                    style={{ color: theme.muted }}
                  >
                    {dnsForm.type === 'MX' ? 'Mail Server' : 'Value / Target'}
                  </span>
                  {serverIP && (dnsForm.type === 'A' || dnsForm.type === 'AAAA') && (
                    <button
                      onClick={() => setDnsForm((f) => ({ ...f, value: serverIP }))}
                      className="ml-auto text-[9px] px-2 py-0.5 rounded font-mono"
                      style={{ background: `${theme.accent}15`, color: theme.accent }}
                    >
                      Use server IP ({serverIP})
                    </button>
                  )}
                </div>
                <input
                  value={dnsForm.value}
                  onChange={(e) => setDnsForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={meta.valuePh}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                />
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: theme.muted }}>
                  {meta.valueHelp}
                </p>
              </div>
            </div>

            {/* TTL + Priority */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-40">
                <p
                  className="text-[10px] font-mono uppercase tracking-wider mb-1.5 font-semibold"
                  style={{ color: theme.muted }}
                >
                  TTL (Time To Live)
                </p>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {TTL_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setDnsForm((f) => ({ ...f, ttl: p.value }))}
                      className="text-[10px] px-2 py-1 rounded font-mono"
                      style={{
                        background: dnsForm.ttl === p.value ? `${theme.accent}20` : `${theme.accent}06`,
                        color: dnsForm.ttl === p.value ? theme.accent : theme.muted,
                        border: `1px solid ${dnsForm.ttl === p.value ? theme.accent : theme.border}`,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: theme.muted }}>
                  How long browsers/servers cache this record. Lower = faster updates (use 5 min when
                  making changes), higher = less server load.{' '}
                  <strong>{dnsForm.ttl}s</strong> selected.
                </p>
              </div>

              {dnsForm.type === 'MX' && (
                <div className="w-32">
                  <p
                    className="text-[10px] font-mono uppercase tracking-wider mb-1.5 font-semibold"
                    style={{ color: theme.muted }}
                  >
                    Priority
                  </p>
                  <input
                    type="number"
                    value={dnsForm.priority}
                    onChange={(e) => setDnsForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                    style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                    Lower = higher priority (10 is most common)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" loading={addMut.isPending} onClick={handleAddRecord}>
                Save Record
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              {['Type', 'Name', 'Value / Target', 'TTL', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: theme.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs" style={{ color: theme.muted }}>
                  No DNS records yet. Click &quot;Add Record&quot; to create one.
                  {serverIP && (
                    <span>
                      {' '}Your server IP is{' '}
                      <strong style={{ color: theme.accent }}>{serverIP}</strong> — start with an A
                      record pointing @ to it.
                    </span>
                  )}
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr
                key={r._id}
                className="hover:bg-white/[0.02]"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <td className="px-4 py-2.5">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: `${theme.accent}15`, color: theme.accent }}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: theme.text }}>
                  {r.name}
                </td>
                <td
                  className="px-4 py-2.5 text-xs font-mono max-w-xs truncate"
                  style={{ color: theme.muted }}
                >
                  {r.value}
                </td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: theme.muted }}>
                  {formatTTL(r.ttl)}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => delMut.mutate(r._id)}
                    disabled={delMut.isPending}
                    className="p-1 rounded hover:bg-red-500/10 transition-colors"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Domain Monitoring + Down-reason card ─────────────────────────────────────
function MonitoringCard({ domain, theme, onScrollToDNS }) {
  const qc = useQueryClient()
  const mon = domain.monitoring || {}
  const state = mon.currentState || 'unknown'
  const lastChecked = mon.lastChecked ? new Date(mon.lastChecked) : null
  const lastDownAt = mon.lastDownAt ? new Date(mon.lastDownAt) : null

  // Smart reason detection
  const reasons = []

  if (domain.status === 'expired') {
    reasons.push({
      id: 'expired',
      severity: 'critical',
      icon: '⏰',
      title: 'Domain Expired',
      detail: 'This domain has expired and is no longer registered. It will stop resolving immediately.',
      steps: [
        '1. Log in to your registrar (e.g. GoDaddy, Namecheap)',
        '2. Find this domain and click Renew',
        '3. Complete payment',
        '4. DNS propagation may take a few hours after renewal',
      ],
      actionLabel: null,
      actionId: null,
    })
  }

  if (!domain.hostingId) {
    reasons.push({
      id: 'no-hosting',
      severity: 'warning',
      icon: '🖥️',
      title: 'No Hosting Linked',
      detail: 'This domain has no server assigned. Without a hosting plan, there is nowhere to point the domain.',
      steps: [
        '1. Go to Hosting → Add Hosting (or use an existing plan)',
        '2. Come back and Edit this domain',
        '3. Assign the hosting plan using the Hosting dropdown',
        '4. Then add an A record in DNS pointing to the server IP',
      ],
      actionLabel: 'Edit Domain',
      actionId: 'edit',
    })
  }

  const hasARecord = (domain.dnsRecords || []).some((r) => r.type === 'A')
  const serverIP = domain.hostingId?.serverIP

  if (domain.hostingId && !hasARecord) {
    reasons.push({
      id: 'no-a-record',
      severity: 'critical',
      icon: '📡',
      title: 'No A Record in DNS',
      detail: `Hosting is linked (server IP: ${serverIP || '?'}), but no A record exists in DNS. The domain cannot resolve to the server.`,
      steps: [
        '1. Scroll down to the DNS Records section below',
        '2. Click "Add Record"',
        `3. Set Type = A, Name = @, Value = ${serverIP || 'your server IP'}, TTL = 3600`,
        `4. Also add: Type = A, Name = www, Value = ${serverIP || 'your server IP'}`,
        '5. Wait 15–60 min for DNS propagation',
      ],
      actionLabel: 'Add A Record',
      actionId: 'dns',
    })
  }

  if ((domain.dnsRecords || []).length === 0 && !domain.hostingId) {
    reasons.push({
      id: 'no-dns',
      severity: 'warning',
      icon: '🌐',
      title: 'No DNS Records',
      detail: 'No DNS records are configured. The domain has no routing instructions.',
      steps: [
        '1. First link a hosting plan (see above)',
        '2. Then add an A record pointing to the server IP',
      ],
      actionLabel: 'Add DNS Record',
      actionId: 'dns',
    })
  }

  if (state === 'down' && reasons.length === 0) {
    reasons.push({
      id: 'server-down',
      severity: 'critical',
      icon: '🔌',
      title: 'Server Unreachable',
      detail: 'Domain resolves but the server is not responding. The web server process may be stopped.',
      steps: [
        '1. Log in to cPanel / your server control panel',
        '2. Check if Apache / Nginx service is running',
        '3. Restart the web server if needed',
        '4. Check server disk space and memory',
        '5. Click "Check now" again after fixing',
      ],
      actionLabel: null,
      actionId: null,
    })
  }

  const checkMut = useMutation({
    mutationFn: () => api.post(`/domains/${domain._id}/check`),
    onSuccess: (res) => {
      const st = res.data?.data?.domain?.monitoring?.currentState
      const probeErr = res.data?.data?.domain?.probeResult?.error
      if (st === 'up') {
        toast.success('Domain is UP ✓ — site is reachable')
      } else {
        toast.error(`Domain is DOWN ✗${probeErr ? ' — ' + probeErr : ''}`)
      }
      qc.invalidateQueries(['domain', domain._id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Check failed'),
  })

  const CONFIG = {
    up: { label: 'Online', color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)', icon: CheckCircle2 },
    down: { label: 'Down', color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', icon: XCircle },
    unknown: { label: 'Not checked', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.20)', icon: AlertTriangle },
  }
  const cfg = CONFIG[state] || CONFIG.unknown
  const Icon = cfg.icon

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Activity size={15} style={{ color: theme.accent }} />
            Monitoring
          </span>
        }
        subtitle="Checks every 15 min"
      />
      <div className="p-5 space-y-4">

        {/* Status chip */}
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <div className="flex items-center gap-3">
            <Icon size={22} style={{ color: cfg.color }} />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>
                Status
              </p>
              <p className="font-bold text-lg" style={{ color: cfg.color }}>{cfg.label}</p>
            </div>
          </div>
          <Button
            variant={state === 'unknown' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => checkMut.mutate()}
            loading={checkMut.isPending}
            disabled={checkMut.isPending}
          >
            <RefreshCw size={12} className={checkMut.isPending ? 'animate-spin' : ''} />
            {checkMut.isPending ? 'Checking…' : 'Check now'}
          </Button>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Last checked</p>
            <p className="font-mono" style={{ color: theme.text }}>
              {lastChecked ? formatDistanceToNow(lastChecked, { addSuffix: true }) : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Last down</p>
            <p className="font-mono" style={{ color: state === 'down' ? '#EF4444' : theme.text }}>
              {lastDownAt ? formatDistanceToNow(lastDownAt, { addSuffix: true }) : 'Never recorded'}
            </p>
          </div>
        </div>

        {/* Reasons + Fix Steps */}
        {reasons.length > 0 && (
          <div className="space-y-3">
            <p
              className="text-[10px] font-mono uppercase tracking-wider font-bold"
              style={{ color: state === 'down' ? '#EF4444' : '#F0A045' }}
            >
              {state === 'down' ? '⚠ Why is this domain down?' : '⚠ Issues detected'}
            </p>

            {reasons.map((r) => (
              <div
                key={r.id}
                className="rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${r.severity === 'critical' ? 'rgba(239,68,68,0.30)' : 'rgba(240,160,69,0.30)'
                    }`,
                }}
              >
                {/* Reason header */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{
                    background:
                      r.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(240,160,69,0.08)',
                  }}
                >
                  <span className="text-base">{r.icon}</span>
                  <p className="text-xs font-semibold flex-1" style={{ color: theme.text }}>
                    {r.title}
                  </p>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold"
                    style={{
                      background:
                        r.severity === 'critical'
                          ? 'rgba(239,68,68,0.15)'
                          : 'rgba(240,160,69,0.15)',
                      color: r.severity === 'critical' ? '#EF4444' : '#F0A045',
                    }}
                  >
                    {r.severity}
                  </span>
                </div>

                {/* Detail + steps */}
                <div className="px-3 py-3 space-y-2.5" style={{ background: theme.bg }}>
                  <p className="text-[11px]" style={{ color: theme.muted }}>{r.detail}</p>

                  <div className="space-y-1">
                    <p
                      className="text-[10px] font-mono uppercase font-semibold"
                      style={{ color: theme.accent }}
                    >
                      How to fix:
                    </p>
                    {r.steps.map((step, i) => (
                      <p key={i} className="text-[11px] font-mono" style={{ color: theme.muted }}>
                        {step}
                      </p>
                    ))}
                  </div>

                  {/* Action button */}
                  {r.actionId === 'dns' && (
                    <button
                      onClick={() => onScrollToDNS && onScrollToDNS()}
                      className="mt-1 flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      style={{
                        background: `${theme.accent}18`,
                        color: theme.accent,
                        border: `1px solid ${theme.accent}30`,
                      }}
                    >
                      ↓ Jump to DNS Records
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All good */}
        {state === 'up' && reasons.length === 0 && (
          <div
            className="flex items-center gap-2 text-xs p-3 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.20)' }}
          >
            <CheckCircle2 size={13} style={{ color: '#10B981' }} />
            <p style={{ color: theme.muted }}>Domain is live and reachable. No issues detected.</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Hosting Connection Guide ─────────────────────────────────────────────────
function HostingConnectionCard({ domain, theme }) {
  const [open, setOpen] = useState(false)
  const hosting = domain.hostingId
  if (!hosting) return null

  const serverIP = hosting.serverIP || '???'

  return (
    <Card>
      <div className="p-5">
        <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={15} style={{ color: theme.accent }} />
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: theme.text }}>
                Linked Hosting: {hosting.label}
              </p>
              <p className="text-[11px]" style={{ color: theme.muted }}>
                {hosting.planType} · IP:{' '}
                <span className="font-mono">{serverIP}</span>
              </p>
            </div>
          </div>
          {open
            ? <ChevronUp size={15} style={{ color: theme.muted }} />
            : <ChevronDown size={15} style={{ color: theme.muted }} />}
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            <p
              className="text-[10px] font-mono uppercase tracking-wider font-semibold"
              style={{ color: theme.accent }}
            >
              How to connect domain → hosting
            </p>
            {[
              {
                step: '1',
                title: 'Point DNS to server',
                desc: `Add an A record in DNS: Name = @, Value = ${serverIP}. Also add www → ${serverIP}.`,
              },
              {
                step: '2',
                title: 'Upload website files',
                desc: `Log into ${hosting.controlPanel || 'cPanel'} and upload your files to public_html/.`,
              },
              {
                step: '3',
                title: 'Enable SSL',
                desc: "In cPanel → SSL/TLS → Let's Encrypt, install a free SSL certificate.",
              },
              {
                step: '4',
                title: 'Wait for DNS propagation',
                desc: 'DNS changes take 15 min to 48 hours to propagate worldwide.',
              },
              {
                step: '5',
                title: 'Verify',
                desc: `Visit https://${domain.name} in your browser. Use the "Check now" button above to confirm.`,
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                  style={{ background: `${theme.accent}20`, color: theme.accent }}
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: theme.text }}>{s.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>{s.desc}</p>
                </div>
              </div>
            ))}

            {/* Quick copy IP */}
            <div
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}
            >
              <span className="text-xs font-mono flex-1" style={{ color: theme.text }}>
                A record value: <strong style={{ color: theme.accent }}>{serverIP}</strong>
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(serverIP); toast.success('IP copied!') }}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg"
                style={{ background: `${theme.accent}15`, color: theme.accent }}
              >
                <Copy size={11} />Copy IP
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Main DomainDetail ────────────────────────────────────────────────────────
export default function DomainDetail() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const dnsRef = useRef(null)

  const scrollToDNS = () =>
    dnsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const { data, isLoading } = useQuery({
    queryKey: ['domain', id],
    queryFn: () => domainService.getOne(id),
  })

  useEffect(() => {
    const d = data?.data?.data?.domain
    if (d) setForm(d)
  }, [data])

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientService.getAll({ limit: 100 }),
  })
  const { data: hostingData } = useQuery({
    queryKey: ['hosting-list'],
    queryFn: () => hostingService.getAll({ limit: 100 }),
  })

  const updateMut = useMutation({
    mutationFn: (d) => domainService.update(id, d),
    onSuccess: () => {
      toast.success('Domain updated')
      qc.invalidateQueries(['domain', id])
      setEditing(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const whoisMut = useMutation({
    mutationFn: () => whoisService.refresh(id),
    onSuccess: () => {
      toast.success('WHOIS data refreshed')
      qc.invalidateQueries(['domain', id])
    },
    onError: (err) => {
      const msg = err.response?.data?.message || ''
      const status = err.response?.status
      if (
        status === 404 ||
        msg.toLowerCase().includes('whois') ||
        msg.toLowerCase().includes('could not find')
      ) {
        toast(
          'WHOIS data not available for this domain.\nIt may be private, unregistered, or the lookup service is unavailable.',
          { icon: 'ℹ️', duration: 5000 },
        )
      } else {
        toast.error(msg || 'WHOIS lookup failed')
      }
    },
  })

  const domain = data?.data?.data?.domain
  const clients = clientsData?.data?.data?.docs || []
  const hostingList = hostingData?.data?.data?.docs || []

  if (isLoading) return <Loader text="Loading domain..." />
  if (!domain) return <div className="text-center py-20" style={{ color: theme.muted }}>Domain not found</div>

  const daysLeft = Math.ceil((new Date(domain.expiryDate) - new Date()) / 86_400_000)
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleSave = () => {
    if (form.expiryDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (new Date(form.expiryDate) <= today)
        return toast.error('Expiry date must be in the future')
    }
    updateMut.mutate({
      ...form,
      clientId: form.clientId?._id || form.clientId || null,
      hostingId: form.hostingId?._id || form.hostingId || null,
    })
  }

  // View-mode field definitions
  const viewFields = [
    { key: 'name', label: 'Domain Name', mono: true },
    {
      key: 'url',
      label: 'URL',
      mono: true,
      format: (v) => {
        const url = v || `https://${domain.name}`
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
            style={{ color: theme.accent }}
            onClick={(e) => e.stopPropagation()}
          >
            {url} <ExternalLink size={10} />
          </a>
        )
      },
    },
    { key: 'registrar', label: 'Registrar' },
    { key: 'expiryDate', label: 'Expiry Date', format: (v) => format(new Date(v), 'dd MMM yyyy') },
    { key: 'renewalCost', label: 'Renewal Cost', format: (v) => (v ? `₹${v}` : '—') },
    { key: 'autoRenewal', label: 'Auto Renewal', format: (v) => (v ? '✓ Enabled' : 'Disabled') },
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={domain.name}
        subtitle={`${daysLeft > 0 ? daysLeft + ' days left' : 'EXPIRED'} · ${domain.registrar || 'No registrar'}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate('/domains')}>
              <ArrowLeft size={13} />Back
            </Button>

            {/* WHOIS button with tooltip */}
            <div className="relative group">
              <Button
                variant="secondary"
                size="sm"
                loading={whoisMut.isPending}
                onClick={() => whoisMut.mutate()}
              >
                <RefreshCw size={13} />Refresh WHOIS
              </Button>
              <div
                className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl text-[10px] leading-relaxed z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl"
                style={{ background: '#1a1a2e', border: `1px solid ${theme.border}`, color: '#94A3B8' }}
              >
                <p className="font-semibold text-xs mb-1" style={{ color: '#fff' }}>What is WHOIS?</p>
                <p>
                  WHOIS is a public database that stores who owns a domain — the registrant name,
                  email, registrar, and expiry date. Clicking this fetches the latest data directly
                  from the domain registry. Useful to verify ownership details or check if expiry
                  info has changed.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`https://${domain.name}`, '_blank')}
            >
              <ExternalLink size={13} />Visit Site
            </Button>

            {!editing ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Edit3 size={13} />Edit
              </Button>
            ) : (
              <>
                <Button size="sm" loading={updateMut.isPending} onClick={handleSave}>
                  <Save size={13} />Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditing(false); setForm(domain) }}
                >
                  <X size={13} />Cancel
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: domain info */}
        <Card className="lg:col-span-2">
          <CardHeader title="Domain Information" />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <div>
                  <Input
                    label="Domain Name"
                    name="name"
                    value={form.name || ''}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                    Just the domain, e.g. example.com
                  </p>
                </div>
                <Input
                  label="Registrar"
                  name="registrar"
                  value={form.registrar || ''}
                  onChange={handleChange}
                />
                <div>
                  <Input
                    label="Expiry Date"
                    name="expiryDate"
                    type="date"
                    value={form.expiryDate?.slice(0, 10) || ''}
                    onChange={handleChange}
                    min={minDate}
                  />
                  {form.expiryDate && new Date(form.expiryDate) <= new Date() && (
                    <p className="text-[10px] mt-1" style={{ color: '#EF4444' }}>
                      ⚠ Must be in the future
                    </p>
                  )}
                </div>
                <Select
                  label="Assign Client"
                  name="clientId"
                  value={form.clientId?._id || form.clientId || ''}
                  onChange={handleChange}
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Select>
                <Input
                  label="Renewal Cost (₹)"
                  name="renewalCost"
                  type="number"
                  value={form.renewalCost || ''}
                  onChange={handleChange}
                />

                {/* Hosting assignment */}
                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: theme.muted }}
                  >
                    Assign Hosting
                  </label>
                  <select
                    name="hostingId"
                    value={form.hostingId?._id || form.hostingId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: `${theme.accent}08`,
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
                  >
                    <option value="">— No hosting</option>
                    {hostingList.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.label}{h.serverIP ? ` (${h.serverIP})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto Renewal toggle */}
                <div
                  className="flex items-center justify-between p-3 rounded-xl col-span-full"
                  style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}
                >
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>Auto Renewal</p>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, autoRenewal: !f.autoRenewal }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                      background: form.autoRenewal ? `${theme.accent}20` : `${theme.border}40`,
                      color: form.autoRenewal ? theme.accent : theme.muted,
                      border: `1px solid ${form.autoRenewal ? theme.accent : theme.border}`,
                    }}
                  >
                    {form.autoRenewal ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    <span className="text-xs font-mono font-bold">
                      {form.autoRenewal ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              viewFields.map((field) => (
                <div key={field.key}>
                  <p
                    className="text-[10px] font-mono uppercase tracking-wider mb-1"
                    style={{ color: theme.muted }}
                  >
                    {field.label}
                  </p>
                  <p
                    className={`text-sm font-semibold ${field.mono ? 'font-mono' : ''}`}
                    style={{ color: theme.text }}
                  >
                    {domain[field.key] !== undefined && domain[field.key] !== ''
                      ? field.format
                        ? field.format(domain[field.key])
                        : domain[field.key]
                      : '—'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* WHOIS section — full data */}
          {domain.whois && (
            <div className="p-5" style={{ borderTop: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: theme.muted }}>
                  WHOIS Data
                </p>
                {domain.whois.lastFetched && (
                  <span className="text-[10px] font-mono" style={{ color: theme.muted }}>
                    Fetched: {format(new Date(domain.whois.lastFetched), 'dd MMM yyyy HH:mm')}
                  </span>
                )}
              </div>

              {/* Privacy notice */}
              <div className="mb-4 p-2.5 rounded-lg text-[10px] leading-relaxed"
                style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                <span style={{ color: theme.muted }}>
                  ℹ Many registrars enable <strong style={{ color: theme.text }}>WHOIS Privacy Protection</strong> which
                  hides the owner's name and email. In that case only the registrar name and dates are visible — this is completely normal.
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: 'Registrant Name', value: domain.whois.registrantName },
                  { label: 'Registrant Org', value: domain.whois.registrantOrg },
                  { label: 'Registrant Email', value: domain.whois.registrantEmail },
                  { label: 'Registrar', value: domain.registrar },
                  { label: 'Registration Date', value: domain.registrationDate ? format(new Date(domain.registrationDate), 'dd MMM yyyy') : null },
                  { label: 'Expiry (Registry)', value: domain.expiryDate ? format(new Date(domain.expiryDate), 'dd MMM yyyy') : null },
                  { label: 'Last Updated', value: domain.whois.updatedDate ? format(new Date(domain.whois.updatedDate), 'dd MMM yyyy') : null },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: theme.muted }}>{label}</p>
                    {value
                      ? <p className="text-xs font-mono" style={{ color: theme.text }}>{value}</p>
                      : <p className="text-xs font-mono" style={{ color: theme.muted }}>
                        — <span className="text-[9px] opacity-70">(private or not available)</span>
                      </p>
                    }
                  </div>
                ))}
              </div>

              {/* Nameservers */}
              {domain.nameservers && domain.nameservers.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <p className="text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: theme.muted }}>Nameservers</p>
                  <div className="flex flex-wrap gap-2">
                    {domain.nameservers.map((ns, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-1 rounded-lg"
                        style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.accent}25` }}>
                        {ns}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* No data at all */}
              {!domain.whois.registrantName && !domain.whois.registrantOrg &&
                !domain.whois.registrantEmail && !domain.registrar && (
                  <div className="mt-3 p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
                    <p className="font-semibold" style={{ color: '#F0A045' }}>⚠ No public WHOIS data found</p>
                    <p className="mt-1" style={{ color: theme.muted }}>
                      This domain likely has WHOIS privacy enabled, or the registry doesn't support public lookups.
                      The expiry date you entered manually is shown above. Click "Refresh WHOIS" to try again.
                    </p>
                  </div>
                )}
            </div>
          )}
        </Card>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Status card */}
          <Card className="p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-wider mb-3"
              style={{ color: theme.muted }}
            >
              Status
            </p>
            <StatusBadge status={domain.status} />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Days left</span>
                <span
                  className="font-mono font-bold"
                  style={{
                    color:
                      daysLeft <= 7 ? '#C94040' :
                        daysLeft <= 30 ? '#F0A045' : theme.accent,
                  }}
                >
                  {daysLeft > 0 ? `${daysLeft}d` : `Expired ${Math.abs(daysLeft)}d ago`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Auto Renewal</span>
                <span
                  className="font-mono"
                  style={{ color: domain.autoRenewal ? '#62B849' : theme.muted }}
                >
                  {domain.autoRenewal ? '✓ ON' : 'OFF'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Client</span>
                <span className="font-mono" style={{ color: theme.text }}>
                  {domain.clientId?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.muted }}>Hosting</span>
                <span
                  className="font-mono"
                  style={{ color: domain.hostingId ? theme.accent : theme.muted }}
                >
                  {domain.hostingId?.label || 'Not linked'}
                </span>
              </div>
            </div>
          </Card>

          <MonitoringCard domain={domain} theme={theme} onScrollToDNS={scrollToDNS} />
          <HostingConnectionCard domain={domain} theme={theme} />

          {/* Nameservers */}
          <Card className="p-5">
            <p
              className="text-[10px] font-mono uppercase tracking-wider mb-3"
              style={{ color: theme.muted }}
            >
              Nameservers
            </p>
            {domain.nameservers?.length > 0 ? (
              domain.nameservers.map((ns, i) => (
                <p key={i} className="text-xs font-mono py-1" style={{ color: theme.text }}>
                  {ns}
                </p>
              ))
            ) : (
              <p className="text-xs" style={{ color: theme.muted }}>No nameservers set</p>
            )}
          </Card>
        </div>
      </div>

      {/* DNS Records */}
      <div ref={dnsRef}>
        <InlineDNSSection domain={domain} theme={theme} />
      </div>

      {/* Domain Hierarchy */}
      {(domain.parentDomainId || (domain.subdomains && domain.subdomains.length > 0)) && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Layers size={15} style={{ color: theme.accent }} />
                Domain Hierarchy
              </span>
            }
            subtitle={
              domain.isSubdomain
                ? 'This is a subdomain'
                : `Main domain with ${domain.subdomains?.length || 0} subdomain(s)`
            }
          />
          <div className="p-5 space-y-3">
            {domain.parentDomainId && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-white/[0.02]"
                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}
                onClick={() =>
                  navigate(`/domains/${domain.parentDomainId._id || domain.parentDomainId}`)
                }
              >
                <Globe size={13} style={{ color: theme.accent }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>
                    Parent domain
                  </p>
                  <p className="text-sm font-mono font-semibold" style={{ color: theme.text }}>
                    {domain.parentDomainId.name || 'Unknown'}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: theme.muted }} />
              </div>
            )}

            {domain.subdomains?.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-mono uppercase mb-2"
                  style={{ color: theme.muted }}
                >
                  Subdomains ({domain.subdomains.length})
                </p>
                <div className="space-y-1.5">
                  {domain.subdomains.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-white/[0.02]"
                      style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}
                      onClick={() => navigate(`/domains/${sub._id}`)}
                    >
                      <span style={{ color: theme.muted }}>↳</span>
                      <Globe size={12} style={{ color: theme.accent }} />
                      <span className="text-xs font-mono flex-1" style={{ color: theme.text }}>
                        {sub.name}
                      </span>
                      <StatusBadge status={sub.status} />
                      <ChevronRight size={12} style={{ color: theme.muted }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}