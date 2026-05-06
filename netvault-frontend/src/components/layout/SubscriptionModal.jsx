import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { X, Check, Zap, Building2, Rocket, Tag, Gift, Crown, AlertTriangle } from 'lucide-react'
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

export default function SubscriptionModal({ onClose, onSuccess }) {
    const { theme, user } = useAuth()
    const [plans, setPlans] = useState([])
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [couponCode, setCouponCode] = useState('')
    const [referralCode, setReferralCode] = useState('')
    const [couponValidated, setCouponValidated] = useState(null)
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponError, setCouponError] = useState('')
    const [loading, setLoading] = useState(false)
    const [country, setCountry] = useState('IN')

    useEffect(() => {
        api.get(`/plans?country=${country}`)
            .then(res => {
                const list = res.data?.data?.plans || []
                setPlans(list)
                const popular = list.find(p => p.isPopular)
                setSelectedPlanId(popular?._id || list[0]?._id || '')
            })
            .catch(() => setPlans([]))
    }, [country])

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

    const calcFinalPrice = () => {
        if (!selectedPlan) return 0
        let price = selectedPlan.price
        if (couponValidated) {
            if (couponValidated.discountType === 'percentage') {
                price -= (price * couponValidated.discountValue / 100)
            } else {
                price -= couponValidated.discountValue
            }
        }
        return Math.max(0, price)
    }

    const handleSubscribe = async () => {
        if (!selectedPlanId) return toast.error('Please select a plan')
        setLoading(true)
        try {
            await api.post('/tenant/subscribe', {
                planId: selectedPlanId,
                couponCode: couponValidated ? couponCode : undefined,
                referralCode: referralCode || undefined,
            })
            toast.success('Subscription activated! Welcome aboard.')
            onSuccess?.()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Subscription failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ background: theme.bg2, border: `1px solid ${theme.border}` }}>

                {/* Header */}
                <div className="p-6 border-b" style={{ borderColor: theme.border }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
                                <Crown size={20} style={{ color: '#fff' }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: theme.text }}>
                                    Your Free Trial Has Expired
                                </h2>
                                <p className="text-sm" style={{ color: theme.muted }}>
                                    Subscribe to a plan to continue using NetVault
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ color: theme.muted }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Trial expired notice */}
                    <div className="mt-4 p-3 rounded-xl flex items-start gap-3"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                        <p className="text-sm" style={{ color: '#EF4444' }}>
                            Your 7-day free trial has ended. All features are temporarily restricted. Subscribe to restore full access.
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Country selector for relevant plans */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium" style={{ color: theme.muted }}>Your Country:</label>
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

                    {/* Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan, idx) => {
                            const Icon = PLAN_ICONS[idx % 3] || Zap
                            const isSelected = selectedPlanId === plan._id
                            return (
                                <button key={plan._id}
                                    onClick={() => { setSelectedPlanId(plan._id); setCouponValidated(null) }}
                                    className="relative p-4 rounded-xl text-left transition-all"
                                    style={{
                                        background: isSelected
                                            ? `linear-gradient(135deg, ${theme.accent}22, ${theme.accent2}22)`
                                            : theme.surface,
                                        border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                                        boxShadow: isSelected ? `0 0 0 1px ${theme.accent}44` : 'none',
                                    }}>
                                    {plan.isPopular && (
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
                                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                                            Popular
                                        </span>
                                    )}
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                                        style={{ background: isSelected ? `${theme.accent}33` : `${theme.accent}18` }}>
                                        <Icon size={18} style={{ color: theme.accent }} />
                                    </div>
                                    <div className="font-semibold text-sm mb-1" style={{ color: theme.text }}>{plan.displayName}</div>
                                    <div className="text-xl font-bold" style={{ color: isSelected ? theme.accent : theme.text }}>
                                        {currencyInfo.symbol}{plan.price}
                                        <span className="text-xs font-normal" style={{ color: theme.muted }}>/{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                    </div>
                                    <ul className="mt-3 space-y-1.5">
                                        {[
                                            `${plan.maxDomains} Domains`,
                                            `${plan.maxClients} Clients`,
                                            `${plan.maxHosting} Hosting`,
                                            `${plan.maxStaff} Staff`,
                                        ].map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs" style={{ color: theme.muted }}>
                                                <Check size={12} style={{ color: theme.accent }} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            )
                        })}
                    </div>

                    {/* Coupon & Referral */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium mb-1.5 block flex items-center gap-1.5" style={{ color: theme.muted }}>
                                <Tag size={12} /> Coupon Code
                            </label>
                            <div className="flex gap-2">
                                <input value={couponCode} onChange={e => { setCouponCode(e.target.value); setCouponValidated(null); setCouponError('') }}
                                    placeholder="SAVE20"
                                    className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                                    style={{ background: theme.surface, color: theme.text, borderColor: couponError ? '#EF4444' : couponValidated ? '#22c55e' : theme.border }} />
                                <button onClick={handleValidateCoupon} disabled={couponLoading || !couponCode.trim()}
                                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                    style={{ background: `${theme.accent}22`, color: theme.accent, border: `1px solid ${theme.accent}44` }}>
                                    {couponLoading ? '...' : 'Apply'}
                                </button>
                            </div>
                            {couponError && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{couponError}</p>}
                            {couponValidated && (
                                <p className="text-xs mt-1" style={{ color: '#22c55e' }}>
                                    ✓ {couponValidated.code} — {couponValidated.discountType === 'percentage'
                                        ? `${couponValidated.discountValue}% off`
                                        : `${currencyInfo.symbol}${couponValidated.discountValue} off`}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-medium mb-1.5 block flex items-center gap-1.5" style={{ color: theme.muted }}>
                                <Gift size={12} /> Referral Code (Optional)
                            </label>
                            <input value={referralCode} onChange={e => setReferralCode(e.target.value)}
                                placeholder="REF-XXXXX"
                                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                                style={{ background: theme.surface, color: theme.text, borderColor: theme.border }} />
                        </div>
                    </div>

                    {/* Price summary */}
                    {selectedPlan && (
                        <div className="p-4 rounded-xl" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                            <div className="flex justify-between text-sm mb-2" style={{ color: theme.muted }}>
                                <span>{selectedPlan.displayName}</span>
                                <span>{currencyInfo.symbol}{selectedPlan.price}</span>
                            </div>
                            {couponValidated && (
                                <div className="flex justify-between text-sm mb-2" style={{ color: '#22c55e' }}>
                                    <span>Discount ({couponValidated.code})</span>
                                    <span>-{couponValidated.discountType === 'percentage'
                                        ? `${couponValidated.discountValue}%`
                                        : `${currencyInfo.symbol}${couponValidated.discountValue}`}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: theme.border, color: theme.text }}>
                                <span>Total</span>
                                <span style={{ color: theme.accent }}>{currencyInfo.symbol}{calcFinalPrice()}/{selectedPlan.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                            </div>
                        </div>
                    )}

                    {/* Subscribe button */}
                    <button onClick={handleSubscribe} disabled={loading || !selectedPlanId}
                        className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60 transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
                        {loading ? 'Processing...' : `Subscribe Now — ${currencyInfo.symbol}${calcFinalPrice()}/${selectedPlan?.billingCycle === 'yearly' ? 'yr' : 'mo'}`}
                    </button>
                </div>
            </div>
        </div>
    )
}
