// src/pages/settings/CompanySettings.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Globe, Phone, MapPin, Mail, Shield, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Button, Card, CardHeader, Input, Loader, PageHeader } from '../../components/ui/index'
import toast from 'react-hot-toast'

// Fetch own tenant info
const fetchMyTenant = () => api.get('/tenant/me')
const updateMyTenant = (data) => api.put('/tenant/me', data)

export default function CompanySettings() {
    const { theme, user } = useAuth()
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['my-tenant'],
        queryFn: fetchMyTenant,
    })

    const tenant = data?.data?.data?.tenant
    const plan = tenant?.planId

    const [form, setForm] = useState({
        orgName: '', website: '', address: '', phone: '', email: '',
        settings: { emailAlerts: true, smsAlerts: false, currency: 'INR', alertDays: [30, 15, 7, 1] },
    })

    // Pre-fill form when data loads
    useEffect(() => {
        if (tenant) {
            setForm({
                orgName: tenant.orgName || '',
                website: tenant.website || '',
                address: tenant.address || '',
                phone: tenant.phone || '',
                email: tenant.email || '',
                settings: tenant.settings || form.settings,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant?._id])

    const saveMut = useMutation({
        mutationFn: updateMyTenant,
        onSuccess: () => {
            toast.success('Company settings saved')
            qc.invalidateQueries(['my-tenant'])
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
    })

    const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    const handleSettings = (key, val) => setForm(f => ({ ...f, settings: { ...f.settings, [key]: val } }))

    if (isLoading) return <Loader text="Loading company settings..." />

    // Usage percentages for plan limits
    const usagePct = (used, max) => max >= 99999 ? 0 : Math.min(100, Math.round((used / max) * 100))

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <PageHeader title="Company Settings" subtitle="Manage your agency profile and subscription" />

            {/* Plan overview */}
            <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${theme.accent}18` }}>
                        <Shield size={16} style={{ color: theme.accent }} />
                    </div>
                    <div>
                        <p className="text-sm font-bold capitalize" style={{ color: theme.text }}>
                            {tenant?.planName || 'Free'} Plan
                        </p>
                        <p className="text-xs" style={{ color: theme.muted }}>
                            {plan?.displayName || 'Free'} — {plan?.price === 0 ? 'Free' : `₹${plan?.price}/mo`}
                        </p>
                    </div>
                    {tenant?.subscriptionEnd && (
                        <div className="ml-auto text-right">
                            <p className="text-[10px] font-mono" style={{ color: theme.muted }}>Renews</p>
                            <p className="text-xs font-mono" style={{ color: theme.accent }}>
                                {new Date(tenant.subscriptionEnd).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Usage bars */}
                <div className="space-y-3">
                    {[
                        { label: 'Domains', max: tenant?.maxDomains, key: 'domains' },
                        { label: 'Clients', max: tenant?.maxClients, key: 'clients' },
                        { label: 'Hosting', max: tenant?.maxHosting, key: 'hosting' },
                        { label: 'Staff', max: tenant?.maxStaff, key: 'staff' },
                    ].map(({ label, max }) => {
                        const isUnlimited = max >= 99999
                        return (
                            <div key={label}>
                                <div className="flex justify-between text-[11px] mb-1">
                                    <span style={{ color: theme.muted }}>{label}</span>
                                    <span className="font-mono" style={{ color: theme.text }}>
                                        {isUnlimited ? 'Unlimited' : `— / ${max}`}
                                    </span>
                                </div>
                                {!isUnlimited && (
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${theme.accent}15` }}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: '0%', background: theme.accent }}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <p className="text-[10px] mt-4" style={{ color: theme.muted }}>
                    Contact support or your platform admin to upgrade your plan.
                </p>
            </Card>

            {/* Company info — only admin can edit */}
            {user?.role === 'admin' ? (
                <Card className="p-6">
                    <CardHeader title="Company Profile" subtitle="Update your agency information" />
                    <div className="space-y-4 mt-4">
                        <Input label="Company / Agency Name *" name="orgName" value={form.orgName} onChange={handle}
                            placeholder="Acme Digital Agency" />
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input label="Company Email" name="email" type="email" value={form.email} onChange={handle}
                                placeholder="hello@acme.com" />
                            <Input label="Phone" name="phone" value={form.phone} onChange={handle}
                                placeholder="+91 9876543210" />
                        </div>
                        <Input label="Website" name="website" value={form.website} onChange={handle}
                            placeholder="https://acme.com" />
                        <Input label="Address" name="address" value={form.address} onChange={handle}
                            placeholder="Mumbai, Maharashtra, India" />
                    </div>

                    {/* Alert preferences */}
                    <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${theme.border}` }}>
                        <p className="text-xs font-semibold mb-4" style={{ color: theme.muted }}>Alert Preferences</p>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.settings.emailAlerts}
                                    onChange={e => handleSettings('emailAlerts', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm" style={{ color: theme.text }}>Email alerts for expiry reminders</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.settings.smsAlerts}
                                    onChange={e => handleSettings('smsAlerts', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm" style={{ color: theme.text }}>SMS alerts (requires Twilio setup)</span>
                            </label>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>
                                Alert Days (days before expiry to send alerts)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {[1, 3, 7, 15, 30, 60].map(d => {
                                    const active = form.settings.alertDays?.includes(d)
                                    return (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => {
                                                const curr = form.settings.alertDays || []
                                                handleSettings('alertDays',
                                                    active ? curr.filter(x => x !== d) : [...curr, d].sort((a, b) => b - a)
                                                )
                                            }}
                                            className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-all"
                                            style={{
                                                background: active ? `${theme.accent}20` : 'transparent',
                                                borderColor: active ? theme.accent : theme.border,
                                                color: active ? theme.accent : theme.muted,
                                            }}
                                        >
                                            {d}d
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button loading={saveMut.isPending} onClick={() => saveMut.mutate(form)}>
                            Save Changes
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="p-5">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={16} style={{ color: '#F0A045' }} />
                        <p className="text-sm" style={{ color: theme.muted }}>
                            Only the account admin can edit company settings.
                        </p>
                    </div>
                    <div className="mt-4 space-y-2 text-xs">
                        {[
                            ['Company', tenant?.orgName],
                            ['Website', tenant?.website],
                            ['Phone', tenant?.phone],
                            ['Address', tenant?.address],
                        ].map(([k, v]) => v ? (
                            <div key={k} className="flex justify-between">
                                <span style={{ color: theme.muted }}>{k}</span>
                                <span style={{ color: theme.text }}>{v}</span>
                            </div>
                        ) : null)}
                    </div>
                </Card>
            )}
        </div>
    )
}
