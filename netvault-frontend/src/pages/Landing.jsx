import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ui/ThemeToggle'
import {
    Globe, Server, Users, FileText, Bell, Lock,
    Check, ArrowRight, Shield, Star, Search, RefreshCw,
} from 'lucide-react'
import api from '../services/api'

// ─── Static data ─────────

const FEATURES = [
    {
        icon: Globe,
        title: 'Domain Portfolio',
        text: 'Track every domain, registrar, WHOIS, DNS records, and expiry in one place. Never miss a renewal again.',
    },
    {
        icon: Lock,
        title: 'SSL Lifecycle',
        text: 'Live TLS handshake checks, A+ SSL grading, ACME auto-renew, HSTS verification, and CT log monitoring.',
    },
    {
        icon: Server,
        title: 'DNS Manager',
        text: 'Full CRUD across Cloudflare, Route 53, Google Cloud DNS, GoDaddy & Namecheap with global propagation checks.',
    },
    {
        icon: Users,
        title: 'Client Portal',
        text: 'White-label, magic-link access. Clients see their own domains, invoices, and alerts — without admin chaos.',
    },
    {
        icon: FileText,
        title: 'GST Billing',
        text: 'Auto-generate GST-compliant PDF invoices per client. Track paid, pending, and overdue. Know your revenue at a glance.',
    },
    {
        icon: Bell,
        title: 'Smart Alerts',
        text: 'Email, WhatsApp, SMS, and Slack alerts for expiring domains, SSL, hosting — 9-stage renewal pipeline.',
    },
]

const STATS = [
    { n: '480k+', l: 'Domains managed' },
    { n: '99.99%', l: 'Uptime SLA' },
    { n: 'AES-256', l: 'Vault encryption' },
    { n: '<60s', l: 'Alert dispatch' },
]

const STEPS = [
    {
        n: '01',
        icon: RefreshCw,
        title: 'Connect your registrars',
        text: 'Plug in API keys for GoDaddy, Namecheap, Cloudflare, BigRock, Hostinger and more. We auto-discover every asset.',
    },
    {
        n: '02',
        icon: Search,
        title: 'Organize your portfolio',
        text: 'Assets are auto-grouped by client, project, and category. Replace your spreadsheet in one afternoon.',
    },
    {
        n: '03',
        icon: Shield,
        title: 'Let automation run',
        text: 'Renewals, uptime checks, SSL grades, alerts, and invoices — DomainVault handles it all while you sleep.',
    },
]

const INTEGRATIONS = [
    'GoDaddy', 'Namecheap', 'Cloudflare', 'BigRock',
    'Hostinger', 'cPanel', 'Plesk', 'AWS', 'DigitalOcean', 'Google Cloud',
]

const TESTIMONIALS = [
    {
        initials: 'RM', color: '#4f72ff',
        name: 'Rohan Mehta', role: 'Operations Lead, Northstar Digital',
        quote: 'We were managing 600+ domains across 14 spreadsheets. The first week, we caught 23 expiring SSLs no one had noticed. Paid for itself instantly.',
    },
    {
        initials: 'AS', color: '#7c5cfc',
        name: 'Anjali Shah', role: 'Founder, PixelByte Studio',
        quote: 'The white-label client portal alone is worth the subscription. We bill clients ₹1,500/month for portfolio monitoring on top — pure margin.',
    },
    {
        initials: 'KV', color: '#059669',
        name: 'Karthik Venkat', role: 'Security Engineer, Finovax',
        quote: 'The CT log monitor flagged a fraudulent cert issued for our domain at 2am. We rotated keys before any damage. That single alert is worth a year of the platform.',
    },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Landing() {
    const { theme, mode } = useTheme()
    const [plans, setPlans] = useState([])
    const isLight = mode === 'light'

    useEffect(() => {
        api.get('/plans')
            .then(res => setPlans(res.data?.data?.plans || []))
            .catch(() => setPlans([]))
    }, [])

    // Shared style helpers
    const surface = { background: theme.surface, border: `1px solid ${theme.border}` }
    const accentBg = (opacity = '15') => `${theme.accent}${opacity}`

    return (
        <div style={{ background: theme.bg, color: theme.text }} className="min-h-screen overflow-x-hidden">

            {/* ── NAV ───────────────────────────────────────────────────── */}
            <nav
                className="sticky top-0 z-50 backdrop-blur-xl"
                style={{ background: `${theme.bg}cc`, borderBottom: `1px solid ${theme.border}` }}
            >
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}
                        >
                            D
                        </div>
                        <span className="font-display font-bold text-xl">
                            Net<span style={{ color: theme.accent }}>Vault</span>
                        </span>
                    </Link>

                    {/* Nav links */}
                    <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: theme.muted }}>
                        <a href="#features" className="hover:opacity-80 transition-opacity">Features</a>
                        <a href="#how" className="hover:opacity-80 transition-opacity">How it works</a>
                        <a href="#pricing" className="hover:opacity-80 transition-opacity">Pricing</a>
                    </div>

                    {/* Auth CTAs */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link
                            to="/login"
                            className="text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-80 transition-opacity"
                            style={{ color: theme.text }}
                        >
                            Sign in
                        </Link>
                        <Link
                            to="/register"
                            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 hidden sm:block"
                            style={{ background: theme.accent, color: '#fff' }}
                        >
                            Get started →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                {/* Glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${theme.accent}18, transparent)` }}
                />

                <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center relative">
                    {/* Announcement pill */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6"
                        style={{ background: accentBg(), color: theme.accent, border: `1px solid ${theme.border}` }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accent }} />
                        New — Subdomain Takeover Scanner &amp; CT Monitoring now live
                    </div>

                    {/* Headline */}
                    <p className="text-xs font-mono uppercase tracking-[0.2em] mb-5" style={{ color: theme.muted }}>
                        Built for agencies, MSPs &amp; IT teams
                    </p>
                    <h1 className="font-display font-black text-4xl sm:text-5xl md:text-[64px] leading-[1.07] mb-6 tracking-tight">
                        Every domain, SSL &amp; host
                        <br />
                        <span style={{ color: theme.accent }}>in a single command center.</span>
                    </h1>
                    <p className="text-base md:text-lg max-w-xl mx-auto mb-9 leading-relaxed" style={{ color: theme.muted }}>
                        DomainVault unifies every domain, certificate, DNS record, hosting account,
                        mailbox, and cloud asset across every client and registrar.
                        Stop juggling 14 dashboards — start running infrastructure like an operator.
                    </p>

                    {/* CTA pair */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <Link
                            to="/register"
                            className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                            style={{ background: theme.accent, color: '#fff' }}
                        >
                            Start 14-day free trial <ArrowRight size={14} />
                        </Link>
                        <Link
                            to="/login"
                            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                            style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}
                        >
                            Sign in to your account
                        </Link>
                    </div>
                    <p className="text-xs mt-4" style={{ color: theme.muted }}>
                        No credit card required · Cancel anytime · Free for up to 10 domains forever
                    </p>

                    {/* Dashboard mockup */}
                    <div
                        className="mt-16 rounded-2xl overflow-hidden text-left"
                        style={{ ...surface, background: isLight ? theme.bg2 : theme.surface }}
                    >
                        {/* Titlebar */}
                        <div
                            className="flex items-center gap-2.5 px-4 py-3"
                            style={{ background: isLight ? theme.bg : '#0d0d18', borderBottom: `1px solid ${theme.border}` }}
                        >
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            </div>
                            <span className="flex-1 text-center text-xs" style={{ color: theme.muted }}>
                                🔒 app.domainvault.io / portfolio
                            </span>
                            <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                style={{ background: '#22c55e20', color: '#4ade80' }}
                            >
                                ● LIVE
                            </span>
                        </div>

                        {/* Domain rows */}
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-display font-bold text-sm">Domain Portfolio</span>
                                <div className="flex gap-2">
                                    {[
                                        { label: 'All 1,284', c: '#22c55e' },
                                        { label: 'Expiring 32', c: '#f59e0b' },
                                        { label: 'Issues 4', c: '#ef4444' },
                                    ].map(t => (
                                        <span
                                            key={t.label}
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                            style={{ background: `${t.c}20`, color: t.c }}
                                        >
                                            {t.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {[
                                { i: 'A', name: 'acmecorp.com', reg: 'GoDaddy · Auto-renew on', ssl: 'A+', sslC: '#22c55e', days: '187 days', accent: theme.accent },
                                { i: 'B', name: 'brightlabs.io', reg: 'Cloudflare · Locked', ssl: '14d', sslC: '#f59e0b', days: '62 days', accent: theme.accent2 },
                                { i: 'N', name: 'novabank.in', reg: 'BigRock · WHOIS private', ssl: 'A', sslC: '#22c55e', days: '410 days', accent: '#059669' },
                                { i: 'P', name: 'pixelstudio.co', reg: 'Namecheap · Locked', ssl: '3d', sslC: '#ef4444', days: '3 days', accent: '#ef4444', alert: true },
                            ].map(d => (
                                <div
                                    key={d.name}
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-3 mb-2 last:mb-0"
                                    style={{
                                        background: isLight ? theme.bg : '#14141f',
                                        border: d.alert ? '1px solid #ef444440' : `1px solid ${theme.border}`,
                                    }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{ background: `${d.accent}25`, color: d.accent }}
                                    >
                                        {d.i}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold">{d.name}</div>
                                        <div className="text-xs" style={{ color: theme.muted }}>{d.reg}</div>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                        style={{ background: `${d.sslC}20`, color: d.sslC }}
                                    >
                                        SSL {d.ssl}
                                    </span>
                                    <span className="text-xs" style={{ color: d.alert ? '#ef4444' : theme.muted }}>
                                        {d.days}
                                    </span>
                                </div>
                            ))}

                            {/* Alert banner */}
                            <div
                                className="mt-3 flex items-center justify-between rounded-xl px-4 py-2.5"
                                style={{ background: '#ef444412', border: '1px solid #ef444430' }}
                            >
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
                                <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold -mr-2 last:mr-0"
                                    style={{
                                        background: [accentBg('40'), `${theme.accent2}40`, '#05966940', '#33333360'][i],
                                        borderColor: theme.bg,
                                        color: theme.text,
                                    }}
                                >
                                    {l}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm" style={{ color: theme.muted }}>
                            ★★★★★ &nbsp; 2,000+ teams managing{' '}
                            <strong style={{ color: theme.text }}>480k+</strong> domains
                        </span>
                    </div>
                </div>
            </section>

            {/* ── TRUST STRIP ───────────────────────────────────────────── */}
            <section
                className="border-y"
                style={{ borderColor: theme.border, background: isLight ? theme.bg2 : accentBg('05') }}
            >
                <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {STATS.map(s => (
                        <div key={s.l}>
                            <div className="font-display font-bold text-2xl md:text-3xl mb-1" style={{ color: theme.accent }}>
                                {s.n}
                            </div>
                            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: theme.muted }}>
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── INTEGRATIONS STRIP ────────────────────────────────────── */}
            <section className="py-10 overflow-hidden" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <div className="max-w-5xl mx-auto px-6">
                    <p className="text-xs font-mono uppercase tracking-widest text-center mb-6" style={{ color: theme.muted }}>
                        Integrates natively with the providers you already use
                    </p>
                    <div className="flex flex-wrap gap-2.5 justify-center">
                        {INTEGRATIONS.map(i => (
                            <span
                                key={i}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ ...surface, color: theme.muted }}
                            >
                                {i}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────────── */}
            <section id="features" className="py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                            What's inside
                        </p>
                        <h2 className="font-display font-bold text-3xl md:text-4xl">
                            One intelligent layer over{' '}
                            <span style={{ color: theme.accent }}>your entire stack</span>
                        </h2>
                        <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: theme.muted }}>
                            From domain registrars to DNS, from SSL chains to cloud servers — every signal
                            flows into one operational view.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map(f => (
                            <div
                                key={f.title}
                                className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                                style={surface}
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: accentBg() }}
                                >
                                    <f.icon size={18} style={{ color: theme.accent }} />
                                </div>
                                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
            <section id="how" className="py-24" style={{ background: isLight ? theme.bg2 : accentBg('04') }}>
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                            How it works
                        </p>
                        <h2 className="font-display font-bold text-3xl md:text-4xl">
                            From scattered to in control in 3 steps
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {STEPS.map(s => (
                            <div key={s.n} className="p-6 rounded-2xl relative" style={surface}>
                                <div
                                    className="font-display font-black text-5xl mb-4 leading-none"
                                    style={{ color: accentBg('35') }}
                                >
                                    {s.n}
                                </div>
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                    style={{ background: accentBg() }}
                                >
                                    <s.icon size={16} style={{ color: theme.accent }} />
                                </div>
                                <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
            <section className="py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                            Loved by operators
                        </p>
                        <h2 className="font-display font-bold text-3xl md:text-4xl">
                            Trusted by agencies and IT teams
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map(t => (
                            <div key={t.name} className="p-6 rounded-2xl" style={surface}>
                                <div className="text-amber-400 text-sm tracking-wider mb-3">★★★★★</div>
                                <p className="text-sm leading-relaxed mb-5 italic" style={{ color: theme.muted }}>
                                    "{t.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                        style={{ background: `${t.color}25`, color: t.color }}
                                    >
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{t.name}</div>
                                        <div className="text-xs" style={{ color: theme.muted }}>{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING (LIVE from /api/plans) ────────────────────────── */}
            <section id="pricing" className="py-24" style={{ background: isLight ? theme.bg2 : accentBg('04') }}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                            Pricing
                        </p>
                        <h2 className="font-display font-bold text-3xl md:text-4xl">
                            Simple plans that scale with your portfolio
                        </h2>
                        <p className="text-sm mt-3" style={{ color: theme.muted }}>
                            Start free. Upgrade when you outgrow it. No per-domain pricing tricks.
                        </p>
                    </div>

                    {plans.length === 0 ? (
                        <div className="text-center py-12 text-sm" style={{ color: theme.muted }}>
                            Loading plans…
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                            {plans.map(p => {
                                const popular = p.isPopular
                                return (
                                    <div
                                        key={p._id}
                                        className="p-6 rounded-2xl flex flex-col relative transition-all hover:-translate-y-1"
                                        style={{
                                            background: popular ? accentBg('08') : theme.surface,
                                            border: `${popular ? '2px' : '1px'} solid ${popular ? theme.accent : theme.border}`,
                                        }}
                                    >
                                        {popular && (
                                            <div
                                                className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                                                style={{ background: theme.accent, color: '#fff' }}
                                            >
                                                <Star size={10} /> Most popular
                                            </div>
                                        )}
                                        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: theme.accent }}>
                                            {p.displayName}
                                        </p>
                                        <div className="flex items-baseline gap-1 mb-1">
                                            <span className="font-display font-black text-4xl">₹{p.price}</span>
                                            {p.price > 0 && (
                                                <span className="text-sm" style={{ color: theme.muted }}>
                                                    /{p.billingCycle === 'monthly' ? 'mo' : 'yr'}
                                                </span>
                                            )}
                                        </div>
                                        {p.trialDays > 0
                                            ? <p className="text-xs mb-5" style={{ color: theme.muted }}>{p.trialDays}-day free trial</p>
                                            : <p className="text-xs mb-5" style={{ color: theme.muted }}>Free forever</p>
                                        }

                                        <div className="space-y-2 mb-6 flex-1">
                                            {(p.features || []).map(f => (
                                                <div key={f} className="flex items-start gap-2 text-sm">
                                                    <Check size={14} style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" />
                                                    <span>{f}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Link
                                            to={`/register?plan=${p._id}`}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all active:scale-95"
                                            style={popular
                                                ? { background: theme.accent, color: '#fff' }
                                                : { background: accentBg(), color: theme.accent, border: `1px solid ${theme.border}` }
                                            }
                                        >
                                            Start with {p.displayName}
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────────────────── */}
            <section className="py-24">
                <div className="max-w-3xl mx-auto px-6">
                    <div
                        className="rounded-3xl px-8 md:px-16 py-16 text-center"
                        style={{
                            background: isLight
                                ? theme.bg2
                                : `linear-gradient(135deg, ${theme.accent}12, ${theme.accent2}08)`,
                            border: `1px solid ${theme.accent}30`,
                        }}
                    >
                        <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                            Stop firefighting domain expiries.
                        </h2>
                        <p className="text-base mb-8" style={{ color: theme.muted }}>
                            14-day free trial. No credit card. Connect your first registrar and see your
                            full portfolio in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                            <Link
                                to="/register"
                                className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                                style={{ background: theme.accent, color: '#fff' }}
                            >
                                Create your account <ArrowRight size={14} />
                            </Link>
                            <Link
                                to="/login"
                                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                                style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}
                            >
                                Sign in
                            </Link>
                        </div>
                        <div className="mt-5 flex gap-5 justify-center flex-wrap">
                            {['No credit card', 'Cancel anytime', 'Free for up to 10 domains'].map(t => (
                                <span key={t} className="text-xs" style={{ color: '#4ade80' }}>✓ {t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────────────── */}
            <footer className="py-10" style={{ borderTop: `1px solid ${theme.border}` }}>
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
                            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}
                        >
                            D
                        </div>
                        <span className="font-display font-bold text-sm">
                            Domain<span style={{ color: theme.accent }}>Vault</span>
                        </span>
                        <span className="text-xs ml-2" style={{ color: theme.muted }}>
                            © {new Date().getFullYear()} DomainVault Technologies Pvt. Ltd. · Made in India 🇮🇳
                        </span>
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