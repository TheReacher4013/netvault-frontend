import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '../../services/api'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
    Button, Card, CardHeader, StatusBadge, Loader, PageHeader, Modal,
} from '../../components/ui/index'
import {
    ArrowLeft, Building2, Users, Globe, Server, FileText, Shield, Check, Zap, Star,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TenantDetail() {
    const { id } = useParams()
    const { theme } = useAuth()
    const navigate = useNavigate()
    const qc = useQueryClient()

    const [showPlanModal, setShowPlanModal] = useState(false)
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [extendDays, setExtendDays] = useState('')
    const [activeTab, setActiveTab] = useState('overview')

    const { data, isLoading } = useQuery({
        queryKey: ['sa-tenant', id],
        queryFn: () => superAdminService.getTenant(id),
    })

    const { data: plansData } = useQuery({
        queryKey: ['sa-plans'],
        queryFn: () => api.get('/plans'),
    })

    // Fetch clients for this tenant
    const { data: clientsData } = useQuery({
        queryKey: ['sa-tenant-clients', id],
        queryFn: () => superAdminService.getAllClients({ tenantId: id, limit: 100 }),
        enabled: activeTab === 'clients',
    })

    // Fetch domains for this tenant
    const { data: domainsData } = useQuery({
        queryKey: ['sa-tenant-domains', id],
        queryFn: () => superAdminService.getAllDomains({ tenantId: id, limit: 100 }),
        enabled: activeTab === 'domains',
    })

    const changePlanMut = useMutation({
        mutationFn: (body) => superAdminService.updateTenantPlan(id, body),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Plan updated')
            qc.invalidateQueries(['sa-tenant', id])
            qc.invalidateQueries(['sa-tenants'])
            setShowPlanModal(false)
            setExtendDays('')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to change plan'),
    })

    if (isLoading) return <Loader text="Loading tenant details..." />

    const tenant = data?.data?.data?.tenant
    const users = data?.data?.data?.users || []
    const counts = data?.data?.data?.counts || {}
    const plans = plansData?.data?.data?.plans || []
    const clients = clientsData?.data?.data?.clients || clientsData?.data?.data?.docs || []
    const domains = domainsData?.data?.data?.domains || domainsData?.data?.data?.docs || []

    if (!tenant) return <div className="text-center py-20" style={{ color: theme.muted }}>Tenant not found</div>

    const currentPlan = plans.find(p => p.name === tenant.planName)

    const handleOpenPlanModal = () => {
        setSelectedPlanId(currentPlan?._id || '')
        setShowPlanModal(true)
    }

    const handleSubmitPlanChange = () => {
        if (!selectedPlanId) return toast.error('Select a plan')
        changePlanMut.mutate({
            planId: selectedPlanId,
            ...(extendDays && +extendDays > 0 ? { extendTrialDays: +extendDays } : {}),
        })
    }

    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'users', label: `Users (${users.length})` },
        { key: 'clients', label: `Clients (${counts.clients ?? '—'})` },
        { key: 'domains', label: `Domains (${counts.domains ?? '—'})` },
    ]

    return (
        <div className="space-y-5 max-w-5xl">
            <PageHeader
                title={tenant.orgName}
                subtitle={`${tenant.planName || 'No plan'} · ${users.length} users`}
                actions={
                    <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/tenants')}>
                        <ArrowLeft size={13} />Back
                    </Button>
                }
            />

            <div className="grid lg:grid-cols-3 gap-5">
                {/* Overview */}
                <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                            {tenant.orgName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: theme.text }}>{tenant.orgName}</p>
                            <p className="text-xs" style={{ color: theme.muted }}>
                                {tenant.isActive ? <span style={{ color: '#10B981' }}>● Active</span> : <span style={{ color: '#EF4444' }}>● Suspended</span>}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span style={{ color: theme.muted }}>Admin</span>
                            <span style={{ color: theme.text }}>{tenant.adminId?.name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: theme.muted }}>Admin Email</span>
                            <span className="font-mono" style={{ color: theme.text }}>{tenant.adminId?.email || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: theme.muted }}>Created</span>
                            <span className="font-mono" style={{ color: theme.text }}>
                                {tenant.createdAt ? format(new Date(tenant.createdAt), 'dd MMM yyyy') : '—'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Plan card */}
                <Card className="p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Shield size={15} style={{ color: theme.accent }} />
                            <p className="text-sm font-semibold" style={{ color: theme.text }}>Subscription</p>
                        </div>
                        <Button size="sm" onClick={handleOpenPlanModal}>Change plan</Button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Current plan</p>
                            <p className="font-display font-bold text-lg capitalize" style={{ color: theme.accent }}>
                                {currentPlan?.displayName || tenant.planName || 'Free'}
                            </p>
                            {currentPlan && (
                                <p className="text-xs" style={{ color: theme.muted }}>
                                    ₹{currentPlan.price} / {currentPlan.billingCycle === 'monthly' ? 'month' : 'year'}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>Subscription end</p>
                            <p className="font-mono text-sm" style={{ color: theme.text }}>
                                {tenant.subscriptionEnd
                                    ? format(new Date(tenant.subscriptionEnd), 'dd MMM yyyy')
                                    : 'Not set'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                        {[
                            { icon: Globe, label: 'Domains', used: counts.domains ?? '—', max: tenant.maxDomains },
                            { icon: Server, label: 'Hosting', used: counts.hosting ?? '—', max: tenant.maxHosting },
                            { icon: Users, label: 'Clients', used: counts.clients ?? '—', max: tenant.maxClients },
                            { icon: Users, label: 'Staff', used: users.filter(u => u.role === 'staff' || u.role === 'admin').length, max: tenant.maxStaff },
                        ].map(({ icon: Icon, label, used, max }) => (
                            <div key={label}>
                                <div className="flex items-center gap-1 mb-1">
                                    <Icon size={10} style={{ color: theme.accent }} />
                                    <span className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{label}</span>
                                </div>
                                <p className="text-sm font-mono" style={{ color: theme.text }}>
                                    {used} <span style={{ color: theme.muted }}>/ {max >= 99999 ? '∞' : max}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: activeTab === tab.key ? theme.surface : 'transparent',
                            color: activeTab === tab.key ? theme.accent : theme.muted,
                            border: activeTab === tab.key ? `1px solid ${theme.border}` : '1px solid transparent',
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Overview/Users */}
            {activeTab === 'overview' && (
                <Card>
                    <CardHeader title="Company Info" />
                    <div className="p-5 grid sm:grid-cols-2 gap-4 text-sm">
                        {[
                            ['Organization', tenant.orgName],
                            ['Website', tenant.website || '—'],
                            ['Phone', tenant.phone || '—'],
                            ['Address', tenant.address || '—'],
                            ['Admin', tenant.adminId?.name || '—'],
                            ['Admin Email', tenant.adminId?.email || '—'],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: theme.muted }}>{k}</p>
                                <p style={{ color: theme.text }}>{v}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {activeTab === 'users' && (
                <Card>
                    <CardHeader title={`Users (${users.length})`} />
                    {users.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: theme.muted }}>No users</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Name', 'Email', 'Role', 'Status', 'Last login'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase"
                                                style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: theme.text }}>{u.name}</td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                                                    style={{ background: `${theme.accent}12`, color: theme.accent }}>{u.role}</span>
                                            </td>
                                            <td className="px-4 py-3 text-[10px] font-mono"
                                                style={{ color: u.isActive ? '#10B981' : '#EF4444' }}>
                                                {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                {u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM yy HH:mm') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'clients' && (
                <Card>
                    <CardHeader title="Clients" />
                    {clients.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: theme.muted }}>No clients found for this company</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Name', 'Email', 'Phone', 'Company', 'Portal Access'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase"
                                                style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map(c => (
                                        <tr key={c._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: theme.text }}>{c.name}</td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{c.email || '—'}</td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{c.phone || '—'}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{c.company || '—'}</td>
                                            <td className="px-4 py-3 text-[10px] font-mono"
                                                style={{ color: c.portalAccess ? '#10B981' : theme.muted }}>
                                                {c.portalAccess ? 'YES' : 'NO'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {activeTab === 'domains' && (
                <Card>
                    <CardHeader title="Domains" />
                    {domains.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: theme.muted }}>No domains found for this company</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Domain', 'Registrar', 'Expiry', 'Status', 'Client'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase"
                                                style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {domains.map(d => (
                                        <tr key={d._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: theme.text }}>{d.name || d.domain}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{d.registrar || '—'}</td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                {d.expiryDate ? format(new Date(d.expiryDate), 'dd MMM yyyy') : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded capitalize"
                                                    style={{
                                                        background: d.status === 'active' ? '#10B98115' : '#EF444415',
                                                        color: d.status === 'active' ? '#10B981' : '#EF4444'
                                                    }}>{d.status || 'unknown'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>
                                                {d.clientId?.name || d.client?.name || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* Change plan modal */}
            <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)}
                title="Change Subscription Plan" size="lg">
                <div className="space-y-3">
                    <p className="text-xs" style={{ color: theme.muted }}>
                        Select the new plan for <strong style={{ color: theme.text }}>{tenant.orgName}</strong>.
                        Limits will be updated and they'll get an email confirming the change.
                    </p>

                    {plans.length === 0 ? (
                        <div className="text-center py-8 text-sm" style={{ color: theme.muted }}>Loading plans...</div>
                    ) : (
                        <div className="space-y-2 mt-3">
                            {plans.map(p => {
                                const isSelected = selectedPlanId === p._id
                                const isCurrent = currentPlan?._id === p._id
                                return (
                                    <button key={p._id} type="button"
                                        onClick={() => setSelectedPlanId(p._id)}
                                        className="w-full text-left p-3 rounded-xl transition-all"
                                        style={{
                                            background: isSelected ? `${theme.accent}15` : `${theme.accent}06`,
                                            border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? theme.accent : theme.border}`,
                                        }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {p.isPopular && <Star size={12} style={{ color: theme.accent }} />}
                                                <span className="font-semibold text-sm" style={{ color: theme.text }}>{p.displayName}</span>
                                                {isCurrent && (
                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                                        style={{ background: `${theme.accent}15`, color: theme.accent }}>
                                                        CURRENT
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-mono font-bold text-sm" style={{ color: isSelected ? theme.accent : theme.text }}>
                                                ₹{p.price}{p.price > 0 ? '/mo' : ''}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 mt-1.5 text-[10px] font-mono" style={{ color: theme.muted }}>
                                            <span>{p.maxDomains >= 99999 ? '∞' : p.maxDomains} domains</span>
                                            <span>{p.maxClients >= 99999 ? '∞' : p.maxClients} clients</span>
                                            <span>{p.maxStaff >= 99999 ? '∞' : p.maxStaff} staff</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <div className="pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
                            Extend subscription (optional)
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder="e.g. 30" value={extendDays}
                                onChange={e => setExtendDays(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                            <span className="text-xs font-mono" style={{ color: theme.muted }}>days</span>
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                            Leave blank to keep the current end date.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="ghost" onClick={() => setShowPlanModal(false)}>Cancel</Button>
                        <Button loading={changePlanMut.isPending} onClick={handleSubmitPlanChange}>
                            Apply change
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
