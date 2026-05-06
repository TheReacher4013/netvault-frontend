


import React, { useState, useEffect, useCallback } from 'react';
import { reportDataAPI } from '../../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const PLAN_COLORS = {
    free: { bg: '#F3F4F6', color: '#6B7280' },
    starter: { bg: '#EFF6FF', color: '#3B82F6' },
    pro: { bg: '#F0FDF4', color: '#16A34A' },
    enterprise: { bg: '#FAF5FF', color: '#7C3AED' },
};
const STATUS_COLORS = {
    active: { bg: '#F0FDF4', color: '#16A34A' },
    suspended: { bg: '#FEF2F2', color: '#DC2626' },
    pending: { bg: '#FFFBEB', color: '#D97706' },
    rejected: { bg: '#FEF2F2', color: '#DC2626' },
};

function StatCard({ icon, label, value, color, sub }) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
            <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                background: `${color}15`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px',
            }}>{icon}</div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{value ?? '—'}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{label}</div>
                {sub && <div style={{ fontSize: '11px', color, fontWeight: 600, marginTop: '1px' }}>{sub}</div>}
            </div>
        </div>
    );
}

/* Company card for mobile view */
function CompanyCard({ c }) {
    const pc = PLAN_COLORS[c.planName?.toLowerCase()] || { bg: '#F3F4F6', color: '#6B7280' };
    const sc = STATUS_COLORS[c.planStatus] || STATUS_COLORS.pending;
    return (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '2px' }}>{c.orgName}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.adminEmail}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{ background: pc.bg, color: pc.color, borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{c.planName || 'Free'}</span>
                    <span style={{ background: sc.bg, color: sc.color, borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>{c.planStatus}</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '12px' }}>
                <div style={{ color: '#6B7280' }}>Expiry <span style={{ color: c.isExpired ? '#DC2626' : c.isExpiring ? '#D97706' : '#374151', fontWeight: 600 }}>{fmtDate(c.subscriptionEnd)}</span></div>
                <div style={{ color: '#6B7280' }}>Revenue <span style={{ color: '#6366F1', fontWeight: 700 }}>{fmtMoney(c.revenue)}</span></div>
                <div style={{ color: '#6B7280' }}>🌐 {c.domains} · 🖥️ {c.hosting}</div>
                <div style={{ color: '#6B7280' }}>👥 {c.clients} clients · 👤 {c.staff} staff</div>
            </div>
            {(c.isExpired || (c.daysLeft != null && c.daysLeft <= 30 && !c.isExpired)) && (
                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: c.isExpired ? '#DC2626' : '#D97706' }}>
                    {c.isExpired ? '❌ Expired' : `⚠️ ${c.daysLeft} days left`}
                </div>
            )}
        </div>
    );
}

function EmailScheduleSection() {
    const [schedule, setSchedule] = useState(null);
    const [emails, setEmails] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [sendTime, setSendTime] = useState('18:00');
    const [enabled, setEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    useEffect(() => {
        reportDataAPI.getEmailSchedule().then(res => {
            const s = res.data?.data?.schedule;
            if (s) { setSchedule(s); setEmails(s.emails || []); setSendTime(s.sendTime || '18:00'); setEnabled(s.enabled !== false); }
        }).catch(() => { });
    }, []);

    const addEmail = () => {
        const e = emailInput.trim().toLowerCase();
        if (!e) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('Invalid email address'); return; }
        if (emails.includes(e)) { setErr('Already added'); return; }
        setEmails(prev => [...prev, e]); setEmailInput(''); setErr('');
    };
    const removeEmail = (e) => setEmails(prev => prev.filter(x => x !== e));
    const handleSave = async () => {
        setSaving(true); setMsg(''); setErr('');
        try { await reportDataAPI.saveEmailSchedule({ emails, sendTime, enabled }); setMsg('✅ Schedule saved! Reports will be sent daily at ' + sendTime); }
        catch (e) { setErr('Failed to save schedule'); }
        finally { setSaving(false); }
    };
    const handleTest = async () => {
        if (!emails.length) { setErr('Add at least one email first'); return; }
        setTesting(true); setMsg(''); setErr('');
        try { await reportDataAPI.testEmailSchedule(); setMsg('📧 Test report sent! Check your inbox.'); }
        catch (e) { setErr('Failed to send test email'); }
        finally { setTesting(false); }
    };

    const inp = { padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' };

    return (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: 'clamp(16px, 4vw, 24px)', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>📧 Email Schedule</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                        Send this report automatically every day
                        {schedule?.lastSentAt && <span> · Last sent: {fmtDate(schedule.lastSentAt)}</span>}
                    </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <div style={{ width: '42px', height: '24px', borderRadius: '99px', background: enabled ? '#6366F1' : '#D1D5DB', position: 'relative', transition: 'background .2s' }} onClick={() => setEnabled(v => !v)}>
                        <div style={{ position: 'absolute', top: '3px', left: enabled ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>{enabled ? 'Enabled' : 'Disabled'}</span>
                </label>
            </div>
            <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Daily Send Time (IST)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={{ ...inp, width: '150px' }} />
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Reports will be delivered at this time every day</span>
                </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Recipient Emails</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="email" value={emailInput} onChange={e => { setEmailInput(e.target.value); setErr(''); }} onKeyDown={e => e.key === 'Enter' && addEmail()} placeholder="admin@example.com" style={{ ...inp, flex: 1, minWidth: 0 }} />
                    <button onClick={addEmail} style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
                {err && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#DC2626' }}>{err}</p>}
            </div>
            {emails.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {emails.map(e => (
                        <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', color: '#4338CA', maxWidth: '100%' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📧 {e}</span>
                            <button onClick={() => removeEmail(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', fontSize: '14px', padding: '0', lineHeight: 1, flexShrink: 0 }}>×</button>
                        </div>
                    ))}
                </div>
            )}
            {msg && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#15803D' }}>{msg}</div>}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: '1 1 130px', background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>{saving ? 'Saving…' : '💾 Save Schedule'}</button>
                <button onClick={handleTest} disabled={testing} style={{ flex: '1 1 130px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 18px', cursor: testing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>{testing ? 'Sending…' : '🧪 Send Test Now'}</button>
            </div>
        </div>
    );
}

export default function SuperAdminReports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [tab, setTab] = useState('overview');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const res = await reportDataAPI.getSuperAdminSummary(); setData(res.data?.data || null); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-switch to cards on narrow screens
    useEffect(() => {
        const check = () => setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const companies = (data?.companies || []).filter(c => {
        if (search && !c.orgName.toLowerCase().includes(search.toLowerCase()) && !c.adminEmail.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterStatus && c.planStatus !== filterStatus) return false;
        if (filterPlan && c.planName?.toLowerCase() !== filterPlan.toLowerCase()) return false;
        return true;
    }).sort((a, b) => {
        let av = a[sortBy], bv = b[sortBy];
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    const toggleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const thStyle = (col) => ({
        padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
        color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px',
        cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
        background: sortBy === col ? '#F0F0FF' : '#F9FAFB',
    });

    const totals = data?.totals || {};
    const planOptions = [...new Set((data?.companies || []).map(c => c.planName).filter(Boolean))];

    return (
        <div style={{ padding: 'clamp(12px, 4vw, 24px)', maxWidth: '1100px', margin: '0 auto' }}>
            <style>{`
              .sr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
              .sr-filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
              .sr-filter-inp { padding: 8px 10px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; background: #fff; outline: none; }
              .sr-view-toggle { display: flex; gap: 4px; }
              @media (max-width: 900px) {
                .sr-stats { grid-template-columns: repeat(3, 1fr); }
              }
              @media (max-width: 640px) {
                .sr-stats { grid-template-columns: repeat(2, 1fr); }
                .sr-filter-inp { flex: 1 1 120px; }
                .sr-filters { gap: 6px; }
              }
              @media (max-width: 360px) {
                .sr-stats { grid-template-columns: 1fr; }
              }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(18px,4vw,22px)', fontWeight: 800, color: '#111827' }}>📊 Platform Reports</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>All companies, subscriptions, and platform-level metrics</p>
                </div>
                <button onClick={fetchData} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>🔄 Refresh</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '20px', borderBottom: '2px solid #E5E7EB', overflowX: 'auto' }}>
                {[['overview', '🏢 Overview'], ['companies', '📋 Companies']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{
                        background: 'none', border: 'none', padding: '10px 18px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap',
                        color: tab === key ? '#6366F1' : '#6B7280',
                        borderBottom: tab === key ? '2px solid #6366F1' : '2px solid transparent',
                        marginBottom: '-2px',
                    }}>{label}</button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>Loading report data…
                </div>
            ) : !data ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Failed to load data</div>
            ) : tab === 'overview' ? (
                <>
                    <div className="sr-stats">
                        <StatCard icon="🏢" label="Total Companies" value={totals.companies} color="#6366F1" />
                        <StatCard icon="✅" label="Active" value={totals.active} color="#16A34A" />
                        <StatCard icon="⏸️" label="Suspended" value={totals.suspended} color="#DC2626" />
                        <StatCard icon="⚠️" label="Expiring ≤30d" value={totals.expiringSoon} color="#D97706" />
                        <StatCard icon="🌐" label="Total Domains" value={totals.totalDomains} color="#3B82F6" />
                        <StatCard icon="👥" label="Total Clients" value={totals.totalClients} color="#8B5CF6" />
                        <StatCard icon="💰" label="Platform Revenue" value={fmtMoney(totals.totalRevenue)} color="#16A34A" />
                    </div>

                    {data.companies.filter(c => c.isExpiring || c.isExpired).length > 0 && (
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#92400E' }}>⚠️ Subscriptions Expiring or Expired</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.companies.filter(c => c.isExpiring || c.isExpired).map(c => (
                                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{c.orgName}</span>
                                            <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px' }}>{c.planName}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: c.isExpired ? '#DC2626' : '#D97706' }}>
                                            {c.isExpired ? '❌ Expired' : `⚠️ ${c.daysLeft} days left`}
                                            <span style={{ marginLeft: '8px', fontWeight: 400, color: '#6B7280' }}>{fmtDate(c.subscriptionEnd)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <EmailScheduleSection />
                </>
            ) : (
                <>
                    {/* Filters + view toggle */}
                    <div className="sr-filters">
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or email…"
                            className="sr-filter-inp" style={{ minWidth: '180px', flex: '1 1 180px' }} />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="sr-filter-inp">
                            <option value="">All Status</option>
                            {['active', 'suspended', 'pending', 'rejected'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="sr-filter-inp">
                            <option value="">All Plans</option>
                            {planOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>{companies.length} companies</span>
                        {/* View toggle — only on md+ */}
                        <div className="sr-view-toggle" style={{ display: window.innerWidth < 768 ? 'none' : 'flex' }}>
                            {['table', 'cards'].map(v => (
                                <button key={v} onClick={() => setViewMode(v)} style={{
                                    background: viewMode === v ? '#6366F1' : '#F3F4F6',
                                    color: viewMode === v ? '#fff' : '#6B7280',
                                    border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                }}>{v === 'table' ? '≡ Table' : '⊞ Cards'}</button>
                            ))}
                        </div>
                    </div>

                    {/* Card view (mobile default, or toggled) */}
                    {viewMode === 'cards' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {companies.length === 0
                                ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>No companies found</div>
                                : companies.map(c => <CompanyCard key={c._id} c={c} />)
                            }
                        </div>
                    ) : (
                        /* Table view */
                        <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '740px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <th style={thStyle('orgName')} onClick={() => toggleSort('orgName')}>Company {sortBy === 'orgName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th style={thStyle('planName')} onClick={() => toggleSort('planName')}>Plan</th>
                                        <th style={thStyle('planStatus')}>Status</th>
                                        <th style={thStyle('subscriptionEnd')} onClick={() => toggleSort('subscriptionEnd')}>Expiry</th>
                                        <th style={{ ...thStyle('domains'), textAlign: 'right' }}>Resources</th>
                                        <th style={{ ...thStyle('revenue'), textAlign: 'right' }} onClick={() => toggleSort('revenue')}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>No companies found</td></tr>
                                    ) : companies.map((c, i) => {
                                        const pc = PLAN_COLORS[c.planName?.toLowerCase()] || { bg: '#F3F4F6', color: '#6B7280' };
                                        const sc = STATUS_COLORS[c.planStatus] || STATUS_COLORS.pending;
                                        return (
                                            <tr key={c._id} style={{ borderBottom: i < companies.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <div style={{ fontWeight: 700, color: '#111827' }}>{c.orgName}</div>
                                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.adminEmail}</div>
                                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Since {fmtDate(c.createdAt)}</div>
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <span style={{ background: pc.bg, color: pc.color, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{c.planName || 'Free'}</span>
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <span style={{ background: sc.bg, color: sc.color, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{c.planStatus}</span>
                                                </td>
                                                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontSize: '13px', color: c.isExpired ? '#DC2626' : c.isExpiring ? '#D97706' : '#374151', fontWeight: c.isExpired || c.isExpiring ? 700 : 400 }}>{fmtDate(c.subscriptionEnd)}</div>
                                                    {c.daysLeft != null && c.daysLeft <= 30 && !c.isExpired && <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 700 }}>⚠️ {c.daysLeft}d left</div>}
                                                    {c.isExpired && <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>❌ Expired</div>}
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontSize: '12px', color: '#374151' }}>🌐 {c.domains} · 🖥️ {c.hosting}</div>
                                                    <div style={{ fontSize: '12px', color: '#374151' }}>👥 {c.clients} · 👤 {c.staff}</div>
                                                </td>
                                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#6366F1', whiteSpace: 'nowrap' }}>{fmtMoney(c.revenue)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}