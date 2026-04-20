import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clientService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, StatusBadge, Loader, PageHeader } from '../../components/ui/index'
import { ArrowLeft, Globe, Server, FileText, Key } from 'lucide-react'
import { format } from 'date-fns'

export default function ClientProfile() {
  const { id } = useParams()
  const { theme } = useAuth()
  const navigate = useNavigate()

  const { data: clientData, isLoading } = useQuery({ queryKey: ['client', id], queryFn: () => clientService.getOne(id) })
  const { data: assetsData } = useQuery({ queryKey: ['client-assets', id], queryFn: () => clientService.getAssets(id) })

  const client = clientData?.data?.data?.client
  const domains = assetsData?.data?.data?.domains || []
  const hosting = assetsData?.data?.data?.hosting || []

  if (isLoading) return <Loader text="Loading client..." />
  if (!client) return <div className="text-center py-20" style={{ color: theme.muted }}>Client not found</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title={client.name} subtitle={client.company || client.email}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}><ArrowLeft size={13} />Back</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/clients/${id}/vault`)}><Key size={13} />Vault</Button>
            <Button size="sm" onClick={() => navigate('/billing/create')}>+ Invoice</Button>
          </div>
        } />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}>
              {client.name.charAt(0)}
            </div>
            <p className="font-display font-bold text-base" style={{ color: theme.text }}>{client.name}</p>
            <p className="text-xs" style={{ color: theme.muted }}>{client.company || 'Individual'}</p>
          </div>
          <div className="space-y-2 text-xs">
            {[['Email', client.email], ['Phone', client.phone], ['Since', format(new Date(client.createdAt), 'MMM yyyy')]].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span style={{ color: theme.muted }}>{k}</span>
                <span className="font-mono text-right" style={{ color: theme.text }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title={`Domains (${domains.length})`} actions={<Button size="sm" onClick={() => navigate('/domains/add')}>+ Add</Button>} />
            {domains.length === 0 ? <p className="text-xs text-center py-6" style={{ color: theme.muted }}>No domains</p> : (
              <div className="divide-y" style={{ borderColor: theme.border }}>
                {domains.map(d => (
                  <div key={d._id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => navigate(`/domains/${d._id}`)}>
                    <Globe size={13} style={{ color: theme.accent }} />
                    <span className="flex-1 text-xs font-mono" style={{ color: theme.text }}>{d.name}</span>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title={`Hosting (${hosting.length})`} actions={<Button size="sm" onClick={() => navigate('/hosting/add')}>+ Add</Button>} />
            {hosting.length === 0 ? <p className="text-xs text-center py-6" style={{ color: theme.muted }}>No hosting plans</p> : (
              <div className="divide-y" style={{ borderColor: theme.border }}>
                {hosting.map(h => (
                  <div key={h._id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => navigate(`/hosting/${h._id}`)}>
                    <Server size={13} style={{ color: theme.accent }} />
                    <span className="flex-1 text-xs font-semibold" style={{ color: theme.text }}>{h.label}</span>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
