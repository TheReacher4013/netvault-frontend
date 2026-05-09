import React, { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';

const ROLES = ['superAdmin', 'admin', 'staff', 'client'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['draft', 'published', 'archived'];

const PRIORITY_META = {
  low: { color: 'var(--nv-muted)', bg: 'var(--nv-bg2)', label: 'Low', icon: '📢' },
  medium: { color: '#818CF8', bg: 'rgba(99,102,241,0.12)', label: 'Medium', icon: '📣' },
  high: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', label: 'High', icon: '🔔' },
  urgent: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', label: '🚨 Urgent', icon: '🚨' },
};

const STATUS_META = {
  draft: { color: 'var(--nv-muted)', bg: 'var(--nv-bg2)', label: 'Draft' },
  published: { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', label: '● Published' },
  archived: { color: 'var(--nv-muted)', bg: 'var(--nv-bg2)', label: 'Archived' },
};

const EMPTY_CUSTOM = {
  bgColor: '#ffffff',
  textColor: '#111827',
  accentColor: '#6366F1',
  buttonText: '',
  buttonLink: '',
  iconEmoji: '',
  imageUrl: '',
};

const initialForm = {
  title: '', content: '', priority: 'medium',
  status: 'draft', targetRoles: [], expiresAt: '',
  customization: { ...EMPTY_CUSTOM },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '9px 12px', border: '1.5px solid var(--nv-border)',
  borderRadius: '8px', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: 'var(--nv-bg2)', color: 'var(--nv-text)',
};
const lbl = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: 'var(--nv-muted)', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '.5px',
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

function ColorField({ label: lbTxt, value, onChange }) {
  return (
    <div>
      <div style={lbl}>{lbTxt}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{
            width: '40px', height: '36px', padding: '2px', border: '1.5px solid var(--nv-border)',
            borderRadius: '8px', cursor: 'pointer', background: 'var(--nv-bg2)'
          }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inp, flex: 1 }} maxLength={9} />
      </div>
    </div>
  );
}

// ─── Inline Preview ────────────────────────────────────────────────────────────
function InlinePreview({ form }) {
  const pm = PRIORITY_META[form.priority] || PRIORITY_META.medium;
  const c = { ...EMPTY_CUSTOM, ...(form.customization || {}) };
  const icon = c.iconEmoji || pm.icon;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.55)', borderRadius: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '28px', minHeight: '340px',
    }}>
      <div style={{
        background: c.bgColor, borderRadius: '20px', width: '100%', maxWidth: '420px',
        boxShadow: '0 32px 80px rgba(0,0,0,.28)',
        border: `1px solid ${c.accentColor}44`, overflow: 'hidden', fontFamily: 'inherit',
      }}>
        <div style={{ height: '4px', background: c.accentColor }} />
        {c.imageUrl && (
          <img src={c.imageUrl} alt=""
            onError={e => (e.currentTarget.style.display = 'none')}
            style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${c.accentColor}18`, border: `1px solid ${c.accentColor}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>{icon}</div>
            <div style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '1.2px', color: c.accentColor
            }}>{pm.label}</div>
          </div>
          <div style={{
            background: `${c.textColor}12`, borderRadius: '7px',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: `${c.textColor}88`, fontSize: '14px',
          }}>✕</div>
        </div>
        <div style={{ padding: '12px 20px 0' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.textColor, lineHeight: 1.3 }}>
            {form.title || 'Announcement Title'}
          </h2>
        </div>
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{
            background: `${c.accentColor}0d`, border: `1px solid ${c.accentColor}22`,
            borderRadius: '10px', padding: '12px 14px',
            fontSize: '13px', color: c.textColor, lineHeight: 1.7,
          }}>
            {form.content || 'Your announcement message will appear here…'}
          </div>
        </div>
        {c.buttonText && (
          <div style={{ padding: '12px 20px 0' }}>
            <div style={{
              background: c.accentColor, color: '#fff', borderRadius: '10px',
              padding: '10px 18px', fontSize: '13px', fontWeight: 700,
              display: 'inline-block', boxShadow: `0 4px 14px ${c.accentColor}44`,
            }}>{c.buttonText} →</div>
          </div>
        )}
        <div style={{ padding: '14px 20px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: c.accentColor, color: '#fff', borderRadius: '10px',
            padding: '8px 18px', fontSize: '12px', fontWeight: 700,
          }}>Done ✓</div>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, isSuperAdmin, onEdit, onDelete, onPublish }) {
  const [expanded, setExpanded] = useState(false);
  const pm = PRIORITY_META[announcement.priority] || PRIORITY_META.medium;
  const sm = STATUS_META[announcement.status] || STATUS_META.draft;
  const c = { ...EMPTY_CUSTOM, ...(announcement.customization || {}) };

  return (
    <div style={{
      background: 'var(--nv-surface)', border: '1px solid var(--nv-border)', borderRadius: '14px', overflow: 'hidden',
    }}>
      <div style={{ height: '4px', background: c.accentColor || pm.color, opacity: .7 }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-start',
          flexWrap: 'wrap', justifyContent: 'space-between'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <Badge meta={pm} />
              <Badge meta={sm} />
              {announcement.targetRoles?.length > 0 && (
                <span style={{
                  background: 'var(--nv-bg2)', color: 'var(--nv-muted)', borderRadius: '6px',
                  padding: '2px 10px', fontSize: '11px', fontWeight: 600
                }}>
                  👥 {announcement.targetRoles.join(', ')}
                </span>
              )}
              {c.buttonText && (
                <span style={{
                  background: 'rgba(74,222,128,0.12)', color: 'var(--nv-success)', borderRadius: '6px',
                  padding: '2px 10px', fontSize: '11px', fontWeight: 600
                }}>🔗 CTA</span>
              )}
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: 'var(--nv-text)' }}>
              {(c.iconEmoji || pm.icon) + ' '}{announcement.title}
            </h3>
            <p style={{
              margin: 0, fontSize: '13px', color: 'var(--nv-muted)', lineHeight: 1.6,
              ...(expanded ? {} : {
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }),
            }}>
              {announcement.content}
            </p>
            {announcement.content?.length > 120 && (
              <button onClick={() => setExpanded(v => !v)} style={{
                background: 'none', border: 'none', color: 'var(--nv-accent)',
                fontSize: '12px', cursor: 'pointer', padding: '4px 0', fontWeight: 600,
              }}>{expanded ? 'Show less ▲' : 'Read more ▼'}</button>
            )}
            {c.buttonText && c.buttonLink && (
              <a href={c.buttonLink} target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-block', marginTop: '10px',
                  background: c.accentColor, color: '#fff',
                  borderRadius: '8px', padding: '7px 16px',
                  fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                }}>{c.buttonText} →</a>
            )}
          </div>

          {isSuperAdmin && (
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
              {announcement.status === 'draft' && (
                <button onClick={() => onPublish(announcement._id)} style={{
                  background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px',
                  padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
                  color: 'var(--nv-success)', fontWeight: 700,
                }}>▶ Publish</button>
              )}
              <button onClick={() => onEdit(announcement)} style={{
                background: 'var(--nv-bg2)', border: 'none', borderRadius: '8px',
                padding: '6px 10px', cursor: 'pointer', fontSize: '13px',
              }}>✏️</button>
              <button onClick={() => onDelete(announcement._id)} style={{
                background: 'rgba(248,113,113,0.12)', border: 'none', borderRadius: '8px',
                padding: '6px 10px', cursor: 'pointer', fontSize: '13px', color: 'var(--nv-danger)',
              }}>🗑</button>
            </div>
          )}
        </div>

        <div style={{
          marginTop: '10px', fontSize: '11px', color: 'var(--nv-muted)',
          display: 'flex', gap: '16px', flexWrap: 'wrap'
        }}>
          <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
          {announcement.publishedAt && <span>Published: {new Date(announcement.publishedAt).toLocaleDateString()}</span>}
          {announcement.expiresAt && <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>}
          {announcement.createdBy && <span>By: {announcement.createdBy.name || announcement.createdBy.email}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnnouncementsPage({ userRole }) {
  const isSuperAdmin = userRole === 'superAdmin' || userRole === 'superadmin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [activeTab, setActiveTab] = useState('content');
  const [successMsg, setSuccessMsg] = useState('');

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
      setPagination({ total: res.data.total, pages: res.data.pages });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(1); setPage(1); }, [filterStatus, filterPriority]);

  const openCreate = () => {
    setForm(initialForm); setEditTarget(null); setActiveTab('content'); setShowModal(true);
  };
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
      if (editTarget) await announcementAPI.update(editTarget, payload);
      else await announcementAPI.create(payload);
      setShowModal(false);
      setSuccessMsg(editTarget ? 'Announcement updated!' : 'Announcement created!');
      fetchAll();
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

  const tabBtn = (active) => ({
    padding: '8px 18px', border: 'none',
    borderBottom: active ? '2px solid var(--nv-accent)' : '2px solid transparent',
    cursor: 'pointer', fontSize: '13px', fontWeight: 700,
    background: 'transparent',
    color: active ? 'var(--nv-accent)' : 'var(--nv-muted)',
    transition: 'all .15s',
  });

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

      {successMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#22C55E', color: '#fff', borderRadius: '12px',
          padding: '14px 20px', fontSize: '14px', fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,.18)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideUp .3s ease',
        }}>
          ✓ {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: '16px', marginLeft: '4px',
          }}>×</button>
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--nv-text)' }}>
            📢 Announcements
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--nv-muted)' }}>
            {isSuperAdmin
              ? 'Manage announcements with full popup customization'
              : 'Stay up to date with the latest announcements'}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} style={{
            background: 'var(--nv-accent)', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 18px', fontSize: '13px', cursor: 'pointer', fontWeight: 700,
          }}>+ New Announcement</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {isSuperAdmin && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid var(--nv-border)', borderRadius: '8px',
            fontSize: '13px', background: 'var(--nv-bg2)', color: 'var(--nv-text)', cursor: 'pointer',
          }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        )}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid var(--nv-border)', borderRadius: '8px',
          fontSize: '13px', background: 'var(--nv-bg2)', color: 'var(--nv-text)', cursor: 'pointer',
        }}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--nv-muted)', alignSelf: 'center' }}>
          {pagination.total} announcement{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--nv-muted)', fontSize: '14px' }}>Loading…</div>
      ) : announcements.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px', background: 'var(--nv-bg2)',
          borderRadius: '14px', border: '2px dashed var(--nv-border)'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: 'var(--nv-muted)', margin: 0, fontSize: '14px' }}>No announcements found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map(a => (
            <AnnouncementCard
              key={a._id} announcement={a}
              isSuperAdmin={isSuperAdmin}
              onEdit={openEdit} onDelete={handleDelete} onPublish={handlePublish}
            />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setPage(p); fetchAll(p); }} style={{
              background: p === page ? 'var(--nv-accent)' : 'var(--nv-bg2)',
              color: p === page ? '#fff' : 'var(--nv-text)',
              border: 'none', borderRadius: '8px', width: '36px', height: '36px',
              cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            }}>{p}</button>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px',
        }}>
          <div style={{
            background: 'var(--nv-surface)', borderRadius: '20px', width: '100%', maxWidth: '860px',
            boxShadow: '0 24px 80px rgba(0,0,0,.22)',
            maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', borderBottom: '1px solid var(--nv-border)', flexShrink: 0,
            }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--nv-text)' }}>
                {editTarget ? '✏️ Edit Announcement' : '✨ New Announcement'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'var(--nv-bg2)', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px',
              }}>×</button>
            </div>

            <div style={{
              display: 'flex', gap: '0', padding: '0 24px',
              borderBottom: '1px solid var(--nv-border)', flexShrink: 0
            }}>
              {[
                { key: 'content', label: '📝 Content' },
                { key: 'style', label: '🎨 Style' },
                { key: 'preview', label: '👁 Preview' },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ ...tabBtn(activeTab === t.key), marginTop: '8px' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>

              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={lbl}>Title *</label>
                    <input style={inp} value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Announcement title" />
                  </div>
                  <div>
                    <label style={lbl}>Message / Content *</label>
                    <textarea style={{ ...inp, resize: 'vertical', minHeight: '120px' }}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Write your announcement message…" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={lbl}>Priority</label>
                      <select style={{ ...inp }} value={form.priority}
                        onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Status</label>
                      <select style={inp} value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Target Roles (empty = all roles)</label>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {ROLES.map(r => (
                        <label key={r} style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          cursor: 'pointer', fontSize: '13px', color: 'var(--nv-text)'
                        }}>
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
                    <label style={lbl}>Expiry Date (optional)</label>
                    <input type="date" style={inp} value={form.expiresAt}
                      onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    background: 'rgba(3,105,161,0.1)', border: '1px solid rgba(3,105,161,0.3)', borderRadius: '10px',
                    padding: '12px 16px', fontSize: '13px', color: 'var(--nv-info)',
                  }}>
                    💡 All changes below reflect instantly in the <strong>Preview</strong> tab.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <ColorField label="Background Color" value={form.customization.bgColor} onChange={v => setC('bgColor', v)} />
                    <ColorField label="Text Color" value={form.customization.textColor} onChange={v => setC('textColor', v)} />
                    <ColorField label="Accent Color" value={form.customization.accentColor} onChange={v => setC('accentColor', v)} />
                  </div>
                  <div>
                    <label style={lbl}>Quick Color Presets</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        <button key={p.name}
                          onClick={() => { setC('bgColor', p.bg); setC('textColor', p.text); setC('accentColor', p.accent); }}
                          style={{
                            padding: '6px 14px', border: `2px solid ${p.accent}44`,
                            borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                            background: p.bg, color: p.text,
                          }}>{p.name}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'var(--nv-border)' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={lbl}>Icon / Emoji (optional)</label>
                      <input style={inp} value={form.customization.iconEmoji}
                        onChange={e => setC('iconEmoji', e.target.value)}
                        placeholder="e.g. 🎉  🚀  ⚡  🔔" maxLength={4} />
                      <div style={{ fontSize: '11px', color: 'var(--nv-muted)', marginTop: '4px' }}>Leave blank to use the priority icon</div>
                    </div>
                    <div>
                      <label style={lbl}>Banner Image URL (optional)</label>
                      <input style={inp} value={form.customization.imageUrl}
                        onChange={e => setC('imageUrl', e.target.value)}
                        placeholder="https://…/image.png" />
                      <div style={{ fontSize: '11px', color: 'var(--nv-muted)', marginTop: '4px' }}>Displays above title in the popup</div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'var(--nv-border)' }} />
                  <div>
                    <label style={lbl}>Call-to-Action Button (optional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={lbl}>Button Text</label>
                        <input style={inp} value={form.customization.buttonText}
                          onChange={e => setC('buttonText', e.target.value)} placeholder="e.g. Learn More" />
                      </div>
                      <div>
                        <label style={lbl}>Button Link</label>
                        <input style={inp} value={form.customization.buttonLink}
                          onChange={e => setC('buttonLink', e.target.value)} placeholder="https://…" />
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--nv-muted)', marginTop: '6px' }}>Leave both fields empty to hide the button</div>
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div>
                  <div style={{
                    fontSize: '13px', color: 'var(--nv-muted)', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span style={{
                      background: 'rgba(99,102,241,0.15)', color: 'var(--nv-accent)', borderRadius: '6px',
                      padding: '2px 10px', fontSize: '11px', fontWeight: 700
                    }}>LIVE PREVIEW</span>
                    This is exactly how the popup will appear to users
                  </div>
                  <InlinePreview form={form} />
                </div>
              )}
            </div>

            <div style={{
              display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderTop: '1px solid var(--nv-border)', flexShrink: 0,
            }}>
              <button
                onClick={() => setActiveTab(activeTab === 'preview' ? 'content' : 'preview')}
                style={{
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px',
                  padding: '9px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--nv-accent)',
                }}>
                {activeTab === 'preview' ? '← Back to Edit' : '👁 Preview'}
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} style={{
                  background: 'var(--nv-bg2)', border: '1px solid var(--nv-border)', borderRadius: '8px',
                  padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--nv-text)',
                }}>Cancel</button>
                <button onClick={handleSave}
                  disabled={saving || !form.title || !form.content}
                  style={{
                    background: saving ? 'var(--nv-muted)' : 'linear-gradient(135deg,var(--nv-accent),var(--nv-accent2))',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '10px 28px', cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: 700,
                    boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.25)',
                  }}>
                  {saving ? 'Saving…' : (editTarget ? '✓ Update' : '✓ Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}