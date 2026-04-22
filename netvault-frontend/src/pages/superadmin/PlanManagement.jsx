import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, PageHeader, Modal, Input } from '../../components/ui/index'
import { Shield, Plus, Edit3, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Plan Create / Edit Modal ──────────────────────────────────────────────
function PlanModal({ open, onClose, onSubmit, loading, title, form, setForm, theme }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Plan Key" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="pro" />
          <Input label="Display Name" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Pro" />
        </div>
        <Input label="Price (₹/Month)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Max Domains" type="number" value={form.maxDomains} onChange={e => setForm(f => ({ ...f, maxDomains: +e.target.value }))} />
          <Input label="Max Clients" type="number" value={form.maxClients} onChange={e => setForm(f => ({ ...f, maxClients: +e.target.value }))} />
          <Input label="Max Staff" type="number" value={form.maxStaff} onChange={e => setForm(f => ({ ...f, maxStaff: +e.target.value }))} />
          <Input label="Max Hosting" type="number" value={form.maxHosting} onChange={e => setForm(f => ({ ...f, maxHosting: +e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
            Features (comma separated)
          </label>
          <textarea
            value={form.features}
            onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
            rows={3}
            placeholder="Feature 1, Feature 2, Feature 3"
            className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button loading={loading} onClick={onSubmit}>Save Plan</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────
function DeletePlanModal({ plan, onConfirm, onCancel, loading, theme }) {
  if (!plan) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: '#C9404015' }}>
          <Trash2 size={20} style={{ color: '#C94040' }} />
        </div>
        <h3 className="font-display font-bold text-base mb-1" style={{ color: theme.text }}>
          Delete Plan
        </h3>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: theme.muted }}>
          Are you sure you want to delete the{' '}
          <span className="font-semibold" style={{ color: theme.text }}>{plan.name}</span> plan?
          This action cannot be undone. Plans assigned to active companies cannot be deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 cursor-pointer"
            style={{ background: '#C94040', color: '#fff' }}>
            {loading ? 'Deleting...' : 'Yes, Delete Plan'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
            style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.border}` }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function PlanManagement() {
  const { theme } = useAuth()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [form, setForm] = useState({
    name: '', displayName: '', price: 0,
    maxDomains: 20, maxClients: 10, maxStaff: 3, maxHosting: 10, features: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-plans'],
    queryFn: superAdminService.getPlans,
  })

  const createMut = useMutation({
    mutationFn: d => superAdminService.createPlan({ ...d, features: d.features.split(',').map(f => f.trim()).filter(Boolean) }),
    onSuccess: () => {
      toast.success('Plan created successfully.')
      qc.invalidateQueries(['sa-plans'])
      setShowAdd(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create plan.'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => superAdminService.updatePlan(id, { ...d, features: d.features.split(',').map(f => f.trim()).filter(Boolean) }),
    onSuccess: () => {
      toast.success('Plan updated successfully.')
      qc.invalidateQueries(['sa-plans'])
      setEditPlan(null)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update plan.'),
  })

  const deleteMut = useMutation({
    mutationFn: id => superAdminService.deletePlan(id),
    onSuccess: () => {
      toast.success('Plan deleted successfully.')
      setDeleteConfirm(null)
      qc.invalidateQueries(['sa-plans'])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete plan.')
    },
  })

  const BLANK_FORM = { name: '', displayName: '', price: 0, maxDomains: 20, maxClients: 10, maxStaff: 3, maxHosting: 10, features: '' }

  const plans = data?.data?.data?.plans || []
  if (isLoading) return <Loader text="Loading plans..." />

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Plan Management"
        subtitle="SaaS subscription tiers"
        actions={
          <Button onClick={() => { setForm(BLANK_FORM); setShowAdd(true) }}>
            <Plus size={14} /> Create Plan
          </Button>
        }
      />

      {plans.length === 0 ? (
        <Card className="p-10 text-center">
          <Shield size={32} className="mx-auto mb-3 opacity-30" style={{ color: theme.muted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>No plans found.</p>
          <p className="text-xs mb-4" style={{ color: theme.muted }}>Create your first subscription plan to get started.</p>
          <Button onClick={() => { setForm(BLANK_FORM); setShowAdd(true) }}>
            <Plus size={14} /> Create Plan
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <Card key={plan._id} className="p-5 relative flex flex-col">
              {plan.isPopular && (
                <div className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold"
                  style={{ background: theme.accent, color: theme.bg }}>POPULAR</div>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${theme.accent}15` }}>
                <Shield size={16} style={{ color: theme.accent }} />
              </div>
              <p className="font-display font-bold text-base mb-0.5" style={{ color: theme.text }}>
                {plan.displayName}
              </p>
              <p className="font-mono font-bold text-2xl mb-3" style={{ color: theme.accent }}>
                {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                {plan.price > 0 && (
                  <span className="text-xs font-normal" style={{ color: theme.muted }}>/Month</span>
                )}
              </p>
              <div className="space-y-1 text-xs mb-4 flex-1" style={{ color: theme.muted }}>
                <div className="flex justify-between">
                  <span>Domains</span>
                  <span className="font-mono" style={{ color: theme.text }}>
                    {plan.maxDomains >= 99999 ? 'Unlimited' : plan.maxDomains}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Clients</span>
                  <span className="font-mono" style={{ color: theme.text }}>
                    {plan.maxClients >= 99999 ? 'Unlimited' : plan.maxClients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Staff</span>
                  <span className="font-mono" style={{ color: theme.text }}>
                    {plan.maxStaff >= 99999 ? 'Unlimited' : plan.maxStaff}
                  </span>
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={() => {
                  setEditPlan(plan._id)
                  setForm({ ...plan, features: plan.features?.join(', ') || '' })
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer mb-2"
                style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.border}` }}
                title="Edit plan"
              >
                <Edit3 size={12} /> Edit Plan
              </button>

              {/* Delete button */}
              <button
                onClick={() => setDeleteConfirm({ id: plan._id, name: plan.displayName })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
                style={{ background: '#C9404010', color: '#C94040', border: '1px solid #C9404030' }}
                title="Delete plan"
              >
                <Trash2 size={12} /> Delete Plan
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <PlanModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Create Plan"
        loading={createMut.isPending}
        form={form}
        setForm={setForm}
        theme={theme}
        onSubmit={() => {
          if (!form.name || !form.displayName) return toast.error('Plan key and display name are required.')
          createMut.mutate(form)
        }}
      />

      {/* Edit Modal */}
      <PlanModal
        open={!!editPlan}
        onClose={() => setEditPlan(null)}
        title="Edit Plan"
        loading={updateMut.isPending}
        form={form}
        setForm={setForm}
        theme={theme}
        onSubmit={() => updateMut.mutate({ id: editPlan, d: form })}
      />

      {/* Delete Confirmation Modal */}
      <DeletePlanModal
        plan={deleteConfirm}
        onConfirm={() => deleteMut.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMut.isPending}
        theme={theme}
      />
    </div>
  )
}
