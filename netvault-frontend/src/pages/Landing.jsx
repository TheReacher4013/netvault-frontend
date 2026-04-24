import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ui/ThemeToggle'
import {
    Globe, Server, Users, FileText, Bell, Lock,
    Check, ArrowRight, Shield, Star, Search, RefreshCw,
} from 'lucide-react'
import api from '../services/api'


function useInView(threshold = 0.15) {
    const ref = useRef(null)
    const [inView, setInView] = useState(false)
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
            { threshold }
        )
        if (ref.current) obs.observe(ref.current)
        return () => obs.disconnect()
    }, [threshold])
    return [ref, inView]
}

// ─── Animated counter ─────────────────────────────────────────────────────
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

// ─── Fade-in wrapper ──────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
    const [ref, inView] = useInView()
    const transforms = { up: 'translateY(40px)', down: 'translateY(-40px)', left: 'translateX(-40px)', right: 'translateX(40px)' }
    return (
        <div ref={ref} className={className} style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : transforms[direction],
            transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        }}>
            {children}
        </div>
    )
}

// ─── Floating particle ────────────────────────────────────────────────────
function Particle({ style }) {
    return <div className="absolute rounded-full pointer-events-none" style={style} />
}

// ─── Static data ──────────────────────────────────────────────────────────
const FEATURES = [
    { icon: Globe, title: 'Domain Portfolio', text: 'Track every domain, registrar, WHOIS, DNS records, and expiry in one place. Never miss a renewal again.' },
    { icon: Lock, title: 'SSL Lifecycle', text: 'Live TLS handshake checks, A+ SSL grading, ACME auto-renew, HSTS verification, and CT log monitoring.' },
    { icon: Server, title: 'DNS Manager', text: 'Full CRUD across Cloudflare, Route 53, Google Cloud DNS, GoDaddy & Namecheap with global propagation checks.' },
    { icon: Users, title: 'Client Portal', text: 'White-label, magic-link access. Clients see their own domains, invoices, and alerts — without admin chaos.' },
    { icon: FileText, title: 'GST Billing', text: 'Auto-generate GST-compliant PDF invoices per client. Track paid, pending, and overdue. Know your revenue at a glance.' },
    { icon: Bell, title: 'Smart Alerts', text: 'Email, WhatsApp, SMS, and Slack alerts for expiring domains, SSL, hosting — 9-stage renewal pipeline.' },
]

const STATS = [
    { n: 480, suffix: 'k+', l: 'Domains managed' },
    { n: 99.99, suffix: '%', l: 'Uptime SLA' },
    { n: 2000, suffix: '+', l: 'Teams onboarded' },
    { n: 60, suffix: 's', l: 'Alert dispatch' },
]

const STEPS = [
    { n: '01', icon: RefreshCw, title: 'Connect your registrars', text: 'Plug in API keys for GoDaddy, Namecheap, Cloudflare, BigRock, Hostinger and more. We auto-discover every asset.' },
    { n: '02', icon: Search, title: 'Organize your portfolio', text: 'Assets are auto-grouped by client, project, and category. Replace your spreadsheet in one afternoon.' },
    { n: '03', icon: Shield, title: 'Let automation run', text: 'Renewals, uptime checks, SSL grades, alerts, and invoices — NetVault handles it all while you sleep.' },
]

const INTEGRATIONS = ['GoDaddy', 'Namecheap', 'Cloudflare', 'BigRock', 'Hostinger', 'cPanel', 'Plesk', 'AWS', 'DigitalOcean', 'Google Cloud']

const TESTIMONIALS = [
    { initials: 'RM', color: '#4f72ff', name: 'Rohan Mehta', role: 'Operations Lead, Northstar Digital', quote: 'We were managing 600+ domains across 14 spreadsheets. The first week, we caught 23 expiring SSLs no one had noticed. Paid for itself instantly.' },
    { initials: 'AS', color: '#7c5cfc', name: 'Anjali Shah', role: 'Founder, PixelByte Studio', quote: 'The white-label client portal alone is worth the subscription. We bill clients ₹1,500/month for portfolio monitoring on top — pure margin.' },
    { initials: 'KV', color: '#059669', name: 'Karthik Venkat', role: 'Security Engineer, Finovax', quote: 'The CT log monitor flagged a fraudulent cert issued for our domain at 2am. We rotated keys before any damage. That single alert is worth a year of the platform.' },
]

const DOMAIN_ROWS = [
    { i: 'A', name: 'acmecorp.com', reg: 'GoDaddy · Auto-renew on', ssl: 'A+', sslC: '#22c55e', days: '187 days', accent: '#4f72ff' },
    { i: 'B', name: 'brightlabs.io', reg: 'Cloudflare · Locked', ssl: '14d', sslC: '#f59e0b', days: '62 days', accent: '#7c5cfc' },
    { i: 'N', name: 'novabank.in', reg: 'BigRock · WHOIS private', ssl: 'A', sslC: '#22c55e', days: '410 days', accent: '#059669' },
    { i: 'P', name: 'pixelstudio.co', reg: 'Namecheap · Locked', ssl: '3d', sslC: '#ef4444', days: '3 days', accent: '#ef4444', alert: true },
]

// ─── Typewriter ───────────────────────────────────────────────────────────
function Typewriter({ words, speed = 80, pause = 1800 }) {
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
        } else if (deleting && charIdx === 0) {
            setDeleting(false); setWIdx(i => (i + 1) % words.length)
        }
        return () => clearTimeout(timeout)
    }, [charIdx, deleting, wIdx, words, speed, pause])
    return (
        <span>
            {display}
            <span className="animate-pulse" style={{ borderRight: '3px solid currentColor', marginLeft: 2 }}>&nbsp;</span>
        </span>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function Landing() {
    const { theme, mode } = useTheme()
    const [plans, setPlans] = useState([])
    const [heroVisible, setHeroVisible] = useState(false)
    const [mockupRow, setMockupRow] = useState(0)
    const isLight = mode === 'light'

    useEffect(() => {
        api.get('/plans').then(res => setPlans(res.data?.data?.plans || [])).catch(() => setPlans([]))
        const t = setTimeout(() => setHeroVisible(true), 100)
        return () => clearTimeout(t)
    }, [])

    // Cycle through domain rows in mockup
    useEffect(() => {
        const t = setInterval(() => setMockupRow(r => (r + 1) % DOMAIN_ROWS.length), 2000)
        return () => clearInterval(t)
    }, [])

    const surface = { background: theme.surface, border: `1px solid ${theme.border}` }
    const accentBg = (op = '15') => `${theme.accent}${op}`

    // Floating particles config
    const particles = [
        { width: 6, height: 6, top: '15%', left: '8%', background: `${theme.accent}60`, animation: 'floatA 6s ease-in-out infinite' },
        { width: 10, height: 10, top: '35%', left: '92%', background: `${theme.accent2}50`, animation: 'floatB 8s ease-in-out infinite' },
        { width: 4, height: 4, top: '65%', left: '5%', background: `${theme.accent}40`, animation: 'floatA 5s ease-in-out infinite 1s' },
        { width: 8, height: 8, top: '75%', left: '88%', background: `${theme.accent2}40`, animation: 'floatB 7s ease-in-out infinite 2s' },
        { width: 5, height: 5, top: '50%', left: '95%', background: `${theme.accent}50`, animation: 'floatA 9s ease-in-out infinite 0.5s' },
        { width: 12, height: 12, top: '20%', left: '96%', background: `${theme.accent2}30`, animation: 'floatB 11s ease-in-out infinite 3s' },
    ]

    return (
        <div style={{ background: theme.bg, color: theme.text }} className="min-h-screen overflow-x-hidden">

            {/* ── Global keyframes ──────────────────────────────────────── */}
            <style>{`
                @keyframes floatA {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                @keyframes floatB {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-14px) scale(1.3); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes slideInRow {
                    from { opacity: 0; transform: translateX(-16px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes heroFadeUp {
                    from { opacity: 0; transform: translateY(32px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .shimmer-text {
                    background: linear-gradient(90deg, currentColor 0%, #fff 40%, currentColor 60%, currentColor 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
                .hero-word { display: inline-block; }
                .card-hover {
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                }
                .card-hover:hover {
                    transform: translateY(-6px);
                }
                .integration-ticker {
                    animation: ticker 20s linear infinite;
                    width: max-content;
                }
                .integration-ticker:hover { animation-play-state: paused; }
            `}</style>

            {/* ── NAV ───────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl"
                style={{ background: `${theme.bg}cc`, borderBottom: `1px solid ${theme.border}` }}>
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                            N
                        </div>
                        <span className="font-display font-bold text-xl">
                            Net<span style={{ color: theme.accent }}>Vault</span>
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: theme.muted }}>
                        <a href="#features" className="hover:opacity-80 transition-opacity">Features</a>
                        <a href="#how" className="hover:opacity-80 transition-opacity">How it works</a>
                        <a href="#pricing" className="hover:opacity-80 transition-opacity">Pricing</a>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-80 transition-opacity" style={{ color: theme.text }}>
                            Sign in
                        </Link>
                        <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 hidden sm:block"
                            style={{ background: theme.accent, color: '#12100C' }}>
                            Get started →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center' }}>

                {/* Animated gradient mesh background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div style={{
                        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
                        width: '900px', height: '600px', borderRadius: '50%',
                        background: `radial-gradient(ellipse, ${theme.accent}22 0%, transparent 70%)`,
                        animation: 'floatB 10s ease-in-out infinite',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-10%', right: '-10%',
                        width: '500px', height: '500px', borderRadius: '50%',
                        background: `radial-gradient(ellipse, ${theme.accent2}18 0%, transparent 70%)`,
                        animation: 'floatA 13s ease-in-out infinite 2s',
                    }} />
                    {/* Grid pattern */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                        opacity: 0.4,
                        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
                    }} />
                    {/* Floating particles */}
                    {particles.map((p, i) => <Particle key={i} style={p} />)}
                </div>

                <div className="max-w-5xl mx-auto px-6 py-24 text-center relative w-full">

                    {/* Announcement pill */}
                    <div style={{
                        opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)',
                        transition: 'all 0.6s ease 0ms',
                    }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6"
                            style={{ background: accentBg(), color: theme.accent, border: `1px solid ${theme.border}` }}>
                            {/* Pulse dot with ring */}
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full opacity-75"
                                    style={{ background: theme.accent, animation: 'pulse-ring 1.5s ease-out infinite' }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: theme.accent }} />
                            </span>
                            New — Subdomain Takeover Scanner &amp; CT Monitoring now live
                        </div>
                    </div>

                    {/* Label */}
                    <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease 100ms' }}>
                        <p className="text-xs font-mono uppercase tracking-[0.2em] mb-5" style={{ color: theme.muted }}>
                            Built for agencies, MSPs &amp; IT teams
                        </p>
                    </div>

                    {/* Headline */}
                    <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(24px)', transition: 'all 0.7s ease 200ms' }}>
                        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-[64px] leading-[1.07] mb-6 tracking-tight">
                            Every domain, SSL &amp; host
                            <br />
                            {/* FIX: replaced `background` shorthand with `backgroundImage` longhand
                                to avoid conflict with `backgroundSize` (React warning resolved) */}
                            <span style={{
                                backgroundImage: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2}, ${theme.accent})`,
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'gradientShift 4s ease infinite',
                            }}>
                                in one command center.
                            </span>
                        </h1>
                    </div>

                    {/* Typewriter subtitle */}
                    <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease 350ms' }}>
                        <p className="text-base md:text-lg max-w-xl mx-auto mb-9 leading-relaxed" style={{ color: theme.muted }}>
                            Stop juggling dashboards. NetVault unifies every{' '}
                            <span style={{ color: theme.accent, fontWeight: 700 }}>
                                <Typewriter words={['domain', 'SSL certificate', 'DNS record', 'hosting account', 'client invoice']} />
                            </span>
                            {' '}across every registrar and client.
                        </p>
                    </div>

                    {/* CTA pair */}
                    <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease 480ms' }}>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                            <Link to="/register"
                                className="px-7 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 group"
                                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C', boxShadow: `0 0 30px ${theme.accent}40` }}>
                                Start 14-day free trial
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login"
                                className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/5"
                                style={{ color: theme.text, border: `1px solid ${theme.border}` }}>
                                Sign in to your account
                            </Link>
                        </div>
                        <p className="text-xs mt-4" style={{ color: theme.muted }}>
                            No credit card required · Cancel anytime · Free for up to 10 domains forever
                        </p>
                    </div>

                    {/* Dashboard mockup */}
                    <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(32px)', transition: 'all 0.9s ease 600ms' }}>
                        <div className="mt-16 rounded-2xl overflow-hidden text-left"
                            style={{ ...surface, background: isLight ? theme.bg2 : theme.surface, boxShadow: `0 40px 80px ${theme.accent}15, 0 0 0 1px ${theme.border}` }}>

                            {/* Titlebar */}
                            <div className="flex items-center gap-2.5 px-4 py-3"
                                style={{ background: isLight ? theme.bg : '#0d0d18', borderBottom: `1px solid ${theme.border}` }}>
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                </div>
                                <span className="flex-1 text-center text-xs" style={{ color: theme.muted }}>
                                    🔒 app.netvault.io / portfolio
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: '#22c55e20', color: '#4ade80' }}>
                                    ● LIVE
                                </span>
                            </div>

                            {/* Domain rows with animation */}
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-display font-bold text-sm">Domain Portfolio</span>
                                    <div className="flex gap-2">
                                        {[{ label: 'All 1,284', c: '#22c55e' }, { label: 'Expiring 32', c: '#f59e0b' }, { label: 'Issues 4', c: '#ef4444' }].map(t => (
                                            <span key={t.label} className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${t.c}20`, color: t.c }}>
                                                {t.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {DOMAIN_ROWS.map((d, i) => (
                                    <div key={d.name}
                                        className="flex items-center gap-3 rounded-xl px-3.5 py-3 mb-2 last:mb-0"
                                        style={{
                                            background: i === mockupRow ? (isLight ? `${theme.accent}08` : `${theme.accent}12`) : (isLight ? theme.bg : '#14141f'),
                                            border: d.alert ? '1px solid #ef444440' : i === mockupRow ? `1px solid ${theme.accent}40` : `1px solid ${theme.border}`,
                                            transition: 'all 0.5s ease',
                                        }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                            style={{ background: `${d.accent}25`, color: d.accent }}>
                                            {d.i}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold">{d.name}</div>
                                            <div className="text-xs" style={{ color: theme.muted }}>{d.reg}</div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                            style={{ background: `${d.sslC}20`, color: d.sslC }}>
                                            SSL {d.ssl}
                                        </span>
                                        <span className="text-xs" style={{ color: d.alert ? '#ef4444' : theme.muted }}>
                                            {d.days}
                                        </span>
                                    </div>
                                ))}

                                {/* Progress bar animation */}
                                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: `${theme.accent}15` }}>
                                    <div style={{
                                        height: '100%', borderRadius: 9999,
                                        background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
                                        width: `${((mockupRow + 1) / DOMAIN_ROWS.length) * 100}%`,
                                        transition: 'width 1.8s ease',
                                    }} />
                                </div>

                                <div className="mt-3 flex items-center justify-between rounded-xl px-4 py-2.5"
                                    style={{ background: '#ef444412', border: '1px solid #ef444430' }}>
                                    <span className="text-xs font-medium" style={{ color: '#f87171' }}>
                                        ⚠ SSL expires in 3 days · pixelstudio.co · auto-renew triggered
                                    </span>
                                    <span className="text-sm font-bold" style={{ color: '#4ade80' }}>+₹4.2L</span>
                                </div>
                            </div>
                        </div>

                        {/* Social proof */}
                        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                            <div className="flex">
                                {['M', 'A', 'R', '+'].map((l, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold -mr-2 last:mr-0"
                                        style={{ background: [accentBg('40'), `${theme.accent2}40`, '#05966940', '#33333360'][i], borderColor: theme.bg, color: theme.text }}>
                                        {l}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm" style={{ color: theme.muted }}>
                                ★★★★★ &nbsp; 2,000+ teams managing <strong style={{ color: theme.text }}>480k+</strong> domains
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ─────────────────────────────────────────────────── */}
            <section className="border-y" style={{ borderColor: theme.border, background: isLight ? theme.bg2 : accentBg('05') }}>
                <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {STATS.map((s, i) => (
                        <FadeIn key={s.l} delay={i * 100}>
                            <div className="font-display font-bold text-3xl md:text-4xl mb-1" style={{ color: theme.accent }}>
                                <Counter target={s.n} suffix={s.suffix} />
                            </div>
                            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: theme.muted }}>{s.l}</div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* ── INTEGRATIONS TICKER ───────────────────────────────────── */}
            <section className="py-10 overflow-hidden" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <div className="max-w-5xl mx-auto px-6 mb-6">
                    <p className="text-xs font-mono uppercase tracking-widest text-center" style={{ color: theme.muted }}>
                        Integrates natively with the providers you already use
                    </p>
                </div>
                <div className="overflow-hidden relative">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                        style={{ background: `linear-gradient(90deg, ${theme.bg}, transparent)` }} />
                    <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
                        style={{ background: `linear-gradient(-90deg, ${theme.bg}, transparent)` }} />
                    <div className="flex integration-ticker">
                        {[...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
                            <span key={i} className="mx-3 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0"
                                style={{ ...surface, color: theme.muted }}>
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────────── */}
            <section id="features" className="py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-14">
                            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>What's inside</p>
                            <h2 className="font-display font-bold text-3xl md:text-4xl">
                                One intelligent layer over{' '}
                                <span style={{ color: theme.accent }}>your entire stack</span>
                            </h2>
                            <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: theme.muted }}>
                                From domain registrars to DNS, from SSL chains to cloud servers — every signal flows into one operational view.
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <FadeIn key={f.title} delay={i * 80} direction={i % 2 === 0 ? 'up' : 'up'}>
                                <div className="p-6 rounded-2xl card-hover h-full"
                                    style={{ ...surface, cursor: 'default' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = `${theme.accent}60`
                                        e.currentTarget.style.boxShadow = `0 12px 40px ${theme.accent}15`
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = theme.border
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}>
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: accentBg() }}>
                                        <f.icon size={18} style={{ color: theme.accent }} />
                                    </div>
                                    <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{f.text}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
            <section id="how" className="py-24" style={{ background: isLight ? theme.bg2 : accentBg('04') }}>
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-14">
                            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>How it works</p>
                            <h2 className="font-display font-bold text-3xl md:text-4xl">From scattered to in control in 3 steps</h2>
                        </div>
                    </FadeIn>
                    <div className="grid md:grid-cols-3 gap-5">
                        {STEPS.map((s, i) => (
                            <FadeIn key={s.n} delay={i * 150} direction="up">
                                <div className="p-6 rounded-2xl relative card-hover h-full" style={surface}>
                                    <div className="font-display font-black text-5xl mb-4 leading-none" style={{ color: accentBg('35') }}>{s.n}</div>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: accentBg() }}>
                                        <s.icon size={16} style={{ color: theme.accent }} />
                                    </div>
                                    <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{s.text}</p>
                                    {i < STEPS.length - 1 && (
                                        <div className="hidden md:block absolute top-1/2 -right-3 text-lg" style={{ color: theme.accent }}>→</div>
                                    )}
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
            <section className="py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-14">
                            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>Loved by operators</p>
                            <h2 className="font-display font-bold text-3xl md:text-4xl">Trusted by agencies and IT teams</h2>
                        </div>
                    </FadeIn>
                    <div className="grid md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <FadeIn key={t.name} delay={i * 120} direction="up">
                                <div className="p-6 rounded-2xl card-hover h-full" style={surface}>
                                    <div className="text-amber-400 text-sm tracking-wider mb-3">★★★★★</div>
                                    <p className="text-sm leading-relaxed mb-5 italic" style={{ color: theme.muted }}>"{t.quote}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ background: `${t.color}25`, color: t.color }}>
                                            {t.initials}
                                        </div>
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

            {/* ── PRICING ───────────────────────────────────────────────── */}
            <section id="pricing" className="py-24" style={{ background: isLight ? theme.bg2 : accentBg('04') }}>
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-14">
                            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>Pricing</p>
                            <h2 className="font-display font-bold text-3xl md:text-4xl">Simple plans that scale with your portfolio</h2>
                            <p className="text-sm mt-3" style={{ color: theme.muted }}>Start free. Upgrade when you outgrow it. No per-domain pricing tricks.</p>
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
                                        <div className="p-6 rounded-2xl flex flex-col relative card-hover h-full"
                                            style={{ background: popular ? accentBg('08') : theme.surface, border: `${popular ? '2px' : '1px'} solid ${popular ? theme.accent : theme.border}` }}>
                                            {popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                                                    style={{ background: theme.accent, color: '#12100C' }}>
                                                    <Star size={10} /> Most popular
                                                </div>
                                            )}
                                            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>{p.displayName}</p>
                                            <div className="flex items-baseline gap-1 mb-1">
                                                <span className="font-display font-black text-4xl">₹{p.price}</span>
                                                {p.price > 0 && <span className="text-sm" style={{ color: theme.muted }}>/{p.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>}
                                            </div>
                                            {p.trialDays > 0
                                                ? <p className="text-xs mb-5" style={{ color: theme.muted }}>{p.trialDays}-day free trial</p>
                                                : <p className="text-xs mb-5" style={{ color: theme.muted }}>Free forever</p>}
                                            <div className="space-y-2 mb-6 flex-1">
                                                {(p.features || []).map(f => (
                                                    <div key={f} className="flex items-start gap-2 text-sm">
                                                        <Check size={14} style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" />
                                                        <span>{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Link to={`/register?plan=${p._id}`}
                                                className="w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all active:scale-95 block"
                                                style={popular ? { background: theme.accent, color: '#12100C' } : { background: accentBg(), color: theme.accent, border: `1px solid ${theme.border}` }}>
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

            {/* ── FINAL CTA ─────────────────────────────────────────────── */}
            <section className="py-24">
                <div className="max-w-3xl mx-auto px-6">
                    <FadeIn>
                        <div className="rounded-3xl px-8 md:px-16 py-16 text-center relative overflow-hidden"
                            style={{ background: isLight ? theme.bg2 : `linear-gradient(135deg, ${theme.accent}12, ${theme.accent2}08)`, border: `1px solid ${theme.accent}30` }}>
                            {/* Background glow */}
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${theme.accent}15, transparent)` }} />
                            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 relative">
                                Stop firefighting domain expiries.
                            </h2>
                            <p className="text-base mb-8 relative" style={{ color: theme.muted }}>
                                14-day free trial. No credit card. Connect your first registrar and see your full portfolio in minutes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center relative">
                                <Link to="/register"
                                    className="px-7 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 group"
                                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C', boxShadow: `0 0 30px ${theme.accent}40` }}>
                                    Create your account <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/login"
                                    className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/5"
                                    style={{ color: theme.text, border: `1px solid ${theme.border}` }}>
                                    Sign in
                                </Link>
                            </div>
                            <div className="mt-5 flex gap-5 justify-center flex-wrap relative">
                                {['No credit card', 'Cancel anytime', 'Free for up to 10 domains'].map(t => (
                                    <span key={t} className="text-xs" style={{ color: '#4ade80' }}>✓ {t}</span>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────────────── */}
            <footer className="py-10" style={{ borderTop: `1px solid ${theme.border}` }}>
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                            N
                        </div>
                        <span className="font-display font-bold text-sm">Net<span style={{ color: theme.accent }}>Vault</span></span>
                        <span className="text-xs ml-2" style={{ color: theme.muted }}>© {new Date().getFullYear()} NetVault Technologies Pvt. Ltd. · Made in India 🇮🇳</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm" style={{ color: theme.muted }}>
                        <Link to="/login" className="hover:opacity-80">Sign in</Link>
                        <Link to="/register" className="hover:opacity-80">Register</Link>
                        <a href="#features" className="hover:opacity-80">Features</a>
                        <a href="#pricing" className="hover:opacity-80">Pricing</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
