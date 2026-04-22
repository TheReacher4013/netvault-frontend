import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader } from '../../components/ui/index'
import { RefreshCw, Copy, Check, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const CHARSETS = {
  lower:   'abcdefghijklmnopqrstuvwxyz',
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits:  '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  // Ambiguous chars to remove when "no ambiguous" is on
  ambiguous: 'Il1O0',
}

function generate(opts) {
  const pool = [
    opts.lower   ? CHARSETS.lower   : '',
    opts.upper   ? CHARSETS.upper   : '',
    opts.digits  ? CHARSETS.digits  : '',
    opts.symbols ? CHARSETS.symbols : '',
  ].join('')

  let chars = pool
  if (opts.noAmbiguous) {
    chars = chars.split('').filter(c => !CHARSETS.ambiguous.includes(c)).join('')
  }
  if (!chars) return ''

  // Crypto-random: avoid Math.random bias by rejection-sampling
  const out = new Array(opts.length)
  const buf = new Uint32Array(opts.length * 2) // extra headroom for rejections
  crypto.getRandomValues(buf)

  let j = 0
  const max = Math.floor(0xFFFFFFFF / chars.length) * chars.length
  for (let i = 0; i < opts.length; i++) {
    while (buf[j] >= max) {
      j++
      if (j >= buf.length) {
        crypto.getRandomValues(buf)
        j = 0
      }
    }
    out[i] = chars[buf[j] % chars.length]
    j++
  }
  return out.join('')
}

// Rough strength estimate using character pool size and length
function strength(password, opts) {
  let pool = 0
  if (opts.lower)   pool += 26
  if (opts.upper)   pool += 26
  if (opts.digits)  pool += 10
  if (opts.symbols) pool += 25
  if (opts.noAmbiguous) pool -= CHARSETS.ambiguous.length
  const bits = password.length * Math.log2(Math.max(pool, 1))
  if (bits < 40)  return { label: 'Weak',       color: '#C94040', pct: Math.min(100, bits / 40 * 50) }
  if (bits < 60)  return { label: 'Fair',       color: '#F0A045', pct: 50 + (bits - 40) / 20 * 25 }
  if (bits < 100) return { label: 'Strong',     color: '#62B849', pct: 75 + (bits - 60) / 40 * 20 }
  return              { label: 'Very Strong',color: '#62B849', pct: 100 }
}

export default function PasswordGenerator() {
  const { theme } = useAuth()
  const [length, setLength] = useState(20)
  const [opts, setOpts] = useState({
    lower: true, upper: true, digits: true, symbols: true, noAmbiguous: false,
  })
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const regen = () => setPassword(generate({ ...opts, length }))
  useEffect(() => { regen() /* eslint-disable-next-line */ }, [])

  const score = useMemo(() => strength(password, { ...opts, length }), [password, opts, length])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true); toast.success('Copied!')
      setTimeout(() => setCopied(false), 1500)
    } catch { toast.error('Copy failed — select and copy manually') }
  }

  const toggle = (k) => setOpts(o => ({ ...o, [k]: !o[k] }))

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Password Generator" subtitle="Generate cryptographically-random, strong passwords" />

      <Card className="p-6">
        {/* Output */}
        <div className="relative">
          <textarea value={password} readOnly rows={2}
            className="w-full px-4 py-3 rounded-xl text-lg font-mono outline-none resize-none pr-24"
            style={{
              background: `${theme.accent}10`, border: `1px solid ${theme.border}`,
              color: theme.text, letterSpacing: '0.06em',
            }}
            onFocus={e => e.target.select()}
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button onClick={regen}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: theme.accent }}>
              <RefreshCw size={15} />
            </button>
            <button onClick={copy}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: copied ? '#62B849' : theme.accent }}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        {/* Strength meter */}
        <div className="mt-3 flex items-center gap-3">
          <Shield size={14} style={{ color: score.color }} />
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${theme.accent}15` }}>
            <div className="h-full transition-all duration-300"
              style={{ width: `${score.pct}%`, background: score.color }} />
          </div>
          <span className="text-xs font-mono font-semibold" style={{ color: score.color, minWidth: 70 }}>
            {score.label}
          </span>
        </div>

        {/* Length slider */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold" style={{ color: theme.muted }}>Length</label>
            <span className="text-sm font-mono font-bold" style={{ color: theme.accent }}>{length}</span>
          </div>
          <input type="range" min={8} max={64} value={length}
            onChange={e => setLength(+e.target.value)}
            onMouseUp={regen}
            onTouchEnd={regen}
            className="w-full" style={{ accentColor: theme.accent }}
          />
          <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: theme.muted }}>
            <span>8</span><span>20</span><span>32</span><span>48</span><span>64</span>
          </div>
        </div>

        {/* Character set options */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            ['lower', 'Lowercase', 'a–z'],
            ['upper', 'Uppercase', 'A–Z'],
            ['digits', 'Digits', '0–9'],
            ['symbols', 'Symbols', '!@#$%'],
          ].map(([k, label, hint]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={opts[k]} onChange={() => toggle(k)}
                className="w-4 h-4 rounded" style={{ accentColor: theme.accent }} />
              <span className="text-sm" style={{ color: theme.text }}>{label}</span>
              <span className="text-[10px] font-mono" style={{ color: theme.muted }}>{hint}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" checked={opts.noAmbiguous} onChange={() => toggle('noAmbiguous')}
              className="w-4 h-4 rounded" style={{ accentColor: theme.accent }} />
            <span className="text-sm" style={{ color: theme.text }}>Exclude ambiguous characters</span>
            <span className="text-[10px] font-mono" style={{ color: theme.muted }}>(no I, l, 1, O, 0)</span>
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <Button onClick={regen}><RefreshCw size={14} />Generate New</Button>
          <Button variant="secondary" onClick={copy}>
            {copied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy</>}
          </Button>
        </div>

        <p className="text-[10px] mt-4" style={{ color: theme.muted }}>
          Passwords are generated entirely in your browser using the Web Crypto API.
          They are never sent to any server.
        </p>
      </Card>
    </div>
  )
}
