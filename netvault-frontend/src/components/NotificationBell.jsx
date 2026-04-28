import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../services/api';

const TYPE_COLORS = {
  info:    { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', text: '#1D4ED8' },
  success: { bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E', text: '#15803D' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', text: '#B45309' },
  error:   { bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', text: '#B91C1C' },
};

const TYPE_ICONS = {
  info:    'ℹ️',
  success: '✅',
  warning: '⚠️',
  error:   '🚨',
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationBell({ userRole }) {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]           = useState(0);
  const [loading, setLoading]         = useState(false);
  const dropRef                       = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nRes, cRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(nRes.data.notifications || []);
      setUnread(cRes.data.count || 0);
    } catch (_) { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    await notificationAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', background: open ? '#F3F4F6' : 'transparent',
          border: '1px solid', borderColor: open ? '#D1D5DB' : 'transparent',
          borderRadius: '10px', padding: '8px 10px',
          cursor: 'pointer', transition: 'all .15s',
          fontSize: '18px', lineHeight: 1,
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#EF4444', color: '#fff',
            borderRadius: '999px', fontSize: '10px', fontWeight: 700,
            minWidth: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 'min(380px, 92vw)',
          background: '#fff', borderRadius: '14px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 10px 40px rgba(0,0,0,.12)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                Notifications
              </span>
              {unread > 0 && (
                <span style={{
                  marginLeft: '8px', background: '#EFF6FF', color: '#3B82F6',
                  borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                  padding: '1px 8px',
                }}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', color: '#6366F1',
                  fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                  padding: '4px 8px', borderRadius: '6px',
                  transition: 'background .1s',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
                <div style={{ color: '#6B7280', fontSize: '13px' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => {
                const colors = TYPE_COLORS[n.type] || TYPE_COLORS.info;
                return (
                  <div
                    key={n._id}
                    style={{
                      display: 'flex', gap: '12px',
                      padding: '12px 16px',
                      background: n.isRead ? '#fff' : '#F8FAFF',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'default', transition: 'background .1s',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                    }}>
                      {TYPE_ICONS[n.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: n.isRead ? 500 : 700,
                        color: '#111827', marginBottom: '2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(n._id, e)}
                        title="Mark as read"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#6366F1', fontSize: '16px', flexShrink: 0, padding: '0 2px',
                        }}
                      >
                        ●
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #F3F4F6', textAlign: 'center',
            }}>
              <a
                href="/notifications"
                style={{ fontSize: '12px', color: '#6366F1', textDecoration: 'none', fontWeight: 600 }}
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
