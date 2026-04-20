import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input, Select } from '../../components/ui/index'
import { Globe, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddDomain() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    registrar: '',
    expiryDate: '',
    clientId: '',
    autoRenewal: false,
    renewalCost: '',
    sellingPrice: '',
    parentDomainId: '', 
    notes: '',
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientService.getAll({ limit: 100 }),
  })
  const { data: parentsData } = useQuery({
    queryKey: ['domains-parents'],
    queryFn: () => domainService.getAll({ limit: 100 }),
  })

  const parents = useMemo(() => {
    const all = parentsData?.data?.data?.docs || []
    return all.filter(d => !d.isSubdomain)
  }, [parentsData])

  const selectedParent = parents.find(p => p._id === form.parentDomainId)

  const mut = useMutation({
    mutationFn: d => domainService.create(d),
    onSuccess: () => {
      toast.success('Domain added')
      qc.invalidateQueries(['domains'])
      qc.invalidateQueries(['domains-parents'])
      navigate('/domains')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add domain'),
  })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleParentChange = (e) => {
    const pid = e.target.value
    setForm(f => ({
      ...f,
      parentDomainId: pid,
      name: pid && !f.name ? `.${parents.find(p => p._id === pid)?.name || ''}` : f.name,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Domain name is required')
    if (!form.expiryDate) return toast.error('Expiry date is required')
    if (form.parentDomainId && selectedParent) {
      const parentName = selectedParent.name
      if (!form.name.toLowerCase().endsWith(`.${parentName}`) && form.name.toLowerCase() !== parentName) {
        const proceed = window.confirm(
          `Warning: "${form.name}" doesn't look like a subdomain of "${parentName}".\n\n` +
          `Typical subdomains look like: blog.${parentName}, shop.${parentName}\n\n` +
          `Continue anyway?`
        )
        if (!proceed) return
      }
    }

    mut.mutate({
      ...form,
      renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined,
      sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
      clientId: form.clientId || null,
      parentDomainId: form.parentDomainId || null,
    })
  }

  const clients = clientsData?.data?.data?.docs || []

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader
        title="Add Domain"
        subtitle="Register a new domain or subdomain"
        actions={<Button variant="ghost" onClick={() => navigate('/domains')}>Cancel</Button>}
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Parent domain picker */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>
              <Layers size={11} className="inline mr-1" />
              Add as subdomain of <span className="font-normal opacity-70">(optional)</span>
            </label>
            <select name="parentDomainId" value={form.parentDomainId} onChange={handleParentChange}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">— Main domain (no parent)</option>
              {parents.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {selectedParent && (
              <p className="text-[10px] mt-1 font-mono" style={{ color: theme.muted }}>
                <Globe size={9} className="inline mr-1" />
                This will be created as a subdomain of <strong style={{ color: theme.accent }}>{selectedParent.name}</strong>
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={form.parentDomainId ? 'Subdomain Name *' : 'Domain Name *'}
              name="name" value={form.name} onChange={handle}
              placeholder={form.parentDomainId && selectedParent
                ? `e.g. blog.${selectedParent.name}`
                : 'example.com'} />
            <Input label="Registrar" name="registrar" value={form.registrar} onChange={handle}
              placeholder="GoDaddy, Namecheap..." />
            <Input label="Expiry Date *" name="expiryDate" type="date" value={form.expiryDate} onChange={handle} />
            <Select label="Assign to Client" name="clientId" value={form.clientId} onChange={handle}>
              <option value="">No client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Renewal Cost (₹)" name="renewalCost" type="number"
              value={form.renewalCost} onChange={handle} />
            <Input label="Selling Price (₹)" name="sellingPrice" type="number"
              value={form.sellingPrice} onChange={handle} />
          </div>

          <Input label="Notes" name="notes" value={form.notes} onChange={handle}
            placeholder="Optional notes..." />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mut.isPending}>Add Domain</Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/domains')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}