import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService, otpService } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import {
  ArrowRight, ArrowLeft, Check, Eye, EyeOff, Star, Mail,
  ShieldCheck, Tag, X, Zap, Building2, Rocket, Globe, Gift,
  Lock, Users, Database, MonitorSmartphone, Clock, CheckCircle2,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const PLAN_ICONS = { 0: Zap, 1: Building2, 2: Rocket }

const COUNTRY_CODES = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', currency: 'INR', symbol: '₹', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', currency: 'USD', symbol: '$', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', symbol: '£', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', currency: 'AUD', symbol: 'A$', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', currency: 'CAD', symbol: 'C$', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', currency: 'EUR', symbol: '€', phoneLength: 11, phonePattern: /^\d{10,11}$/ },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', currency: 'EUR', symbol: '€', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', currency: 'AED', symbol: 'AED', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', currency: 'SGD', symbol: 'S$', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', phoneLength: 9, phonePattern: /^\d{9,10}$/ },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh', currency: 'BDT', symbol: '৳', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', currency: 'PKR', symbol: '₨', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal', currency: 'NPR', symbol: 'Rs.', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka', currency: 'LKR', symbol: 'Rs', phoneLength: 9, phonePattern: /^\d{9}$/ },
]

// Returns a human-readable description for the phone format of a country
function phoneHint(c) {
  return `${c.phoneLength}-digit number for ${c.name} (${c.dial})`
}

export default function Register() {
  const [params] = useSearchParams()
  const { theme } = useTheme()
  const preselectedPlan = params.get('plan')
  const refCode = params.get('ref') || ''

  const [step, setStep] = useState(1)
  // Step 1: only email + password
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
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
  const [country, setCountry] = useState('IN')

  // Coupon state
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [manualCouponInput, setManualCouponInput] = useState('')
  const [manualCouponError, setManualCouponError] = useState('')
  const [manualCouponLoading, setManualCouponLoading] = useState(false)

  const selectedCountry = COUNTRY_CODES.find(c => c.code === country) || COUNTRY_CODES[0]
  const currSymbol = selectedCountry.symbol

  // Load plans filtered by country
  useEffect(() => {
    api.get(`/plans?country=${country}`).then(res => {
      const list = res.data?.data?.plans || []
      setPlans(list)
      if (!selectedPlanId && list.length) {
        const popular = list.find(p => p.isPopular)
        setSelectedPlanId(popular?._id || list[0]._id)
      }
    }).catch(() => setPlans([]))
  }, [country])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  useEffect(() => {
    if (step === 2) setTimeout(() => otpInputRef.current?.focus(), 100)
  }, [step])

  const selectedPlan = plans.find(p => p._id === selectedPlanId)

  // ── Coupon helpers ──────────────────────────────────────────────────────
  const handleManualApply = async () => {
    if (!manualCouponInput.trim()) return
    setManualCouponLoading(true)
    setManualCouponError('')
    try {
      const res = await api.post('/coupons/validate', {
        code: manualCouponInput.trim().toUpperCase(),
        orderAmount: selectedPlan?.price || 0,
      })
      const { coupon, extraDays } = res.data.data
      setSelectedCoupon({ ...coupon, extraDays })
      toast.success(
        coupon.discountType === 'duration'
          ? `Coupon applied — ${extraDays} extra days added to your subscription!`
          : 'Coupon applied!'
      )
    } catch (err) {
      setManualCouponError(err.response?.data?.message || 'Invalid coupon code')
    } finally {
      setManualCouponLoading(false)
    }
  }

  // ── Field-level validators ──────────────────────────────────────────────
  const validators = {
    email: v => {
      if (!v.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
      return ''
    },
    password: v => {
      if (!v) return 'Password is required'
      if (v.length < 6) return 'Password must be at least 6 characters'
      return ''
    },
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (validators[name]) setErrors(prev => ({ ...prev, [name]: validators[name](value) }))
  }

  const validateStep1 = () => {
    const newErrors = {}
    Object.keys(validators).forEach(f => {
      const err = validators[f]?.(form[f] || '')
      if (err) newErrors[f] = err
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Continue = async (e) => {
    e.preventDefault()
    if (!validateStep1()) return
    setOtpSending(true)
    try {
      // Pre-check email availability
      try {
        await authService.checkEmail(form.email.trim().toLowerCase())
      } catch (emailErr) {
        if (emailErr.response?.status === 409) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in.' }))
          setOtpSending(false)
          return
        }
      }
      await otpService.send(form.email.trim().toLowerCase())
      toast.success(`Verification code sent to ${form.email}`)
      setStep(2)
      setResendIn(60)
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (/already registered|email.*exist|duplicate/i.test(msg)) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in.' }))
      } else {
        toast.error(msg || 'Failed to send verification code')
      }
    } finally {
      setOtpSending(false)
    }
  }

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

  const handleSubmit = async () => {
    if (!selectedPlanId) return toast.error('Please select a plan')
    setLoading(true)
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        planId: selectedPlanId,
        country,
        countryCode: selectedCountry.dial,
        ...(selectedCoupon && { couponCode: selectedCoupon.code }),
        ...(refCode && { referralCode: refCode }),
      }
      const res = await authService.register(payload)
      const { token, user } = res.data.data
      localStorage.setItem('nv_token', token)
      toast.success('Account created! Welcome to NetVault 🎉')
      setTimeout(() => { window.location.href = '/dashboard' }, 800)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (/already registered|email.*exist|duplicate/i.test(msg)) {
        toast.error('This email is already registered.')
        setStep(1)
        setErrors(prev => ({ ...prev, email: 'Already registered. Please sign in.' }))
      } else {
        toast.error(msg)
      }
      setLoading(false)
    }
  }

  // ── Price calculation ─────────────────────────────────────────────────
  const originalPrice = selectedPlan?.price || 0
  const discountAmount = selectedCoupon && selectedCoupon.discountType !== 'duration'
    ? selectedCoupon.discountType === 'percentage'
      ? Math.round((originalPrice * selectedCoupon.discountValue) / 100)
      : Math.min(selectedCoupon.discountValue, originalPrice)
    : 0
  const finalPrice = originalPrice - discountAmount

  const STEPS = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Verify email' },
    { n: 3, label: 'Choose plan' },
  ]

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="text-[10px] font-mono mt-1" style={{ color: '#C94040' }}>{errors[name]}</p>
    ) : null

  const inputStyle = (hasError) => ({
    background: `${theme.accent}08`,
    border: `1px solid ${hasError ? '#C94040' : theme.border}`,
    color: theme.text,
  })

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: theme.bg }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${theme.accent}15, transparent)` }} />

      {/* Nav */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C' }}>N</div>
          <span className="font-display font-bold text-lg">
            Net<span style={{ color: theme.accent }}>Vault</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Stepper */}
      <div className="relative z-10 max-w-lg mx-auto px-6 mb-6">
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
      <div className="relative z-10 max-w-lg mx-auto px-6 pb-16">
        <div className="rounded-2xl p-7" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>

          {/* ── STEP 1: Email + Password only ── */}
          {step === 1 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Create your account</h1>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                🎉 Start your <strong style={{ color: theme.accent }}>7-day free trial</strong> — no credit card required
              </p>

              {/* Quick benefit pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: Clock, text: '7-day free trial' },
                  { icon: CheckCircle2, text: 'No credit card' },
                  { icon: Lock, text: 'Secure & private' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ background: `${theme.accent}10`, color: theme.muted, border: `1px solid ${theme.border}` }}>
                    <Icon size={10} style={{ color: theme.accent }} /> {text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleStep1Continue} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle(errors.email)}
                  />
                  <FieldError name="email" />
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                      style={inputStyle(errors.password)}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                      style={{ color: theme.text }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <FieldError name="password" />
                </div>

                {/* Country selector for plan filtering */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5 flex items-center gap-1" style={{ color: theme.muted }}>
                    <Globe size={11} /> Your country
                  </label>
                  <select
                    value={country}
                    onChange={e => { setCountry(e.target.value); setSelectedPlanId(''); setSelectedCoupon(null) }}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: `${theme.accent}08`, borderColor: theme.border, color: theme.text }}>
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                    Determines available subscription plans and currency.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpSending}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpSending ? 'Sending code…' : (<>Continue <ArrowRight size={14} /></>)}
                </button>
              </form>

              <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: theme.accent }}>Sign in</Link>
              </p>

              <p className="text-[10px] text-center mt-3" style={{ color: theme.muted }}>
                You can add your name and organisation details later in your profile settings.
              </p>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
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
                  <input
                    ref={otpInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    autoComplete="one-time-code"
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full px-3 py-3 rounded-xl text-center text-2xl font-mono tracking-[0.4em] outline-none"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpVerifying || otp.length !== 6}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpVerifying ? 'Verifying…' : (<><ShieldCheck size={14} />Verify & continue</>)}
                </button>
                <div className="flex items-center justify-between pt-2 text-xs" style={{ color: theme.muted }}>
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 hover:underline">
                    <ArrowLeft size={11} /> Change email
                  </button>
                  {resendIn > 0 ? <span>Resend in {resendIn}s</span> : (
                    <button type="button" onClick={handleResend} disabled={otpSending}
                      className="font-semibold hover:underline disabled:opacity-60"
                      style={{ color: theme.accent }}>Resend code</button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* ── STEP 3: Plan selection ── */}
          {step === 3 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Choose your plan</h1>
              <p className="text-xs mb-2 font-mono" style={{ color: theme.muted }}>
                🎉 All plans start with a <strong style={{ color: theme.accent }}>7-day free trial</strong>
              </p>

              {/* Country badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                  style={{ background: `${theme.accent}12`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
                  <Globe size={10} />
                  {selectedCountry.flag} {selectedCountry.name} — {selectedCountry.currency}
                </span>
                <button onClick={() => setStep(1)} className="text-[10px] hover:underline" style={{ color: theme.muted }}>
                  Change
                </button>
              </div>

              {refCode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
                  style={{ background: '#16a34a15', border: '1px solid #16a34a40', color: '#16a34a' }}>
                  <Gift size={12} />
                  Referral <strong>{refCode}</strong> applied — bonus on your first invoice!
                </div>
              )}

              {/* Plan cards */}
              {plans.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>Loading plans…</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 mb-5">
                  {plans.map((p, idx) => {
                    const isSelected = selectedPlanId === p._id
                    const PlanIcon = PLAN_ICONS[idx] || Zap
                    return (
                      <button key={p._id} type="button"
                        onClick={() => { setSelectedPlanId(p._id); setSelectedCoupon(null) }}
                        className="text-left rounded-2xl transition-all relative overflow-hidden"
                        style={{
                          background: isSelected ? `${theme.accent}12` : `${theme.accent}05`,
                          border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? theme.accent : theme.border}`,
                          padding: isSelected ? '15px' : '16px',
                          boxShadow: isSelected ? `0 4px 20px ${theme.accent}20` : 'none',
                        }}>

                        {p.isPopular && (
                          <div className="absolute top-0 right-0 flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded-bl-xl"
                            style={{ background: theme.accent, color: '#fff' }}>
                            <Star size={7} /> Popular
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: isSelected ? `${theme.accent}25` : `${theme.accent}10` }}>
                            <PlanIcon size={18} style={{ color: isSelected ? theme.accent : theme.muted }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Plan name + price row */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-sm" style={{ color: theme.text }}>{p.displayName}</span>
                              <div className="flex items-baseline gap-0.5 flex-shrink-0">
                                {p.price === 0 ? (
                                  <span className="font-display font-bold text-base" style={{ color: isSelected ? theme.accent : theme.text }}>Free</span>
                                ) : (
                                  <>
                                    <span className="font-display font-bold text-base" style={{ color: isSelected ? theme.accent : theme.text }}>
                                      {currSymbol}{p.price}
                                    </span>
                                    <span className="text-[10px]" style={{ color: theme.muted }}>/mo</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Limits row */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                              {[
                                { icon: Database, label: `${p.maxDomains >= 99999 ? '∞' : p.maxDomains} Domains` },
                                { icon: Users, label: `${p.maxClients >= 99999 ? '∞' : p.maxClients} Clients` },
                                { icon: MonitorSmartphone, label: `${p.maxHosting >= 99999 ? '∞' : p.maxHosting} Hosting` },
                              ].map(({ icon: LIcon, label }) => (
                                <span key={label} className="flex items-center gap-1 text-[10px]" style={{ color: theme.muted }}>
                                  <LIcon size={9} style={{ color: isSelected ? theme.accent : theme.muted }} />
                                  {label}
                                </span>
                              ))}
                            </div>

                            {/* Features */}
                            {(p.features || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {p.features.slice(0, 3).map(f => (
                                  <span key={f} className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                                    style={{
                                      background: isSelected ? `${theme.accent}18` : `${theme.accent}08`,
                                      color: isSelected ? theme.accent : theme.muted,
                                      border: `1px solid ${isSelected ? `${theme.accent}30` : theme.border}`,
                                    }}>
                                    {f}
                                  </span>
                                ))}
                                {p.features.length > 3 && (
                                  <span className="text-[9px] font-mono" style={{ color: theme.muted }}>
                                    +{p.features.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Trial */}
                            <div className="text-[9px] font-mono" style={{ color: '#22c55e' }}>
                              ✓ 7-day free trial included
                            </div>
                          </div>

                          {/* Selected radio */}
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: isSelected ? theme.accent : 'transparent', border: `2px solid ${isSelected ? theme.accent : theme.border}` }}>
                            {isSelected && <Check size={10} color="#fff" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Coupon section */}
              {selectedPlan && selectedPlan.price > 0 && (
                <div className="mb-5">
                  <label className="text-xs font-semibold block mb-2" style={{ color: theme.muted }}>
                    <Tag size={11} className="inline mr-1" /> Have a coupon code?
                  </label>

                  {selectedCoupon ? (
                    <div className="rounded-xl p-3" style={{ background: '#16a34a12', border: '1px solid #16a34a40' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Check size={14} style={{ color: '#16a34a' }} />
                          <span className="font-mono font-bold text-sm" style={{ color: '#16a34a' }}>{selectedCoupon.code}</span>
                          {selectedCoupon.description && (
                            <span className="text-xs" style={{ color: theme.muted }}>— {selectedCoupon.description}</span>
                          )}
                        </div>
                        <button type="button" onClick={() => { setSelectedCoupon(null); setManualCouponInput('') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted }}>
                          <X size={14} />
                        </button>
                      </div>

                      {/* Duration coupon info */}
                      {selectedCoupon.discountType === 'duration' ? (
                        <div className="text-xs pt-2" style={{ borderTop: '1px solid #16a34a30', color: '#16a34a' }}>
                          🗓 <strong>{selectedCoupon.durationDays || selectedCoupon.extraDays} extra days</strong> will be added to your subscription after the trial!
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs pt-2" style={{ borderTop: '1px solid #16a34a30' }}>
                          <div className="flex justify-between" style={{ color: theme.muted }}>
                            <span>Plan price</span><span>{currSymbol}{originalPrice}/mo</span>
                          </div>
                          <div className="flex justify-between" style={{ color: '#16a34a' }}>
                            <span>Discount ({selectedCoupon.discountType === 'percentage'
                              ? `${selectedCoupon.discountValue}%` : `${currSymbol}${selectedCoupon.discountValue} flat`})</span>
                            <span>- {currSymbol}{discountAmount}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-1"
                            style={{ color: theme.text, borderTop: `1px solid ${theme.border}` }}>
                            <span>After trial</span>
                            <span style={{ color: theme.accent }}>{currSymbol}{finalPrice}/mo</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualCouponInput}
                        onChange={e => { setManualCouponInput(e.target.value.toUpperCase()); setManualCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleManualApply()}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none font-mono uppercase"
                        style={{ background: `${theme.accent}08`, border: `1px solid ${manualCouponError ? '#C94040' : theme.border}`, color: theme.text }}
                      />
                      <button type="button" onClick={handleManualApply}
                        disabled={!manualCouponInput.trim() || manualCouponLoading}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                        style={{ background: theme.accent, color: '#fff' }}>
                        {manualCouponLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {manualCouponError && <p className="text-[10px] font-mono mt-1.5" style={{ color: '#C94040' }}>{manualCouponError}</p>}
                </div>
              )}

              {/* Order Summary */}
              {selectedPlan && (
                <div className="p-4 rounded-xl mb-5" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: theme.muted }}>ORDER SUMMARY</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Plan</span>
                      <span style={{ color: theme.text, fontWeight: 600 }}>{selectedPlan.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Domains</span>
                      <span style={{ color: theme.text }}>{selectedPlan.maxDomains >= 99999 ? 'Unlimited' : selectedPlan.maxDomains}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Clients</span>
                      <span style={{ color: theme.text }}>{selectedPlan.maxClients >= 99999 ? 'Unlimited' : selectedPlan.maxClients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Hosting</span>
                      <span style={{ color: theme.text }}>{selectedPlan.maxHosting >= 99999 ? 'Unlimited' : selectedPlan.maxHosting}</span>
                    </div>
                    <div className="flex justify-between" style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
                      <span style={{ color: theme.muted }}>Free trial</span>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>7 days ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Billing after trial</span>
                      <span style={{ color: theme.text }}>
                        {selectedPlan.price === 0 ? 'Free forever' : `${currSymbol}${originalPrice}/month`}
                      </span>
                    </div>
                    {selectedCoupon && selectedCoupon.discountType === 'duration' && (
                      <div className="flex justify-between" style={{ color: '#16a34a' }}>
                        <span>Coupon bonus</span>
                        <span>+{selectedCoupon.durationDays || selectedCoupon.extraDays} days</span>
                      </div>
                    )}
                    {selectedCoupon && selectedCoupon.discountType !== 'duration' && discountAmount > 0 && (
                      <>
                        <div className="flex justify-between" style={{ color: '#16a34a' }}>
                          <span>Coupon ({selectedCoupon.code})</span>
                          <span>- {currSymbol}{discountAmount}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1"
                          style={{ borderTop: `1px solid ${theme.border}`, color: theme.text }}>
                          <span>Total after trial</span>
                          <span style={{ color: theme.accent }}>{currSymbol}{finalPrice}/mo</span>
                        </div>
                      </>
                    )}
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
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {loading ? 'Creating your account…' : (<>Start 7-day free trial <ArrowRight size={14} /></>)}
                </button>
              </div>

              <p className="text-[10px] text-center mt-3" style={{ color: theme.muted }}>
                No credit card required. Cancel any time. By signing up, you agree to our terms.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
