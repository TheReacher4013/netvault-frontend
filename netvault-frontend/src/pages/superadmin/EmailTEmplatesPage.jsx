import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Save, RotateCcw, Send, Eye, Palette, Type,
    ChevronRight, CheckCircle, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { superAdminService } from '../../services/api'

// ── Sidebar template list ─────────────────────────────────────────────────────
const TEMPLATE_ICONS = {
    welcome: '👋', reset: '🔒', otp: '🔢',
    'domain-urgent': '🌐', 'domain-warn': '🌐',
    hosting: '🖥️', ssl: '🔐', serverdown: '🔴',
    invoice: '🧾', invite: '✉️', 'portal-welcome': '🎉',
    'plan-change': '🔄', 'plan-activated': '✅', 'plan-rejected': '❌',
    announcement: '📢',
}

// ── Color picker row ──────────────────────────────────────────────────────────
function ColorField({ label, value, onChange }) {
    return (
        <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                {label}
            </label>
            <div className="flex items-center gap-3">
                <div
                    className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0 relative overflow-hidden cursor-pointer"
                    style={{ background: value }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-gray-400"
                    maxLength={7}
                />
            </div>
        </div>
    )
}

// ── Text field ────────────────────────────────────────────────────────────────
function TextField({ label, value, onChange, multiline, placeholder }) {
    const cls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 font-inherit"
    return (
        <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                {label}
            </label>
            {multiline
                ? <textarea value={value} onChange={e => onChange(e.target.value)}
                    placeholder={placeholder} rows={3}
                    className={cls + ' resize-y'} />
                : <input type="text" value={value} onChange={e => onChange(e.target.value)}
                    placeholder={placeholder} className={cls} />
            }
        </div>
    )
}

// ── Live preview panel ────────────────────────────────────────────────────────
function EmailPreview({ form }) {
    const isOtp = form.templateId === 'otp'
    const fill = (str) => (str || '').replace(/\{\{(\w+)\}\}/g, (_, k) => {
        const samples = {
            userName: 'Rahul Sharma', agencyName: 'TechAgency Pvt Ltd',
            domainName: 'techagency.com', daysLeft: '7', otpCode: '4 8 2 9 1 7',
            invoiceNo: 'INV-2025-042', amount: '12,500', dueDate: '15 May 2025',
            planName: 'Pro', oldPlan: 'Starter', newPlan: 'Pro', clientName: 'Amit Shah',
            title: 'New Feature Released', content: 'We\'ve launched Uptime Monitoring 2.0!',
            rejectionReason: 'Incomplete documents. Please resubmit.',
        }
        return samples[k] ?? `{{${k}}}`
    })

    return (
        <div className="bg-gray-100 rounded-xl p-4 h-full">
            <div className="bg-white max-w-md mx-auto rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div style={{ background: form.hdrColor, padding: '20px 24px' }}>
                    <div style={{ color: form.hdrTxtColor, fontSize: 18, fontWeight: 700 }}>
                        {fill(form.headerTitle) || 'NetVault'}
                    </div>
                    <div style={{ color: form.hdrTxtColor, opacity: 0.75, fontSize: 12, marginTop: 3 }}>
                        {fill(form.headerSub)}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px', background: '#fff' }}>
                    {form.greeting && (
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                            {fill(form.greeting)}
                        </div>
                    )}
                    {form.body && (
                        <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 10 }}>
                            {fill(form.body)}
                        </div>
                    )}
                    {form.highlight && (
                        isOtp
                            ? <div style={{ background: '#F5F5F0', border: `2px dashed ${form.hlColor}`, borderRadius: 10, padding: '14px', textAlign: 'center', margin: '14px 0' }}>
                                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 900, letterSpacing: 10, color: form.hlColor }}>
                                    {fill(form.highlight)}
                                </div>
                            </div>
                            : <div style={{ background: form.hlBg, borderLeft: `4px solid ${form.hlColor}`, padding: '12px 14px', borderRadius: '0 6px 6px 0', fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '12px 0' }}>
                                {fill(form.highlight)}
                            </div>
                    )}
                    {form.btnText && (
                        <a href="#" style={{ display: 'inline-block', background: form.btnColor, color: form.btnTxtColor, padding: '10px 22px', borderRadius: 7, textDecoration: 'none', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
                            {fill(form.btnText)}
                        </a>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 24px', background: form.footerBg, borderTop: '1px solid #E5E7EB', fontSize: 11, color: form.footerTxt, textAlign: 'center' }}>
                    {fill(form.footer)}
                </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">Live preview with sample data</p>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmailTemplatesPage() {
    const qc = useQueryClient()
    const [selectedId, setSelectedId] = useState('welcome')
    const [form, setForm] = useState(null)
    const [activeTab, setActiveTab] = useState('content') // content | design | preview
    const [previewEmail, setPreviewEmail] = useState('')
    const [showPreviewModal, setShowPreviewModal] = useState(false)

    // Fetch all templates
    const { data, isLoading } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => superAdminService.getEmailTemplates(),
    })
    const templates = data?.data?.data || []

    // Load selected template into form
    useEffect(() => {
        const t = templates.find(t => t.templateId === selectedId)
        if (t) setForm({ ...t })
    }, [selectedId, templates])

    const setField = useCallback((key, val) => {
        setForm(f => ({ ...f, [key]: val }))
    }, [])

    // Save mutation
    const saveMut = useMutation({
        mutationFn: () => superAdminService.updateEmailTemplate(selectedId, form),
        onSuccess: () => {
            toast.success('Template saved!')
            qc.invalidateQueries(['email-templates'])
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
    })

    // Reset mutation
    const resetMut = useMutation({
        mutationFn: () => superAdminService.resetEmailTemplate(selectedId),
        onSuccess: (res) => {
            toast.success('Reset to defaults')
            setForm({ ...res.data.data })
            qc.invalidateQueries(['email-templates'])
        },
        onError: () => toast.error('Reset failed'),
    })

    // Preview email mutation
    const previewMut = useMutation({
        mutationFn: () => superAdminService.sendEmailTemplatePreview(selectedId, { to: previewEmail }),
        onSuccess: () => {
            toast.success(`Preview sent to ${previewEmail}`)
            setShowPreviewModal(false)
        },
        onError: () => toast.error('Failed to send preview'),
    })

    const selectedMeta = templates.find(t => t.templateId === selectedId)

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
    )

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-xl border border-gray-200">

            {/* ── Sidebar ── */}
            <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-800">Email Templates</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{templates.length} templates</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {templates.map(t => (
                        <button
                            key={t.templateId}
                            onClick={() => { setSelectedId(t.templateId); setActiveTab('content') }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1 text-left transition-all border ${selectedId === t.templateId
                                    ? 'bg-white border-gray-200 shadow-sm'
                                    : 'border-transparent hover:bg-white hover:border-gray-100'
                                }`}
                        >
                            <span className="text-base flex-shrink-0">{TEMPLATE_ICONS[t.templateId] || '📧'}</span>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-gray-800 truncate">{t.name}</div>
                                <div className="text-[10px] text-gray-400 truncate">{t.tag}</div>
                            </div>
                            {selectedId === t.templateId && <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Editor + Preview ── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">

                {/* Tab bar */}
                <div className="flex items-center border-b border-gray-200 px-4">
                    {[
                        { id: 'content', icon: <Type size={13} />, label: 'Content' },
                        { id: 'design', icon: <Palette size={13} />, label: 'Design' },
                        { id: 'preview', icon: <Eye size={13} />, label: 'Preview' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all ${activeTab === tab.id
                                    ? 'border-gray-800 text-gray-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 py-2">
                        <button
                            onClick={() => setShowPreviewModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            <Send size={12} /> Send test
                        </button>
                        <button
                            onClick={() => resetMut.mutate()}
                            disabled={resetMut.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                            {resetMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Reset
                        </button>
                        <button
                            onClick={() => saveMut.mutate()}
                            disabled={saveMut.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"
                        >
                            {saveMut.isPending
                                ? <Loader2 size={12} className="animate-spin" />
                                : saveMut.isSuccess ? <CheckCircle size={12} /> : <Save size={12} />
                            }
                            Save
                        </button>
                    </div>
                </div>

                {/* Content */}
                {form && (
                    <div className="flex-1 overflow-hidden flex">

                        {/* Form panel (content & design tabs) */}
                        {activeTab !== 'preview' && (
                            <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-gray-100 p-4">
                                {activeTab === 'content' && (
                                    <>
                                        <TextField label="Subject line" value={form.subject} onChange={v => setField('subject', v)} />
                                        <TextField label="Header title" value={form.headerTitle} onChange={v => setField('headerTitle', v)} />
                                        <TextField label="Header subtitle" value={form.headerSub} onChange={v => setField('headerSub', v)} />
                                        <TextField label="Greeting" value={form.greeting} onChange={v => setField('greeting', v)} placeholder="Hi {{userName}}," />
                                        <TextField label="Main message" value={form.body} onChange={v => setField('body', v)} multiline placeholder="Main body text..." />
                                        <TextField label="Highlight box" value={form.highlight} onChange={v => setField('highlight', v)} multiline placeholder="Text inside the colored highlight box" />
                                        <TextField label="Button text" value={form.btnText} onChange={v => setField('btnText', v)} placeholder="Leave blank to hide button" />
                                        <TextField label="Button URL" value={form.btnUrl} onChange={v => setField('btnUrl', v)} placeholder="{{dashboardUrl}}" />
                                        <TextField label="Footer text" value={form.footer} onChange={v => setField('footer', v)} />
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-600 font-medium mb-1">Available variables</p>
                                            <p className="text-[11px] text-blue-500 leading-5">
                                                {`{{userName}} {{agencyName}} {{domainName}} {{daysLeft}} {{otpCode}} {{invoiceNo}} {{amount}} {{dueDate}} {{planName}} {{oldPlan}} {{newPlan}} {{clientName}} {{title}} {{content}}`}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'design' && (
                                    <>
                                        <ColorField label="Header background" value={form.hdrColor} onChange={v => setField('hdrColor', v)} />
                                        <ColorField label="Header text color" value={form.hdrTxtColor} onChange={v => setField('hdrTxtColor', v)} />
                                        <ColorField label="Highlight border" value={form.hlColor} onChange={v => setField('hlColor', v)} />
                                        <ColorField label="Highlight background" value={form.hlBg} onChange={v => setField('hlBg', v)} />
                                        <ColorField label="Button color" value={form.btnColor} onChange={v => setField('btnColor', v)} />
                                        <ColorField label="Button text color" value={form.btnTxtColor} onChange={v => setField('btnTxtColor', v)} />
                                        <ColorField label="Footer background" value={form.footerBg} onChange={v => setField('footerBg', v)} />
                                        <ColorField label="Footer text color" value={form.footerTxt} onChange={v => setField('footerTxt', v)} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Preview panel — always visible on right, full width on preview tab */}
                        <div className={`flex-1 overflow-y-auto p-4 ${activeTab === 'preview' ? 'w-full' : ''}`}>
                            <EmailPreview form={form} />
                        </div>
                    </div>
                )}
            </div>

            {/* Send test email modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-base font-semibold text-gray-800 mb-1">Send test email</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Preview of <strong>{selectedMeta?.name}</strong> will be sent with sample data.
                        </p>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={previewEmail}
                            onChange={e => setPreviewEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:border-gray-400"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => previewMut.mutate()}
                                disabled={!previewEmail || previewMut.isPending}
                                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {previewMut.isPending && <Loader2 size={13} className="animate-spin" />}
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}