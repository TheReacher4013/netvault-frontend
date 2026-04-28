import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';

const ROLES = ['superadmin', 'admin', 'manager', 'user'];
const TYPES = ['info', 'warning', 'success', 'error'];

const TYPE_META = {
  info:    { color: '#3B82F6', bg: '#EFF6FF', label: 'Info' },
  success: { color: '#22C55E', bg: '#F0FDF4', label: 'Success' },
  warning: { color: '#F59E0B', bg: '#FFFBEB', label: 'Warning' },
  error:   { color: '#EF4444', bg: '#FEF2F2', label: 'Error' },
};

const initialForm = {
  title: '', message: '', type: 'info',
  targetRoles: [], isGlobal: false,
};

function Badge({ type }) {
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

export default function NotificationsPage({ userRole }) {
  const isSuperAdmin = userRole === 'superadmin';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [form, setForm]                   = useState(initialForm);
  const [saving, setSaving]               = useState(false);
  const [filterType, setFilterType]       = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setForm(initialForm); setEditTarget(null); setShowModal(true); };
  const openEdit   = (n)  => {
    setForm({ title: n.title, message: n.message, type: n.type, targetRoles: n.targetRoles || [], isGlobal: n.isGlobal });
    setEditTarget(n._id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) await notificationAPI.update(editTarget, form);
      else            await notificationAPI.create(form);
      setShowModal(false);
      fetchAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    await notificationAPI.remove(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const handleMarkRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filtered = filterType ? notifications.filter(n => n.type === filterType) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            🔔 Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            {isSuperAdmin ? 'Manage system notifications' : 'Your notifications'}
            {unreadCount > 0 && <span style={{ color: '#3B82F6', fontWeight: 600 }}> · {unreadCount} unread</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{
              background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: '#374151',
            }}>
              ✓ Mark all read
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={openCreate} style={{
              background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 700,
            }}>
              + New Notification
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['', ...TYPES].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            background: filterType === t ? '#6366F1' : '#F9FAFB',
            color: filterType === t ? '#fff' : '#374151',
            border: `1px solid ${filterType === t ? '#6366F1' : '#E5E7EB'}`,
            borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
            cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
          }}>
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
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
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No notifications found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(n => (
            <div key={n._id} style={{
              background: n.isRead ? '#fff' : '#F5F7FF',
              border: `1px solid ${n.isRead ? '#E5E7EB' : '#C7D2FE'}`,
              borderRadius: '12px', padding: '16px',
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              transition: 'box-shadow .15s',
            }}>
              <div style={{ flexShrink: 0 }}>
                <Badge type={n.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: n.isRead ? 500 : 700, fontSize: '14px',
                  color: '#111827', marginBottom: '4px',
                }}>
                  {n.title}
                  {!n.isRead && (
                    <span style={{
                      marginLeft: '8px', background: '#6366F1', color: '#fff',
                      borderRadius: '999px', fontSize: '10px', padding: '1px 7px', fontWeight: 700,
                    }}>NEW</span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.6 }}>{n.message}</div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#9CA3AF' }}>
                  {new Date(n.createdAt).toLocaleString()}
                  {n.isGlobal && <span style={{ marginLeft: '8px', color: '#6B7280' }}>· Global</span>}
                  {n.targetRoles?.length > 0 && (
                    <span style={{ marginLeft: '8px', color: '#6B7280' }}>
                      · Roles: {n.targetRoles.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {!n.isRead && (
                  <button onClick={() => handleMarkRead(n._id)} title="Mark read" style={{
                    background: '#EEF2FF', border: 'none', borderRadius: '7px',
                    padding: '6px 10px', cursor: 'pointer', fontSize: '13px', color: '#6366F1',
                  }}>✓</button>
                )}
                {isSuperAdmin && (
                  <>
                    <button onClick={() => openEdit(n)} style={{
                      background: '#F3F4F6', border: 'none', borderRadius: '7px',
                      padding: '6px 10px', cursor: 'pointer', fontSize: '13px', color: '#374151',
                    }}>✏️</button>
                    <button onClick={() => handleDelete(n._id)} style={{
                      background: '#FEF2F2', border: 'none', borderRadius: '7px',
                      padding: '6px 10px', cursor: 'pointer', fontSize: '13px', color: '#EF4444',
                    }}>🗑</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Notification' : 'New Notification'} onClose={() => setShowModal(false)}>
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
                placeholder="Notification message" />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Roles (empty = use Global toggle)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
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
              Send to all users (Global)
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
                padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.message} style={{
                background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 24px', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 700,
              }}>
                {saving ? 'Saving…' : (editTarget ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
