import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportService, billingService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import { TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function RevenueReport() {
  const { theme } = useAuth()
  const [months, setMonths] = useState(6)

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue', months],
    queryFn: () => reportService.getRevenue(months),
  })
  const { data: summaryData } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: () => billingService.getSummary(),
  })

  const monthly = revenueData?.data?.data?.monthly || []
  const summary = summaryData?.data?.data || {}

  const chartData = monthly.map(m => ({
    month: MONTHS[m._id.month - 1],
    revenue: m.revenue,
    count: m.count,
  }))

  const pieData = [
    { name: 'Paid', value: summary.totalRevenue || 0 },
    { name: 'Pending', value: summary.pending || 0 },
    { name: 'Overdue', value: summary.overdue || 0 },
  ]

  if (isLoading) return <Loader text="Loading revenue..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Revenue Report"
        subtitle="Financial overview and billing analytics"
        actions={
          <div className="flex gap-2">
            {[3, 6, 12].map(m => (
              <button key={m} onClick={() => setMonths(m)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all"
                style={{
                  background: months === m ? theme.accent : `${theme.accent}10`,
                  color: months === m ? theme.bg : theme.text,
                  border: `1px solid ${months === m ? theme.accent : theme.border}`,
                }}>
                {m}M
              </button>
            ))}
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: summary.totalRevenue || 0, color: theme.accent },
          { label: 'Pending', value: summary.pending || 0, color: '#F0A045' },
          { label: 'Overdue', value: summary.overdue || 0, color: '#C94040' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-5">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: theme.muted }}>{label}</p>
            <p className="font-display font-bold text-2xl" style={{ color }}>
              ₹{value.toLocaleString('en-IN')}
            </p>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader title="Monthly Revenue" subtitle={`Last ${months} months`} />
        <div className="p-5">
          {chartData.length === 0
            ? <EmptyState icon={TrendingUp} title="No revenue data" description="Create and mark invoices as paid to see revenue" />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={36}>
                  <XAxis dataKey="month" tick={{ fill: theme.muted, fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: theme.muted, fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, fontFamily: 'DM Sans', fontSize: 12 }}
                    labelStyle={{ color: theme.text, fontWeight: 600 }}
                    formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === chartData.length - 1 ? theme.accent : `${theme.accent}55`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </Card>

      {/* Pie chart */}
      <Card>
        <CardHeader title="Invoice Breakdown" subtitle="By payment status" />
        <div className="p-5 flex justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={[theme.accent, '#F0A045', '#C94040'][i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, fontFamily: 'DM Sans', fontSize: 12 }}
                formatter={v => [`₹${v.toLocaleString('en-IN')}`, '']}
              />
              <Legend formatter={(value) => <span style={{ color: theme.muted, fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}