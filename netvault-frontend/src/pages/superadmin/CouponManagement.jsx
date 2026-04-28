import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Tag, X, Check } from 'lucide-react'

const couponService = {
    getAll: () => api.get('/coupons').then(r => r.data?.data?.coupons || []),
    create: (data) => api.post('/coupons', data),
    update: (id, data) => api.put(`/coupons/${id}`, data),
    delete: (id) => api.delete(`/coupons/${id}`),
    toggle: (id) => api.patch(`/coupons/${id}/toggle`),
}

const EMPTY_FORM = {
    code: '', description: '', discountType: 'percentage',
    discountValue: '', maxUses: '', minOrderAmount: '',
    expiresAt: '', isActive: true,
}

function Badge({ children, color = 'blue' }) {
    const colors = {
        green: { bg: '#16a34a20', color: '#16a34a', border: '#16a34a40' },
        red: { bg: '#dc262620', color: '#dc2626', border: '#dc262640' },
        blue: { bg: '#2563eb20', color: '#2563eb', border: '#2563eb40' },
        orange: { bg: '#ea580c20', color: '#ea580c', border: '#ea580c40' },
    }
    const c = colors[color] || colors.blue
    return (
        <span style={{
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
        }}>{children}</span>
    )
}

function Modal({ open, onClose, title, children }) {
    const { theme } = useAuth()
    if (!open) return null
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={onClose}>
            <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 24, width: '100%', maxWidth: 520,
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ color: theme.text, fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

export default function CouponManagement() {
    const { theme } = useAuth()
    const qc = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: couponService.getAll,
    })

    const createMutation = useMutation({
        mutationFn: couponService.create,
        onSuccess: () => { qc.invalidateQueries(['coupons']); toast.success('Coupon created!'); closeModal() },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to create coupon'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => couponService.update(id, data),
        onSuccess: () => { qc.invalidateQueries(['coupons']); toast.success('Coupon updated!'); closeModal() },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to update coupon'),
    })

    const deleteMutation = useMutation({
        mutationFn: couponService.delete,
        onSuccess: () => { qc.invalidateQueries(['coupons']); toast.success('Coupon deleted!'); setDeleteConfirm(null) },
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete coupon'),
    })

    const toggleMutation = useMutation({
        mutationFn: couponService.toggle,
        onSuccess: () => qc.invalidateQueries(['coupons']),
        onError: (e) => toast.error(e.response?.data?.message || 'Failed to toggle coupon'),
    })

    const openCreate = () => { setEditingCoupon(null); setForm(EMPTY_FORM); setShowModal(true) }
    const openEdit = (coupon) => {
        setEditingCoupon(coupon)
        setForm({
            code: coupon.code,
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxUses: coupon.maxUses || '',
            minOrderAmount: coupon.minOrderAmount || '',
            expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
            isActive: coupon.isActive,
        })
        setShowModal(true)
    }
    const closeModal = () => { setShowModal(false); setEditingCoupon(null); setForm(EMPTY_FORM) }

    const handleSubmit = () => {
        if (!form.code || !form.discountType || !form.discountValue) {
            toast.error('Code, type, and value are required'); return
        }
        const payload = {
            ...form,
            discountValue: Number(form.discountValue),
            maxUses: form.maxUses ? Number(form.maxUses) : null,
            minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
            expiresAt: form.expiresAt || null,
        }
        if (editingCoupon) {
            updateMutation.mutate({ id: editingCoupon._id, data: payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const s = { background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' }

    return (
        <div style={{ padding: '0 0 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ color: theme.text, fontWeight: 700, fontSize: 22, margin: 0 }}>Coupon Management</h1>
                    <p style={{ color: theme.muted, fontSize: 13, margin: '4px 0 0' }}>Create and manage discount coupons for plans</p>
                </div>
                <button onClick={openCreate} style={{
                    background: theme.accent, color: '#fff', border: 'none',
                    borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Plus size={15} /> New Coupon
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Total Coupons', value: coupons.length, color: theme.accent },
                    { label: 'Active', value: coupons.filter(c => c.isActive).length, color: '#16a34a' },
                    { label: 'Inactive', value: coupons.filter(c => !c.isActive).length, color: '#dc2626' },
                    { label: 'Total Uses', value: coupons.reduce((s, c) => s + (c.usedCount || 0), 0), color: '#ea580c' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: theme.surface, border: `1px solid ${theme.border}`,
                        borderRadius: 12, padding: '16px 18px',
                    }}>
                        <div style={{ color: stat.color, fontWeight: 700, fontSize: 24 }}>{stat.value}</div>
                        <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: theme.muted }}>Loading coupons...</div>
                ) : coupons.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: theme.muted }}>
                        <Tag size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <div style={{ fontSize: 15, fontWeight: 600 }}>No coupons yet</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Create your first coupon to get started</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                {['Code', 'Discount', 'Uses', 'Min Order', 'Expires', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((c, i) => (
                                <tr key={c._id} style={{ borderBottom: i < coupons.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                background: `${theme.accent}15`, color: theme.accent,
                                                border: `1px solid ${theme.accent}30`,
                                                borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                                            }}>{c.code}</span>
                                        </div>
                                        {c.description && <div style={{ color: theme.muted, fontSize: 11, marginTop: 3 }}>{c.description}</div>}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: theme.text, fontWeight: 600, fontSize: 13 }}>
                                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                        <div style={{ color: theme.muted, fontSize: 11 }}>{c.discountType}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ color: theme.text, fontSize: 13 }}>
                                            {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                                        </span>
                                        {c.maxUses && (
                                            <div style={{ marginTop: 4, height: 3, background: theme.border, borderRadius: 2, width: 60 }}>
                                                <div style={{ height: '100%', background: theme.accent, borderRadius: 2, width: `${Math.min(100, (c.usedCount / c.maxUses) * 100)}%` }} />
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: theme.text, fontSize: 13 }}>
                                        {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : <span style={{ color: theme.muted }}>—</span>}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: theme.text, fontSize: 13 }}>
                                        {c.expiresAt
                                            ? <span style={{ color: new Date(c.expiresAt) < new Date() ? '#dc2626' : theme.text }}>{new Date(c.expiresAt).toLocaleDateString()}</span>
                                            : <span style={{ color: theme.muted }}>Never</span>}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <Badge color={c.isActive ? 'green' : 'red'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => toggleMutation.mutate(c._id)}
                                                title={c.isActive ? 'Deactivate' : 'Activate'}
                                                style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: theme.muted }}>
                                                {c.isActive ? <ToggleRight size={15} style={{ color: '#16a34a' }} /> : <ToggleLeft size={15} />}
                                            </button>
                                            <button onClick={() => openEdit(c)} title="Edit"
                                                style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: theme.muted }}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(c)} title="Delete"
                                                style={{ background: 'none', border: '1px solid #dc262640', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#dc2626' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal open={showModal} onClose={closeModal} title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code *</label>
                            <input style={{ ...s, marginTop: 4, textTransform: 'uppercase' }} placeholder="e.g. SAVE20"
                                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                disabled={!!editingCoupon} />
                        </div>
                        <div>
                            <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discount Type *</label>
                            <select style={{ ...s, marginTop: 4 }} value={form.discountType}
                                onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                            </label>
                            <input type="number" min={0} style={{ ...s, marginTop: 4 }} placeholder={form.discountType === 'percentage' ? '10' : '500'}
                                value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Uses (blank = unlimited)</label>
                            <input type="number" min={1} style={{ ...s, marginTop: 4 }} placeholder="100"
                                value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Order Amount (₹)</label>
                            <input type="number" min={0} style={{ ...s, marginTop: 4 }} placeholder="0"
                                value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
                        </div>
                        <div>
                            <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires At</label>
                            <input type="date" style={{ ...s, marginTop: 4 }}
                                value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label style={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                        <input style={{ ...s, marginTop: 4 }} placeholder="Optional description"
                            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                        <button onClick={closeModal} style={{
                            background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8,
                            padding: '8px 18px', fontSize: 13, color: theme.muted, cursor: 'pointer',
                        }}>Cancel</button>
                        <button onClick={handleSubmit}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            style={{
                                background: theme.accent, color: '#fff', border: 'none',
                                borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            <Check size={14} /> {editingCoupon ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Coupon">
                <p style={{ color: theme.muted, fontSize: 14, marginBottom: 20 }}>
                    Are you sure you want to delete coupon <strong style={{ color: theme.text }}>{deleteConfirm?.code}</strong>? This cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{
                        background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8,
                        padding: '8px 18px', fontSize: 13, color: theme.muted, cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={() => deleteMutation.mutate(deleteConfirm._id)}
                        disabled={deleteMutation.isPending}
                        style={{
                            background: '#dc2626', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>Delete</button>
                </div>
            </Modal>
        </div>
    )
}