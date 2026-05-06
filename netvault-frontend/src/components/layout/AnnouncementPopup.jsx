import { useState, useEffect } from 'react'
import { announcementAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const SESSION_KEY = 'nv_seen_announcements'

const PRIORITY_CONFIG = {
  low:    { color: '#6B7280', icon: '📢', label: 'Announcement'   },
  medium: { color: '#6366F1', icon: '📣', label: 'Announcement'   },
  high:   { color: '#F59E0B', icon: '🔔', label: 'Important Update'},
  urgent: { color: '#EF4444', icon: '🚨', label: 'Urgent Notice'  },
}

function getSeenIds() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]') } catch { return [] }
}
function markAllSeen(ids) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids))
}

export default function AnnouncementPopup() {
  const { user }   = useAuth()
  const [queue, setQueue]     = useState([])
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!user || user.role === 'superAdmin') return
    const load = async () => {
      try {
        const res  = await announcementAPI.getAll({ limit: 50 })
        const all  = res.data?.announcements || []
        const seen = getSeenIds()
        const unseen = all.filter(a => !seen.includes(a._id))
        if (unseen.length > 0) { setQueue(unseen); setCurrent(0); setVisible(true) }
      } catch (e) { console.error('AnnouncementPopup fetch error', e) }
    }
    load()
  }, [user])

  if (!visible || queue.length === 0) return null

  const ann = queue[current]
  const cfg = PRIORITY_CONFIG[ann?.priority] || PRIORITY_CONFIG.medium

  // ── pull customization with safe defaults ──────────────────────────────────
  const c = {
    bgColor:     ann.customization?.bgColor     || '#ffffff',
    textColor:   ann.customization?.textColor   || '#111827',
    accentColor: ann.customization?.accentColor || cfg.color,
    buttonText:  ann.customization?.buttonText  || '',
    buttonLink:  ann.customization?.buttonLink  || '',
    iconEmoji:   ann.customization?.iconEmoji   || cfg.icon,
    imageUrl:    ann.customization?.imageUrl    || '',
  }

  const isLast  = current === queue.length - 1
  const isFirst = current === 0

  const close = () => {
    setLeaving(true)
    setTimeout(() => { markAllSeen(queue.map(a => a._id)); setVisible(false) }, 260)
  }
  const next = () => { if (isLast) close(); else setCurrent(i => i + 1) }
  const prev = () => { if (!isFirst) setCurrent(i => i - 1) }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.62)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
      animation: leaving ? 'nvFadeOut .26s ease forwards' : 'nvFadeIn .22s ease',
    }}>
      <style>{`
        @keyframes nvFadeIn  { from { opacity:0 }                              to { opacity:1 } }
        @keyframes nvFadeOut { from { opacity:1 }                              to { opacity:0 } }
        @keyframes nvPopIn   { from { opacity:0; transform:scale(.93) translateY(18px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes nvPopOut  { from { opacity:1; transform:scale(1)  }         to { opacity:0; transform:scale(.93) } }
        .nv-cta-btn:hover    { opacity:.88 !important; }
        .nv-close-btn:hover  { background:#00000022 !important; }
        .nv-nav-btn:hover    { background:#F3F4F6 !important; }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '490px',
        animation: leaving ? 'nvPopOut .26s ease forwards' : 'nvPopIn .3s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: c.bgColor,
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
          border: `1px solid ${c.accentColor}40`,
        }}>
          {/* accent bar */}
          <div style={{ height: '4px', background: c.accentColor }} />

          {/* banner image */}
          {c.imageUrl && (
            <img
              src={c.imageUrl}
              alt=""
              onError={e => (e.currentTarget.style.display = 'none')}
              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
            />
          )}

          {/* header row */}
          <div style={{
            padding: '18px 22px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px',
                background: `${c.accentColor}18`,
                border: `1px solid ${c.accentColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                {c.iconEmoji}
              </div>
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1.2px', color: c.accentColor,
                }}>
                  {cfg.label}
                </div>
                {queue.length > 1 && (
                  <div style={{ fontSize: '10px', color: `${c.textColor}88`, marginTop: '1px' }}>
                    {current + 1} of {queue.length}
                  </div>
                )}
              </div>
            </div>

            {/* close */}
            <button
              className="nv-close-btn"
              onClick={close}
              style={{
                background: `${c.textColor}12`, border: 'none', borderRadius: '8px',
                width: '30px', height: '30px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: `${c.textColor}88`, transition: 'background .15s',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* title */}
          <div style={{ padding: '14px 22px 0' }}>
            <h2 style={{
              margin: 0, fontSize: '18px', fontWeight: 800,
              color: c.textColor, lineHeight: 1.3,
            }}>
              {ann.title}
            </h2>
          </div>

          {/* content */}
          <div style={{ padding: '10px 22px 0' }}>
            <div style={{
              background: `${c.accentColor}0e`,
              border: `1px solid ${c.accentColor}28`,
              borderRadius: '12px', padding: '14px 16px',
              fontSize: '14px', color: c.textColor, lineHeight: 1.75,
            }}>
              {ann.content}
            </div>
          </div>

          {/* CTA button */}
          {c.buttonText && (
            <div style={{ padding: '14px 22px 0' }}>
              <a
                href={c.buttonLink || '#'}
                target={c.buttonLink ? '_blank' : '_self'}
                rel="noreferrer"
                className="nv-cta-btn"
                style={{
                  display: 'inline-block',
                  background: c.accentColor,
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: `0 4px 14px ${c.accentColor}44`,
                  transition: 'opacity .15s',
                }}
              >
                {c.buttonText} →
              </a>
            </div>
          )}

          {/* date */}
          {ann.publishedAt && (
            <div style={{ padding: '8px 22px 0', fontSize: '11px', color: `${c.textColor}66` }}>
              {new Date(ann.publishedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </div>
          )}

          {/* dot indicators */}
          {queue.length > 1 && (
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', padding: '14px 0 0' }}>
              {queue.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? '18px' : '5px', height: '5px',
                    borderRadius: '999px', cursor: 'pointer',
                    background: i === current ? c.accentColor : `${c.textColor}30`,
                    transition: 'all .25s ease',
                  }}
                />
              ))}
            </div>
          )}

          {/* action row */}
          <div style={{
            padding: '14px 22px 20px',
            display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {/* prev */}
            <button
              className="nv-nav-btn"
              onClick={prev}
              disabled={isFirst}
              style={{
                background: `${c.textColor}0a`, border: `1px solid ${c.textColor}18`,
                borderRadius: '10px', padding: '9px 12px',
                cursor: isFirst ? 'not-allowed' : 'pointer',
                opacity: isFirst ? 0.3 : 1,
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', color: c.textColor, fontWeight: 600,
                transition: 'all .15s',
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {queue.length > 1 && (
                <button
                  className="nv-nav-btn"
                  onClick={close}
                  style={{
                    background: `${c.textColor}0a`, border: `1px solid ${c.textColor}18`,
                    borderRadius: '10px', padding: '9px 14px', cursor: 'pointer',
                    fontSize: '12px', color: c.textColor, fontWeight: 600, transition: 'all .15s',
                  }}
                >
                  Dismiss All
                </button>
              )}
              <button
                onClick={next}
                style={{
                  background: c.accentColor,
                  color: '#fff', border: 'none',
                  borderRadius: '10px', padding: '9px 20px',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: `0 4px 14px ${c.accentColor}44`,
                  transition: 'opacity .15s',
                }}
              >
                {isLast ? 'Done ✓' : <> Next <ChevronRight size={14} /> </>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
