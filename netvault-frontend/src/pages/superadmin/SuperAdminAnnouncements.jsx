import React, { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';

const ROLES = ['superAdmin', 'admin', 'staff', 'client'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['draft', 'published', 'archived'];

const PRIORITY_META = {
  low: { color: '#6B7280', bg: '#F9FAFB', label: 'Low', icon: '📢' },
  medium: { color: '#6366F1', bg: '#EEF2FF', label: 'Medium', icon: '📣' },
  high: { color: '#F59E0B', bg: '#FFFBEB', label: 'High', icon: '🔔' },
  urgent: { color: '#EF4444', bg: '#FEF2F2', label: '🚨 Urgent', icon: '🚨' },
};

const STATUS_META = {
  draft: { color: '#6B7280', bg: '#F3F4F6', label: 'Draft' },
  published: { color: '#22C55E', bg: '#F0FDF4', label: '● Published' },
  archived: { color: '#9CA3AF', bg: '#F9FAFB', label: 'Archived' },
};

const EMPTY_CUSTOM = {
  bgColor: '#ffffff', textColor: '#111827', accentColor: '#6366F1',
  buttonText: '', buttonLink: '', iconEmoji: '', imageUrl: '',
};

const initialForm = {
  title: '', content: '', priority: 'medium',
  status: 'draft', targetRoles: [], expiresAt: '',
  customization: { ...EMPTY_CUSTOM },
};

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB',
  borderRadius: '8px', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
};

function Badge({ meta }) {
  return (
    <span style={{
      background: meta.bg, color: meta.color, borderRadius: '6px',
      padding: '2px 10px', fontSize: '11px', fontWeight: 700,
      border: `1px solid ${meta.color}33`,
    }}>{meta.label}</span>
  );
}

function PopupPreview({ form }) {
  const { title, content, priority, customization: c } = form;
  const pm = PRIORITY_META[priority] || PRIORITY_META.medium;
  const icon = c.iconEmoji || pm.icon;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.55)', borderRadius: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', minHeight: '280px',
    }}>
      <div style={{
        background: c.bgColor, borderRadius: '20px', width: '100%', maxWidth: '380px',
        boxShadow: '0 32px 80px rgba(0,0,0,.28)',
        border: `1px solid ${c.accentColor}44`, overflow: 'hidden', fontFamily: 'inherit',
      }}>
        <div style={{ height: '4px', background: c.accentColor }} />
        {c.imageUrl && (
          <img src={c.imageUrl} alt="" onError={e => e.currentTarget.style.display = 'none'}
            style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: `${c.accentColor}18`, border: `1px solid ${c.accentColor}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>{icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: c.accentColor }}>{pm.label}</div>
          </div>
          <div style={{
            background: '#00000010', borderRadius: '7px',
            width: '26px', height: '26px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#888', fontSize: '13px',
          }}>✕</div>
        </div>
        <div style={{ padding: '10px 18px 0' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: c.textColor, lineHeight: 1.3 }}>
            {title || 'Announcement Title'}
          </h2>
        </div>
        <div style={{ padding: '8px 18px 0' }}>
          <div style={{
            background: `${c.accentColor}0d`, border: `1px solid ${c.accentColor}22`,
            borderRadius: '10px', padding: '10px 12px',
            fontSize: '12px', color: c.textColor, lineHeight: 1.7,
          }}>
            {content || 'Your announcement message will appear here…'}
          </div>
        </div>
        {c.buttonText && (
          <div style={{ padding: '10px 18px 0' }}>
            <div style={{
              background: c.accentColor, color: '#fff', borderRadius: '8px',
              padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-block',
            }}>{c.buttonText}</div>
          </div>
        )}
        <div style={{ padding: '12px 18px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: c.accentColor, color: '#fff', borderRadius: '8px', padding: '7px 14px', fontSize: '11px', fontWeight: 700 }}>Done ✓</div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '38px', height: '34px', padding: '2px', border: '1.5px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', background: '#fff' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, flex: 1 }} maxLength={9} />
      </div>
    </div>
  );
}

function AnnouncementCard({ a, onEdit, onDelete, onPublish }) {
  const pm = PRIORITY_META[a.priority] || PRIORITY_META.medium;
  const sm = STATUS_META[a.status] || STATUS_META.draft;
  const c = a.customization || {};
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ height: '4px', background: c.accentColor || pm.color, opacity: .7 }} />
      <div style={{ padding: '14px 16px' }}>
        {/* badges row */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <Badge meta={pm} />
          <Badge meta={sm} />
          {a.targetRoles?.length > 0
            ? <span style={{ background: '#F3F4F6', color: '#374151', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>👥 {a.targetRoles.join(', ')}</span>
            : <span style={{ background: '#EEF2FF', color: '#6366F1', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>🌐 All Roles</span>
          }
          {c.buttonText && <span style={{ background: '#F0FDF4', color: '#15803D', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>🔗 CTA</span>}
        </div>
        {/* title + content */}
        <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>{a.title}</h3>
        <p style={{
          margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{a.content}</p>
        {/* meta + actions row */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span>Created: {new Date(a.createdAt).toLocaleDateString()}</span>
            {a.publishedAt && <span>Published: {new Date(a.publishedAt).toLocaleDateString()}</span>}
            {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
            {a.createdBy && <span>By: {a.createdBy.name || a.createdBy.email}</span>}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {a.status === 'draft' && (
              <button onClick={() => onPublish(a._id)} style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
                padding: '5px 10px', cursor: 'pointer', fontSize: '11px', color: '#15803D', fontWeight: 700, whiteSpace: 'nowrap',
              }}>▶ Publish</button>
            )}
            <button onClick={() => onEdit(a)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', padding: '5px 9px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
            <button onClick={() => onDelete(a._id)} style={{ background: '#FEF2F2', border: 'none', borderRadius: '8px', padding: '5px 9px', cursor: 'pointer', fontSize: '12px', color: '#EF4444' }}>🗑</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [activeTab, setActiveTab] = useState('content');

  const setC = (key, val) =>
    setForm(f => ({ ...f, customization: { ...f.customization, [key]: val } }));

  const fetchAll = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await announcementAPI.getAll(params);
      setAnnouncements(res.data.announcements || []);
      setPagination({ total: res.data.total || 0, pages: res.data.pages || 1 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(1); setPage(1); }, [filterStatus, filterPriority]);

  const openCreate = () => { setForm(initialForm); setEditTarget(null); setActiveTab('content'); setShowModal(true); };
  const openEdit = (a) => {
    setForm({
      title: a.title, content: a.content, priority: a.priority,
      status: a.status, targetRoles: a.targetRoles || [],
      expiresAt: a.expiresAt ? a.expiresAt.split('T')[0] : '',
      customization: { ...EMPTY_CUSTOM, ...(a.customization || {}) },
    });
    setEditTarget(a._id); setActiveTab('content'); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || undefined };
      if (editTarget) {
        await announcementAPI.update(editTarget, payload);
        setSuccessMsg('Announcement updated successfully!');
      } else {
        await announcementAPI.create(payload);
        setSuccessMsg('Announcement created successfully!');
      }
      setShowModal(false); fetchAll();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await announcementAPI.remove(id); fetchAll();
  };

  const handlePublish = async (id) => {
    await announcementAPI.publish(id); fetchAll();
  };

  const tabBtn = (key, label) => ({
    padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
    background: activeTab === key ? '#6366F1' : 'transparent',
    color: activeTab === key ? '#fff' : '#6B7280',
    borderBottom: activeTab === key ? '2px solid #6366F1' : '2px solid transparent',
    borderRadius: '0', transition: 'all .15s',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ padding: 'clamp(12px, 4vw, 24px)', maxWidth: '980px', margin: '0 auto' }}>
      <style>{`
        @keyframes popIn{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}
        .ann-modal-body { overflow-y: auto; flex: 1; padding: 20px; }
        .ann-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ann-color-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .ann-cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ann-tabbar { display: flex; gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ann-tabbar::-webkit-scrollbar { display: none; }
        .ann-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .ann-filter-sel { padding: 8px 10px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; background: #fff; cursor: pointer; }
        .ann-header { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .ann-modal-footer { display: flex; gap: 8px; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid #F3F4F6; flex-shrink: 0; flex-wrap: wrap; }
        @media (max-width: 600px) {
          .ann-grid-2 { grid-template-columns: 1fr; }
          .ann-color-grid { grid-template-columns: 1fr 1fr; }
          .ann-cta-grid { grid-template-columns: 1fr; }
          .ann-filter-sel { flex: 1 1 120px; }
          .ann-modal-footer { flex-direction: column-reverse; }
          .ann-modal-footer > div { width: 100%; }
          .ann-modal-footer button { flex: 1; }
        }
        @media (max-width: 480px) {
          .ann-color-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Success popup */}
      {successMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: 'clamp(28px,6vw,40px) clamp(24px,6vw,48px)', textAlign: 'center', maxWidth: '380px', width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,.2)', animation: 'popIn .3s ease' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>✓</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#111827' }}>Done!</h2>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 28px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>Got it</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ann-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(18px,4vw,22px)', fontWeight: 800, color: '#111827' }}>📢 Announcements</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>Create and manage announcements with popup customization</p>
        </div>
        <button onClick={openCreate} style={{
          background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap',
        }}>+ New Announcement</button>
      </div>

      {/* Filters */}
      <div className="ann-filters">
        <select className="" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>{pagination.total} total</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>Loading…</div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#F9FAFB', borderRadius: '14px', border: '2px dashed #E5E7EB' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>No announcements yet</p>
          <button onClick={openCreate} style={{ marginTop: '14px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Create First Announcement</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map(a => (
            <AnnouncementCard key={a._id} a={a} onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setPage(p); fetchAll(p); }} style={{
              background: p === page ? '#6366F1' : '#F3F4F6',
              color: p === page ? '#fff' : '#374151',
              border: 'none', borderRadius: '8px', minWidth: '36px', height: '36px',
              padding: '0 10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            }}>{p}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000, padding: '0' }}>
          <style>{`
            @media (min-width: 640px) {
              .ann-modal-wrap { align-items: center !important; padding: 16px !important; }
              .ann-modal-box { border-radius: 20px !important; max-height: 94vh !important; }
            }
          `}</style>
          <div className="ann-modal-wrap" style={{ display: 'contents' }}>
            <div className="ann-modal-box" style={{
              background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '860px',
              boxShadow: '0 -8px 40px rgba(0,0,0,.2)', maxHeight: '96vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                  {editTarget ? '✏️ Edit Announcement' : '✨ New Announcement'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>

              {/* Tab bar — scrollable on mobile */}
              <div className="ann-tabbar" style={{ borderBottom: '1px solid #F3F4F6', flexShrink: 0, padding: '0 8px' }}>
                {[['content', '📝 Content'], ['style', '🎨 Style'], ['preview', '👁 Preview']].map(([key, lbl]) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={tabBtn(key, lbl)}>{lbl}</button>
                ))}
              </div>

              {/* Body */}
              <div className="ann-modal-body">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Title *</div>
                      <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Message / Content *</div>
                      <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement message…" />
                    </div>
                    <div className="ann-grid-2">
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Priority</div>
                        <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Status</div>
                        <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Target Roles (empty = all roles)</div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {ROLES.map(r => (
                          <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                            <input type="checkbox" checked={form.targetRoles.includes(r)}
                              onChange={e => setForm(f => ({ ...f, targetRoles: e.target.checked ? [...f.targetRoles, r] : f.targetRoles.filter(x => x !== r) }))} />
                            {r}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Expiry Date (optional)</div>
                      <input type="date" style={inputStyle} value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* STYLE TAB */}
                {activeTab === 'style' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#0369A1' }}>
                      💡 Changes reflect instantly in the <strong>Preview</strong> tab.
                    </div>
                    <div className="ann-color-grid">
                      <ColorField label="Background" value={form.customization.bgColor} onChange={v => setC('bgColor', v)} />
                      <ColorField label="Text Color" value={form.customization.textColor} onChange={v => setC('textColor', v)} />
                      <ColorField label="Accent" value={form.customization.accentColor} onChange={v => setC('accentColor', v)} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Quick Presets</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { name: 'Default', bg: '#ffffff', text: '#111827', accent: '#6366F1' },
                          { name: 'Dark', bg: '#1F2937', text: '#F9FAFB', accent: '#6366F1' },
                          { name: 'Success', bg: '#F0FDF4', text: '#14532D', accent: '#22C55E' },
                          { name: 'Warning', bg: '#FFFBEB', text: '#78350F', accent: '#F59E0B' },
                          { name: 'Danger', bg: '#FEF2F2', text: '#7F1D1D', accent: '#EF4444' },
                          { name: 'Ocean', bg: '#EFF6FF', text: '#1E3A5F', accent: '#3B82F6' },
                          { name: 'Purple', bg: '#FAF5FF', text: '#4C1D95', accent: '#8B5CF6' },
                          { name: 'Midnight', bg: '#0F172A', text: '#E2E8F0', accent: '#38BDF8' },
                        ].map(p => (
                          <button key={p.name} onClick={() => { setC('bgColor', p.bg); setC('textColor', p.text); setC('accentColor', p.accent); }}
                            style={{ padding: '5px 12px', border: `2px solid ${p.accent}44`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: p.bg, color: p.text }}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: '1px', background: '#F3F4F6' }} />
                    <div className="ann-grid-2">
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Icon / Emoji</div>
                        <input style={inputStyle} value={form.customization.iconEmoji} onChange={e => setC('iconEmoji', e.target.value)} placeholder="🎉  🚀  ⚡" maxLength={4} />
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>Blank = priority icon</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Banner Image URL</div>
                        <input style={inputStyle} value={form.customization.imageUrl} onChange={e => setC('imageUrl', e.target.value)} placeholder="https://…/image.png" />
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>Above the title in popup</div>
                      </div>
                    </div>
                    <div style={{ height: '1px', background: '#F3F4F6' }} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Call-to-Action Button (optional)</div>
                      <div className="ann-cta-grid">
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>Button Text</div>
                          <input style={inputStyle} value={form.customization.buttonText} onChange={e => setC('buttonText', e.target.value)} placeholder="e.g. Learn More" />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>Button Link</div>
                          <input style={inputStyle} value={form.customization.buttonLink} onChange={e => setC('buttonLink', e.target.value)} placeholder="https://…" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PREVIEW TAB */}
                {activeTab === 'preview' && (
                  <div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#EEF2FF', color: '#6366F1', borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>LIVE</span>
                      Exactly how the popup will appear to users
                    </div>
                    <PopupPreview form={form} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="ann-modal-footer">
                <button onClick={() => setActiveTab(activeTab === 'preview' ? 'content' : 'preview')}
                  style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#6366F1' }}>
                  {activeTab === 'preview' ? '← Back to Edit' : '👁 Preview'}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowModal(false)} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving || !form.title || !form.content}
                    style={{ background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 22px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
                    {saving ? 'Saving…' : (editTarget ? '✓ Update' : '✓ Create')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}