import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const NAV_MAP = [
    { keywords: ['domain', 'domains', 'expiry', 'dns', 'whois', 'registrar'], path: '/domains', label: 'Domain List' },
    { keywords: ['add domain', 'new domain', 'create domain'], path: '/domains/add', label: 'Add Domain' },
    { keywords: ['hosting', 'server', 'cpanel', 'uptime'], path: '/hosting', label: 'Hosting List' },
    { keywords: ['add hosting', 'new hosting', 'new server'], path: '/hosting/add', label: 'Add Hosting' },
    { keywords: ['client', 'clients', 'customer'], path: '/clients', label: 'Client List' },
    { keywords: ['invoice', 'billing', 'payment', 'bill'], path: '/billing', label: 'Billing' },
    { keywords: ['create invoice', 'new invoice', 'generate invoice'], path: '/billing/create', label: 'Create Invoice' },
    { keywords: ['report', 'revenue', 'analytics', 'renewal report'], path: '/reports/revenue', label: 'Revenue Report' },
    { keywords: ['alert', 'notification', 'expiring'], path: '/alerts', label: 'Alert Center' },
    { keywords: ['uptime', 'monitor', 'downtime'], path: '/uptime', label: 'Uptime Monitor' },
    { keywords: ['credential', 'vault', 'password', 'cpanel login'], path: '/clients/vault', label: 'Credential Vault' },
    { keywords: ['setting', 'profile', 'account'], path: '/settings/profile', label: 'Profile Settings' },
    { keywords: ['user', 'team', 'staff', 'member'], path: '/settings/users', label: 'User Management' },
    { keywords: ['activity', 'log', 'history'], path: '/settings/activity', label: 'Activity Log' },
    { keywords: ['domain availability', 'check domain', 'domain search'], path: '/tools/domain-availability', label: 'Domain Availability Tool' },
    { keywords: ['dashboard', 'home', 'overview'], path: '/dashboard', label: 'Dashboard' },
]

// ── Get page name from path ──────────────────────────────────────────
function getPageName(path) {
    const map = {
        '/dashboard': 'Dashboard', '/domains': 'Domains', '/domains/add': 'Add Domain',
        '/hosting': 'Hosting', '/hosting/add': 'Add Hosting', '/clients': 'Clients',
        '/billing': 'Billing', '/billing/create': 'Create Invoice',
        '/reports/revenue': 'Revenue Report', '/reports/renewals': 'Renewal Report',
        '/alerts': 'Alert Center', '/uptime': 'Uptime Monitor',
        '/clients/vault': 'Credential Vault', '/settings/profile': 'Profile Settings',
        '/settings/users': 'User Management', '/settings/activity': 'Activity Log',
        '/tools/domain-availability': 'Domain Availability',
    }
    for (const [key, val] of Object.entries(map)) {
        if (path.startsWith(key)) return val
    }
    return 'Dashboard'
}

// ── Fetch user context (domains, hosting, invoices) ─────────────────
async function fetchUserContext() {
    try {
        const [domainsRes, hostingRes, invoicesRes] = await Promise.allSettled([
            api.get('/domains?limit=100'),
            api.get('/hosting?limit=100'),
            api.get('/billing?limit=100'),
        ])

        const domains = domainsRes.status === 'fulfilled'
            ? (domainsRes.value.data?.data?.domains || []) : []
        const hosting = hostingRes.status === 'fulfilled'
            ? (hostingRes.value.data?.data?.hostings || []) : []
        const invoices = invoicesRes.status === 'fulfilled'
            ? (invoicesRes.value.data?.data?.invoices || []) : []

        // Expiring soon (within 30 days)
        const now = new Date()
        const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const expiringDomains = domains.filter(d => {
            const exp = new Date(d.expiryDate)
            return exp > now && exp <= in30
        }).map(d => d.name)

        const overdueInvoices = invoices.filter(i => i.status === 'overdue').length
        const pendingInvoices = invoices.filter(i => i.status === 'pending').length

        return {
            totalDomains: domains.length,
            totalHosting: hosting.length,
            totalInvoices: invoices.length,
            expiringDomains,
            overdueInvoices,
            pendingInvoices,
        }
    } catch {
        return null
    }
}

// ── Call backend chat API ────────────────────────────────────────────
async function askAI(messages, systemPrompt) {
    try {
        const res = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, systemPrompt }),
        })
        const data = await res.json()
        return data.reply || 'Sorry, something went wrong. Please try again!'
    } catch {
        return 'Could not connect to server. Please try again!'
    }
}

// ── Quick help options ───────────────────────────────────────────────
const QUICK_OPTIONS = [
    { label: '🌐 How to add a domain?', value: 'How do I add a new domain in NetVault?' },
    { label: '🖥️ How to add hosting?', value: 'How do I add a new hosting account?' },
    { label: '📄 How to create an invoice?', value: 'How do I create a new invoice for a client?' },
    { label: '⚠️ Why am I getting expiry alerts?', value: 'Why am I getting domain or hosting expiry alerts?' },
    { label: '👤 How to add a team member?', value: 'How do I add a new staff member or user?' },
    { label: '🔍 How to find something?', value: 'I cannot find what I am looking for. Can you guide me?' },
]

// ── Typing dots ──────────────────────────────────────────────────────
function TypingDots({ accent }) {
    return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: accent,
                    display: 'inline-block',
                    animation: 'dcBounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                }} />
            ))}
        </div>
    )
}

// ── Message bubble ───────────────────────────────────────────────────
function Bubble({ msg, accent, surface, border, text, muted }) {
    const isBot = msg.role === 'assistant'
    return (
        <div style={{
            display: 'flex',
            justifyContent: isBot ? 'flex-start' : 'flex-end',
            marginBottom: 10,
            animation: 'dcFadeIn 0.25s ease',
        }}>
            {isBot && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, marginRight: 7, marginTop: 2,
                }}>🤖</div>
            )}
            <div style={{
                maxWidth: '78%',
                background: isBot ? surface : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                color: isBot ? text : '#fff',
                border: isBot ? `1px solid ${border}` : 'none',
                borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                padding: '9px 13px',
                fontSize: 13, lineHeight: 1.65,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
                {msg.content}
                {msg.navPath && (
                    <div style={{ marginTop: 8 }}>
                        <a
                            href={msg.navPath}
                            style={{
                                display: 'inline-block',
                                background: accent,
                                color: '#fff',
                                padding: '5px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            Go to {msg.navLabel} →
                        </a>
                    </div>
                )}
            </div>
            {!isBot && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: `${accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, marginLeft: 7, marginTop: 2, color: accent,
                }}>👤</div>
            )}
        </div>
    )
}

// ── Main Dashboard Chatbot ───────────────────────────────────────────
export default function DashboardChatbot() {
    const { user, theme } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [greeted, setGreeted] = useState(false)
    const [unread, setUnread] = useState(1)
    const [userCtx, setUserCtx] = useState(null)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    const accent = theme?.accent || '#4f72ff'
    const bg = theme?.bg || '#0a0b0f'
    const bg2 = theme?.bg2 || '#13151c'
    const surface = theme?.surface || '#1a1d26'
    const border = theme?.border || 'rgba(255,255,255,0.08)'
    const text = theme?.text || '#f1f5f9'
    const muted = theme?.muted || '#94a3b8'

    const currentPage = getPageName(location.pathname)

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading, showOptions])

    // Focus on open
    useEffect(() => {
        if (open) {
            inputRef.current?.focus()
            setUnread(0)
        }
    }, [open])

    // Fetch user context when opened first time
    useEffect(() => {
        if (open && !userCtx) {
            fetchUserContext().then(setUserCtx)
        }
    }, [open])

    // Greet on first open
    useEffect(() => {
        if (open && !greeted && user) {
            setGreeted(true)
            setLoading(true)
            setTimeout(() => {
                const name = user.name?.split(' ')[0] || 'there'
                setMessages([{
                    role: 'assistant',
                    content: `👋 Hey ${name}! I'm your NetVault assistant.\n\nI'm here to help you navigate the dashboard, find features, or troubleshoot any issues.\n\nWhat can I help you with? 😊`,
                }])
                setShowOptions(true)
                setLoading(false)
            }, 600)
        }
    }, [open, greeted, user])

    // Build system prompt with full context
    const buildSystemPrompt = () => {
        const ctx = userCtx
        const role = user?.role || 'admin'

        let contextSection = ''
        if (ctx) {
            contextSection = `
CURRENT USER DATA:
- Total Domains: ${ctx.totalDomains}
- Total Hosting Accounts: ${ctx.totalHosting}
- Total Invoices: ${ctx.totalInvoices}
- Domains expiring in 30 days: ${ctx.expiringDomains.length > 0 ? ctx.expiringDomains.join(', ') : 'None'}
- Overdue Invoices: ${ctx.overdueInvoices}
- Pending Invoices: ${ctx.pendingInvoices}
`
        }

        return `You are a helpful in-app assistant for NetVault — a SaaS platform for managing domains, hosting, clients, billing, and uptime monitoring.

CURRENT USER:
- Name: ${user?.name || 'User'}
- Role: ${role}
- Currently on page: ${currentPage}
${contextSection}
NAVIGATION GUIDE (tell user where to go):
- Add Domain → /domains → click "Add Domain" button
- View all domains → /domains
- Add Hosting → /hosting → click "Add Hosting" button  
- Create Invoice → /billing → click "Create Invoice"
- View Clients → /clients
- Credential Vault → /clients → "Credential Vault" tab
- Uptime Monitor → /uptime
- Alert Center → /alerts
- Revenue Report → /reports/revenue
- User Management → /settings/users
- Profile Settings → /settings/profile
- Activity Log → /settings/activity
- Domain Availability Tool → /tools/domain-availability

HOW TO HELP:
1. If user cannot find something → tell them exactly which menu/page to go to
2. If user has a problem → diagnose and give step-by-step solution
3. If domains are expiring → mention it proactively
4. If there are overdue invoices → mention it
5. Keep answers short and actionable
6. ALWAYS respond in English only
7. Use emojis to make responses friendly`
    }

    const sendMessage = async (text) => {
        const userText = (text || input).trim()
        if (!userText || loading) return

        setInput('')
        setShowOptions(false)

        // Check if nav suggestion needed
        let navPath = null
        let navLabel = null
        const lower = userText.toLowerCase()
        for (const nav of NAV_MAP) {
            if (nav.keywords.some(k => lower.includes(k))) {
                navPath = nav.path
                navLabel = nav.label
                break
            }
        }

        const newMessages = [...messages, { role: 'user', content: userText }]
        setMessages(newMessages)
        setLoading(true)

        const systemPrompt = buildSystemPrompt()
        const reply = await askAI(
            newMessages.map(m => ({ role: m.role, content: m.content })),
            systemPrompt
        )

        setMessages(prev => [...prev, {
            role: 'assistant',
            content: reply,
            navPath,
            navLabel,
        }])
        setShowOptions(true)
        setLoading(false)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    // Don't show on auth pages or client portal
    const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/pending-approval', '/client-portal', '/accept-invite']
    if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null
    if (!user) return null

    return (
        <>
            <style>{`
        @keyframes dcBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes dcFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dcOpen {
          from { opacity: 0; transform: scale(0.9) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dcPulse {
          0% { box-shadow: 0 4px 20px ${accent}60, 0 0 0 0 ${accent}50; }
          70% { box-shadow: 0 4px 20px ${accent}60, 0 0 0 10px ${accent}00; }
          100% { box-shadow: 0 4px 20px ${accent}60, 0 0 0 0 ${accent}00; }
        }
        @keyframes dcOptIn {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .dc-opt:hover {
          background: ${accent} !important;
          color: #fff !important;
          border-color: ${accent} !important;
          transform: translateX(3px) !important;
        }
        .dc-msgs::-webkit-scrollbar { width: 3px; }
        .dc-msgs::-webkit-scrollbar-track { background: transparent; }
        .dc-msgs::-webkit-scrollbar-thumb { background: ${accent}40; border-radius: 4px; }
      `}</style>

            {/* ── Launcher ── */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    width: 52, height: 52, borderRadius: '50%', border: 'none',
                    background: open
                        ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                        : `linear-gradient(135deg, ${accent}, ${accent}bb)`,
                    cursor: 'pointer', fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    animation: !open ? 'dcPulse 2.5s infinite' : 'none',
                }}
                title="NetVault Help"
            >
                {open ? '✕' : '💬'}
                {!open && unread > 0 && (
                    <span style={{
                        position: 'absolute', top: -3, right: -3,
                        background: '#ef4444', color: '#fff',
                        borderRadius: '50%', width: 17, height: 17,
                        fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${bg}`,
                    }}>{unread}</span>
                )}
            </button>

            {/* ── Chat window ── */}
            {open && (
                <div style={{
                    position: 'fixed', bottom: 88, right: 24, zIndex: 9998,
                    width: 'min(380px, calc(100vw - 36px))',
                    height: 'min(540px, calc(100vh - 120px))',
                    background: bg2,
                    borderRadius: 18,
                    border: `1px solid ${border}`,
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${accent}20`,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    animation: 'dcOpen 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    fontFamily: 'inherit',
                }}>

                    {/* Header */}
                    <div style={{
                        background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
                        borderBottom: `1px solid ${border}`,
                        padding: '13px 15px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: `${accent}25`,
                            border: `1.5px solid ${accent}50`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, flexShrink: 0,
                        }}>🤖</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: text, fontWeight: 700, fontSize: 13.5 }}>NetVault Help</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
                                <span style={{ color: muted, fontSize: 11 }}>On: {currentPage}</span>
                            </div>
                        </div>

                        {/* Context badges */}
                        {userCtx && (
                            <div style={{ display: 'flex', gap: 5 }}>
                                {userCtx.expiringDomains.length > 0 && (
                                    <span style={{
                                        background: '#f59e0b20', color: '#f59e0b',
                                        border: '1px solid #f59e0b40',
                                        borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700,
                                    }}>⚠ {userCtx.expiringDomains.length} expiring</span>
                                )}
                                {userCtx.overdueInvoices > 0 && (
                                    <span style={{
                                        background: '#ef444420', color: '#ef4444',
                                        border: '1px solid #ef444440',
                                        borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700,
                                    }}>🔴 {userCtx.overdueInvoices} overdue</span>
                                )}
                            </div>
                        )}

                        <button onClick={() => setOpen(false)} style={{
                            background: `${accent}20`, border: 'none',
                            color: muted, width: 28, height: 28, borderRadius: '50%',
                            cursor: 'pointer', fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                    </div>

                    {/* Messages */}
                    <div className="dc-msgs" style={{
                        flex: 1, overflowY: 'auto',
                        padding: '13px 11px 8px',
                        background: bg2,
                    }}>
                        {messages.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: muted }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                                <div style={{ fontSize: 12 }}>Ask me anything about NetVault...</div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <Bubble key={i} msg={msg} accent={accent} surface={surface} border={border} text={text} muted={muted} />
                        ))}

                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: `${accent}25`, border: `1px solid ${accent}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                                }}>🤖</div>
                                <div style={{
                                    background: surface, border: `1px solid ${border}`,
                                    borderRadius: '4px 14px 14px 14px',
                                }}>
                                    <TypingDots accent={accent} />
                                </div>
                            </div>
                        )}

                        {/* Quick options */}
                        {showOptions && !loading && messages.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{
                                    fontSize: 10, color: muted, fontWeight: 600,
                                    marginBottom: 5, paddingLeft: 35,
                                    letterSpacing: 0.5, textTransform: 'uppercase',
                                }}>Quick Help</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {QUICK_OPTIONS.map((opt, i) => (
                                        <button
                                            key={i}
                                            className="dc-opt"
                                            onClick={() => sendMessage(opt.value)}
                                            style={{
                                                background: surface,
                                                border: `1px solid ${border}`,
                                                borderRadius: 8,
                                                padding: '7px 11px',
                                                fontSize: 12,
                                                color: text,
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease',
                                                fontFamily: 'inherit',
                                                animation: `dcOptIn 0.2s ease ${i * 0.04}s both`,
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '9px 11px',
                        borderTop: `1px solid ${border}`,
                        background: bg2,
                        display: 'flex', gap: 7, alignItems: 'flex-end',
                        flexShrink: 0,
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask anything... (Enter to send)"
                            rows={1}
                            disabled={loading}
                            style={{
                                flex: 1,
                                border: `1px solid ${border}`,
                                borderRadius: 9,
                                padding: '8px 11px',
                                fontSize: 12.5,
                                fontFamily: 'inherit',
                                outline: 'none',
                                resize: 'none',
                                lineHeight: 1.5,
                                color: text,
                                background: surface,
                                maxHeight: 68,
                                overflowY: 'auto',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e => e.target.style.borderColor = border}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            style={{
                                width: 36, height: 36,
                                background: input.trim() && !loading ? `linear-gradient(135deg, ${accent}, ${accent}bb)` : surface,
                                border: `1px solid ${input.trim() && !loading ? accent : border}`,
                                borderRadius: 9,
                                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                color: input.trim() && !loading ? '#fff' : muted,
                                fontSize: 14,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                            }}
                        >➤</button>
                    </div>

                    {/* Footer */}
                    <div style={{
                        textAlign: 'center', padding: '4px 11px 7px',
                        fontSize: 10, color: muted,
                        background: bg2,
                        borderTop: `1px solid ${border}`,
                        flexShrink: 0,
                    }}>
                        <strong style={{ color: accent }}>NetVault AI</strong> · Powered by Groq
                    </div>
                </div>
            )}
        </>
    )
}