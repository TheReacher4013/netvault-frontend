import React, { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';

const ROLES      = ['superadmin', 'admin', 'manager', 'user'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['draft', 'published', 'archived'];

const PRIORITY_META = {
  low:    { color: '#6B7280', bg: '#F9FAFB', label: 'Low' },
  medium: { color: '#3B82F6', bg: '#EFF6FF', label: 'Medium' },
  high:   { color: '#F59E0B', bg: '#FFFBEB', label: 'High' },
  urgent: { color: '#EF4444', bg: '#FEF2F2', label: '🚨 Urgent' },
};

const STATUS_META = {
  draft:     { color: '#6B7280', bg: '#F3F4F6', label: 'Draft' },
  published: { color: '#22C55E', bg: '#F0FDF4', label: '● Published' },
  archived:  { color: '#9CA3AF', bg: '#F9FAFB', label: 'Archived' },
};

const initialForm = {
  title: '', content: '', priority: 'medium',
  status: 'draft', targetRoles: [], expiresAt: '',
};

function Badge({ meta }) {
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      borderRadius: '6px', padding: '2px 10px',
      fontSize: '11px', fontWeight: 700,
      border: `1px solid ${meta.color}33`,
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
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
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

function AnnouncementCard({ announcement, isSuperAdmin, onEdit, onDelete, onPublish }) {
  const [expanded, setExpanded] = useState(false);
  const pm = PRIORITY_META[announcement.priority];
  const sm = STATUS_META[announcement.status];

  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px',
      overflow: 'hidden', transition: 'box-shadow .15s',
    }}>
      {/* Priority stripe */}
      <div style={{ height: '4px', background: pm.color, opacity: .6 }} />

      <div style={{ padding: '18px 20px' }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-start',
          flexWrap: 'wrap', justifyContent: 'space-between',
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <Badge meta={pm} />
              <Badge meta={sm} />
              {announcement.targetRoles?.length > 0 && (
                <span style={{
                  background: '#F3F4F6', color: '#374151', borderRadius: '6px',
                  padding: '2px 10px', fontSize: '11px', fontWeight: 600,
                }}>
                  👥 {announcement.targetRoles.join(', ')}
                </span>
              )}
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#111827' }}>
              {announcement.title}
            </h3>
            <p style={{
              margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.6,
              ...(expanded ? {} : {
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }),
            }}>
              {announcement.content}
            </p>
            {announcement.content?.length > 120 && (
              <button onClick={() => setExpanded(v => !v)} style={{
                background: 'none', border: 'none', color: '#6366F1',
                fontSize: '12px', cursor: 'pointer', padding: '4px 0', fontWeight: 600,
              }}>
                {expanded ? 'Show less ▲' : 'Read more ▼'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
            {isSuperAdmin && announcement.status === 'draft' && (
              <button onClick={() => onPublish(announcement._id)} style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
                padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
                color: '#15803D', fontWeight: 700,
              }}>
                Publish
              </button>
            )}
            {isSuperAdmin && (
              <>
                <button onClick={() => onEdit(announcement)} style={{
                  background: '#F3F4F6', border: 'none', borderRadius: '8px',
                  padding: '6px 10px', cursor: 'pointer', fontSize: '13px',
                }}>✏️</button>
                <button onClick={() => onDelete(announcement._id)} style={{
                  background: '#FEF2F2', border: 'none', borderRadius: '8px',
                  padding: '6px 10px', cursor: 'pointer', fontSize: '13px',
                }}>🗑</button>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: '10px', fontSize: '11px', color: '#9CA3AF', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
          {announcement.publishedAt && <span>Published: {new Date(announcement.publishedAt).toLocaleDateString()}</span>}
          {announcement.expiresAt && <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>}
          {announcement.createdBy && <span>By: {announcement.createdBy.name || announcement.createdBy.email}</span>}
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage({ userRole }) {
  const isSuperAdmin = userRole === 'superadmin';
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [form, setForm]                   = useState(initialForm);
  const [saving, setSaving]               = useState(false);
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState({ total: 0, pages: 1 });

  const fetchAll = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 10 };
      if (filterStatus)   params.status   = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await announcementAPI.getAll(params);
      setAnnouncements(res.data.announcements || []);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(1); setPage(1); }, [filterStatus, filterPriority]);

  const openCreate = () => { setForm(initialForm); setEditTarget(null); setShowModal(true); };
  const openEdit   = (a) => {
    setForm({
      title: a.title, content: a.content, priority: a.priority,
      status: a.status, targetRoles: a.targetRoles || [],
      expiresAt: a.expiresAt ? a.expiresAt.split('T')[0] : '',
    });
    setEditTarget(a._id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || undefined };
      if (editTarget) await announcementAPI.update(editTarget, payload);
      else            await announcementAPI.create(payload);
      setShowModal(false);
      fetchAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await announcementAPI.remove(id);
    fetchAll();
  };

  const handlePublish = async (id) => {
    await announcementAPI.publish(id);
    fetchAll();
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            📢 Announcements
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            {isSuperAdmin ? 'Manage announcements for all roles' : 'Stay up to date with the latest announcements'}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} style={{
            background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 18px', fontSize: '13px', cursor: 'pointer', fontWeight: 700,
          }}>
            + New Announcement
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {isSuperAdmin && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px',
            fontSize: '13px', background: '#fff', cursor: 'pointer',
          }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        )}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px',
          fontSize: '13px', background: '#fff', cursor: 'pointer',
        }}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280', alignSelf: 'center' }}>
          {pagination.total} announcement{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>Loading…</div>
      ) : announcements.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px', background: '#F9FAFB',
          borderRadius: '14px', border: '2px dashed #E5E7EB',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No announcements found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(a => (
            <AnnouncementCard
              key={a._id}
              announcement={a}
              isSuperAdmin={isSuperAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onPublish={handlePublish}
            />
          ))}
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
        <Modal title={editTarget ? 'Edit Announcement' : 'New Announcement'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title" />
            </div>
            <div>
              <label style={labelStyle}>Content *</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write the announcement content…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={inputStyle} value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Target Roles (empty = all roles)</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
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
            <div>
              <label style={labelStyle}>Expiry Date (optional)</label>
              <input type="date" style={inputStyle} value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
                padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.content} style={{
                background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '10px 24px',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700,
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
