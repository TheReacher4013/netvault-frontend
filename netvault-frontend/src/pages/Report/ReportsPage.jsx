import React, { useState, useEffect, useCallback } from 'react';
import { reportDataAPI } from '../../services/api';

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

function StatCard({ icon, label, value, color, sub, subColor }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: `${color}18`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: subColor || color, fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

function MetaRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F9FAFB' }}>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: color || '#111827' }}>{value}</span>
    </div>
  );
}

function EmailScheduleSection() {
  const [schedule, setSchedule]     = useState(null);
  const [emails, setEmails]         = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [sendTime, setSendTime]     = useState('18:00');
  const [enabled, setEnabled]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [testing, setTesting]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [err, setErr]               = useState('');

  useEffect(() => {
    reportDataAPI.getEmailSchedule().then(res => {
      const s = res.data?.data?.schedule;
      if (s) { setSchedule(s); setEmails(s.emails || []); setSendTime(s.sendTime || '18:00'); setEnabled(s.enabled !== false); }
    }).catch(() => {});
  }, []);

  const addEmail = () => {
    const e = emailInput.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('Invalid email address'); return; }
    if (emails.includes(e)) { setErr('Already added'); return; }
    setEmails(prev => [...prev, e]);
    setEmailInput('');
    setErr('');
  };

  const removeEmail = (e) => setEmails(prev => prev.filter(x => x !== e));

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      await reportDataAPI.saveEmailSchedule({ emails, sendTime, enabled });
      setMsg('✅ Schedule saved! Reports will be sent daily at ' + sendTime + ' IST');
    } catch { setErr('Failed to save schedule'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!emails.length) { setErr('Add at least one email first'); return; }
    setTesting(true); setMsg(''); setErr('');
    try {
      await reportDataAPI.testEmailSchedule();
      setMsg('📧 Test report sent! Check your inbox.');
    } catch { setErr('Failed to send test email'); }
    finally { setTesting(false); }
  };

  const inp = { padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '24px', marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>📧 Email Schedule</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            Receive this report automatically every day
            {schedule?.lastSentAt && <span> · Last sent: {fmtDate(schedule.lastSentAt)}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setEnabled(v => !v)}>
          <div style={{
            width: '42px', height: '24px', borderRadius: '99px',
            background: enabled ? '#6366F1' : '#D1D5DB', position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: '3px', left: enabled ? '21px' : '3px',
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }}/>
          </div>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Daily Send Time (IST)</label>
        <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={{ ...inp, width: '160px' }} />
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#9CA3AF' }}>Delivered every day at this time</span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Recipient Emails</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="email" value={emailInput}
            onChange={e => { setEmailInput(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && addEmail()}
            placeholder="e.g. manager@yourcompany.com"
            style={{ ...inp, flex: 1 }} />
          <button onClick={addEmail} style={{
            background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '9px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
          }}>+ Add</button>
        </div>
        {err && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#DC2626' }}>{err}</p>}
      </div>

      {emails.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {emails.map(e => (
            <div key={e} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#EEF2FF', border: '1px solid #C7D2FE',
              borderRadius: '20px', padding: '4px 12px', fontSize: '13px', color: '#4338CA',
            }}>
              <span>📧 {e}</span>
              <button onClick={() => removeEmail(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', fontSize: '14px', padding: '0' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#15803D' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={saving} style={{
          background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '10px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700,
        }}>{saving ? 'Saving…' : '💾 Save Schedule'}</button>
        <button onClick={handleTest} disabled={testing} style={{
          background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
          padding: '10px 20px', cursor: testing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
        }}>{testing ? 'Sending…' : '🧪 Send Test Now'}</button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportDataAPI.getAdminSummary();
      setData(res.data?.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const d = data || {};
  const inv = d.invoices || {};
  const growth = inv.revenueGrowth;
  const growthStr = growth != null
    ? (growth >= 0 ? `↑ ${growth}% vs last month` : `↓ ${Math.abs(growth)}% vs last month`)
    : null;
  const growthColor = growth >= 0 ? '#16A34A' : '#DC2626';

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827' }}>📊 Reports</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            Dashboard summary — clients, domains, billing & more
          </p>
        </div>
        <button onClick={fetchData} style={{
          background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
          padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
        }}>🔄 Refresh</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
        {[['overview', '📈 Overview'], ['details', '📋 Details']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 700,
            color: tab === key ? '#6366F1' : '#6B7280',
            borderBottom: tab === key ? '2px solid #6366F1' : '2px solid transparent',
            marginBottom: '-2px',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF', fontSize: '14px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>Loading report data…
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Failed to load data</div>
      ) : tab === 'overview' ? (
        <>
          {/* Stat cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            <StatCard icon="👥" label="Total Clients"   value={d.clients?.total}   color="#6366F1"
              sub={`${d.clients?.active || 0} active`} />
            <StatCard icon="👤" label="Staff Members"   value={d.staff?.total}     color="#8B5CF6" />
            <StatCard icon="🌐" label="Domains"         value={d.domains?.total}   color="#3B82F6"
              sub={d.domains?.expiring ? `${d.domains.expiring} expiring` : null} subColor="#D97706" />
            <StatCard icon="🖥️" label="Hosting Plans"  value={d.hosting?.total}   color="#06B6D4"
              sub={d.hosting?.expiring ? `${d.hosting.expiring} expiring` : null} subColor="#D97706" />
            <StatCard icon="🧾" label="Total Invoices"  value={inv.total}          color="#F59E0B" />
            <StatCard icon="💰" label="Total Revenue"   value={fmtMoney(inv.totalRevenue)}  color="#16A34A"
              sub={growthStr} subColor={growthColor} />
            <StatCard icon="📅" label="This Month"      value={fmtMoney(inv.thisMonthRevenue)} color="#6366F1" />
            <StatCard icon="⚠️" label="Overdue"         value={fmtMoney(inv.overdueRevenue)}  color="#DC2626"
              sub={`${inv.overdue || 0} invoices`} subColor="#DC2626" />
          </div>

          {/* Alert banners */}
          {(d.domains?.expiring > 0 || d.domains?.expired > 0) && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400E' }}>
              ⚠️ <strong>{d.domains.expiring} domain{d.domains.expiring !== 1 ? 's' : ''}</strong> expiring soon
              {d.domains.expired > 0 && <> · <strong style={{ color: '#DC2626' }}>{d.domains.expired} expired</strong></>}
            </div>
          )}
          {inv.overdue > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#991B1B' }}>
              🔴 <strong>{inv.overdue} overdue invoice{inv.overdue !== 1 ? 's' : ''}</strong> totalling {fmtMoney(inv.overdueRevenue)} — please follow up
            </div>
          )}

          <EmailScheduleSection />
        </>
      ) : (
        /* Details tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <SectionCard title="Domains" icon="🌐">
            <MetaRow label="Total Domains"  value={d.domains?.total} />
            <MetaRow label="Expiring Soon"  value={d.domains?.expiring} color="#D97706" />
            <MetaRow label="Expired"        value={d.domains?.expired}  color="#DC2626" />
          </SectionCard>

          <SectionCard title="Hosting" icon="🖥️">
            <MetaRow label="Total Plans"   value={d.hosting?.total} />
            <MetaRow label="Expiring Soon" value={d.hosting?.expiring} color="#D97706" />
          </SectionCard>

          <SectionCard title="Clients & Staff" icon="👥">
            <MetaRow label="Total Clients"  value={d.clients?.total} />
            <MetaRow label="Active Clients" value={d.clients?.active}  color="#16A34A" />
            <MetaRow label="Staff Members"  value={d.staff?.total} />
          </SectionCard>

          <SectionCard title="Billing" icon="🧾">
            <MetaRow label="Total Invoices" value={inv.total} />
            <MetaRow label="Paid"           value={inv.paid}    color="#16A34A" />
            <MetaRow label="Pending"        value={inv.pending} color="#D97706" />
            <MetaRow label="Overdue"        value={inv.overdue} color="#DC2626" />
            <MetaRow label="Draft"          value={inv.draft} />
          </SectionCard>

          <SectionCard title="Revenue" icon="💰">
            <MetaRow label="Total Revenue"   value={fmtMoney(inv.totalRevenue)}   color="#6366F1" />
            <MetaRow label="This Month"      value={fmtMoney(inv.thisMonthRevenue)} />
            <MetaRow label="Last Month"      value={fmtMoney(inv.prevMonthRevenue)} />
            <MetaRow label="Overdue Amount"  value={fmtMoney(inv.overdueRevenue)}  color="#DC2626" />
            <MetaRow label="Pending Amount"  value={fmtMoney(inv.pendingRevenue)}  color="#D97706" />
            {growthStr && <MetaRow label="Growth" value={growthStr} color={growthColor} />}
          </SectionCard>

          {/* Recent Domains */}
          {d.recentDomains?.length > 0 && (
            <SectionCard title="Recently Added Domains" icon="🆕">
              {d.recentDomains.map(dom => (
                <div key={dom._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>{dom.name}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{fmtDate(dom.expiryDate)}</span>
                </div>
              ))}
            </SectionCard>
          )}

          {/* Recent Clients */}
          {d.recentClients?.length > 0 && (
            <SectionCard title="Recently Added Clients" icon="🆕">
              {d.recentClients.map(cl => (
                <div key={cl._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>{cl.name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{cl.email}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: cl.status === 'active' ? '#16A34A' : '#D97706', fontWeight: 600 }}>{cl.status}</span>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
