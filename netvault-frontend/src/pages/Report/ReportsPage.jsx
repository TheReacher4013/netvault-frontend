import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../services/api';

const REPORT_TYPES = ['user_activity', 'system', 'financial', 'audit', 'custom'];
const FORMATS      = ['pdf', 'csv', 'excel'];
const STATUSES     = ['pending', 'generating', 'ready', 'failed'];

const TYPE_META = {
  user_activity: { icon: '👥', label: 'User Activity', color: '#6366F1' },
  system:        { icon: '⚙️', label: 'System',        color: '#3B82F6' },
  financial:     { icon: '💰', label: 'Financial',      color: '#22C55E' },
  audit:         { icon: '🔍', label: 'Audit',          color: '#F59E0B' },
  custom:        { icon: '📋', label: 'Custom',         color: '#8B5CF6' },
};

const STATUS_META = {
  pending:    { color: '#6B7280', bg: '#F3F4F6', label: '⏳ Pending' },
  generating: { color: '#3B82F6', bg: '#EFF6FF', label: '⚡ Generating' },
  ready:      { color: '#22C55E', bg: '#F0FDF4', label: '✅ Ready' },
  failed:     { color: '#EF4444', bg: '#FEF2F2', label: '❌ Failed' },
};

const FORMAT_ICONS = { pdf: '📄', csv: '📊', excel: '📗' };

const initialForm = {
  title: '', description: '', type: 'user_activity',
  format: 'pdf', filters: {},
};

function Badge({ meta }) {
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      borderRadius: '6px', padding: '2px 10px',
      fontSize: '11px', fontWeight: 700,
    }}>
      {meta.label}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
          position: 'sticky', top: 0, background: '#fff',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px',
          }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: `${color}15`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function ReportsPage({ userRole }) {
  const isSuperAdmin = userRole === 'superadmin';
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(initialForm);
  const [saving, setSaving]             = useState(false);
  const [filterType, setFilterType]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState({ total: 0, pages: 1 });

  const fetchAll = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 10 };
      if (filterType)   params.type   = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await reportAPI.getAll(params);
      setReports(res.data.reports || []);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(1); setPage(1); }, [filterType, filterStatus]);

  const openCreate = () => { setForm(initialForm); setEditTarget(null); setShowModal(true); };
  const openEdit   = (r) => {
    setForm({ title: r.title, description: r.description || '', type: r.type, format: r.format, filters: r.filters || {} });
    setEditTarget(r._id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) await reportAPI.update(editTarget, form);
      else            await reportAPI.create(form);
      setShowModal(false);
      fetchAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await reportAPI.remove(id);
    fetchAll();
  };

  const handleRegenerate = async (id) => {
    await reportAPI.regenerate(id);
    fetchAll();
  };

  // Stats
  const readyCount      = reports.filter(r => r.status === 'ready').length;
  const pendingCount    = reports.filter(r => ['pending', 'generating'].includes(r.status)).length;
  const failedCount     = reports.filter(r => r.status === 'failed').length;

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            📊 Reports
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            {isSuperAdmin ? 'Generate and manage system reports' : 'View available reports'}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} style={{
            background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 18px', fontSize: '13px', cursor: 'pointer', fontWeight: 700,
          }}>
            + Generate Report
          </button>
        )}
      </div>

      {/* Stats */}
      {isSuperAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px', marginBottom: '24px',
        }}>
          <StatCard icon="📊" label="Total Reports" value={pagination.total} color="#6366F1" />
          <StatCard icon="✅" label="Ready"          value={readyCount}       color="#22C55E" />
          <StatCard icon="⏳" label="In Progress"    value={pendingCount}     color="#F59E0B" />
          <StatCard icon="❌" label="Failed"         value={failedCount}      color="#EF4444" />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px',
          fontSize: '13px', background: '#fff', cursor: 'pointer',
        }}>
          <option value="">All Types</option>
          {REPORT_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>
          ))}
        </select>
        {isSuperAdmin && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px',
            fontSize: '13px', background: '#fff', cursor: 'pointer',
          }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280', alignSelf: 'center' }}>
          {pagination.total} report{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>Loading…</div>
      ) : reports.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px', background: '#F9FAFB',
          borderRadius: '14px', border: '2px dashed #E5E7EB',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No reports found</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Report', 'Type', 'Format', 'Status', 'Generated', ...(isSuperAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 700, color: '#6B7280',
                    textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => {
                const tm = TYPE_META[r.type];
                const sm = STATUS_META[r.status];
                return (
                  <tr key={r._id} style={{
                    borderBottom: i < reports.length - 1 ? '1px solid #F3F4F6' : 'none',
                    transition: 'background .1s',
                  }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{r.title}</div>
                      {r.description && (
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{r.description}</div>
                      )}
                      {r.createdBy && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                          By {r.createdBy.name || r.createdBy.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: `${tm?.color}15`, color: tm?.color,
                        borderRadius: '6px', padding: '3px 10px',
                        fontSize: '11px', fontWeight: 700,
                      }}>
                        {tm?.icon} {tm?.label || r.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '16px' }}>{FORMAT_ICONS[r.format]}</span>
                      <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '4px', textTransform: 'uppercase' }}>
                        {r.format}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <Badge meta={sm} />
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#6B7280' }}>
                      {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : '—'}
                    </td>
                    {isSuperAdmin && (
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(r.status === 'ready' || r.status === 'failed') && (
                            <button onClick={() => handleRegenerate(r._id)} title="Regenerate" style={{
                              background: '#F0FDF4', border: 'none', borderRadius: '7px',
                              padding: '5px 10px', cursor: 'pointer', fontSize: '13px', color: '#15803D',
                            }}>🔄</button>
                          )}
                          <button onClick={() => openEdit(r)} style={{
                            background: '#F3F4F6', border: 'none', borderRadius: '7px',
                            padding: '5px 10px', cursor: 'pointer', fontSize: '13px',
                          }}>✏️</button>
                          <button onClick={() => handleDelete(r._id)} style={{
                            background: '#FEF2F2', border: 'none', borderRadius: '7px',
                            padding: '5px 10px', cursor: 'pointer', fontSize: '13px', color: '#EF4444',
                          }}>🗑</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setPage(p); fetchAll(p); }} style={{
              background: p === page ? '#6366F1' : '#F3F4F6',
              color: p === page ? '#fff' : '#374151',
              border: 'none', borderRadius: '8px', width: '36px', height: '36px',
              cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            }}>{p}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Report' : 'Generate New Report'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Report title" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Report Type</label>
                <select style={inputStyle} value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {REPORT_TYPES.map(t => (
                    <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Export Format</label>
                <select style={inputStyle} value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                  {FORMATS.map(fmt => (
                    <option key={fmt} value={fmt}>{FORMAT_ICONS[fmt]} {fmt.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
                padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title} style={{
                background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 24px',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700,
              }}>
                {saving ? 'Saving…' : (editTarget ? 'Update' : 'Generate')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
