import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService, otpService } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff, Star, Mail, ShieldCheck, Tag, X, Zap, Building2, Rocket } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

// Plan icons mapping
const PLAN_ICONS = { 0: Zap, 1: Building2, 2: Rocket }

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { theme } = useTheme()
  const preselectedPlan = params.get('plan')
  const refCode = params.get('ref') || ''

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    orgName: '', name: '', email: '', password: '', phone: '',
  })
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

  // Coupon state
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [manualCouponInput, setManualCouponInput] = useState('')
  const [manualCouponError, setManualCouponError] = useState('')
  const [manualCouponLoading, setManualCouponLoading] = useState(false)

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

  const selectedPlan = plans.find(p => p._id === selectedPlanId)

  // ── Coupon helpers ───────────────────────────────────────────────────
  const handleManualApply = async () => {
    if (!manualCouponInput.trim()) return
    setManualCouponLoading(true)
    setManualCouponError('')
    try {
      const res = await api.post('/coupons/validate', {
        code: manualCouponInput.trim().toUpperCase(),
        orderAmount: selectedPlan?.price || 0,
      })
      const { coupon } = res.data.data
      setSelectedCoupon(coupon)
      toast.success('Coupon applied!')
    } catch (err) {
      setManualCouponError(err.response?.data?.message || 'Invalid coupon code')
    } finally {
      setManualCouponLoading(false)
    }
  }

  // ── Field-level validation ───────────────────────────────────────────
  const validators = {
    name: v => {
      if (!v.trim()) return 'Name is required'
      if (/\d/.test(v)) return 'Name cannot contain numbers'
      if (!/^[a-zA-Z\s'.,-]+$/.test(v)) return 'Name can only contain letters'
      return ''
    },
    orgName: v => !v.trim() ? 'Organisation name is required' : '',
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
    phone: v => {
      if (!v) return ''
      const digits = v.replace(/\D/g, '')
      if (digits.length !== 10) return 'Phone number must be exactly 10 digits'
      return ''
    },
  }

  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'name' && /\d/.test(value)) {
      setErrors(prev => ({ ...prev, name: 'Name cannot contain numbers' }))
      return
    }
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      setForm(f => ({ ...f, phone: digits }))
      setErrors(prev => ({ ...prev, phone: validators.phone(digits) }))
      return
    }
    setForm(f => ({ ...f, [name]: value }))
    if (validators[name]) {
      setErrors(prev => ({ ...prev, [name]: validators[name](value) }))
    }
  }

  const validateStep1 = () => {
    const fields = ['orgName', 'name', 'email', 'password']
    const newErrors = {}
    fields.forEach(f => {
      const err = validators[f]?.(form[f])
      if (err) newErrors[f] = err
    })
    const phoneErr = validators.phone(form.phone)
    if (phoneErr) newErrors.phone = phoneErr
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Continue = async (e) => {
    e.preventDefault()
    if (!validateStep1()) return
    setOtpSending(true)
    try {
      // Pre-check email availability before sending OTP
      try {
        await authService.checkEmail(form.email.trim().toLowerCase())
      } catch (emailErr) {
        if (emailErr.response?.status === 409) {
          setErrors(prev => ({
            ...prev,
            email: 'This email is already registered. Please sign in or use a different email.',
          }))
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
      // Show a specific, user-friendly error for duplicate emails
      if (/already registered|email.*exist|duplicate/i.test(msg)) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered. Please sign in or use a different email.',
        }))
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
        ...form,
        planId: selectedPlanId,
        ...(selectedCoupon && { couponCode: selectedCoupon.code }),
        ...(refCode && { referralCode: refCode }),
      }
      const res = await authService.register(payload)
      const { token, user } = res.data.data
      localStorage.setItem('nv_token', token)
      toast.success(`Welcome aboard, ${user.name}!`)
      setTimeout(() => { window.location.href = '/dashboard' }, 800)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (/already registered|email.*exist|duplicate/i.test(msg)) {
        toast.error('This email is already registered. Please sign in or use a different email.')
        setStep(1)
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered. Please sign in or use a different email.',
        }))
      } else if (/verify your email/i.test(msg)) {
        toast.error(msg)
        setStep(2)
      } else {
        toast.error(msg)
      }
      setLoading(false)
    }
  }

  // ── Price calculation ────────────────────────────────────────────────
  const originalPrice = selectedPlan?.price || 0
  const discountAmount = selectedCoupon
    ? selectedCoupon.discountType === 'percentage'
      ? Math.round((originalPrice * selectedCoupon.discountValue) / 100)
      : Math.min(selectedCoupon.discountValue, originalPrice)
    : 0
  const finalPrice = originalPrice - discountAmount

  const STEPS = [
    { n: 1, label: 'Your details' },
    { n: 2, label: 'Verify email' },
    { n: 3, label: 'Choose plan' },
  ]

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="text-[10px] font-mono mt-1" style={{ color: '#C94040' }}>
        {errors[name]}
      </p>
    ) : null

  const inputStyle = (hasError) => ({
    background: `${theme.accent}08`,
    border: `1px solid ${hasError ? '#C94040' : theme.border}`,
    color: theme.text,
    fontFamily: "'DM Sans',sans-serif",
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

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Create your account</h1>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                Start your 14-day free trial
              </p>
              <form onSubmit={handleStep1Continue} className="space-y-3">
                {[
                  { label: 'Organisation name', name: 'orgName', type: 'text', placeholder: 'Acme Digital' },
                  { label: 'Your name', name: 'name', type: 'text', placeholder: 'Rahul Kumar' },
                  { label: 'Email', name: 'email', type: 'email', placeholder: 'you@agency.com' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>{f.label}</label>
                    <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                      placeholder={f.placeholder} autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle(errors[f.name])} />
                    <FieldError name={f.name} />
                  </div>
                ))}

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange} placeholder="Min 6 characters"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                      style={inputStyle(errors.password)} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                      style={{ color: theme.text }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <FieldError name="password" />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                    Phone <span className="font-normal opacity-60">(optional)</span>
                  </label>
                  <div className='flex'>
                    <select
                    name ="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className='px-2 py-2 rounded-1-xl text-sm outline-none border-r style={inputStyle()}'
                    >
                      <option value = "+91">IN +91</option>
                      <option value = "+1">US +1</option>
                      <option value = "+44">GB +44</option>
                      <option value = "+971">AE +971</option>

                    </select>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="9876543210" maxLength={10} inputMode="numeric"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle(errors.phone)} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <FieldError name="phone" />
                    <span className="text-[10px] font-mono ml-auto" style={{ color: theme.muted }}>
                      {form.phone.length}/10
                    </span>
                  </div>
                </div>

                <button type="submit" disabled={otpSending}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpSending ? 'Sending code…' : (<>Send verification code <ArrowRight size={14} /></>)}
                </button>
              </form>

              <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: theme.accent }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2 ── */}
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

          {/* ── STEP 3 — Plan + Coupon ── */}
          {step === 3 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Choose your plan</h1>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                All plans include a 14-day free trial — no credit card required
              </p>

              {/* Referral banner */}
              {refCode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
                  style={{ background: '#16a34a15', border: '1px solid #16a34a40', color: '#16a34a' }}>
                  <Check size={12} />
                  Referral code <strong>{refCode}</strong> applied — you'll get a discount on your first invoice!
                </div>
              )}

              {/* Plans — 2-column grid, no scroll */}
              {plans.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>Loading plans…</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {plans.map((p, idx) => {
                    const isSelected = selectedPlanId === p._id
                    const PlanIcon = PLAN_ICONS[idx] || Zap
                    return (
                      <button key={p._id} type="button"
                        onClick={() => setSelectedPlanId(p._id)}
                        className="text-left rounded-2xl transition-all relative overflow-hidden flex flex-col"
                        style={{
                          background: isSelected ? `${theme.accent}12` : `${theme.accent}05`,
                          border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? theme.accent : theme.border}`,
                          padding: isSelected ? '11px' : '12px',
                          boxShadow: isSelected ? `0 4px 20px ${theme.accent}20` : 'none',
                          minHeight: '128px',
                        }}>

                        {/* Popular badge */}
                        {p.isPopular && (
                          <div className="absolute top-0 right-0 flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded-bl-xl"
                            style={{ background: theme.accent, color: '#fff' }}>
                            <Star size={7} /> Popular
                          </div>
                        )}

                        {/* Icon + check row */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: isSelected ? `${theme.accent}25` : `${theme.accent}10` }}>
                            <PlanIcon size={15} style={{ color: isSelected ? theme.accent : theme.muted }} />
                          </div>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center"
                            style={{
                              background: isSelected ? theme.accent : 'transparent',
                              border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                            }}>
                            {isSelected && <Check size={9} color="#fff" />}
                          </div>
                        </div>

                        {/* Name */}
                        <div className="font-bold text-xs mb-1 leading-tight" style={{ color: theme.text }}>
                          {p.displayName}
                        </div>

                        {/* Price */}
                        <div className="mb-1">
                          {p.price === 0 ? (
                            <span className="font-display font-bold text-lg leading-none"
                              style={{ color: isSelected ? theme.accent : theme.text }}>Free</span>
                          ) : (
                            <div className="flex items-baseline gap-0.5">
                              <span className="font-display font-bold text-base leading-none"
                                style={{ color: isSelected ? theme.accent : theme.text }}>₹{p.price}</span>
                              <span className="text-[10px]" style={{ color: theme.muted }}>/mo</span>
                            </div>
                          )}
                        </div>

                        {/* Trial */}
                        <div className="text-[9px] font-mono mt-auto pt-1" style={{ color: isSelected ? theme.accent : theme.muted }}>
                          {p.trialDays > 0 ? `✓ ${p.trialDays}d free trial` : '✓ Free forever'}
                        </div>

                        {/* First feature tag */}
                        {(p.features || []).length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono leading-tight"
                              style={{
                                background: isSelected ? `${theme.accent}18` : `${theme.accent}08`,
                                color: isSelected ? theme.accent : theme.muted,
                                border: `1px solid ${isSelected ? `${theme.accent}30` : theme.border}`,
                              }}>
                              {p.features[0]}
                            </span>
                            {p.features.length > 1 && (
                              <span className="text-[9px] font-mono" style={{ color: theme.muted }}>
                                +{p.features.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Coupon Section */}
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
                          <span className="font-mono font-bold text-sm" style={{ color: '#16a34a' }}>
                            {selectedCoupon.code}
                          </span>
                          {selectedCoupon.description && (
                            <span className="text-xs" style={{ color: theme.muted }}>— {selectedCoupon.description}</span>
                          )}
                        </div>
                        <button type="button" onClick={() => { setSelectedCoupon(null); setManualCouponInput('') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted }}>
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-1 text-xs pt-2" style={{ borderTop: '1px solid #16a34a30' }}>
                        <div className="flex justify-between" style={{ color: theme.muted }}>
                          <span>Plan price</span><span>₹{originalPrice}/mo</span>
                        </div>
                        <div className="flex justify-between" style={{ color: '#16a34a' }}>
                          <span>
                            Discount ({selectedCoupon.discountType === 'percentage'
                              ? `${selectedCoupon.discountValue}%`
                              : `₹${selectedCoupon.discountValue} flat`})
                          </span>
                          <span>- ₹{discountAmount}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1"
                          style={{ color: theme.text, borderTop: `1px solid ${theme.border}` }}>
                          <span>You pay</span>
                          <span style={{ color: theme.accent }}>₹{finalPrice}/mo</span>
                        </div>
                      </div>
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
                        style={{
                          background: `${theme.accent}08`,
                          border: `1px solid ${manualCouponError ? '#C94040' : theme.border}`,
                          color: theme.text,
                        }}
                      />
                      <button type="button" onClick={handleManualApply}
                        disabled={!manualCouponInput.trim() || manualCouponLoading}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                        style={{ background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {manualCouponLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {manualCouponError && (
                    <p className="text-[10px] font-mono mt-1.5" style={{ color: '#C94040' }}>{manualCouponError}</p>
                  )}
                </div>
              )}

              {/* Order Summary */}
              {selectedPlan && (
                <div className="p-4 rounded-xl mb-5"
                  style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: theme.muted }}>ORDER SUMMARY</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Plan</span>
                      <span style={{ color: theme.text, fontWeight: 600 }}>{selectedPlan.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Billing</span>
                      <span style={{ color: theme.text }}>
                        {selectedPlan.price === 0 ? 'Free forever' : `₹${originalPrice}/month`}
                      </span>
                    </div>
                    {selectedPlan.trialDays > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: theme.muted }}>Trial</span>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>{selectedPlan.trialDays} days free</span>
                      </div>
                    )}
                    {selectedCoupon && discountAmount > 0 && (
                      <div className="flex justify-between" style={{ color: '#16a34a' }}>
                        <span>Coupon ({selectedCoupon.code})</span>
                        <span>- ₹{discountAmount}</span>
                      </div>
                    )}
                    {selectedPlan.price > 0 && (
                      <div className="flex justify-between font-bold pt-2"
                        style={{ borderTop: `1px solid ${theme.border}`, color: theme.text }}>
                        <span>Total after trial</span>
                        <span style={{ color: theme.accent }}>
                          ₹{selectedCoupon ? finalPrice : originalPrice}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
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
                  {loading ? 'Creating your account…' : (
                    <>{selectedPlan?.trialDays > 0 ? 'Start free trial' : 'Create account'} <ArrowRight size={14} /></>
                  )}
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