import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { domainService, hostingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, Loader, PageHeader, StatusBadge } from '../../components/ui/index'
import { TrendingUp, Globe, Server, Calendar, AlertTriangle, IndianRupee } from 'lucide-react'
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

const MONTHS_AHEAD = 6

export default function SpendForecast() {
    const { theme } = useAuth()

    const { data: domainsData, isLoading: dLoading } = useQuery({
        queryKey: ['domains-forecast'],
        queryFn: () => domainService.getAll({ limit: 500 }),
    })
    const { data: hostingData, isLoading: hLoading } = useQuery({
        queryKey: ['hosting-forecast'],
        queryFn: () => hostingService.getAll({ limit: 500 }),
    })

    const domains = domainsData?.data?.data?.docs || []
    const hostingList = hostingData?.data?.data?.docs || []

    // Build month-by-month forecast
    const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => {
        const date = addMonths(new Date(), i)
        return {
            label: format(date, 'MMM yyyy'),
            start: startOfMonth(date),
            end: endOfMonth(date),
            domains: [],
            hosting: [],
        }
    })

    // Assign each domain/hosting to its expiry month
    domains.forEach(d => {
        if (!d.expiryDate || !d.renewalCost) return
        const exp = new Date(d.expiryDate)
        months.forEach(m => {
            if (isWithinInterval(exp, { start: m.start, end: m.end })) {
                m.domains.push({ name: d.name, cost: d.renewalCost, status: d.status, expiryDate: d.expiryDate })
            }
        })
    })

    hostingList.forEach(h => {
        if (!h.expiryDate || !h.renewalCost) return
        const exp = new Date(h.expiryDate)
        months.forEach(m => {
            if (isWithinInterval(exp, { start: m.start, end: m.end })) {
                m.hosting.push({ name: h.label, cost: h.renewalCost, status: h.status, expiryDate: h.expiryDate })
            }
        })
    })

    const totalForecast = months.reduce((sum, m) => {
        const dCost = m.domains.reduce((s, d) => s + (d.cost || 0), 0)
        const hCost = m.hosting.reduce((s, h) => s + (h.cost || 0), 0)
        return sum + dCost + hCost
    }, 0)

    const maxMonthCost = Math.max(...months.map(m => {
        return m.domains.reduce((s, d) => s + (d.cost || 0), 0) +
            m.hosting.reduce((s, h) => s + (h.cost || 0), 0)
    }), 1)

    const noRenewalCost = [...domains, ...hostingList].filter(i => !i.renewalCost).length

    if (dLoading || hLoading) return <Loader text="Building forecast..." />

    return (
        <div className="space-y-5 max-w-4xl">
            <PageHeader title="Spend Forecast"
                subtitle={`Upcoming renewal costs for next ${MONTHS_AHEAD} months`} />

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Forecast', value: `₹${totalForecast.toLocaleString('en-IN')}`, icon: IndianRupee, color: theme.accent },
                    { label: 'Avg per Month', value: `₹${Math.round(totalForecast / MONTHS_AHEAD).toLocaleString('en-IN')}`, icon: TrendingUp, color: '#10B981' },
                    { label: 'Domains Tracked', value: domains.length, icon: Globe, color: '#6366F1' },
                    { label: 'Hosting Tracked', value: hostingList.length, icon: Server, color: '#F0A045' },
                ].map(s => (
                    <Card key={s.label} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon size={14} style={{ color: s.color }} />
                            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{s.label}</p>
                        </div>
                        <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                    </Card>
                ))}
            </div>

            {/* Missing cost warning */}
            {noRenewalCost > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
                    <AlertTriangle size={13} style={{ color: '#F0A045' }} className="flex-shrink-0 mt-0.5" />
                    <p style={{ color: theme.muted }}>
                        <strong style={{ color: '#F0A045' }}>{noRenewalCost} items</strong> have no renewal cost set —
                        forecast is incomplete. Edit each domain/hosting and add renewal cost to see accurate totals.
                    </p>
                </div>
            )}

            {/* Month by month bar chart + breakdown */}
            <div className="space-y-4">
                {months.map((m, i) => {
                    const dTotal = m.domains.reduce((s, d) => s + (d.cost || 0), 0)
                    const hTotal = m.hosting.reduce((s, h) => s + (h.cost || 0), 0)
                    const total = dTotal + hTotal
                    const barWidth = total > 0 ? (total / maxMonthCost) * 100 : 0
                    const isCurrentMonth = i === 0

                    return (
                        <Card key={m.label} className={isCurrentMonth ? 'ring-1' : ''}
                            style={isCurrentMonth ? { ringColor: theme.accent } : {}}>
                            {/* Month header */}
                            <div className="flex items-center justify-between p-4 pb-0">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} style={{ color: isCurrentMonth ? theme.accent : theme.muted }} />
                                    <p className="text-sm font-bold" style={{ color: isCurrentMonth ? theme.accent : theme.text }}>
                                        {m.label}
                                        {isCurrentMonth && (
                                            <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded"
                                                style={{ background: `${theme.accent}20`, color: theme.accent }}>THIS MONTH</span>
                                        )}
                                    </p>
                                </div>
                                <p className="text-sm font-bold font-mono" style={{ color: total > 0 ? theme.text : theme.muted }}>
                                    {total > 0 ? `₹${total.toLocaleString('en-IN')}` : 'No renewals'}
                                </p>
                            </div>

                            {/* Bar */}
                            <div className="px-4 py-3">
                                <div className="h-2 rounded-full overflow-hidden"
                                    style={{ background: `${theme.border}` }}>
                                    <div className="h-full rounded-full transition-all"
                                        style={{ width: `${barWidth}%`, background: isCurrentMonth ? theme.accent : `${theme.accent}60` }} />
                                </div>
                            </div>

                            {/* Items breakdown */}
                            {(m.domains.length > 0 || m.hosting.length > 0) && (
                                <div className="px-4 pb-4 space-y-1.5">
                                    {m.domains.map((d, j) => (
                                        <div key={j} className="flex items-center justify-between text-xs py-1"
                                            style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <div className="flex items-center gap-2">
                                                <Globe size={11} style={{ color: '#6366F1' }} />
                                                <span className="font-mono" style={{ color: theme.text }}>{d.name}</span>
                                                <StatusBadge status={d.status} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px]" style={{ color: theme.muted }}>
                                                    {format(new Date(d.expiryDate), 'dd MMM')}
                                                </span>
                                                <span className="font-mono font-semibold" style={{ color: '#6366F1' }}>
                                                    ₹{(d.cost || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {m.hosting.map((h, j) => (
                                        <div key={j} className="flex items-center justify-between text-xs py-1"
                                            style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <div className="flex items-center gap-2">
                                                <Server size={11} style={{ color: '#F0A045' }} />
                                                <span className="font-mono" style={{ color: theme.text }}>{h.name}</span>
                                                <StatusBadge status={h.status} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px]" style={{ color: theme.muted }}>
                                                    {format(new Date(h.expiryDate), 'dd MMM')}
                                                </span>
                                                <span className="font-mono font-semibold" style={{ color: '#F0A045' }}>
                                                    ₹{(h.cost || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Month subtotals */}
                                    <div className="flex justify-between pt-1">
                                        {dTotal > 0 && (
                                            <span className="text-[10px] font-mono" style={{ color: '#6366F1' }}>
                                                Domains: ₹{dTotal.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                        {hTotal > 0 && (
                                            <span className="text-[10px] font-mono" style={{ color: '#F0A045' }}>
                                                Hosting: ₹{hTotal.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}