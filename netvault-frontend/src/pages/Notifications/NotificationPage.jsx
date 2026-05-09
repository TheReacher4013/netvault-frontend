import React, { useState, useEffect } from 'react'
import { notificationService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Bell, Info, CheckCircle, AlertTriangle, XCircle,
  Plus, Check, CheckCheck, Trash2, Pencil, X, Loader2
} from 'lucide-react'

const ROLES = ['superAdmin', 'admin', 'staff', 'client']
const TYPES = ['info', 'warning', 'success', 'error']

const TYPE_META = {
  info: { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', Icon: Info, label: 'Info' },
  success: { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', Icon: CheckCircle, label: 'Success' },
  warning: { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', Icon: AlertTriangle, label: 'Warning' },
  error: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', Icon: XCircle, label: 'Error' },
}

const initialForm = { title: '', message: '', type: 'info', targetRoles: [], isGlobal: false, actionUrl: '' }

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ type }) {
  const m = TYPE_META[type] || TYPE_META.info
  const { Icon } = m
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: '6px', padding: '3px 10px',
      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <Icon size={11} /> {m.label}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '16px',
    }}>
      <div style={{
        background: 'var(--nv-surface)', borderRadius: '20px', width: '100%', maxWidth: '540px',
        boxShadow: '0 24px 80px rgba(0,0,0,.2)',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'popIn .25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <style>{`@keyframes popIn { from { opacity:0;transform:scale(.94) } to { opacity:1;transform:scale(1) } }`}</style>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--nv-border)', position: 'sticky', top: 0, background: 'var(--nv-surface)', zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--nv-text)' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'var(--nv-bg2)', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={15} color="#6B7280" /></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Field helpers ─────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '10px 12px', border: '1.5px solid var(--nv-border)',
  borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: 'var(--nv-bg2)', color: 'var(--nv-text)',
}
const lbl = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--nv-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }

// ── Success popup ─────────────────────────────────────────────────────────────
function SuccessPopup({ msg, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '40px 48px',
        textAlign: 'center', maxWidth: '380px', width: '100%',
        boxShadow: '0 32px 100px rgba(0,0,0,.22)',
        animation: 'popIn .3s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{
          width: '68px', height: '68px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <Bell size={28} color="#fff" />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#111827' }}>Sent!</h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>{msg}</p>
        <button onClick={onClose} style={{
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
          border: 'none', borderRadius: '12px', padding: '12px 32px',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%',
        }}>Got it ✓</button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superAdmin'

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await notificationService.getAll({ limit: 100 })
      setNotifications(res.data?.data?.notifications || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setForm(initialForm); setEditTarget(null); setShowModal(true) }
  const openEdit = (n) => {
    setForm({ title: n.title, message: n.message, type: n.type, targetRoles: n.targetRoles || [], isGlobal: n.isGlobal, actionUrl: n.actionUrl || '' })
    setEditTarget(n._id); setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editTarget) {
        await notificationService.update(editTarget, form)
        setSuccessMsg('Notification updated successfully!')
      } else {
        await notificationService.create(form)
        setSuccessMsg('Notification sent successfully!')
      }
      setShowModal(false); fetchAll()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return
    await notificationService.remove(id)
    setNotifications(prev => prev.filter(n => n._id !== id))
  }

  const handleMarkRead = async (id) => {
    await notificationService.markRead(id)
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const filtered = filterType ? notifications.filter(n => n.type === filterType) : notifications
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto', color: 'var(--nv-text)' }}>

      {successMsg && <SuccessPopup msg={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* ── Page header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--nv-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={22} /> Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--nv-muted)' }}>
            {isSuperAdmin ? 'Send and manage notifications to specific roles' : 'Notifications sent to you by Admin'}
            {unreadCount > 0 && <span style={{ color: '#6366F1', fontWeight: 700 }}> · {unreadCount} unread</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--nv-bg2)', border: '1px solid var(--nv-border)', borderRadius: '10px',
              padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: 'var(--nv-text)',
            }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={openCreate} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#6366F1', color: '#fff', border: 'none', borderRadius: '10px',
              padding: '8px 16px', fontSize: '12px', cursor: 'pointer', fontWeight: 700,
            }}>
              <Plus size={14} /> New Notification
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      {!isSuperAdmin && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '10px',
          padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--nv-info)',
        }}>
          <Info size={14} />
          These are messages broadcast to your role. For system alerts visit the <strong style={{ marginLeft: '3px' }}>Alert Center</strong>.
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['', ...TYPES].map(t => {
          const meta = TYPE_META[t]
          const active = filterType === t
          return (
            <button key={t} onClick={() => setFilterType(t)} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: active ? '#6366F1' : 'var(--nv-bg2)',
              color: active ? '#fff' : 'var(--nv-text)',
              border: `1px solid ${active ? '#6366F1' : 'var(--nv-border)'}`,
              borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
              cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
            }}>
              {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        })}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '10px', color: 'var(--nv-muted)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
          <span style={{ fontSize: '13px' }}>Loading notifications…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--nv-bg2)', borderRadius: '16px', border: '2px dashed var(--nv-border)',
        }}>
          <Bell size={36} color="#D1D5DB" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--nv-muted)', margin: '0 0 16px', fontSize: '14px', fontWeight: 500 }}>No notifications found</p>
          {isSuperAdmin && (
            <button onClick={openCreate} style={{
              background: '#6366F1', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            }}>Send First Notification</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.info
            const { Icon } = meta
            return (
              <div key={n._id} style={{
                background: n.isRead ? 'var(--nv-surface)' : 'var(--nv-bg2)',
                border: `1px solid ${n.isRead ? 'var(--nv-border)' : '#C7D2FE'}`,
                borderRadius: '14px', padding: '16px 18px',
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                transition: 'box-shadow .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Type icon */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: meta.bg, border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} color={meta.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: '14px', color: 'var(--nv-text)' }}>
                      {n.title}
                    </span>
                    <Badge type={n.type} />
                    {!n.isRead && (
                      <span style={{
                        background: '#6366F1', color: '#fff',
                        borderRadius: '999px', fontSize: '10px', padding: '1px 8px', fontWeight: 700,
                      }}>NEW</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--nv-muted)', lineHeight: 1.65 }}>{n.message}</div>
                  <div style={{ marginTop: '7px', fontSize: '11px', color: 'var(--nv-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span>{new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {n.isGlobal && <span>🌐 Global</span>}
                    {n.targetRoles?.length > 0 && <span>👥 {n.targetRoles.join(', ')}</span>}
                    {n.createdBy?.name && <span>by {n.createdBy.name}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {!n.isRead && (
                    <button onClick={() => handleMarkRead(n._id)} title="Mark read" style={{
                      background: 'var(--nv-bg2)', border: 'none', borderRadius: '8px',
                      padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}><Check size={13} color="#6366F1" /></button>
                  )}
                  {isSuperAdmin && (
                    <>
                      <button onClick={() => openEdit(n)} style={{
                        background: 'var(--nv-bg2)', border: 'none', borderRadius: '8px',
                        padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}><Pencil size={13} color="#374151" /></button>
                      <button onClick={() => handleDelete(n._id)} style={{
                        background: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: '8px',
                        padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}><Trash2 size={13} color="#EF4444" /></button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Notification' : 'New Notification'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={lbl}>Title *</label>
              <input style={inp} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title" />
            </div>

            <div>
              <label style={lbl}>Message *</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: '80px' }}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Notification message" />
            </div>

            <div>
              <label style={lbl}>Type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TYPES.map(t => {
                  const m = TYPE_META[t]
                  const sel = form.type === t
                  return (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', border: `1.5px solid ${sel ? m.color : 'var(--nv-border)'}`,
                      background: sel ? m.bg : 'var(--nv-bg2)', color: sel ? m.color : 'var(--nv-muted)',
                      transition: 'all .15s',
                    }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={lbl}>Target Roles</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {ROLES.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--nv-text)', userSelect: 'none' }}>
                    <input type="checkbox" checked={form.targetRoles.includes(r)}
                      onChange={e => setForm(f => ({
                        ...f, targetRoles: e.target.checked ? [...f.targetRoles, r] : f.targetRoles.filter(x => x !== r),
                      }))} />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--nv-text)', fontWeight: 600, userSelect: 'none' }}>
              <input type="checkbox" checked={form.isGlobal}
                onChange={e => setForm(f => ({ ...f, isGlobal: e.target.checked }))} />
              🌐 Send to all users (Global)
            </label>

            <div>
              <label style={lbl}>Action URL <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none' }}>(optional)</span></label>
              <input style={inp} value={form.actionUrl}
                onChange={e => setForm(f => ({ ...f, actionUrl: e.target.value }))}
                placeholder="e.g. /billing, /domains" />
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--nv-muted)' }}>
              Leave roles empty + check Global to notify everyone.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button onClick={() => setShowModal(false)} style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '10px',
                padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.message} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: saving ? '#9CA3AF' : '#6366F1', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '10px 24px',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700,
              }}>
                {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {saving ? 'Saving…' : editTarget ? 'Update' : 'Send'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}