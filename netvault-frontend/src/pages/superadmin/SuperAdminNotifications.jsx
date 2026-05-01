import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';

const ROLES = ['superAdmin', 'admin', 'accountManager', 'technicalManager', 'billingManager', 'staff', 'client'];
const TYPES = ['info', 'warning', 'success', 'error'];

const TYPE_META = {
  info:    { color: '#3B82F6', bg: '#EFF6FF', label: 'Info' },
  success: { color: '#22C55E', bg: '#F0FDF4', label: 'Success' },
  warning: { color: '#F59E0B', bg: '#FFFBEB', label: 'Warning' },
  error:   { color: '#EF4444', bg: '#FEF2F2', label: 'Error' },
};

const initialForm = {
  title: '', message: '', type: 'info',
  targetRoles: [], isGlobal: false, actionUrl: '',
};

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB',
  borderRadius: '8px', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#374151', marginBottom: '6px',
};

function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.info;
  return (
    <span style={{
      background: m.bg, color: m.color,
      border: `1px solid ${m.color}33`,
      borderRadius: '6px', padding: '2px 10px',
      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
    }}>
      {m.label}
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
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
          }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

export default function SuperAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 100 });
      // SuperAdmin sees all broadcast notifications; isRead is per their account
      setNotifications(res.data?.data?.notifications || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setForm(initialForm); setEditTarget(null); setShowModal(true); };
  const openEdit = (n) => {
    setForm({
      title: n.title, message: n.message, type: n.type,
      targetRoles: n.targetRoles || [], isGlobal: n.isGlobal || false,
      actionUrl: n.actionUrl || '',
    });
    setEditTarget(n._id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        await notificationAPI.update(editTarget, form);
        setSuccessMsg('Notification updated successfully!');
      } else {
        await notificationAPI.create(form);
        setSuccessMsg('Notification sent successfully!');
      }
      setShowModal(false);
      fetchAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    await notificationAPI.remove(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const filtered = filterType
    ? notifications.filter(n => n.type === filterType)
    : notifications;

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Success Popup */}
      {successMsg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '40px 48px',
            textAlign: 'center', maxWidth: '420px', width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,.2)',
            animation: 'popIn .3s ease',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '32px',
            }}>🔔</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#111827' }}>Sent!</h2>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
              {successMsg}
            </p>
            <button onClick={() => setSuccessMsg('')} style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '12px 32px', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', width: '100%',
            }}>Got it</button>
          </div>
          <style>{`@keyframes popIn { from { transform: scale(.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            📣 Broadcast Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            Send messages to specific roles or all users
          </p>
        </div>
        <button onClick={openCreate} style={{
          background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '10px 18px', fontSize: '13px', cursor: 'pointer', fontWeight: 700,
        }}>
          + New Notification
        </button>
      </div>

      {/* Info callout */}
      <div style={{
        background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px',
        padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#15803D',
      }}>
        ✅ Notifications created here are broadcast to targeted roles. Recipients will see them in their <strong>Notifications</strong> page and bell. System alerts (domain expiry, uptime) appear separately in the <strong>Alert Center</strong>.
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['', ...TYPES].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            background: filterType === t ? '#6366F1' : '#F9FAFB',
            color: filterType === t ? '#fff' : '#374151',
            border: `1px solid ${filterType === t ? '#6366F1' : '#E5E7EB'}`,
            borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
            cursor: 'pointer', fontWeight: 600,
          }}>
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280', alignSelf: 'center' }}>
          {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px', background: '#F9FAFB',
          borderRadius: '14px', border: '2px dashed #E5E7EB',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔕</div>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No notifications yet</p>
          <button onClick={openCreate} style={{
            marginTop: '16px', background: '#6366F1', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
          }}>Send First Notification</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(n => (
            <div key={n._id} style={{
              background: '#fff', border: '1px solid #E5E7EB',
              borderRadius: '12px', padding: '16px',
              display: 'flex', gap: '14px', alignItems: 'flex-start',
            }}>
              <div style={{ flexShrink: 0 }}>
                <TypeBadge type={n.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.6 }}>{n.message}</div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#9CA3AF', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  {n.isGlobal && (
                    <span style={{ color: '#6366F1', fontWeight: 600 }}>🌐 Global</span>
                  )}
                  {n.targetRoles?.length > 0 && (
                    <span>👥 {n.targetRoles.join(', ')}</span>
                  )}
                  {(!n.targetRoles || n.targetRoles.length === 0) && !n.isGlobal && (
                    <span>—</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => openEdit(n)} style={{
                  background: '#F3F4F6', border: 'none', borderRadius: '7px',
                  padding: '6px 10px', cursor: 'pointer', fontSize: '13px',
                }}>✏️</button>
                <button onClick={() => handleDelete(n._id)} style={{
                  background: '#FEF2F2', border: 'none', borderRadius: '7px',
                  padding: '6px 10px', cursor: 'pointer', fontSize: '13px', color: '#EF4444',
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editTarget ? 'Edit Notification' : 'New Notification'}
          onClose={() => setShowModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title" />
            </div>
            <div>
              <label style={labelStyle}>Message *</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Notification message…" />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Roles</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                {ROLES.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                    <input type="checkbox" checked={form.targetRoles.includes(r)}
                      onChange={e => setForm(f => ({
                        ...f,
                        targetRoles: e.target.checked
                          ? [...f.targetRoles, r]
                          : f.targetRoles.filter(x => x !== r),
                      }))} />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
              <input type="checkbox" checked={form.isGlobal}
                onChange={e => setForm(f => ({ ...f, isGlobal: e.target.checked }))} />
              🌐 Send to all users (Global)
            </label>
            <div>
              <label style={labelStyle}>Action URL <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional — where clicking navigates)</span></label>
              <input style={inputStyle} value={form.actionUrl}
                onChange={e => setForm(f => ({ ...f, actionUrl: e.target.value }))}
                placeholder="e.g. /billing, /domains, /notifications" />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
              Leave roles empty + check Global to notify everyone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
                padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.message} style={{
                background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 24px',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700,
              }}>
                {saving ? 'Sending…' : (editTarget ? 'Update' : 'Send')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
