import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService, otpService } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff, Star, Mail, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { theme } = useTheme()
  const preselectedPlan = params.get('plan')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    orgName: '', name: '', email: '', password: '', phone: '',
  })
  const [showPass, setShowPass] = useState(false)

  // OTP state
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const otpInputRef = useRef(null)

  // Plan state
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(preselectedPlan || '')
  const [loading, setLoading] = useState(false)

  // Load public plans
  useEffect(() => {
    api.get('/plans').then(res => {
      const list = res.data?.data?.plans || []
      setPlans(list)
      if (!selectedPlanId && list.length) {
        const popular = list.find(p => p.isPopular)
        setSelectedPlanId(popular?._id || list[0]._id)
      }
    }).catch(() => setPlans([]))
  }, [])

  // Resend timer countdown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendIn])
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputRef.current?.focus(), 100)
    }
  }, [step])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Step 1 → send OTP → Step 2 ────────
  const handleStep1Continue = async (e) => {
    e.preventDefault()
    if (!form.orgName.trim()) return toast.error('Organisation name is required')
    if (!form.name.trim()) return toast.error('Your name is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Valid email required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')

    setOtpSending(true)
    try {
      await otpService.send(form.email.trim().toLowerCase())
      toast.success(`Verification code sent to ${form.email}`)
      setStep(2)
      setResendIn(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code')
    } finally {
      setOtpSending(false)
    }
  }

  // ── Resend OTP ────────────────
  const handleResend = async () => {
    if (resendIn > 0) return
    setOtpSending(true)
    try {
      await otpService.send(form.email.trim().toLowerCase())
      toast.success('New code sent — check your inbox')
      setOtp('')
      setResendIn(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setOtpSending(false)
    }
  }

  // ── Step 2 → verify OTP → Step 3 ────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter the 6-digit code')
    setOtpVerifying(true)
    try {
      await otpService.verify(form.email.trim().toLowerCase(), otp)
      toast.success('Email verified!')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally {
      setOtpVerifying(false)
    }
  }

  // ── Step 3 → register ──────────────
  const handleSubmit = async () => {
    if (!selectedPlanId) return toast.error('Please select a plan')
    setLoading(true)
    try {
      const res = await authService.register({ ...form, planId: selectedPlanId })
      const { token, user } = res.data.data
      localStorage.setItem('nv_token', token)
      toast.success(`Welcome aboard, ${user.name}!`)
      setTimeout(() => { window.location.href = '/dashboard' }, 800)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
      // If OTP expired between steps, kick back to step 2
      if (/verify your email/i.test(msg)) setStep(2)
      setLoading(false)
    }
  }

  const selectedPlan = plans.find(p => p._id === selectedPlanId)

  // ── Stepper ─────────────────────────────────────────────────────────
  const STEPS = [
    { n: 1, label: 'Your details' },
    { n: 2, label: 'Verify email' },
    { n: 3, label: 'Choose plan' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: theme.bg }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${theme.accent}15, transparent)` }} />

      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>N</div>
          <span className="font-display font-bold text-lg">
            Net<span style={{ color: theme.accent }}>Vault</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Stepper */}
      <div className="relative z-10 max-w-md mx-auto px-6 mb-6">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= s.n ? theme.accent : 'transparent',
                  color: step >= s.n ? '#fff' : theme.muted,
                  border: step >= s.n ? 'none' : `1px solid ${theme.border}`,
                }}>
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className="text-[11px] font-mono hidden sm:inline"
                style={{ color: step >= s.n ? theme.text : theme.muted }}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: theme.border }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-6 pb-16">
        <div className="rounded-2xl p-7"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>

          {/* ─── STEP 1 — Details ───────── */}
          {step === 1 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Create your account</h1>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                Start your 14-day free trial
              </p>

              <form onSubmit={handleStep1Continue} className="space-y-3">
                {[
                  { name: 'orgName', label: 'Organisation name', placeholder: 'Acme Digital', type: 'text' },
                  { name: 'name', label: 'Your name', placeholder: 'Rahul Kumar', type: 'text' },
                  { name: 'email', label: 'Email', placeholder: 'you@agency.com', type: 'email' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                      {f.label}
                    </label>
                    <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                      placeholder={f.placeholder} autoComplete={f.name === 'email' ? 'email' : 'off'}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: `${theme.accent}08`, border: `1px solid ${theme.border}`,
                        color: theme.text, fontFamily: "'DM Sans',sans-serif"
                      }} />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange} placeholder="Min 6 characters"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                      style={{
                        background: `${theme.accent}08`, border: `1px solid ${theme.border}`,
                        color: theme.text, fontFamily: "'DM Sans',sans-serif"
                      }} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                      style={{ color: theme.text }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                    Phone <span className="font-normal opacity-60">(optional)</span>
                  </label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: `${theme.accent}08`, border: `1px solid ${theme.border}`,
                      color: theme.text, fontFamily: "'DM Sans',sans-serif"
                    }} />
                </div>

                <button type="submit" disabled={otpSending}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpSending ? 'Sending code…' : (<>Send verification code <ArrowRight size={14} /></>)}
                </button>
              </form>

              <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: theme.accent }}>
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ─── STEP 2 — OTP ──────────────── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={18} style={{ color: theme.accent }} />
                <h1 className="font-display font-bold text-2xl">Check your email</h1>
              </div>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                We sent a 6-digit code to <strong style={{ color: theme.text }}>{form.email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                    Verification code
                  </label>
                  <input ref={otpInputRef}
                    inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={otp} autoComplete="one-time-code"
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full px-3 py-3 rounded-xl text-center text-2xl font-mono tracking-[0.4em] outline-none"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                </div>

                <button type="submit" disabled={otpVerifying || otp.length !== 6}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpVerifying ? 'Verifying…' : (<><ShieldCheck size={14} />Verify & continue</>)}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs"
                  style={{ color: theme.muted }}>
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1 hover:underline">
                    <ArrowLeft size={11} /> Change email
                  </button>
                  {resendIn > 0 ? (
                    <span>Resend in {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={otpSending}
                      className="font-semibold hover:underline disabled:opacity-60"
                      style={{ color: theme.accent }}>
                      Resend code
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* ─── STEP 3 — Plan ──────────── */}
          {step === 3 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Choose your plan</h1>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                All plans include a 14-day free trial — no credit card required
              </p>

              {plans.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>
                  Loading plans…
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {plans.map(p => {
                    const isSelected = selectedPlanId === p._id
                    return (
                      <button key={p._id} type="button"
                        onClick={() => setSelectedPlanId(p._id)}
                        className="w-full text-left p-4 rounded-xl transition-all relative"
                        style={{
                          background: isSelected ? `${theme.accent}15` : `${theme.accent}06`,
                          border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? theme.accent : theme.border}`,
                        }}>
                        {p.isPopular && !isSelected && (
                          <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider"
                            style={{ background: theme.accent, color: '#fff' }}>
                            <Star size={8} /> Popular
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm" style={{ color: theme.text }}>
                              {p.displayName}
                            </div>
                            <div className="text-[10px] font-mono" style={{ color: theme.muted }}>
                              {p.trialDays > 0 ? `${p.trialDays}-day free trial` : 'Free forever'}
                            </div>
                          </div>
                          <div className="font-display font-bold text-xl"
                            style={{ color: isSelected ? theme.accent : theme.text }}>
                            ₹{p.price}
                            {p.price > 0 && (
                              <span className="text-xs font-normal ml-1" style={{ color: theme.muted }}>/mo</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {(p.features || []).slice(0, 4).map(f => (
                            <span key={f} className="px-2 py-0.5 rounded font-mono"
                              style={{ background: isSelected ? `${theme.accent}18` : theme.border, color: theme.muted }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedPlan && (
                <div className="p-3 rounded-xl mb-4 text-xs"
                  style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: theme.muted }}>You'll start with</span>
                    <span className="font-semibold" style={{ color: theme.accent }}>{selectedPlan.displayName}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} disabled={loading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
                  style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" onClick={handleSubmit}
                  disabled={loading || !selectedPlanId}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {loading ? 'Creating your account…' : 'Create account'}
                </button>
              </div>

              <p className="text-[10px] text-center mt-3" style={{ color: theme.muted }}>
                By creating an account, you agree to our terms and privacy policy.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
