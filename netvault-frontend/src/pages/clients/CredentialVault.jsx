import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, Modal, Input, Select } from '../../components/ui/index'
import {
  ArrowLeft, Plus, Eye, EyeOff, Trash2, Lock, Copy,
  Shield, Info, Globe, Server, Database, Mail, Terminal, Key
} from 'lucide-react'
import toast from 'react-hot-toast'

// Credential type metadata
const CRED_TYPES = {
  cpanel: { icon: Server, label: 'cPanel', color: '#F0A045', desc: 'Hosting control panel login — manage files, databases, email' },
  ftp: { icon: Globe, label: 'FTP', color: '#4A8FA8', desc: 'File Transfer Protocol — upload/download website files' },
  sftp: { icon: Globe, label: 'SFTP', color: '#4A8FA8', desc: 'Secure FTP — encrypted file transfers (recommended over FTP)' },
  database: { icon: Database, label: 'Database', color: '#8B5CF6', desc: 'MySQL/PostgreSQL database credentials' },
  email: { icon: Mail, label: 'Email', color: '#62B849', desc: 'Email account / SMTP credentials' },
  ssh: { icon: Terminal, label: 'SSH', color: '#EC4899', desc: 'Secure Shell — command-line server access' },
  other: { icon: Key, label: 'Other', color: '#94A3B8', desc: 'Any other login credentials' },
}

// Where credentials are visible in the system
const VISIBILITY_INFO = [
  { who: 'Agency Admin', where: 'Vault page (this page)', can: 'View, add, delete credentials', icon: '👤' },
  { who: 'Staff Members', where: 'Client Profile → Vault', can: 'View revealed credentials (if admin role)', icon: '👥' },
  { who: 'Client (portal)', where: 'NEVER visible', can: 'Clients cannot see any vault credentials', icon: '🔒' },
  { who: 'NetVault System', where: 'Encrypted in database', can: 'AES-256 encrypted — never stored as plain text', icon: '🛡️' },
]

function CopyButton({ value, theme }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }} className="p-1 rounded transition-colors" style={{ color: copied ? '#62B849' : theme.muted }}>
      <Copy size={11} />
    </button>
  )
}

export default function CredentialVault() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [reveal, setReveal] = useState({})
  const [showGuide, setShowGuide] = useState(false)
  const [form, setForm] = useState({
    label: '', type: 'cpanel',
    data: { username: '', password: '', url: '', port: '', notes_data: '' },
    notes: ''
  })

  const { data, isLoading } = useQuery({ queryKey: ['creds', id], queryFn: () => clientService.getCredentials(id) })

  const addMut = useMutation({
    mutationFn: d => clientService.addCredential(id, d),
    onSuccess: () => {
      toast.success('Credential stored securely')
      qc.invalidateQueries(['creds', id])
      setShowAdd(false)
      setForm({ label: '', type: 'cpanel', data: { username: '', password: '', url: '', port: '', notes_data: '' }, notes: '' })
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to store credential'),
  })

  const delMut = useMutation({
    mutationFn: cid => clientService.deleteCredential(id, cid),
    onSuccess: () => { toast.success('Credential deleted'); qc.invalidateQueries(['creds', id]) },
  })

  const creds = data?.data?.data?.credentials || []
  if (isLoading) return <Loader text="Loading vault..." />

  const credType = CRED_TYPES[form.type] || CRED_TYPES.other

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={<span className="flex items-center gap-2"><Lock size={18} style={{ color: theme.accent }} />Credential Vault</span>}
        subtitle="AES-256 encrypted · Admin eyes only · Never visible to clients"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${id}`)}><ArrowLeft size={13} />Back</Button>
            <button onClick={() => setShowGuide(v => !v)}
              className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg"
              style={{ background: `${theme.accent}12`, color: theme.accent }}>
              {showGuide ? 'Hide guide' : 'What is the Vault?'}
            </button>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} />Store Credential</Button>
          </div>
        }
      />

      {/* Vault explainer */}
      {showGuide && (
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Shield size={20} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>What is the Credential Vault?</p>
              <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
                The Credential Vault is a secure encrypted locker for storing a client's login credentials —
                such as their cPanel username/password, FTP details, database logins, SSH keys, and more.
                All data is encrypted with AES-256 before being saved to the database. <strong style={{ color: theme.text }}>
                  These credentials are for your agency's internal use</strong> — to manage the client's server on their behalf.
              </p>
            </div>
          </div>

          {/* Visibility table */}
          <p className="text-[10px] font-mono uppercase tracking-wider font-semibold mb-3" style={{ color: theme.muted }}>
            Who can see these credentials?
          </p>
          <div className="space-y-2">
            {VISIBILITY_INFO.map(v => (
              <div key={v.who} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${theme.accent}04`, border: `1px solid ${theme.border}` }}>
                <span className="text-xl">{v.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: theme.text }}>{v.who}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${theme.accent}12`, color: theme.accent }}>{v.where}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>{v.can}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Credential type guide */}
          <p className="text-[10px] font-mono uppercase tracking-wider font-semibold mt-4 mb-2" style={{ color: theme.muted }}>
            Credential types you can store:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(CRED_TYPES).map(([key, t]) => (
              <div key={key} className="flex items-start gap-2 p-2.5 rounded-lg"
                style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}>
                <t.icon size={13} style={{ color: t.color }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold" style={{ color: t.color }}>{t.label}</span>
                  <p className="text-[10px]" style={{ color: theme.muted }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {creds.length === 0 && (
        <Card className="p-8 text-center">
          <Lock size={32} style={{ color: theme.muted }} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Vault is empty</p>
          <p className="text-xs mb-4" style={{ color: theme.muted }}>
            Store cPanel, FTP, SSH, database credentials here for secure access by your team.
          </p>
          <Button onClick={() => setShowAdd(true)}><Plus size={13} />Store First Credential</Button>
        </Card>
      )}

      {/* Credential cards */}
      <div className="space-y-3">
        {creds.map(c => {
          const ct = CRED_TYPES[c.type] || CRED_TYPES.other
          const Icon = ct.icon
          const isRevealed = reveal[c._id]
          return (
            <Card key={c._id} className="overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${ct.color}15` }}>
                    <Icon size={15} style={{ color: ct.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>{c.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${ct.color}12`, color: ct.color }}>{ct.label}</span>
                      <span className="text-[10px]" style={{ color: theme.muted }}>{ct.desc}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setReveal(r => ({ ...r, [c._id]: !r[c._id] }))}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors"
                    style={{ background: isRevealed ? `${theme.accent}15` : `${theme.accent}08`, color: isRevealed ? theme.accent : theme.muted, border: `1px solid ${isRevealed ? theme.accent + '40' : theme.border}` }}>
                    {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    {isRevealed ? 'Hide' : 'Reveal'}
                  </button>
                  <button onClick={() => delMut.mutate(c._id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    style={{ color: '#C94040' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Revealed data */}
              {isRevealed && c.data && (
                <div className="px-4 pb-4">
                  <div className="p-3 rounded-xl" style={{ background: `${theme.accent}04`, border: `1px solid ${theme.border}` }}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(c.data).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[9px] uppercase font-mono tracking-wider mb-1" style={{ color: theme.muted }}>
                            {k === 'notes_data' ? 'Notes' : k}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-mono flex-1 break-all"
                              style={{ color: k === 'password' ? '#F0A045' : theme.text }}>
                              {k === 'password' ? '••••••••' : v}
                            </p>
                            <CopyButton value={v} theme={theme} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {c.notes && (
                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                        <p className="text-[9px] uppercase font-mono mb-1" style={{ color: theme.muted }}>Admin Notes</p>
                        <p className="text-xs" style={{ color: theme.muted }}>{c.notes}</p>
                      </div>
                    )}
                    {/* Copy password explicitly */}
                    {c.data.password && (
                      <button onClick={() => { navigator.clipboard.writeText(c.data.password); toast.success('Password copied') }}
                        className="mt-2 flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg"
                        style={{ background: `${theme.accent}10`, color: theme.accent }}>
                        <Copy size={10} /> Copy Password
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Store Credential Securely">
        <div className="space-y-4">
          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.accent}20` }}>
            <Info size={13} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>
              Credentials are encrypted with AES-256 and only visible to admins.
              The client will never see these details in their portal.
            </p>
          </div>

          <Input label="Label *" value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Main cPanel, Blog FTP, MySQL DB" />

          {/* Type selector */}
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: theme.muted }}>Credential Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(CRED_TYPES).map(([key, t]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, type: key }))}
                  className="px-2 py-2 rounded-lg text-left text-[10px] transition-all"
                  style={{
                    background: form.type === key ? `${t.color}18` : `${theme.accent}05`,
                    border: `1px solid ${form.type === key ? t.color : theme.border}`,
                    color: form.type === key ? t.color : theme.muted,
                  }}>
                  <span className="font-bold block">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color: theme.muted }}>{credType.desc}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Username / Account" value={form.data.username}
              onChange={e => setForm(f => ({ ...f, data: { ...f.data, username: e.target.value } }))}
              placeholder={form.type === 'ssh' ? 'root or user' : 'username'} />
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Password / Key</label>
              <input type="password" value={form.data.password}
                onChange={e => setForm(f => ({ ...f, data: { ...f.data, password: e.target.value } }))}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
            </div>
            <Input label="URL / Host / IP" value={form.data.url}
              onChange={e => setForm(f => ({ ...f, data: { ...f.data, url: e.target.value } }))}
              placeholder={form.type === 'cpanel' ? 'https://ip:2083' : form.type === 'ssh' ? 'server IP or hostname' : 'https://...'} />
            <Input label="Port (optional)" value={form.data.port}
              onChange={e => setForm(f => ({ ...f, data: { ...f.data, port: e.target.value } }))}
              placeholder={form.type === 'ftp' ? '21' : form.type === 'sftp' ? '22' : form.type === 'ssh' ? '22' : ''} />
          </div>

          <Input label="Admin Notes (optional)" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. Production DB, use for file uploads only..." />

          <div className="flex gap-3 pt-1">
            <Button loading={addMut.isPending} onClick={() => {
              if (!form.label.trim()) return toast.error('Label is required')
              if (!form.data.username && !form.data.password) return toast.error('Add at least a username or password')
              addMut.mutate(form)
            }}>
              <Shield size={13} /> Store Encrypted
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
