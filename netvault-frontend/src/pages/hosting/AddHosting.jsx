import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hostingService, clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, PageHeader, Input, Select } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function AddHosting() {
  const { theme } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    label: '', planType: 'shared', provider: '', serverIP: '', serverLocation: '',
    bandwidth: '', diskSpace: '', expiryDate: '', clientId: '',
    controlPanel: 'cpanel', renewalCost: '', sellingPrice: '',
    cpanelInfo: { username: '', password: '', url: '' },
  })

  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientService.getAll({ limit: 100 }) })
  const clients = clientsData?.data?.data?.docs || []

  const mut = useMutation({
    mutationFn: d => hostingService.create(d),
    onSuccess: () => { toast.success('Hosting added!'); qc.invalidateQueries(['hosting']); navigate('/hosting') },
  })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleCpanel = e => setForm(f => ({ ...f, cpanelInfo: { ...f.cpanelInfo, [e.target.name]: e.target.value } }))

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Add Hosting" subtitle="Add a new hosting plan"
        actions={<Button variant="ghost" onClick={() => navigate('/hosting')}>Cancel</Button>} />
      <Card className="p-6">
        <form onSubmit={e => { e.preventDefault(); if (!form.label || !form.expiryDate) return toast.error('Label and expiry required'); mut.mutate(form) }} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Label *" name="label" value={form.label} onChange={handle} placeholder="VPS-01 techzone.in" />
            <Select label="Plan Type" name="planType" value={form.planType} onChange={handle}>
              {['shared','vps','dedicated','cloud','reseller'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </Select>
            <Input label="Provider" name="provider" value={form.provider} onChange={handle} placeholder="HostGator, AWS..." />
            <Input label="Server IP" name="serverIP" value={form.serverIP} onChange={handle} placeholder="192.168.1.1" />
            <Input label="Location" name="serverLocation" value={form.serverLocation} onChange={handle} placeholder="Mumbai, IN" />
            <Input label="Disk Space" name="diskSpace" value={form.diskSpace} onChange={handle} placeholder="50GB" />
            <Input label="Bandwidth" name="bandwidth" value={form.bandwidth} onChange={handle} placeholder="Unlimited" />
            <Input label="Expiry Date *" name="expiryDate" type="date" value={form.expiryDate} onChange={handle} />
            <Select label="Control Panel" name="controlPanel" value={form.controlPanel} onChange={handle}>
              {['cpanel','plesk','directadmin','webmin','none'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Assign Client" name="clientId" value={form.clientId} onChange={handle}>
              <option value="">No client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Renewal Cost (₹)" name="renewalCost" type="number" value={form.renewalCost} onChange={handle} />
            <Input label="Selling Price (₹)" name="sellingPrice" type="number" value={form.sellingPrice} onChange={handle} />
          </div>
          <div className="pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
            <p className="text-xs font-semibold mb-3" style={{ color: theme.muted }}>cPanel Credentials (Encrypted)</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input label="Username" name="username" value={form.cpanelInfo.username} onChange={handleCpanel} />
              <Input label="Password" name="password" type="password" value={form.cpanelInfo.password} onChange={handleCpanel} />
              <Input label="Panel URL" name="url" value={form.cpanelInfo.url} onChange={handleCpanel} placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mut.isPending}>Add Hosting</Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/hosting')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
