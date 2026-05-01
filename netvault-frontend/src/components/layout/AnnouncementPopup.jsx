import { useState, useEffect } from 'react'
import { announcementAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const SESSION_KEY = 'nv_seen_announcements'

const PRIORITY_CONFIG = {
    low: { icon: '📢', label: 'Announcement', bar: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
    medium: { icon: '📣', label: 'Announcement', bar: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    high: { icon: '🔔', label: 'Important Update', bar: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    urgent: { icon: '🚨', label: 'URGENT', bar: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
}

function getSeenIds() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]') } catch { return [] }
}
function markSeen(id) {
    const seen = getSeenIds()
    if (!seen.includes(id)) sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen, id]))
}
function markAllSeen(ids) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids))
}

export default function AnnouncementPopup() {
    const { user } = useAuth()
    const [queue, setQueue] = useState([]) // unseen announcements
    const [current, setCurrent] = useState(0)  // index in queue
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!user || user.role === 'superAdmin') return

        const fetchAndFilter = async () => {
            try {
                const res = await announcementAPI.getAll({ limit: 50 })
                const all = res.data?.announcements || []
                const seen = getSeenIds()
                const unseen = all.filter(a => !seen.includes(a._id))
                if (unseen.length > 0) {
                    setQueue(unseen)
                    setCurrent(0)
                    setVisible(true)
                }
            } catch (e) {
                console.error('AnnouncementPopup fetch error', e)
            }
        }

        fetchAndFilter()
    }, [user])

    if (!visible || queue.length === 0) return null

    const ann = queue[current]
    const cfg = PRIORITY_CONFIG[ann?.priority] || PRIORITY_CONFIG.medium
    const isLast = current === queue.length - 1

    const handleNext = () => {
        markSeen(ann._id)
        if (isLast) {
            markAllSeen(queue.map(a => a._id))
            setVisible(false)
        } else {
            setCurrent(i => i + 1)
        }
    }

    const handleDismissAll = () => {
        markAllSeen(queue.map(a => a._id))
        setVisible(false)
    }

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px',
            animation: 'fadeIn .2s ease',
        }}>
            <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

            <div style={{
                background: '#fff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                animation: 'slideUp .3s ease',
            }}>
                {/* Priority bar */}
                <div style={{ height: '5px', background: cfg.bar }} />

                {/* Header */}
                <div style={{
                    padding: '20px 24px 0',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: cfg.bg, border: `1px solid ${cfg.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', flexShrink: 0,
                        }}>
                            {cfg.icon}
                        </div>
                        <div>
                            <div style={{
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '1px', color: cfg.bar, marginBottom: '1px',
                            }}>
                                {cfg.label}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                                {ann.title}
                            </div>
                        </div>
                    </div>

                    {/* Counter */}
                    {queue.length > 1 && (
                        <div style={{
                            background: '#F3F4F6', borderRadius: '999px',
                            padding: '3px 10px', fontSize: '11px',
                            fontWeight: 700, color: '#6B7280', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                            {current + 1} / {queue.length}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px 24px 0' }}>
                    <div style={{
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        borderRadius: '10px', padding: '14px 16px',
                        fontSize: '14px', color: '#374151', lineHeight: 1.7,
                    }}>
                        {ann.content}
                    </div>

                    {ann.publishedAt && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>
                            Posted {new Date(ann.publishedAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ padding: '20px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {queue.length > 1 && (
                        <button onClick={handleDismissAll} style={{
                            background: 'none', border: '1px solid #E5E7EB', borderRadius: '10px',
                            padding: '10px 16px', fontSize: '13px', color: '#6B7280',
                            cursor: 'pointer', fontWeight: 600,
                        }}>
                            Dismiss All
                        </button>
                    )}
                    <button onClick={handleNext} style={{
                        background: cfg.bar, color: '#fff', border: 'none',
                        borderRadius: '10px', padding: '10px 24px',
                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        minWidth: '100px',
                    }}>
                        {isLast ? 'Got it ✓' : `Next →`}
                    </button>
                </div>

                {/* Dots indicator */}
                {queue.length > 1 && (
                    <div style={{
                        display: 'flex', gap: '5px', justifyContent: 'center',
                        paddingBottom: '16px',
                    }}>
                        {queue.map((_, i) => (
                            <div key={i} style={{
                                width: i === current ? '20px' : '6px',
                                height: '6px', borderRadius: '999px',
                                background: i === current ? cfg.bar : '#D1D5DB',
                                transition: 'all .25s ease',
                            }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}