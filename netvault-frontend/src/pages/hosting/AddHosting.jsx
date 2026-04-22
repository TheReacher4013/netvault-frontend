import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hostingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input, Select } from '../../components/ui/index'
import { ToggleLeft, ToggleRight, HelpCircle, Info, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

// Real hosting providers
const PROVIDERS = [
  'HostGator', 'GoDaddy', 'Bluehost', 'SiteGround', 'A2 Hosting',
  'DreamHost', 'Hostinger', 'BigRock', 'MilesWeb', 'ResellerClub',
  'AWS (Amazon)', 'Google Cloud', 'DigitalOcean', 'Linode / Akamai',
  'Vultr', 'Hetzner', 'Cloudways', 'Kinsta', 'WP Engine', 'Other'
]

const BANDWIDTH_OPTIONS = [
  'Unlimited', '10 GB', '50 GB', '100 GB', '250 GB',
  '500 GB', '1 TB', '2 TB', '5 TB', 'Unmetered'
]

const DISK_OPTIONS = [
  '1 GB', '5 GB', '10 GB', '20 GB', '50 GB',
  '100 GB', '200 GB', '500 GB', '1 TB', 'Unlimited'
]

const PLAN_INFO = {
  shared: { label: 'Shared Hosting', desc: 'Your website shares server resources with many others. Cheapest option, suitable for small sites. Limited performance.', color: '#62B849' },
  vps: { label: 'VPS (Virtual PS)', desc: 'A virtual private server — dedicated resources on a shared physical machine. Good balance of cost and performance.', color: '#4A8FA8' },
  dedicated: { label: 'Dedicated Server', desc: 'An entire physical server for you only. Maximum performance and control. Most expensive — for high-traffic sites.', color: '#F0A045' },
  cloud: { label: 'Cloud Hosting', desc: 'Resources distributed across multiple servers. Scales automatically. Pay-as-you-go model (AWS, GCP, etc.).', color: '#8B5CF6' },
  reseller: { label: 'Reseller', desc: 'You buy hosting wholesale and resell to clients under your own brand. Manage multiple accounts from one control panel.', color: '#EC4899' },
}

// Tooltip help
function Help({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <HelpCircle size={11} style={{ color: '#64748B', cursor: 'pointer' }}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && (
        <span className="absolute left-5 top-0 w-56 z-50 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-xl"
          style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#94A3B8', whiteSpace: 'normal' }}>
          {text}
        </span>
      )}
    </span>
  )
}

function Label({ children, help }) {
  return (
    <div className="flex items-center mb-1.5">
      <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{children}</span>
      {help && <Help text={help} />}
    </div>
  )
}

export default function AddHosting() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showPass, setShowPass] = useState(false)

  const [form, setForm] = useState({
    label: '', planType: 'shared', provider: '', serverIP: '',
    serverLocation: '', bandwidth: 'Unlimited', diskSpace: '',
    expiryDate: '', clientId: '', controlPanel: 'cpanel',
    renewalCost: '', autoRenewal: false,
    cpanelInfo: { username: '', password: '', url: '' },
  })

  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientService.getAll({ limit: 100 }) })
  const clients = clientsData?.data?.data?.docs || []

  const mut = useMutation({
    mutationFn: d => hostingService.create(d),
    onSuccess: () => { toast.success('Hosting plan added!'); qc.invalidateQueries(['hosting']); navigate('/hosting') },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add hosting'),
  })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleCpanel = e => setForm(f => ({ ...f, cpanelInfo: { ...f.cpanelInfo, [e.target.name]: e.target.value } }))

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const planInfo = PLAN_INFO[form.planType] || PLAN_INFO.shared

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.label) return toast.error('Label is required')
    if (!form.expiryDate) return toast.error('Expiry date is required')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (new Date(form.expiryDate) <= today) return toast.error('Expiry date must be in the future')
    mut.mutate({ ...form, renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined, clientId: form.clientId || null })
  }

  const fieldStyle = { background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }
  const selectCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Add Hosting Plan" subtitle="Add and configure a hosting server"
        actions={<Button variant="ghost" onClick={() => navigate('/hosting')}>Cancel</Button>} />

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Plan Basics ── */}
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Plan Details</p>
          <div className="space-y-4">

            <div>
              <Label help="A short internal name to identify this hosting plan, e.g. 'VPS-01-techzone' or 'Shared-clientname'. This is just for your reference inside NetVault.">
                Label *
              </Label>
              <input name="label" value={form.label} onChange={handle}
                placeholder="e.g. VPS-01 techzone.in"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={fieldStyle} />
            </div>

            {/* Plan Type with visual selector */}
            <div>
              <Label help="The type of hosting plan. Shared is cheapest; VPS gives dedicated resources; Dedicated is a full server; Cloud scales automatically; Reseller lets you host multiple clients.">
                Plan Type
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {Object.entries(PLAN_INFO).map(([key, info]) => (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, planType: key }))}
                    className="px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: form.planType === key ? `${info.color}18` : `${theme.accent}05`,
                      border: `1.5px solid ${form.planType === key ? info.color : theme.border}`,
                    }}>
                    <span className="text-xs font-bold block" style={{ color: form.planType === key ? info.color : theme.muted }}>
                      {info.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-xl text-xs" style={{ background: `${planInfo.color}10`, border: `1px solid ${planInfo.color}30` }}>
                <span style={{ color: planInfo.color }}>ℹ {planInfo.desc}</span>
              </div>
            </div>

            {/* Provider dropdown */}
            <div>
              <Label help="The company that provides this hosting server. E.g. HostGator for cPanel shared hosting, AWS for cloud, DigitalOcean for VPS. This is where you log in to manage the server.">
                Provider
              </Label>
              <select name="provider" value={form.provider} onChange={handle}
                className={selectCls} style={fieldStyle}>
                <option value="">— Select provider</option>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* ── Server Details ── */}
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Server Details</p>
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Server IP — critical field */}
            <div className="col-span-full">
              <Label help="The public IPv4 address of this server (e.g. 103.21.4.5). This is what DNS A records point to. Find it in your hosting provider's control panel under 'Server Information' or 'Account Details'. This is NOT the cPanel URL — it's the raw server address.">
                Server IP Address
              </Label>
              <input name="serverIP" value={form.serverIP} onChange={handle}
                placeholder="e.g. 103.21.4.200"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={fieldStyle} />
              <p className="text-[10px] mt-1.5" style={{ color: theme.muted }}>
                This IP is used in DNS records to point domains to this server. It's the server's public address on the internet.
                Find it in your host's dashboard → Account Info → Server IP.
              </p>
            </div>

            <div>
              <Label help="Where the server is physically located. E.g. 'Mumbai, IN' or 'Singapore'. Closer to your users = faster website.">
                Server Location
              </Label>
              <input name="serverLocation" value={form.serverLocation} onChange={handle}
                placeholder="e.g. Mumbai, IN"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={fieldStyle} />
            </div>

            {/* Bandwidth dropdown */}
            <div>
              <Label help="Monthly data transfer limit. Unlimited/Unmetered means no cap. If you have a specific limit (e.g. 100GB), select it. Exceeding limits may cause throttling or extra charges.">
                Monthly Bandwidth
              </Label>
              <select name="bandwidth" value={form.bandwidth} onChange={handle}
                className={selectCls} style={fieldStyle}>
                {BANDWIDTH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Disk Space dropdown */}
            <div>
              <Label help="Total disk storage available on this hosting plan for website files, databases, emails, etc.">
                Disk Space
              </Label>
              <select name="diskSpace" value={form.diskSpace} onChange={handle}
                className={selectCls} style={fieldStyle}>
                <option value="">— Select</option>
                {DISK_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Control Panel */}
            <div>
              <Label help="The web-based control panel used to manage this hosting account. cPanel is most common. Plesk is another popular option. DirectAdmin is lightweight. Webmin is for advanced Linux users. None = raw server/cloud.">
                Control Panel
              </Label>
              <select name="controlPanel" value={form.controlPanel} onChange={handle}
                className={selectCls} style={fieldStyle}>
                {['cpanel', 'plesk', 'directadmin', 'webmin', 'none'].map(t => (
                  <option key={t} value={t}>{t === 'cpanel' ? 'cPanel (most common)' : t === 'none' ? 'None (raw server)' : t}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* ── Billing & Assignment ── */}
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Billing & Assignment</p>
          <div className="grid sm:grid-cols-2 gap-4">

            <div>
              <Label help="The date this hosting plan expires/renews. Must be in the future. You'll get alerts before this date.">
                Expiry Date *
              </Label>
              <input type="date" name="expiryDate" value={form.expiryDate} onChange={handle} min={minDate}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={fieldStyle} />
              {form.expiryDate && new Date(form.expiryDate) <= new Date() && (
                <p className="text-[10px] mt-1 font-semibold" style={{ color: '#EF4444' }}>⚠ Must be a future date</p>
              )}
            </div>

            <div>
              <Label help="The client who uses this hosting plan. Assigning a client lets them see this hosting in their portal.">
                Assign Client
              </Label>
              <select name="clientId" value={form.clientId} onChange={handle}
                className={selectCls} style={fieldStyle}>
                <option value="">— No client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <Label help="How much you pay to renew this hosting plan (for your internal records only).">
                Renewal Cost (₹)
              </Label>
              <input type="number" name="renewalCost" value={form.renewalCost} onChange={handle}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={fieldStyle} />
            </div>

            {/* Auto Renewal */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
              style={{ background: `${theme.accent}08`, border: `1px solid ${form.autoRenewal ? theme.accent + '50' : theme.border}` }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>Auto Renewal</p>
                <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>Extends expiry by 1 year, 7 days before</p>
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
          </div>
        </Card>

        {/* ── cPanel Credentials ── */}
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Control Panel Credentials</p>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: theme.muted }}>
                These are the login details for this server's control panel (cPanel, Plesk, etc.).
                They come from your <strong>hosting provider's welcome email</strong> when you purchased the plan.
                Stored encrypted (AES-256) — only admins can view them. <strong>Not linked to any domain automatically</strong> —
                these are the server-level credentials used to upload files, create databases, and manage email accounts.
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
            <Info size={13} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>
              <strong style={{ color: theme.text }}>Where to find these credentials:</strong>
              <ol className="mt-1 space-y-0.5 list-decimal list-inside">
                <li>Check the welcome email from your hosting provider (sent when you signed up)</li>
                <li>Log in to your hosting provider's billing area → My Hosting → Manage → cPanel Details</li>
                <li>The URL is usually: <span className="font-mono">https://yourip:2083</span> or <span className="font-mono">https://yourdomain.com/cpanel</span></li>
              </ol>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label help="Your cPanel/hosting username — usually your hosting account login, not your email.">cPanel Username</Label>
              <input name="username" value={form.cpanelInfo.username} onChange={handleCpanel}
                placeholder="e.g. hostuser123"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={fieldStyle} />
            </div>
            <div>
              <Label help="cPanel account password. This will be AES-256 encrypted before storage — never stored in plain text.">cPanel Password</Label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.cpanelInfo.password} onChange={handleCpanel}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-9 rounded-xl text-sm outline-none font-mono"
                  style={fieldStyle} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: theme.muted }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <Label help="The URL to access the control panel. Usually https://serverip:2083 for cPanel, or https://serverip:8443 for Plesk. Found in your host's welcome email.">Panel URL</Label>
              <input name="url" value={form.cpanelInfo.url} onChange={handleCpanel}
                placeholder="https://103.x.x.x:2083"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={fieldStyle} />
            </div>
          </div>

          {/* Usage explanation */}
          <div className="mt-4 p-3 rounded-xl text-xs"
            style={{ background: `${theme.accent}05`, border: `1px solid ${theme.border}` }}>
            <p className="font-semibold mb-1.5" style={{ color: theme.text }}>How these credentials are used in NetVault:</p>
            <div className="grid sm:grid-cols-3 gap-2" style={{ color: theme.muted }}>
              <div>
                <p className="font-semibold text-[10px] uppercase mb-0.5" style={{ color: theme.accent }}>Admin View</p>
                <p>Admins can reveal credentials in Hosting Detail → "Show Credentials" button. Used to log in to cPanel and manage the server.</p>
              </div>
              <div>
                <p className="font-semibold text-[10px] uppercase mb-0.5" style={{ color: theme.accent }}>Domain Connection</p>
                <p>Credentials are NOT automatically linked to any domain. You link domains separately via the Domain → Assign Hosting flow.</p>
              </div>
              <div>
                <p className="font-semibold text-[10px] uppercase mb-0.5" style={{ color: theme.accent }}>Client Portal</p>
                <p>Clients NEVER see these credentials. They only see the plan status, expiry, and uptime — not the login details.</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={mut.isPending}>Add Hosting Plan</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/hosting')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
