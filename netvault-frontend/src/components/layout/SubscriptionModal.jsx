import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  X, Check, Zap, Building2, Rocket, Tag, Gift,
  Crown, AlertTriangle, CreditCard, Loader2, Shield,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_ICONS = { 0: Zap, 1: Building2, 2: Rocket }
const COUNTRY_CURRENCIES = {
  IN: { symbol: '₹', code: 'INR' },
  US: { symbol: '$', code: 'USD' },
  GB: { symbol: '£', code: 'GBP' },
  AU: { symbol: 'A$', code: 'AUD' },
  CA: { symbol: 'C$', code: 'CAD' },
  EU: { symbol: '€', code: 'EUR' },
}

/**
 * Loads Razorpay checkout script dynamically
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * SubscriptionModal
 *
 * Props:
 *   onClose       – called when user closes (only when trial NOT expired)
 *   onSuccess     – called after successful payment & plan activation
 *   trialExpired  – boolean; when true hides X button and filters free plans
 */
export default function SubscriptionModal({ onClose, onSuccess, trialExpired = false }) {
  const { theme, user, refreshUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [couponValidated, setCouponValidated] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState('IN')
  const [paymentStep, setPaymentStep] = useState('select') // 'select' | 'processing' | 'success' | 'failed'
  const [lastError, setLastError] = useState('')

  useEffect(() => {
    api.get(`/plans?country=${country}`)
      .then(res => {
        let list = res.data?.data?.plans || []
        if (trialExpired) {
          list = list.filter(p => p.price > 0 && p.name?.toLowerCase() !== 'free')
        }
        setPlans(list)
        const popular = list.find(p => p.isPopular)
        setSelectedPlanId(popular?._id || list[0]?._id || '')
      })
      .catch(() => setPlans([]))
  }, [country, trialExpired])

  const selectedPlan = plans.find(p => p._id === selectedPlanId)
  const currencyInfo = COUNTRY_CURRENCIES[country] || COUNTRY_CURRENCIES.IN

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        orderAmount: selectedPlan?.price || 0,
      })
      setCouponValidated(res.data.data.coupon)
      toast.success('Coupon applied!')
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code')
      setCouponValidated(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const calcFinalPrice = useCallback(() => {
    if (!selectedPlan) return 0
    let price = selectedPlan.price
    if (couponValidated) {
      if (couponValidated.discountType === 'percentage') {
        price -= (price * couponValidated.discountValue) / 100
      } else {
        price -= couponValidated.discountValue
      }
    }
    return Math.max(0, Math.round(price * 100) / 100)
  }, [selectedPlan, couponValidated])

  /**
   * Main subscribe flow:
   * 1. Create order on backend
   * 2. Open Razorpay checkout
   * 3. On payment success → verify on backend → activate plan
   */
  const handleSubscribe = async () => {
    if (!selectedPlanId) return toast.error('Please select a plan')
    setLoading(true)
    setPaymentStep('processing')
    setLastError('')

    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load payment gateway. Check your internet connection.')
      }

      // Step 2: Create order on backend
      const orderRes = await api.post('/payments/create-order', {
        planId: selectedPlanId,
        couponCode: couponValidated ? couponCode.trim().toUpperCase() : undefined,
        referralCode: referralCode || undefined,
      })

      const { orderId, amount, currency, paymentId, razorpayKeyId, plan } = orderRes.data.data

      // Step 3: Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const options = {
          key: razorpayKeyId,
          amount,           // in paise
          currency,
          name: 'NetVault',
          description: `${plan.name} Subscription`,
          order_id: orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          notes: {
            planId: selectedPlanId,
            tenantId: user?.tenantId || '',
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            backdropclose: false,
            escape: false,
            animation: true,
          },
          handler: async function (response) {
            // Step 4: Verify payment on backend
            try {
              setPaymentStep('processing')
              await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId,
              })
              setPaymentStep('success')
              toast.success(`🎉 Subscription activated! Welcome to ${plan.name}!`)
              // Refresh user/tenant data in context
              if (typeof refreshUser === 'function') refreshUser()
              setTimeout(() => onSuccess?.(), 1500)
              resolve()
            } catch (verifyErr) {
              const msg = verifyErr.response?.data?.message || 'Payment verification failed'
              setPaymentStep('failed')
              setLastError(msg)
              reject(new Error(msg))
            }
          },
          // Called when user closes checkout modal
          'modal.ondismiss': async function () {
            try {
              await api.post('/payments/failed', {
                razorpayOrderId: orderId,
                reason: 'User dismissed checkout',
              })
            } catch (_) {}
            setPaymentStep('select')
            setLoading(false)
            resolve() // resolve so the outer promise doesn't hang
          },
        }

        const rzp = new window.Razorpay(options)

        rzp.on('payment.failed', async function (response) {
          const desc = response.error?.description || 'Payment failed'
          try {
            await api.post('/payments/failed', {
              razorpayOrderId: orderId,
              reason: desc,
            })
          } catch (_) {}
          setPaymentStep('failed')
          setLastError(desc)
          toast.error(`Payment failed: ${desc}`)
          reject(new Error(desc))
        })

        rzp.open()
      })

    } catch (err) {
      if (paymentStep !== 'failed') {
        const msg = err.response?.data?.message || err.message || 'Something went wrong'
        setLastError(msg)
        setPaymentStep('failed')
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Success state
  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-8 text-center"
          style={{ background: theme.bg2, border: `1px solid ${theme.border}` }}>
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Check size={40} style={{ color: '#22c55e' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>Payment Successful!</h2>
          <p className="text-sm mb-6" style={{ color: theme.muted }}>
            Your subscription has been activated. Enjoy full access to NetVault!
          </p>
          <div className="w-8 h-1 rounded-full mx-auto animate-pulse" style={{ background: theme.accent }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: theme.bg2, border: `1px solid ${theme.border}` }}
      >
        {/* ── Header ── */}
        <div className="p-5 sm:p-6 border-b sticky top-0 z-10"
          style={{ borderColor: theme.border, background: theme.bg2 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
                <Crown size={20} style={{ color: '#fff' }} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.text }}>
                  {trialExpired ? 'Your Free Trial Has Expired' : 'Upgrade Your Plan'}
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: theme.muted }}>
                  {trialExpired
                    ? 'Subscribe to continue using NetVault'
                    : 'Choose a plan that fits your needs'}
                </p>
              </div>
            </div>
            {!trialExpired && onClose && (
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ color: theme.muted }}>
                <X size={18} />
              </button>
            )}
          </div>

          {trialExpired && (
            <div className="mt-4 p-3 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#EF4444' }}>
                Your 7-day free trial has ended. All features are temporarily restricted.
                Subscribe to a paid plan to restore full access.
              </p>
            </div>
          )}

          {/* Failed state inline notice */}
          {paymentStep === 'failed' && lastError && (
            <div className="mt-3 p-3 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
              <div className="flex-1">
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#EF4444' }}>Payment Failed</p>
                <p className="text-xs" style={{ color: '#EF4444' }}>{lastError}</p>
              </div>
              <button onClick={() => { setPaymentStep('select'); setLastError('') }}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* ── Country ── */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium flex-shrink-0" style={{ color: theme.muted }}>
              Your Country:
            </label>
            <select value={country} onChange={e => { setCountry(e.target.value); setCouponValidated(null) }}
              className="px-3 py-1.5 rounded-lg text-sm border outline-none"
              style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}>
              <option value="IN">🇮🇳 India (INR)</option>
              <option value="US">🇺🇸 United States (USD)</option>
              <option value="GB">🇬🇧 United Kingdom (GBP)</option>
              <option value="AU">🇦🇺 Australia (AUD)</option>
              <option value="CA">🇨🇦 Canada (CAD)</option>
              <option value="EU">🇪🇺 Europe (EUR)</option>
            </select>
          </div>

          {/* ── Plans grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {plans.map((plan, idx) => {
              const Icon = PLAN_ICONS[idx % 3] || Zap
              const isSelected = selectedPlanId === plan._id
              return (
                <button key={plan._id}
                  onClick={() => { setSelectedPlanId(plan._id); setCouponValidated(null) }}
                  className="relative p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${theme.accent}20, ${theme.accent2}20)`
                      : theme.surface,
                    border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                    boxShadow: isSelected ? `0 0 0 1px ${theme.accent}40` : 'none',
                  }}>
                  {plan.isPopular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                      Most Popular
                    </span>
                  )}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: isSelected ? `${theme.accent}30` : `${theme.accent}15` }}>
                    <Icon size={18} style={{ color: theme.accent }} />
                  </div>
                  <div className="font-semibold text-sm mb-1" style={{ color: theme.text }}>
                    {plan.displayName}
                  </div>
                  <div className="text-xl font-bold" style={{ color: isSelected ? theme.accent : theme.text }}>
                    {currencyInfo.symbol}{plan.price}
                    <span className="text-xs font-normal" style={{ color: theme.muted }}>
                      /{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {[
                      `${plan.maxDomains} Domains`,
                      `${plan.maxClients} Clients`,
                      `${plan.maxHosting} Hosting`,
                      `${plan.maxStaff} Staff`,
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: theme.muted }}>
                        <Check size={11} style={{ color: theme.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {/* ── Coupon & Referral ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: theme.muted }}>
                <Tag size={11} /> Coupon Code
              </label>
              <div className="flex gap-2">
                <input value={couponCode}
                  onChange={e => { setCouponCode(e.target.value); setCouponValidated(null); setCouponError('') }}
                  placeholder="SAVE20"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    background: theme.surface,
                    color: theme.text,
                    borderColor: couponError ? '#EF4444' : couponValidated ? '#22c55e' : theme.border,
                  }} />
                <button onClick={handleValidateCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                  style={{ background: `${theme.accent}20`, color: theme.accent, border: `1px solid ${theme.accent}40` }}>
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{couponError}</p>}
              {couponValidated && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#22c55e' }}>
                  ✓ {couponValidated.code} —{' '}
                  {couponValidated.discountType === 'percentage'
                    ? `${couponValidated.discountValue}% off`
                    : `${currencyInfo.symbol}${couponValidated.discountValue} off`}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: theme.muted }}>
                <Gift size={11} /> Referral Code (Optional)
              </label>
              <input value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                placeholder="REF-XXXXX"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: theme.surface, color: theme.text, borderColor: theme.border }} />
            </div>
          </div>

          {/* ── Price summary ── */}
          {selectedPlan && (
            <div className="p-4 rounded-xl" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex justify-between text-sm mb-2" style={{ color: theme.muted }}>
                <span>{selectedPlan.displayName} ({selectedPlan.billingCycle})</span>
                <span>{currencyInfo.symbol}{selectedPlan.price}</span>
              </div>
              {couponValidated && (
                <div className="flex justify-between text-sm mb-2" style={{ color: '#22c55e' }}>
                  <span>Discount ({couponValidated.code})</span>
                  <span>
                    -{couponValidated.discountType === 'percentage'
                      ? `${couponValidated.discountValue}%`
                      : `${currencyInfo.symbol}${couponValidated.discountValue}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t"
                style={{ borderColor: theme.border, color: theme.text }}>
                <span>Total Due</span>
                <span style={{ color: theme.accent }}>
                  {currencyInfo.symbol}{calcFinalPrice()}
                  <span className="text-xs font-normal ml-1" style={{ color: theme.muted }}>
                    /{selectedPlan.billingCycle === 'yearly' ? 'yr' : 'mo'}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ── Subscribe button ── */}
          <button
            onClick={handleSubscribe}
            disabled={loading || !selectedPlanId || paymentStep === 'processing'}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60 transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
            {paymentStep === 'processing' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing Payment…
              </>
            ) : (
              <>
                <CreditCard size={18} />
                {paymentStep === 'failed' ? 'Retry Payment' : `Pay ${currencyInfo.symbol}${calcFinalPrice()}`}
                {selectedPlan && (
                  <span className="opacity-80 text-sm font-normal">
                    — {selectedPlan.displayName}
                  </span>
                )}
              </>
            )}
          </button>

          {/* ── Security note ── */}
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: theme.muted }}>
            <Shield size={12} />
            <span>Payments secured by Razorpay · 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}
