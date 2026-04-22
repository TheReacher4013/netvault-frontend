import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, User, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { superAdminService } from '../../services/api'
import { Button, Card, Input, PageHeader } from '../../components/ui/index'
import toast from 'react-hot-toast'

function Section({ icon: Icon, title, children, theme }) {
    return (
        <Card className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-4"
                style={{ borderBottom: `1px solid ${theme.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${theme.accent}18` }}>
                    <Icon size={15} style={{ color: theme.accent }} />
                </div>
                <h3 className="font-semibold text-sm" style={{ color: theme.text }}>{title}</h3>
            </div>
            {children}
        </Card>
    )
}

function PlanCard({ plan, selected, onSelect, theme }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="p-3 rounded-xl text-left border-2"
            style={{
                background: selected ? `${theme.accent}18` : `${theme.accent}06`,
                borderColor: selected ? theme.accent : theme.border,
            }}
        >
            <p className="text-xs font-bold capitalize mb-0.5" style={{ color: theme.text }}>
                {plan.displayName || plan.name}
            </p>
            <p className="text-[10px] font-mono" style={{ color: theme.accent }}>
                {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
            </p>
        </button>
    )
}

export default function CreateTenant() {
    const { theme } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        orgName: '',
        adminName: '', adminEmail: '', adminPassword: '',
        planName: 'free',
    })

    const { data: plansData } = useQuery({
        queryKey: ['sa-plans'],
        queryFn: superAdminService.getPlans,
        refetchOnWindowFocus: false,
    })
    const plans = plansData?.data?.data?.plans || []

    const createMut = useMutation({
        mutationFn: data => superAdminService.createTenant(data),
        onSuccess: () => {
            toast.success(`Company "${form.orgName}" created successfully!`)
            navigate('/super-admin/tenants')
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to create company')
        },
    })

    const handle = useCallback((e) => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
    }, [])

    const setPlan = useCallback((planName) => {
        setForm(f => ({ ...f, planName }))
    }, [])

    const submit = () => {
        if (!form.orgName.trim()) return toast.error('Company name is required')
        if (!form.adminName.trim()) return toast.error('Admin name is required')
        if (!form.adminEmail.trim()) return toast.error('Admin email is required')
        if (form.adminPassword.length < 6) return toast.error('Password must be at least 6 characters')
        createMut.mutate(form)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <PageHeader
                title="Create Company"
                subtitle="Set up a new agency/company and their admin account"
                actions={
                    <Button variant="ghost" onClick={() => navigate('/super-admin/tenants')}>
                        Cancel
                    </Button>
                }
            />

            {/* Section 1: Company Info - Only Company Name */}
            <Section icon={Building2} title="Company Information" theme={theme}>
                <Input
                    label="Company / Agency Name *"
                    name="orgName"
                    value={form.orgName}
                    onChange={handle}
                    placeholder="e.g. Acme Digital Agency"
                />
            </Section>

            {/* Section 2: Admin Account */}
            <Section icon={User} title="Admin Account" theme={theme}>
                <p className="text-xs mb-4" style={{ color: theme.muted }}>
                    This person will be the primary admin for the company. They can add staff and manage all resources.
                </p>
                <div className="space-y-4">
                    <Input label="Admin Full Name *" name="adminName"
                        value={form.adminName} onChange={handle} placeholder="John Smith" />
                    <Input label="Admin Email *" name="adminEmail" type="email"
                        value={form.adminEmail} onChange={handle} placeholder="admin@acme.com" />
                    <Input label="Password *" name="adminPassword" type="password"
                        value={form.adminPassword} onChange={handle} placeholder="Min. 6 characters" />
                </div>
            </Section>

            {/* Section 3: Plan */}
            <Section icon={Shield} title="Subscription Plan" theme={theme}>
                <p className="text-xs mb-4" style={{ color: theme.muted }}>
                    Select the plan this company will start on. You can upgrade it later from the Tenants list.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {plans.length === 0
                        ? ['free', 'starter', 'pro', 'enterprise'].map(p => (
                            <PlanCard key={p}
                                plan={{ name: p, displayName: p, price: 0 }}
                                selected={form.planName === p}
                                onSelect={() => setPlan(p)}
                                theme={theme} />
                        ))
                        : plans.map(p => (
                            <PlanCard key={p._id} plan={p}
                                selected={form.planName === p.name}
                                onSelect={() => setPlan(p.name)}
                                theme={theme} />
                        ))
                    }
                </div>
            </Section>

            <div className="flex gap-3 pb-6">
                <Button loading={createMut.isPending} onClick={submit}>
                    <Building2 size={14} /> Create Company
                </Button>
                <Button variant="ghost" onClick={() => navigate('/super-admin/tenants')}>
                    Cancel
                </Button>
            </div>
        </div>
    )
}
