import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { twoFactorService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Input, Modal } from '../../components/ui/index'
import { ShieldCheck, ShieldOff, Copy, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TwoFactorSection({ user, refetchUser }) {
  const { theme } = useAuth()
  const qc = useQueryClient()

  const enabled = !!user?.twoFactorEnabled

  const [mode, setMode] = useState(enabled ? 'enabled' : 'idle')
  const [setupData, setSetupData] = useState(null)   
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState(null)
  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [codesCopied, setCodesCopied] = useState(false)

  // ── Step 1: Start setup ──
  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await twoFactorService.setup()
      setSetupData(res.data.data)
      setMode('setup')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed')
    } finally { setLoading(false) }
  }
  const handleVerify = async () => {
    if (!code || code.length < 6) return toast.error('Enter your 6-digit code')
    setLoading(true)
    try {
      const res = await twoFactorService.verifySetup(code.trim())
      const codes = res.data.data.backupCodes || []
      setBackupCodes(codes)
      setMode('backup')
      setCode('')
      toast.success('Two-factor authentication enabled')
      qc.invalidateQueries(['me'])
      refetchUser?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally { setLoading(false) }
  }

  // ── Copy backup codes ──────────
  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCodesCopied(true)
      toast.success('Backup codes copied')
      setTimeout(() => setCodesCopied(false), 2000)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }
  const finishSetup = () => {
    setBackupCodes(null)
    setSetupData(null)
    setMode('enabled')
  }

  // ── Disable flow ────────
  const handleDisable = async () => {
    if (!disablePassword) return toast.error('Enter your password')
    setLoading(true)
    try {
      await twoFactorService.disable(disablePassword)
      toast.success('Two-factor authentication disabled')
      setDisableOpen(false)
      setDisablePassword('')
      setMode('idle')
      qc.invalidateQueries(['me'])
      refetchUser?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable')
    } finally { setLoading(false) }
  }

  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2">
          {enabled || mode === 'enabled'
            ? <ShieldCheck size={15} style={{ color: '#62B849' }} />
            : <ShieldOff size={15} style={{ color: theme.muted }} />}
          Two-Factor Authentication
        </span>}
        subtitle={mode === 'enabled' ? 'Protected with TOTP' : 'Add a second verification step at login'}
      />

      <div className="p-6">

        {/* ── IDLE: not set up yet ───── */}
        {mode === 'idle' && (
          <div>
            <p className="text-sm mb-4" style={{ color: theme.muted }}>
              Protect your account with a time-based one-time password (TOTP).
              Compatible with Google Authenticator, Authy, 1Password, and any
              other standard authenticator app.
            </p>
            <Button onClick={handleStart} loading={loading}>
              <ShieldCheck size={14} />Enable Two-Factor
            </Button>
          </div>
        )}

        {/* ── SETUP: show QR + code input ─────────── */}
        {mode === 'setup' && setupData && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: theme.text }}>
                Step 1 — Scan this QR code
              </p>
              <p className="text-xs mb-3" style={{ color: theme.muted }}>
                Open your authenticator app and scan the code below.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <div className="p-3 rounded-xl flex-shrink-0" style={{ background: '#fff' }}>
                  <img src={setupData.qrDataUrl} alt="2FA QR code"
                    className="w-40 h-40 block" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-[10px] font-mono uppercase mb-1" style={{ color: theme.muted }}>
                    Can't scan? Enter this secret manually:
                  </p>
                  <div className="px-3 py-2 rounded-xl font-mono text-xs break-all select-all"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
                    {setupData.secret}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: theme.text }}>
                Step 2 — Enter the 6-digit code from your app
              </p>
              <div className="flex gap-2">
                <input
                  autoFocus
                  inputMode="numeric" pattern="[0-9]*" maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="flex-1 px-3 py-2.5 rounded-xl text-center text-lg font-mono tracking-[0.3em] outline-none"
                  style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
                />
                <Button onClick={handleVerify} loading={loading}>Verify & Enable</Button>
              </div>
              <div className="flex justify-end mt-2">
                <button onClick={() => { setMode('idle'); setSetupData(null); setCode('') }}
                  className="text-xs hover:underline" style={{ color: theme.muted }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BACKUP: show codes once, require confirmation  */}
        {mode === 'backup' && backupCodes && (
          <div>
            <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
              style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
              <AlertTriangle size={18} style={{ color: '#F0A045' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>
                  Save these backup codes somewhere safe
                </p>
                <p className="text-xs" style={{ color: theme.muted }}>
                  Each code works exactly once if you lose access to your authenticator.
                  These will NOT be shown again.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 rounded-xl mb-4"
              style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
              {backupCodes.map((c, i) => (
                <div key={i} className="font-mono text-sm py-1 px-2 rounded select-all"
                  style={{ color: theme.text }}>{c}</div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={copyCodes}>
                {codesCopied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy all</>}
              </Button>
              <Button onClick={finishSetup}>I've saved them — Done</Button>
            </div>
          </div>
        )}

        {/* ── ENABLED: offer disable ────────── */}
        {mode === 'enabled' && (
          <div>
            <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
              style={{ background: 'rgba(98,184,73,0.08)', border: '1px solid rgba(98,184,73,0.2)' }}>
              <ShieldCheck size={18} style={{ color: '#62B849' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>
                  Two-factor is active on your account
                </p>
                <p className="text-xs mt-1" style={{ color: theme.muted }}>
                  You'll be asked for a 6-digit code every time you sign in.
                </p>
              </div>
            </div>
            <Button variant="danger" onClick={() => setDisableOpen(true)}>
              <ShieldOff size={14} />Disable Two-Factor
            </Button>
          </div>
        )}
      </div>

      {/* Disable-confirm modal */}
      <Modal open={disableOpen} onClose={() => { setDisableOpen(false); setDisablePassword('') }}
        title="Disable Two-Factor Authentication" size="sm">
        <p className="text-sm mb-4" style={{ color: theme.muted }}>
          Enter your account password to confirm. Without 2FA, your account is
          only protected by your password.
        </p>
        <Input type="password" label="Password" placeholder="••••••••"
          value={disablePassword} onChange={e => setDisablePassword(e.target.value)} />
        <div className="flex gap-3 justify-end mt-5">
          <Button variant="ghost" onClick={() => { setDisableOpen(false); setDisablePassword('') }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDisable} loading={loading}>
            Disable
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
