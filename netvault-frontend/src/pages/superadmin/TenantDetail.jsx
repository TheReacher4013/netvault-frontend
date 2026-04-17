// src/pages/superadmin/TenantDetail.jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Building2, Users, Globe, Server, FileText,
    ArrowLeft, ToggleRight, ToggleLeft, Trash2, Edit3,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { superAdminService } from '../../services/api'
import { Button, Card, CardHeader, StatusBadge, Loader } from '../../components/ui/index'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TABS = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'domains', label: 'Domains', icon: Globe },
    { key: 'clients', label: 'Clients', icon: Users },
    { key: 'hosting', label: 'Hosting', icon: Server },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'billing', label: 'Billing', icon: FileText },
]

export default function TenantDetail() {
    const { id } = useParams()
    const { theme } = useAuth()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const [tab, setTab] = useState('overview')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ['sa-tenant-detail', id],
        queryFn: () => superAdminService.getTenant(id),
    })

    const toggleMut = useMutation({
        mutationFn: () => superAdminService.toggleTenant(id),
        onSuccess: () => {
            toast.success('Company status updated')
            qc.invalidateQueries(['sa-tenant-detail', id])
        },
    })

    const deleteMut = useMutation({
        mutationFn: () => superAdminService.deleteTenant(id),
        onSuccess: () => {
            toast.success('Company permanently deleted')
            navigate('/super-admin/tenants')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
    })

    if (isLoading) return <Loader text="Loading company details..." />

    const d = data?.data?.data || {}
    const { tenant, users = [], domains = [], hosting = [], clients = [], counts = {}, invoiceSummary = {} } = d

    if (!tenant) return (
        <div className="text-center py-20" style={{ color: theme.muted }}>Company not found.</div>
    )

    const paidRevenue = invoiceSummary?.paid?.total || 0
    const pendingRevenue = invoiceSummary?.pending?.total || 0

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/super-admin/tenants')}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors mt-1"
                    style={{ color: theme.muted }}>
                    <ArrowLeft size={16} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
                            {tenant.orgName?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-xl" style={{ color: theme.text }}>
                                {tenant.orgName}
                            </h1>
                            <p className="text-xs font-mono" style={{ color: theme.muted }}>
                                {tenant.email || 'No email'} · Plan:{' '}
                                <span style={{ color: theme.accent }} className="capitalize">{tenant.planName}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-1 rounded"
                        style={{ color: tenant.isActive ? '#62B849' : '#C94040', background: tenant.isActive ? 'rgba(98,184,73,0.1)' : 'rgba(201,64,64,0.1)' }}>
                        {tenant.isActive ? '● ACTIVE' : '● SUSPENDED'}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => toggleMut.mutate()} loading={toggleMut.isPending}>
                        {tenant.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {tenant.isActive ? 'Suspend' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 size={12} /> Delete
                    </Button>
                </div>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Users', value: counts.users || 0 },
                    { label: 'Domains', value: counts.domains || 0 },
                    { label: 'Hosting', value: counts.hosting || 0 },
                    { label: 'Clients', value: counts.clients || 0 },
                    { label: 'Revenue', value: `₹${paidRevenue.toLocaleString('en-IN')}` },
                ].map(({ label, value }) => (
                    <Card key={label} className="p-4 text-center">
                        <div className="font-display font-bold text-xl mb-0.5" style={{ color: theme.accent }}>{value}</div>
                        <div className="text-[10px] font-mono" style={{ color: theme.muted }}>{label}</div>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: `1px solid ${theme.border}` }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all"
                        style={{
                            color: tab === t.key ? theme.accent : theme.muted,
                            borderBottom: tab === t.key ? `2px solid ${theme.accent}` : '2px solid transparent',
                        }}>
                        <t.icon size={12} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab panels */}
            {tab === 'overview' && (
                <div className="grid sm:grid-cols-2 gap-5">
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Company Info</h3>
                        <dl className="space-y-2.5">
                            {[
                                ['Admin', `${tenant.adminId?.name} (${tenant.adminId?.email})`],
                                ['Plan', tenant.planName],
                                ['Max Domains', tenant.maxDomains],
                                ['Max Clients', tenant.maxClients],
                                ['Max Staff', tenant.maxStaff],
                                ['Created', tenant.createdAt ? format(new Date(tenant.createdAt), 'dd MMM yyyy') : '—'],
                                ['Website', tenant.website || '—'],
                                ['Phone', tenant.phone || '—'],
                                ['Address', tenant.address || '—'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4">
                                    <dt className="text-xs" style={{ color: theme.muted }}>{k}</dt>
                                    <dd className="text-xs font-medium text-right truncate max-w-48" style={{ color: theme.text }}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </Card>
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Billing Summary</h3>
                        <dl className="space-y-2.5">
                            {Object.entries(invoiceSummary).map(([status, { count, total }]) => (
                                <div key={status} className="flex justify-between">
                                    <dt className="text-xs capitalize" style={{ color: theme.muted }}>{status} ({count})</dt>
                                    <dd className="text-xs font-mono font-semibold" style={{ color: theme.text }}>
                                        ₹{total.toLocaleString('en-IN')}
                                    </dd>
                                </div>
                            ))}
                            {Object.keys(invoiceSummary).length === 0 && (
                                <p className="text-xs" style={{ color: theme.muted }}>No invoices yet</p>
                            )}
                        </dl>
                    </Card>
                </div>
            )}

            {tab === 'domains' && (
                <Card>
                    <CardHeader title={`Domains (${domains.length})`} subtitle="All domains managed by this company" />
                    {domains.length === 0 ? (
                        <div className="py-10 text-center text-xs" style={{ color: theme.muted }}>No domains added yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Domain', 'Client', 'Status', 'Expiry', 'Registrar'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {domains.map(d => (
                                        <tr key={d._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: theme.text }}>{d.name}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{d.clientId?.name || '—'}</td>
                                            <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                {d.expiryDate ? format(new Date(d.expiryDate), 'dd MMM yyyy') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{d.registrar || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'clients' && (
                <Card>
                    <CardHeader title={`Clients (${clients.length})`} subtitle="All clients of this company" />
                    {clients.length === 0 ? (
                        <div className="py-10 text-center text-xs" style={{ color: theme.muted }}>No clients added yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Name', 'Email', 'Company', 'Phone', 'Added'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map(c => (
                                        <tr key={c._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: theme.text }}>{c.name}</td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>{c.email}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{c.company || '—'}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{c.phone || '—'}</td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yy') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'hosting' && (
                <Card>
                    <CardHeader title={`Hosting (${hosting.length})`} subtitle="All hosting accounts" />
                    {hosting.length === 0 ? (
                        <div className="py-10 text-center text-xs" style={{ color: theme.muted }}>No hosting accounts yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Label', 'Provider', 'Type', 'Status', 'Expiry'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {hosting.map(h => (
                                        <tr key={h._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: theme.text }}>{h.label}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: theme.muted }}>{h.provider || '—'}</td>
                                            <td className="px-4 py-3 text-xs capitalize" style={{ color: theme.muted }}>{h.planType}</td>
                                            <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                {h.expiryDate ? format(new Date(h.expiryDate), 'dd MMM yyyy') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'users' && (
                <Card>
                    <CardHeader title={`Users (${users.length})`} subtitle="All accounts in this company" />
                    {users.length === 0 ? (
                        <div className="py-10 text-center text-xs" style={{ color: theme.muted }}>No users yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Name', 'Email', 'Role', 'Status', 'Last Login'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{h}</th>
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
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-mono" style={{ color: u.isActive ? '#62B849' : '#C94040' }}>
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: theme.muted }}>
                                                {u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM yy HH:mm') : 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'billing' && (
                <Card>
                    <CardHeader title="Billing Summary" subtitle="Revenue breakdown for this company" />
                    <div className="p-5 grid sm:grid-cols-3 gap-4">
                        {Object.entries(invoiceSummary).length === 0 ? (
                            <p className="text-xs col-span-3 text-center py-8" style={{ color: theme.muted }}>No invoices yet.</p>
                        ) : Object.entries(invoiceSummary).map(([status, { count, total }]) => (
                            <div key={status} className="p-4 rounded-xl text-center"
                                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                                <div className="font-display font-bold text-xl mb-1" style={{ color: theme.accent }}>
                                    ₹{total.toLocaleString('en-IN')}
                                </div>
                                <div className="text-xs capitalize" style={{ color: theme.text }}>{status}</div>
                                <div className="text-[10px] font-mono mt-0.5" style={{ color: theme.muted }}>{count} invoice{count !== 1 ? 's' : ''}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="p-6 max-w-sm w-full space-y-4">
                        <div className="text-center">
                            <Trash2 size={28} className="mx-auto mb-3" style={{ color: '#C94040' }} />
                            <h3 className="font-bold text-base mb-2" style={{ color: theme.text }}>Delete "{tenant.orgName}"?</h3>
                            <p className="text-xs" style={{ color: theme.muted }}>
                                This will permanently delete the company and ALL their data — domains, clients,
                                hosting, invoices, and users. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
                                Yes, delete permanently
                            </Button>
                            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
