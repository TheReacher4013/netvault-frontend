import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Loader, PageHeader, Modal, Input } from '../../components/ui/index'
import { Shield, Plus, Edit3, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'


// Full country list shared across admin modals
const ALL_PLAN_COUNTRIES = [
  { code: 'AF', flag: '🇦🇫', name: 'Afghanistan' }, { code: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: 'DZ', flag: '🇩🇿', name: 'Algeria' }, { code: 'AD', flag: '🇦🇩', name: 'Andorra' },
  { code: 'AO', flag: '🇦🇴', name: 'Angola' }, { code: 'AG', flag: '🇦🇬', name: 'Antigua and Barbuda' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina' }, { code: 'AM', flag: '🇦🇲', name: 'Armenia' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' }, { code: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: 'AZ', flag: '🇦🇿', name: 'Azerbaijan' }, { code: 'BS', flag: '🇧🇸', name: 'Bahamas' },
  { code: 'BH', flag: '🇧🇭', name: 'Bahrain' }, { code: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'BB', flag: '🇧🇧', name: 'Barbados' }, { code: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgium' }, { code: 'BZ', flag: '🇧🇿', name: 'Belize' },
  { code: 'BJ', flag: '🇧🇯', name: 'Benin' }, { code: 'BT', flag: '🇧🇹', name: 'Bhutan' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia' }, { code: 'BA', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
  { code: 'BW', flag: '🇧🇼', name: 'Botswana' }, { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'BN', flag: '🇧🇳', name: 'Brunei' }, { code: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkina Faso' }, { code: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: 'CV', flag: '🇨🇻', name: 'Cabo Verde' }, { code: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroon' }, { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'CF', flag: '🇨🇫', name: 'Central African Republic' }, { code: 'TD', flag: '🇹🇩', name: 'Chad' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile' }, { code: 'CN', flag: '🇨🇳', name: 'China' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia' }, { code: 'KM', flag: '🇰🇲', name: 'Comoros' },
  { code: 'CD', flag: '🇨🇩', name: 'Congo (DRC)' }, { code: 'CG', flag: '🇨🇬', name: 'Congo (Republic)' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica' }, { code: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: 'CU', flag: '🇨🇺', name: 'Cuba' }, { code: 'CY', flag: '🇨🇾', name: 'Cyprus' },
  { code: 'CZ', flag: '🇨🇿', name: 'Czech Republic' }, { code: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: 'DJ', flag: '🇩🇯', name: 'Djibouti' }, { code: 'DM', flag: '🇩🇲', name: 'Dominica' },
  { code: 'DO', flag: '🇩🇴', name: 'Dominican Republic' }, { code: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'EG', flag: '🇪🇬', name: 'Egypt' }, { code: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinea' }, { code: 'ER', flag: '🇪🇷', name: 'Eritrea' },
  { code: 'EE', flag: '🇪🇪', name: 'Estonia' }, { code: 'SZ', flag: '🇸🇿', name: 'Eswatini' },
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopia' }, { code: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: 'FI', flag: '🇫🇮', name: 'Finland' }, { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'GA', flag: '🇬🇦', name: 'Gabon' }, { code: 'GM', flag: '🇬🇲', name: 'Gambia' },
  { code: 'GE', flag: '🇬🇪', name: 'Georgia' }, { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana' }, { code: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: 'GD', flag: '🇬🇩', name: 'Grenada' }, { code: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinea' }, { code: 'GW', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: 'GY', flag: '🇬🇾', name: 'Guyana' }, { code: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduras' }, { code: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: 'IS', flag: '🇮🇸', name: 'Iceland' }, { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia' }, { code: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: 'IQ', flag: '🇮🇶', name: 'Iraq' }, { code: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: 'IL', flag: '🇮🇱', name: 'Israel' }, { code: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: 'CI', flag: '🇨🇮', name: 'Ivory Coast' }, { code: 'JM', flag: '🇯🇲', name: 'Jamaica' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' }, { code: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' }, { code: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: 'KI', flag: '🇰🇮', name: 'Kiribati' }, { code: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' }, { code: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: 'LV', flag: '🇱🇻', name: 'Latvia' }, { code: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: 'LS', flag: '🇱🇸', name: 'Lesotho' }, { code: 'LR', flag: '🇱🇷', name: 'Liberia' },
  { code: 'LY', flag: '🇱🇾', name: 'Libya' }, { code: 'LI', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: 'LT', flag: '🇱🇹', name: 'Lithuania' }, { code: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: 'MG', flag: '🇲🇬', name: 'Madagascar' }, { code: 'MW', flag: '🇲🇼', name: 'Malawi' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysia' }, { code: 'MV', flag: '🇲🇻', name: 'Maldives' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali' }, { code: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: 'MH', flag: '🇲🇭', name: 'Marshall Islands' }, { code: 'MR', flag: '🇲🇷', name: 'Mauritania' },
  { code: 'MU', flag: '🇲🇺', name: 'Mauritius' }, { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: 'FM', flag: '🇫🇲', name: 'Micronesia' }, { code: 'MD', flag: '🇲🇩', name: 'Moldova' },
  { code: 'MC', flag: '🇲🇨', name: 'Monaco' }, { code: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: 'ME', flag: '🇲🇪', name: 'Montenegro' }, { code: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambique' }, { code: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: 'NA', flag: '🇳🇦', name: 'Namibia' }, { code: 'NR', flag: '🇳🇷', name: 'Nauru' },
  { code: 'NP', flag: '🇳🇵', name: 'Nepal' }, { code: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand' }, { code: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: 'NE', flag: '🇳🇪', name: 'Niger' }, { code: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'NO', flag: '🇳🇴', name: 'Norway' }, { code: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: 'PK', flag: '🇵🇰', name: 'Pakistan' }, { code: 'PW', flag: '🇵🇼', name: 'Palau' },
  { code: 'PA', flag: '🇵🇦', name: 'Panama' }, { code: 'PG', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay' }, { code: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: 'PH', flag: '🇵🇭', name: 'Philippines' }, { code: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal' }, { code: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: 'RO', flag: '🇷🇴', name: 'Romania' }, { code: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: 'RW', flag: '🇷🇼', name: 'Rwanda' }, { code: 'KN', flag: '🇰🇳', name: 'Saint Kitts and Nevis' },
  { code: 'LC', flag: '🇱🇨', name: 'Saint Lucia' }, { code: 'VC', flag: '🇻🇨', name: 'Saint Vincent and Grenadines' },
  { code: 'WS', flag: '🇼🇸', name: 'Samoa' }, { code: 'SM', flag: '🇸🇲', name: 'San Marino' },
  { code: 'ST', flag: '🇸🇹', name: 'Sao Tome and Principe' }, { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'SN', flag: '🇸🇳', name: 'Senegal' }, { code: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: 'SC', flag: '🇸🇨', name: 'Seychelles' }, { code: 'SL', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore' }, { code: 'SK', flag: '🇸🇰', name: 'Slovakia' },
  { code: 'SI', flag: '🇸🇮', name: 'Slovenia' }, { code: 'SB', flag: '🇸🇧', name: 'Solomon Islands' },
  { code: 'SO', flag: '🇸🇴', name: 'Somalia' }, { code: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: 'SS', flag: '🇸🇸', name: 'South Sudan' }, { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: 'LK', flag: '🇱🇰', name: 'Sri Lanka' }, { code: 'SD', flag: '🇸🇩', name: 'Sudan' },
  { code: 'SR', flag: '🇸🇷', name: 'Suriname' }, { code: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: 'CH', flag: '🇨🇭', name: 'Switzerland' }, { code: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: 'TW', flag: '🇹🇼', name: 'Taiwan' }, { code: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania' }, { code: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: 'TL', flag: '🇹🇱', name: 'Timor-Leste' }, { code: 'TG', flag: '🇹🇬', name: 'Togo' },
  { code: 'TO', flag: '🇹🇴', name: 'Tonga' }, { code: 'TT', flag: '🇹🇹', name: 'Trinidad and Tobago' },
  { code: 'TN', flag: '🇹🇳', name: 'Tunisia' }, { code: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: 'TM', flag: '🇹🇲', name: 'Turkmenistan' }, { code: 'TV', flag: '🇹🇻', name: 'Tuvalu' },
  { code: 'UG', flag: '🇺🇬', name: 'Uganda' }, { code: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'AE', flag: '🇦🇪', name: 'United Arab Emirates' }, { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'US', flag: '🇺🇸', name: 'United States' }, { code: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' }, { code: 'VU', flag: '🇻🇺', name: 'Vanuatu' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuela' }, { code: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: 'YE', flag: '🇾🇪', name: 'Yemen' }, { code: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' },
]

function PlanModal({ open, onClose, onSubmit, loading, title, form, setForm, theme }) {
  const [countrySearch, setCountrySearch] = useState('')
  const selectedCountries = form.availableCountries || []

  const filteredCountries = countrySearch.trim()
    ? ALL_PLAN_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
    )
    : ALL_PLAN_COUNTRIES

  const toggleCountry = (code) => {
    setForm(f => ({
      ...f,
      availableCountries: selectedCountries.includes(code)
        ? selectedCountries.filter(c => c !== code)
        : [...selectedCountries, code],
    }))
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Plan Key" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="pro" />
          <Input label="Display Name" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Pro" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Price /Month" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Currency</label>
            <select value={form.currency || 'INR'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: `${theme.accent}08`, borderColor: theme.border, color: theme.text }}>
              {['INR', 'USD', 'GBP', 'AUD', 'CAD', 'EUR', 'AED', 'SGD', 'NZD', 'BDT', 'PKR', 'NPR', 'LKR'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Max Domains" type="number" value={form.maxDomains} onChange={e => setForm(f => ({ ...f, maxDomains: +e.target.value }))} />
          <Input label="Max Clients" type="number" value={form.maxClients} onChange={e => setForm(f => ({ ...f, maxClients: +e.target.value }))} />
          <Input label="Max Staff" type="number" value={form.maxStaff} onChange={e => setForm(f => ({ ...f, maxStaff: +e.target.value }))} />
          <Input label="Max Hosting" type="number" value={form.maxHosting} onChange={e => setForm(f => ({ ...f, maxHosting: +e.target.value }))} />
        </div>
        {/* Note: Max fields grid stays 2-col since all 4 fields are small numbers — readable even on mobile */}
        <Input label="Trial Days" type="number" value={form.trialDays ?? 7} onChange={e => setForm(f => ({ ...f, trialDays: +e.target.value }))} />
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Features (comma separated)</label>
          <textarea
            value={form.features}
            onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
            rows={3}
            placeholder="Feature 1, Feature 2, Feature 3"
            className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-2" style={{ color: theme.muted }}>
            Available Countries <span className="font-normal opacity-60">(leave empty = all countries)</span>
          </label>
          {/* Search box for countries */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-2"
            style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
            <span style={{ color: theme.muted, fontSize: 12 }}>🔍</span>
            <input
              type="text"
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              placeholder="Search countries…"
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: theme.text }}
            />
            {countrySearch && (
              <button type="button" onClick={() => setCountrySearch('')}
                className="text-xs" style={{ color: theme.muted }}>✕</button>
            )}
          </div>
          {/* Scrollable country list */}
          <div className="flex flex-wrap gap-1.5 overflow-y-auto pr-1" style={{ maxHeight: '160px' }}>
            {filteredCountries.map(c => {
              const selected = selectedCountries.includes(c.code)
              return (
                <button key={c.code} type="button" onClick={() => toggleCountry(c.code)}
                  className="px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1"
                  style={{
                    background: selected ? `${theme.accent}22` : 'transparent',
                    color: selected ? theme.accent : theme.muted,
                    border: `1px solid ${selected ? theme.accent : theme.border}`,
                  }}>
                  {c.flag} {c.name}
                </button>
              )
            })}
            {filteredCountries.length === 0 && (
              <p className="text-xs w-full text-center py-2" style={{ color: theme.muted }}>No countries match your search</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            {selectedCountries.length > 0 ? (
              <p className="text-[10px]" style={{ color: theme.muted }}>
                {selectedCountries.length} country selected — shown only to these regions
              </p>
            ) : (
              <p className="text-[10px]" style={{ color: theme.muted }}>Shown to all {ALL_PLAN_COUNTRIES.length} countries</p>
            )}
            {selectedCountries.length > 0 && (
              <button type="button" onClick={() => setForm(f => ({ ...f, availableCountries: [] }))}
                className="text-[10px] underline" style={{ color: theme.muted }}>
                Clear all
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button loading={loading} onClick={onSubmit}>Save Plan</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────
function DeletePlanModal({ plan, onConfirm, onCancel, loading, theme }) {
  if (!plan) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: '#C9404015' }}>
          <Trash2 size={20} style={{ color: '#C94040' }} />
        </div>
        <h3 className="font-display font-bold text-base mb-1" style={{ color: theme.text }}>
          Delete Plan
        </h3>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: theme.muted }}>
          Are you sure you want to delete the{' '}
          <span className="font-semibold" style={{ color: theme.text }}>{plan.name}</span> plan?
          This action cannot be undone. Plans assigned to active companies cannot be deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 cursor-pointer"
            style={{ background: '#C94040', color: '#fff' }}>
            {loading ? 'Deleting...' : 'Yes, Delete Plan'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
            style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.border}` }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function PlanManagement() {
  const { theme } = useAuth()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [form, setForm] = useState({
    name: '', displayName: '', price: 0,
    maxDomains: 20, maxClients: 10, maxStaff: 3, maxHosting: 10, features: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-plans'],
    queryFn: superAdminService.getPlans,
  })

  const createMut = useMutation({
    mutationFn: d => superAdminService.createPlan({ ...d, features: d.features.split(',').map(f => f.trim()).filter(Boolean), availableCountries: d.availableCountries || [] }),
    onSuccess: () => {
      toast.success('Plan created successfully.')
      qc.invalidateQueries(['sa-plans'])
      setShowAdd(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create plan.'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => superAdminService.updatePlan(id, { ...d, features: d.features.split(',').map(f => f.trim()).filter(Boolean), availableCountries: d.availableCountries || [] }),
    onSuccess: () => {
      toast.success('Plan updated successfully.')
      qc.invalidateQueries(['sa-plans'])
      setEditPlan(null)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update plan.'),
  })

  const deleteMut = useMutation({
    mutationFn: id => superAdminService.deletePlan(id),
    onSuccess: () => {
      toast.success('Plan deleted successfully.')
      setDeleteConfirm(null)
      qc.invalidateQueries(['sa-plans'])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete plan.')
    },
  })

  const BLANK_FORM = { name: '', displayName: '', price: 0, currency: 'INR', maxDomains: 20, maxClients: 10, maxStaff: 3, maxHosting: 10, features: '', trialDays: 7, availableCountries: [] }

  const plans = data?.data?.data?.plans || []
  if (isLoading) return <Loader text="Loading plans..." />

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Plan Management"
        subtitle="SaaS subscription tiers"
        actions={
          <Button onClick={() => { setForm(BLANK_FORM); setShowAdd(true) }}>
            <Plus size={14} /> Create Plan
          </Button>
        }
      />

      {plans.length === 0 ? (
        <Card className="p-10 text-center">
          <Shield size={32} className="mx-auto mb-3 opacity-30" style={{ color: theme.muted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>No plans found.</p>
          <p className="text-xs mb-4" style={{ color: theme.muted }}>Create your first subscription plan to get started.</p>
          <Button onClick={() => { setForm(BLANK_FORM); setShowAdd(true) }}>
            <Plus size={14} /> Create Plan
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <Card key={plan._id} className="p-5 relative flex flex-col">
              {plan.isPopular && (
                <div className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold"
                  style={{ background: theme.accent, color: theme.bg }}>POPULAR</div>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${theme.accent}15` }}>
                <Shield size={16} style={{ color: theme.accent }} />
              </div>
              <p className="font-display font-bold text-base mb-0.5" style={{ color: theme.text }}>
                {plan.displayName}
              </p>
              <p className="font-mono font-bold text-2xl mb-3" style={{ color: theme.accent }}>
                {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                {plan.price > 0 && (
                  <span className="text-xs font-normal" style={{ color: theme.muted }}>/Month</span>
                )}
              </p>
              <div className="space-y-1 text-xs mb-4 flex-1" style={{ color: theme.muted }}>
                <div className="flex justify-between">
                  <span>Domains</span>
                  <span className="font-mono" style={{ color: theme.text }}>
                    {plan.maxDomains >= 99999 ? 'Unlimited' : plan.maxDomains}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Clients</span>
                  <span className="font-mono" style={{ color: theme.text }}>
                    {plan.maxClients >= 99999 ? 'Unlimited' : plan.maxClients}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Staff</span>
                  <span className="font-mono" style={{ color: theme.text }}>
                    {plan.maxStaff >= 99999 ? 'Unlimited' : plan.maxStaff}
                  </span>
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={() => {
                  setEditPlan(plan._id)
                  setForm({ ...plan, features: plan.features?.join(', ') || '', availableCountries: plan.availableCountries || [], trialDays: plan.trialDays ?? 7 })
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer mb-2"
                style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.border}` }}
                title="Edit plan"
              >
                <Edit3 size={12} /> Edit Plan
              </button>

              {/* Delete button */}
              <button
                onClick={() => setDeleteConfirm({ id: plan._id, name: plan.displayName })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
                style={{ background: '#C9404010', color: '#C94040', border: '1px solid #C9404030' }}
                title="Delete plan"
              >
                <Trash2 size={12} /> Delete Plan
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <PlanModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Create Plan"
        loading={createMut.isPending}
        form={form}
        setForm={setForm}
        theme={theme}
        onSubmit={() => {
          if (!form.name || !form.displayName) return toast.error('Plan key and display name are required.')
          createMut.mutate(form)
        }}
      />

      {/* Edit Modal */}
      <PlanModal
        open={!!editPlan}
        onClose={() => setEditPlan(null)}
        title="Edit Plan"
        loading={updateMut.isPending}
        form={form}
        setForm={setForm}
        theme={theme}
        onSubmit={() => updateMut.mutate({ id: editPlan, d: form })}
      />

      {/* Delete Confirmation Modal */}
      <DeletePlanModal
        plan={deleteConfirm}
        onConfirm={() => deleteMut.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMut.isPending}
        theme={theme}
      />
    </div>
  )
}