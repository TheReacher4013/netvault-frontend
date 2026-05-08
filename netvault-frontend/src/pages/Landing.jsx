import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ui/ThemeToggle'
import {
    Globe, Server, Users, FileText, Bell, Lock,
    Check, ArrowRight, Shield, Star, Search, RefreshCw,
    Zap, Eye, Database,
} from 'lucide-react'
import api from '../services/api'
import NetVaultChatbot from '../components/NetVaultChatbot'

function useInView(threshold = 0.12) {
    const ref = useRef(null)
    const [inView, setInView] = useState(false)
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
            { threshold }
        )
        if (ref.current) obs.observe(ref.current)
        return () => obs.disconnect()
    }, [threshold])
    return [ref, inView]
}

function Counter({ target, suffix = '', duration = 1800 }) {
    const [count, setCount] = useState(0)
    const [ref, inView] = useInView()
    useEffect(() => {
        if (!inView) return
        const isFloat = target % 1 !== 0
        let start = 0
        const step = target / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= target) { setCount(target); clearInterval(timer) }
            else setCount(isFloat ? parseFloat(start.toFixed(2)) : Math.floor(start))
        }, 16)
        return () => clearInterval(timer)
    }, [inView, target, duration])
    return <span ref={ref}>{count}{suffix}</span>
}

function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
    const [ref, inView] = useInView()
    const transforms = {
        up: 'translateY(36px)', down: 'translateY(-36px)',
        left: 'translateX(-36px)', right: 'translateX(36px)',
    }
    return (
        <div ref={ref} className={className} style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : transforms[direction],
            transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        }}>
            {children}
        </div>
    )
}

function Typewriter({ words, speed = 75, pause = 2000 }) {
    const [display, setDisplay] = useState('')
    const [wIdx, setWIdx] = useState(0)
    const [charIdx, setCharIdx] = useState(0)
    const [deleting, setDeleting] = useState(false)
    useEffect(() => {
        const word = words[wIdx]
        let timeout
        if (!deleting && charIdx <= word.length) {
            timeout = setTimeout(() => { setDisplay(word.slice(0, charIdx)); setCharIdx(c => c + 1) }, speed)
        } else if (!deleting && charIdx > word.length) {
            timeout = setTimeout(() => setDeleting(true), pause)
        } else if (deleting && charIdx > 0) {
            timeout = setTimeout(() => { setCharIdx(c => c - 1); setDisplay(word.slice(0, charIdx - 1)) }, speed / 2)
        } else {
            setDeleting(false); setWIdx(i => (i + 1) % words.length)
        }
        return () => clearTimeout(timeout)
    }, [charIdx, deleting, wIdx, words, speed, pause])
    return (
        <span>
            {display}
            <span style={{ borderRight: '2.5px solid currentColor', marginLeft: 1 }}>&nbsp;</span>
        </span>
    )
}

const FEATURES = [
    { icon: Globe, title: 'Domain Portfolio', text: 'Direct API sync with GoDaddy, Namecheap, Cloudflare, BigRock & more. Auto-import expiry, lock state, name servers, and WHOIS — refreshed daily.' },
    { icon: Lock, title: 'SSL Lifecycle', text: 'Live TLS handshake checks, A+ SSL grading, ACME auto-renew, HSTS verification, and Certificate Transparency monitoring.' },
    { icon: Server, title: 'DNS Manager', text: 'Full CRUD across Cloudflare, Route 53, Google Cloud DNS, GoDaddy & Namecheap with global propagation checks.' },
    { icon: Users, title: 'Client Portal', text: 'White-label, magic-link access. Clients see their own assets only — domains, invoices, and alerts without any admin chaos.' },
    { icon: FileText, title: 'GST Billing', text: 'Auto-generate GST-compliant PDF invoices per client with markup-aware line items, sequential numbering, and payment tracking.' },
    { icon: Bell, title: 'Smart Alerts', text: 'Email, WhatsApp, SMS, and Slack alerts for expiring domains, SSL, hosting — 9-stage renewal pipeline before expiry.' },
    { icon: Eye, title: 'Uptime Monitoring', text: 'HTTP, keyword, port & SSL checks every 60 seconds from 3 continents. Branded public status pages on your own subdomain.' },
    { icon: Shield, title: 'Security Posture', text: 'Subdomain takeover scanner, CT log monitoring, domain hijack defense, and a composite security score with PDF reports.' },
    { icon: Database, title: 'Credential Vault', text: 'AES-256 vault with TOTP unlock. Server passwords, API keys, SSH keys — encrypted, role-gated, and audit-logged.' },
]

const STATS = [
    { n: 480, suffix: 'k+', l: 'Domains under management' },
    { n: 120, suffix: 'k+', l: 'SSL certificates monitored' },
    { n: 99.99, suffix: '%', l: 'Monitoring uptime SLA' },
    { n: 60, suffix: 's', l: 'Downtime alert dispatch' },
]

const STEPS = [
    { n: '01', icon: RefreshCw, title: 'Connect', text: 'Plug in your registrar API keys, cPanel/Plesk tokens, cloud credentials and DNS providers. We auto-discover every asset.', tags: ['API keys', 'OAuth', 'CSV import'] },
    { n: '02', icon: Search, title: 'Organize', text: 'Assets are auto-grouped by client, project, and category. Add notes, tags, owners — replace your spreadsheet in one afternoon.', tags: ['Auto-tag', 'Client mapping', 'RBAC'] },
    { n: '03', icon: Zap, title: 'Operate', text: 'Receive alerts, run renewals, edit DNS, generate invoices, and ship reports — all without leaving the platform.', tags: ['Renew', 'Alert', 'Report'] },
]

const INTEGRATIONS = ['GoDaddy', 'Namecheap', 'Cloudflare', 'BigRock', 'Hostinger', 'cPanel', 'Plesk', 'AWS', 'DigitalOcean', 'Google Cloud', 'Route 53', 'Porkbun']

const TESTIMONIALS = [
    { initials: 'RM', color: '#7663F2', name: 'Rohan Mehta', role: 'Operations Lead, Northstar Digital', quote: 'We were managing 600+ domains across 14 spreadsheets. The first week, we caught 23 expiring SSLs no one had noticed. Paid for itself instantly.' },
    { initials: 'AS', color: '#D96AC6', name: 'Anjali Shah', role: 'Founder, PixelByte Studio', quote: 'The white-label client portal alone is worth the subscription. We bill clients ₹1,500/month for portfolio monitoring on top — pure margin.' },
    { initials: 'KV', color: '#2ABF89', name: 'Karthik Venkat', role: 'Security Engineer, Finovax', quote: 'The CT log monitor flagged a fraudulent cert at 2am. We rotated keys before any damage. That single alert is worth a year of the platform.' },
    { initials: 'SP', color: '#9D62D9', name: 'Sneha Pillai', role: 'CTO, GreenLeaf Hosting', quote: 'We replaced WHMCS, DomainMOD, Better Uptime AND a credential manager with NetVault. One bill, one login, one source of truth.' },
    { initials: 'DI', color: '#5C57F2', name: 'Devika Iyer', role: 'CFO, Aircove Tech', quote: 'GST-compliant invoices auto-generated per client at month-end. Our finance team got their afternoons back.' },
    { initials: 'VK', color: '#914BBF', name: 'Vivek Kapoor', role: 'SRE Lead, ScaleHub MSP', quote: 'Uptime monitoring from 3 continents means we stopped chasing false alarms. When NetVault says down, it is actually down.' },
]

const DOMAIN_ROWS = [
    { i: 'A', name: 'acmecorp.com', reg: 'GoDaddy · Auto-renew on', ssl: 'A+', sslC: '#22c55e', days: '187 days', accent: '#7663F2' },
    { i: 'B', name: 'brightlabs.io', reg: 'Cloudflare · Locked', ssl: '14d', sslC: '#f59e0b', days: '62 days', accent: '#D96AC6' },
    { i: 'N', name: 'novabank.in', reg: 'BigRock · WHOIS private', ssl: 'A', sslC: '#22c55e', days: '410 days', accent: '#2ABF89' },
    { i: 'P', name: 'pixelstudio.co', reg: 'Namecheap · Locked', ssl: '3d', sslC: '#ef4444', days: '3 days', accent: '#ef4444', alert: true },
]

const CAPABILITIES = [
    'Multi-Registrar Sync', '9-Stage Renewal Alerts', 'SSL Live Health Check', 'Bulk Renewal Engine',
    'DMARC / SPF Builder', 'Cloud Asset Inventory', 'Subdomain Takeover Scan', 'CT Log Monitoring',
    'GST-Compliant Billing', 'Client Portal', 'Public Status Page', 'Domain Hijack Defense',
]

export default function Landing() {
    const { theme, mode } = useTheme()
    const [plans, setPlans] = useState([])
    const [heroVisible, setHeroVisible] = useState(false)
    const [mockupRow, setMockupRow] = useState(0)
    const isLight = mode === 'light'

    useEffect(() => {
        api.get('/plans').then(r => setPlans(r.data?.data?.plans || [])).catch(() => setPlans([]))
        const t = setTimeout(() => setHeroVisible(true), 80)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const t = setInterval(() => setMockupRow(r => (r + 1) % DOMAIN_ROWS.length), 2200)
        return () => clearInterval(t)
    }, [])

    const surface = { background: theme.surface, border: `1px solid ${theme.border}` }
    const ab = (op = '18') => `${theme.accent}${op}`
    const pjs = "'Plus Jakarta Sans', 'Inter', sans-serif"

    const heroAnim = (delay) => ({
        opacity: heroVisible ? 1 : 0,
        transform: heroVisible ? 'none' : 'translateY(20px)',
        transition: `all 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    })

    return (
        <div style={{ background: theme.bg, color: theme.text, fontFamily: pjs }} className="min-h-screen overflow-x-hidden">
            <style>{`
                @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-22px) rotate(180deg)} }
                @keyframes floatB { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-16px) scale(1.25)} }
                @keyframes gradientFlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
                @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                @keyframes pulseDot { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
                @keyframes slideRow { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
                @keyframes nvPulse { 0%{box-shadow:0 6px 24px rgba(99,102,241,.45),0 0 0 0 rgba(99,102,241,.5)} 70%{box-shadow:0 6px 24px rgba(99,102,241,.45),0 0 0 14px rgba(99,102,241,0)} 100%{box-shadow:0 6px 24px rgba(99,102,241,.45),0 0 0 0 rgba(99,102,241,0)} }
                @keyframes nvChatOpen { from{opacity:0;transform:scale(.88) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes nvMsgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes nvOptIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
                @keyframes nvBotBounce { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-5px);opacity:1} }
                .integration-ticker{animation:ticker 22s linear infinite;width:max-content}
                .integration-ticker:hover{animation-play-state:paused}
                .nv-card{transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease,border-color .3s ease}
                .nv-card:hover{transform:translateY(-5px)}
                .gradient-text{background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradientFlow 4s ease infinite}
                .nv-btn{transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease}
                .nv-btn:hover{transform:translateY(-1px);opacity:.92}
                .nv-btn:active{transform:scale(.97)}
                .nv-chat-messages::-webkit-scrollbar{width:4px}
                .nv-chat-messages::-webkit-scrollbar-track{background:transparent}
                .nv-chat-messages::-webkit-scrollbar-thumb{background:#7663F240;border-radius:4px}
            `}</style>

            {/* NAV */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: `${theme.bg}d8`, borderBottom: `1px solid ${theme.border}` }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-base"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>N</div>
                        <span style={{ fontFamily: pjs, fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>
                            Net<span style={{ color: theme.accent }}>Vault</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: theme.muted }}>
                        <a href="#features" className="hover:opacity-80 transition-opacity">Features</a>
                        <a href="#how" className="hover:opacity-80 transition-opacity">How it works</a>
                        <a href="#pricing" className="hover:opacity-80 transition-opacity">Pricing</a>
                        <a href="#testimonials" className="hover:opacity-80 transition-opacity">Customers</a>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <ThemeToggle />
                        <Link to="/login" className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-75 transition-opacity" style={{ color: theme.text }}>Sign in</Link>
                        <Link to="/register" className="nv-btn font-bold rounded-lg px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff', boxShadow: `0 4px 14px ${theme.accent}35` }}>
                            <span className="sm:hidden">Start →</span>
                            <span className="hidden sm:inline">Get started →</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO — left text + right mockup */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(ellipse, ${theme.accent}1a 0%, transparent 70%)`, animation: 'floatB 12s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '5%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(ellipse, ${theme.accent2}12 0%, transparent 70%)`, animation: 'floatA 15s ease-in-out infinite 2s' }} />
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`, backgroundSize: '64px 64px', opacity: isLight ? 0.35 : 0.3, maskImage: 'radial-gradient(ellipse 75% 65% at 65% 40%, black 20%, transparent 100%)' }} />
                    {[
                        { w: 6, h: 6, top: '18%', left: '7%', bg: `${theme.accent}55`, anim: 'floatA 6s ease-in-out infinite' },
                        { w: 9, h: 9, top: '60%', right: '4%', bg: `${theme.accent2}45`, anim: 'floatB 9s ease-in-out infinite 1s' },
                        { w: 5, h: 5, top: '80%', left: '15%', bg: `${theme.accent}40`, anim: 'floatA 7s ease-in-out infinite 2s' },
                        { w: 4, h: 4, top: '30%', left: '55%', bg: `${theme.accent2}35`, anim: 'floatB 11s ease-in-out infinite 3s' },
                    ].map((p, i) => (
                        <div key={i} className="absolute rounded-full" style={{ width: p.w, height: p.h, top: p.top, left: p.left, right: p.right, background: p.bg, animation: p.anim }} />
                    ))}
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-20 grid md:grid-cols-2 gap-8 md:gap-14 items-center relative">
                    {/* LEFT */}
                    <div>
                        <div style={heroAnim(0)}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                                style={{ background: ab('14'), color: theme.accent, border: `1px solid ${ab('30')}` }}>
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: theme.accent, animation: 'pulseDot 1.4s ease-out infinite' }} />
                                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: theme.accent }} />
                                </span>
                                Built for agencies, MSPs &amp; IT teams
                            </div>
                        </div>

                        <div style={heroAnim(80)}>
                            <h1 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 16 }}>
                                Every domain, SSL<br />&amp; host<br />
                                <span className="gradient-text" style={{ backgroundImage: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2}, ${theme.accent})` }}>
                                    in a single<br />command center.
                                </span>
                            </h1>
                        </div>

                        <div style={heroAnim(180)}>
                            <p style={{ fontSize: 16, lineHeight: 1.7, color: theme.muted, marginBottom: 28, maxWidth: 440 }}>
                                NetVault unifies every domain, certificate, DNS record, hosting account, and cloud asset across every client and registrar — stop juggling 14 dashboards.
                            </p>
                        </div>

                        <div style={heroAnim(280)}>
                            <div className="flex flex-col xs:flex-row flex-wrap gap-3 items-start sm:items-center mb-6">
                                <Link to="/register" className="nv-btn flex items-center gap-2 group px-6 py-3 rounded-xl text-sm font-bold"
                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff', boxShadow: `0 8px 24px ${theme.accent}35` }}>
                                    Start 14-day free trial <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a href="#features" className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
                                    style={{ color: theme.text, border: `1px solid ${theme.border}` }}>
                                    Watch product tour
                                </a>
                            </div>
                            <p className="text-xs" style={{ color: theme.muted }}>No credit card required &nbsp;·&nbsp; Free for up to 10 domains forever</p>
                        </div>

                        <div style={heroAnim(380)}>
                            <div className="flex items-center gap-3 mt-8">
                                <div className="flex">
                                    {['M', 'A', 'R', 'K', '+2k'].map((l, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold -mr-2 last:mr-0"
                                            style={{ fontSize: l === '+2k' ? 8 : 10, background: [ab('45'), `${theme.accent2}40`, '#05966940', '#06b6d440', '#33333350'][i], borderColor: theme.bg, color: theme.text }}>
                                            {l}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="text-amber-400 text-xs leading-none mb-0.5">★★★★★</div>
                                    <div className="text-xs" style={{ color: theme.muted }}>2,000+ teams managing <strong style={{ color: theme.text }}>480k+</strong> domains</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — mockup */}
                    <div style={heroAnim(220)}>
                        <div className="rounded-2xl overflow-hidden"
                            style={{ ...surface, background: isLight ? theme.bg2 : theme.surface, boxShadow: `0 32px 80px ${theme.accent}18, 0 0 0 1px ${theme.border}` }}>
                            <div className="flex items-center gap-2 px-4 py-3" style={{ background: isLight ? '#F0F1F8' : '#0d0d1a', borderBottom: `1px solid ${theme.border}` }}>
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <span className="flex-1 text-center text-xs font-mono" style={{ color: theme.muted }}>🔒 app.netvault.io / portfolio</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: '#22c55e18', color: '#4ade80' }}>● LIVE</span>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span style={{ fontFamily: pjs, fontWeight: 700, fontSize: 13 }}>Domain Portfolio</span>
                                    <div className="flex gap-1.5">
                                        {[{ l: 'All 1,284', c: '#22c55e' }, { l: 'Expiring 32', c: '#f59e0b' }, { l: 'Issues 4', c: '#ef4444', hide: true }].map(t => (
                                            <span key={t.l} className={`text-[10px] font-bold px-2 py-0.5 rounded-md${t.hide ? ' hidden sm:inline' : ''}`} style={{ background: `${t.c}20`, color: t.c }}>{t.l}</span>
                                        ))}
                                    </div>
                                </div>
                                {DOMAIN_ROWS.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2 last:mb-0"
                                        style={{
                                            background: i === mockupRow ? (isLight ? `${theme.accent}09` : `${theme.accent}14`) : (isLight ? '#F7F8FF' : '#0f0f1c'),
                                            border: d.alert ? '1px solid #ef444438' : i === mockupRow ? `1px solid ${theme.accent}45` : `1px solid ${theme.border}`,
                                            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
                                            animation: i === mockupRow ? 'slideRow .4s ease' : 'none',
                                        }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${d.accent}22`, color: d.accent }}>{d.i}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold truncate">{d.name}</div>
                                            <div className="text-[11px] truncate" style={{ color: theme.muted }}>{d.reg}</div>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${d.sslC}20`, color: d.sslC }}>SSL {d.ssl}</span>
                                        <span className="text-[11px]" style={{ color: d.alert ? '#ef4444' : theme.muted }}>{d.days}</span>
                                    </div>
                                ))}
                                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: ab('14') }}>
                                    <div style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`, width: `${((mockupRow + 1) / DOMAIN_ROWS.length) * 100}%`, transition: 'width 2s cubic-bezier(0.16,1,0.3,1)' }} />
                                </div>
                                <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: '#ef444410', border: '1px solid #ef444428' }}>
                                    <span className="text-xs font-medium truncate mr-2" style={{ color: '#f87171' }}>⚠ SSL expires in 3 days · pixelstudio.co</span>
                                    <span className="text-sm font-bold" style={{ color: '#4ade80' }}>+₹4.2L</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-center mt-4 mb-3 uppercase tracking-widest font-semibold" style={{ color: theme.muted }}>Integrates natively with providers you already use</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['GoDaddy', 'Namecheap', 'Cloudflare', 'BigRock', 'Hostinger', 'cPanel', 'Plesk', 'AWS'].map(n => (
                                <span key={n} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ ...surface, color: theme.muted }}>{n}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS BAR */}
            <section style={{ borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, background: isLight ? theme.bg2 : ab('06') }}>
                <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {STATS.map((s, i) => (
                        <FadeIn key={s.l} delay={i * 90}>
                            <div style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', color: theme.accent, lineHeight: 1.1, marginBottom: 6 }}>
                                <Counter target={s.n} suffix={s.suffix} />
                            </div>
                            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>{s.l}</div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* INTEGRATION TICKER */}
            <section className="py-10 overflow-hidden" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-center mb-5" style={{ color: theme.muted }}>Integrated natively with the providers you already use</p>
                <div className="relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: `linear-gradient(90deg, ${theme.bg}, transparent)` }} />
                    <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: `linear-gradient(-90deg, ${theme.bg}, transparent)` }} />
                    <div className="flex integration-ticker">
                        {[...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
                            <span key={i} className="mx-2.5 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0" style={{ ...surface, color: theme.muted }}>{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: theme.accent }}>↑ The platform</p>
                            <h2 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 12 }}>
                                One intelligent layer over your{' '}
                                <span className="gradient-text" style={{ backgroundImage: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2}, ${theme.accent})` }}>entire stack</span>
                            </h2>
                            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: theme.muted }}>
                                From domain registrars to DNS, from SSL chains to cloud servers — every signal flowing into one operational view, with proactive alerts before anything breaks.
                            </p>
                        </div>
                    </FadeIn>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <FadeIn key={f.title} delay={i * 70} direction="up">
                                <div className="nv-card p-6 rounded-2xl h-full" style={{ ...surface, cursor: 'default' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${theme.accent}50`; e.currentTarget.style.boxShadow = `0 16px 48px ${theme.accent}12` }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: ab('18') }}>
                                        <f.icon size={17} style={{ color: theme.accent }} />
                                    </div>
                                    <h3 style={{ fontFamily: pjs, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{f.text}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CAPABILITIES */}
            <section className="py-16" style={{ background: isLight ? theme.bg2 : ab('04'), borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>Capabilities</p>
                            <h2 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(22px,3.5vw,34px)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                                Everything an agency or MSP needs to run infrastructure at scale
                            </h2>
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {CAPABILITIES.map((cap, i) => (
                            <FadeIn key={cap} delay={i * 45}>
                                <div className="p-4 rounded-xl text-sm font-medium" style={{ ...surface, color: theme.text }}>
                                    <span className="text-[11px] font-bold mr-2" style={{ color: theme.accent }}>✓</span>{cap}
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>How it works</p>
                            <h2 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10 }}>
                                From scattered to in control in 3 steps
                            </h2>
                            <p className="text-sm max-w-md mx-auto" style={{ color: theme.muted }}>Connect your registrar APIs and hosting accounts in minutes — NetVault does the rest.</p>
                        </div>
                    </FadeIn>
                    <div className="grid md:grid-cols-3 gap-5">
                        {STEPS.map((s, i) => (
                            <FadeIn key={s.n} delay={i * 130} direction="up">
                                <div className="nv-card p-7 rounded-2xl relative h-full" style={surface}>
                                    <div style={{ fontFamily: pjs, fontWeight: 900, fontSize: 56, lineHeight: 1, color: ab('28'), marginBottom: 16 }}>{s.n}</div>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: ab('18') }}>
                                        <s.icon size={16} style={{ color: theme.accent }} />
                                    </div>
                                    <h3 style={{ fontFamily: pjs, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                                    <p className="text-sm leading-relaxed mb-4" style={{ color: theme.muted }}>{s.text}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {s.tags.map(t => (
                                            <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: ab('14'), color: theme.accent }}>{t}</span>
                                        ))}
                                    </div>
                                    {i < STEPS.length - 1 && <div className="hidden md:block absolute top-10 -right-3 text-lg font-bold" style={{ color: theme.accent }}>→</div>}
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section id="testimonials" className="py-16" style={{ background: isLight ? theme.bg2 : ab('04'), borderTop: `1px solid ${theme.border}` }}>
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>Loved by operators</p>
                            <h2 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                                Trusted by agencies and IT teams<br />managing hundreds of clients
                            </h2>
                        </div>
                    </FadeIn>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <FadeIn key={t.name} delay={i * 90} direction="up">
                                <div className="nv-card p-6 rounded-2xl h-full" style={surface}>
                                    <div className="text-amber-400 text-sm tracking-wide mb-3">★★★★★</div>
                                    <p className="text-sm leading-relaxed mb-5 italic" style={{ color: theme.muted }}>"{t.quote}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${t.color}22`, color: t.color }}>{t.initials}</div>
                                        <div>
                                            <div className="text-sm font-semibold">{t.name}</div>
                                            <div className="text-xs" style={{ color: theme.muted }}>{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>Pricing</p>
                            <h2 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10 }}>
                                Simple plans that scale with your portfolio
                            </h2>
                            <p className="text-sm" style={{ color: theme.muted }}>Start free. Upgrade when you outgrow it. No per-domain pricing tricks.</p>
                        </div>
                    </FadeIn>
                    {plans.length === 0 ? (
                        <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>Loading plans…</div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                            {plans.map((p, i) => {
                                const popular = p.isPopular
                                return (
                                    <FadeIn key={p._id} delay={i * 100} direction="up">
                                        <div className="nv-card p-7 rounded-2xl flex flex-col relative h-full"
                                            style={{ background: popular ? ab('08') : theme.surface, border: `${popular ? 2 : 1}px solid ${popular ? theme.accent : theme.border}` }}>
                                            {popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                                                    <Star size={9} /> Most popular
                                                </div>
                                            )}
                                            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.accent }}>{p.displayName}</p>
                                            <div className="flex items-baseline gap-1 mb-1">
                                                <span style={{ fontFamily: pjs, fontWeight: 800, fontSize: 38, lineHeight: 1 }}>₹{p.price}</span>
                                                {p.price > 0 && <span className="text-sm" style={{ color: theme.muted }}>/{p.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>}
                                            </div>
                                            <p className="text-xs mb-6" style={{ color: theme.muted }}>{p.trialDays > 0 ? `${p.trialDays}-day free trial` : 'Free forever'}</p>
                                            <div className="space-y-2.5 mb-7 flex-1">
                                                {(p.features || []).map(f => (
                                                    <div key={f} className="flex items-start gap-2 text-sm">
                                                        <Check size={14} style={{ color: theme.accent, flexShrink: 0, marginTop: 2 }} />
                                                        <span>{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Link to={`/register?plan=${p._id}`} className="nv-btn w-full py-3 rounded-xl font-bold text-sm text-center block"
                                                style={popular ? { background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff', boxShadow: `0 6px 20px ${theme.accent}30` } : { background: ab('14'), color: theme.accent, border: `1px solid ${theme.border}` }}>
                                                Start with {p.displayName}
                                            </Link>
                                        </div>
                                    </FadeIn>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16" style={{ borderTop: `1px solid ${theme.border}` }}>
                <div className="max-w-3xl mx-auto px-6">
                    <FadeIn>
                        <div className="rounded-3xl px-8 md:px-16 py-16 text-center relative overflow-hidden"
                            style={{ background: isLight ? theme.bg2 : `linear-gradient(135deg, ${theme.accent}14, ${theme.accent2}08)`, border: `1px solid ${theme.accent}28` }}>
                            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 55% at 50% 0%, ${theme.accent}18, transparent)` }} />
                            <p className="text-xs font-semibold uppercase tracking-widest mb-4 relative" style={{ color: theme.accent }}>Get started in under 5 minutes</p>
                            <h2 style={{ fontFamily: pjs, fontWeight: 800, fontSize: 'clamp(22px,4vw,36px)', letterSpacing: '-0.03em', lineHeight: 1.18, marginBottom: 14 }} className="relative">
                                Stop firefighting domain expiries.<br />Start running infrastructure like an operator.
                            </h2>
                            <p className="text-sm mb-8 relative" style={{ color: theme.muted }}>14-day free trial. No credit card. Connect your first registrar and see your full portfolio in minutes.</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
                                <Link to="/register" className="nv-btn flex items-center justify-center gap-2 group px-7 py-3.5 rounded-xl font-bold text-sm"
                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff', boxShadow: `0 10px 30px ${theme.accent}35` }}>
                                    Start free trial <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/login" className="flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/5 transition-colors"
                                    style={{ color: theme.text, border: `1px solid ${theme.border}` }}>
                                    Sign in
                                </Link>
                            </div>
                            <div className="mt-5 flex gap-5 justify-center flex-wrap relative">
                                {['No credit card', 'Cancel anytime', 'Free for up to 10 domains'].map(t => (
                                    <span key={t} className="text-xs font-medium" style={{ color: '#4ade80' }}>✓ {t}</span>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12" style={{ borderTop: `1px solid ${theme.border}`, background: isLight ? theme.bg2 : theme.bg }}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-sm"
                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>N</div>
                                <span style={{ fontFamily: pjs, fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>Net<span style={{ color: theme.accent }}>Vault</span></span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>The infrastructure command center for agencies, MSPs, and IT teams managing the modern web.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
                            <div>
                                <p className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.muted }}>Product</p>
                                <div className="space-y-2">
                                    {['Domain management', 'SSL lifecycle', 'DNS manager', 'Uptime monitoring', 'Credentials vault'].map(l => (
                                        <a key={l} href="#features" className="block hover:opacity-80 transition-opacity" style={{ color: theme.muted }}>{l}</a>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.muted }}>Solutions</p>
                                <div className="space-y-2">
                                    {['For agencies', 'For MSPs', 'For IT teams', 'White-label'].map(l => (
                                        <a key={l} href="#" className="block hover:opacity-80 transition-opacity" style={{ color: theme.muted }}>{l}</a>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="font-bold mb-3 text-xs uppercase tracking-wider" style={{ color: theme.muted }}>Account</p>
                                <div className="space-y-2">
                                    <Link to="/login" className="block hover:opacity-80 transition-opacity" style={{ color: theme.muted }}>Sign in</Link>
                                    <Link to="/register" className="block hover:opacity-80 transition-opacity" style={{ color: theme.muted }}>Register</Link>
                                    <a href="#pricing" className="block hover:opacity-80 transition-opacity" style={{ color: theme.muted }}>Pricing</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: `1px solid ${theme.border}` }}>
                        <span className="text-xs" style={{ color: theme.muted }}>© {new Date().getFullYear()} NetVault Technologies Pvt. Ltd. · Made in India 🇮🇳</span>
                        <div className="flex items-center gap-5 text-xs" style={{ color: theme.muted }}>
                            <a href="#" className="hover:opacity-80">Privacy</a>
                            <a href="#" className="hover:opacity-80">Terms</a>
                            <a href="#" className="hover:opacity-80">DPA</a>
                        </div>
                    </div>
                </div>
            </footer>

            <NetVaultChatbot />
        </div>
    )
}