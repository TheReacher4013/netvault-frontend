import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  X, Check, Zap, Building2, Rocket, Tag, Gift,
  Crown, AlertTriangle, CreditCard, Loader2, Shield,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_ICONS = { 0: Zap, 1: Building2, 2: Rocket }

// Full country → currency mapping
const ALL_COUNTRIES = [
  { code: 'IN', flag: '🇮🇳', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'US', flag: '🇺🇸', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada', currency: 'CAD', symbol: 'C$' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany', currency: 'EUR', symbol: '€' },
  { code: 'FR', flag: '🇫🇷', name: 'France', currency: 'EUR', symbol: '€' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy', currency: 'EUR', symbol: '€' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain', currency: 'EUR', symbol: '€' },
  { code: 'NL', flag: '🇳🇱', name: 'Netherlands', currency: 'EUR', symbol: '€' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgium', currency: 'EUR', symbol: '€' },
  { code: 'AT', flag: '🇦🇹', name: 'Austria', currency: 'EUR', symbol: '€' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal', currency: 'EUR', symbol: '€' },
  { code: 'FI', flag: '🇫🇮', name: 'Finland', currency: 'EUR', symbol: '€' },
  { code: 'IE', flag: '🇮🇪', name: 'Ireland', currency: 'EUR', symbol: '€' },
  { code: 'GR', flag: '🇬🇷', name: 'Greece', currency: 'EUR', symbol: '€' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE', currency: 'AED', symbol: 'د.إ' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore', currency: 'SGD', symbol: 'S$' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$' },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa', currency: 'ZAR', symbol: 'R' },
  { code: 'BD', flag: '🇧🇩', name: 'Bangladesh', currency: 'BDT', symbol: '৳' },
  { code: 'PK', flag: '🇵🇰', name: 'Pakistan', currency: 'PKR', symbol: '₨' },
  { code: 'NP', flag: '🇳🇵', name: 'Nepal', currency: 'NPR', symbol: '₨' },
  { code: 'LK', flag: '🇱🇰', name: 'Sri Lanka', currency: 'LKR', symbol: 'Rs' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan', currency: 'JPY', symbol: '¥' },
  { code: 'CN', flag: '🇨🇳', name: 'China', currency: 'CNY', symbol: '¥' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea', currency: 'KRW', symbol: '₩' },
  { code: 'HK', flag: '🇭🇰', name: 'Hong Kong', currency: 'HKD', symbol: 'HK$' },
  { code: 'TW', flag: '🇹🇼', name: 'Taiwan', currency: 'TWD', symbol: 'NT$' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysia', currency: 'MYR', symbol: 'RM' },
  { code: 'TH', flag: '🇹🇭', name: 'Thailand', currency: 'THB', symbol: '฿' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', currency: 'IDR', symbol: 'Rp' },
  { code: 'PH', flag: '🇵🇭', name: 'Philippines', currency: 'PHP', symbol: '₱' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam', currency: 'VND', symbol: '₫' },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س' },
  { code: 'QA', flag: '🇶🇦', name: 'Qatar', currency: 'QAR', symbol: 'ر.ق' },
  { code: 'KW', flag: '🇰🇼', name: 'Kuwait', currency: 'KWD', symbol: 'د.ك' },
  { code: 'OM', flag: '🇴🇲', name: 'Oman', currency: 'OMR', symbol: 'ر.ع.' },
  { code: 'BH', flag: '🇧🇭', name: 'Bahrain', currency: 'BHD', symbol: 'BD' },
  { code: 'EG', flag: '🇪🇬', name: 'Egypt', currency: 'EGP', symbol: '£' },
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
  { code: 'KE', flag: '🇰🇪', name: 'Kenya', currency: 'KES', symbol: 'KSh' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana', currency: 'GHS', symbol: 'GH₵' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania', currency: 'TZS', symbol: 'TSh' },
  { code: 'UG', flag: '🇺🇬', name: 'Uganda', currency: 'UGX', symbol: 'USh' },
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopia', currency: 'ETB', symbol: 'Br' },
  { code: 'MA', flag: '🇲🇦', name: 'Morocco', currency: 'MAD', symbol: 'د.م.' },
  { code: 'DZ', flag: '🇩🇿', name: 'Algeria', currency: 'DZD', symbol: 'دج' },
  { code: 'TN', flag: '🇹🇳', name: 'Tunisia', currency: 'TND', symbol: 'DT' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil', currency: 'BRL', symbol: 'R$' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico', currency: 'MXN', symbol: 'MX$' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina', currency: 'ARS', symbol: '$' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile', currency: 'CLP', symbol: '$' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia', currency: 'COP', symbol: '$' },
  { code: 'PE', flag: '🇵🇪', name: 'Peru', currency: 'PEN', symbol: 'S/' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuela', currency: 'VES', symbol: 'Bs.' },
  { code: 'RU', flag: '🇷🇺', name: 'Russia', currency: 'RUB', symbol: '₽' },
  { code: 'UA', flag: '🇺🇦', name: 'Ukraine', currency: 'UAH', symbol: '₴' },
  { code: 'PL', flag: '🇵🇱', name: 'Poland', currency: 'PLN', symbol: 'zł' },
  { code: 'SE', flag: '🇸🇪', name: 'Sweden', currency: 'SEK', symbol: 'kr' },
  { code: 'NO', flag: '🇳🇴', name: 'Norway', currency: 'NOK', symbol: 'kr' },
  { code: 'DK', flag: '🇩🇰', name: 'Denmark', currency: 'DKK', symbol: 'kr' },
  { code: 'CH', flag: '🇨🇭', name: 'Switzerland', currency: 'CHF', symbol: 'Fr' },
  { code: 'CZ', flag: '🇨🇿', name: 'Czech Republic', currency: 'CZK', symbol: 'Kč' },
  { code: 'HU', flag: '🇭🇺', name: 'Hungary', currency: 'HUF', symbol: 'Ft' },
  { code: 'RO', flag: '🇷🇴', name: 'Romania', currency: 'RON', symbol: 'lei' },
  { code: 'TR', flag: '🇹🇷', name: 'Turkey', currency: 'TRY', symbol: '₺' },
  { code: 'IL', flag: '🇮🇱', name: 'Israel', currency: 'ILS', symbol: '₪' },
  { code: 'AF', flag: '🇦🇫', name: 'Afghanistan', currency: 'AFN', symbol: '؋' },
  { code: 'AL', flag: '🇦🇱', name: 'Albania', currency: 'ALL', symbol: 'L' },
  { code: 'AM', flag: '🇦🇲', name: 'Armenia', currency: 'AMD', symbol: '֏' },
  { code: 'AZ', flag: '🇦🇿', name: 'Azerbaijan', currency: 'AZN', symbol: '₼' },
  { code: 'BA', flag: '🇧🇦', name: 'Bosnia and Herzegovina', currency: 'BAM', symbol: 'KM' },
  { code: 'BG', flag: '🇧🇬', name: 'Bulgaria', currency: 'BGN', symbol: 'лв' },
  { code: 'BY', flag: '🇧🇾', name: 'Belarus', currency: 'BYN', symbol: 'Br' },
  { code: 'GE', flag: '🇬🇪', name: 'Georgia', currency: 'GEL', symbol: '₾' },
  { code: 'HR', flag: '🇭🇷', name: 'Croatia', currency: 'EUR', symbol: '€' },
  { code: 'KZ', flag: '🇰🇿', name: 'Kazakhstan', currency: 'KZT', symbol: '₸' },
  { code: 'MD', flag: '🇲🇩', name: 'Moldova', currency: 'MDL', symbol: 'L' },
  { code: 'ME', flag: '🇲🇪', name: 'Montenegro', currency: 'EUR', symbol: '€' },
  { code: 'MK', flag: '🇲🇰', name: 'North Macedonia', currency: 'MKD', symbol: 'ден' },
  { code: 'RS', flag: '🇷🇸', name: 'Serbia', currency: 'RSD', symbol: 'din' },
  { code: 'SK', flag: '🇸🇰', name: 'Slovakia', currency: 'EUR', symbol: '€' },
  { code: 'SI', flag: '🇸🇮', name: 'Slovenia', currency: 'EUR', symbol: '€' },
  { code: 'UZ', flag: '🇺🇿', name: 'Uzbekistan', currency: 'UZS', symbol: 'so\'m' },
  { code: 'TM', flag: '🇹🇲', name: 'Turkmenistan', currency: 'TMT', symbol: 'T' },
  { code: 'TJ', flag: '🇹🇯', name: 'Tajikistan', currency: 'TJS', symbol: 'SM' },
  { code: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan', currency: 'KGS', symbol: 'лв' },
  { code: 'MN', flag: '🇲🇳', name: 'Mongolia', currency: 'MNT', symbol: '₮' },
  { code: 'KH', flag: '🇰🇭', name: 'Cambodia', currency: 'KHR', symbol: '৳' },
  { code: 'LA', flag: '🇱🇦', name: 'Laos', currency: 'LAK', symbol: '₭' },
  { code: 'MM', flag: '🇲🇲', name: 'Myanmar', currency: 'MMK', symbol: 'K' },
  { code: 'BN', flag: '🇧🇳', name: 'Brunei', currency: 'BND', symbol: 'B$' },
  { code: 'MV', flag: '🇲🇻', name: 'Maldives', currency: 'MVR', symbol: 'Rf' },
  { code: 'BT', flag: '🇧🇹', name: 'Bhutan', currency: 'BTN', symbol: 'Nu' },
  { code: 'MO', flag: '🇲🇴', name: 'Macau', currency: 'MOP', symbol: 'P' },
  { code: 'IQ', flag: '🇮🇶', name: 'Iraq', currency: 'IQD', symbol: 'ع.د' },
  { code: 'IR', flag: '🇮🇷', name: 'Iran', currency: 'IRR', symbol: '﷼' },
  { code: 'JO', flag: '🇯🇴', name: 'Jordan', currency: 'JOD', symbol: 'JD' },
  { code: 'LB', flag: '🇱🇧', name: 'Lebanon', currency: 'LBP', symbol: 'L£' },
  { code: 'SY', flag: '🇸🇾', name: 'Syria', currency: 'SYP', symbol: '£' },
  { code: 'YE', flag: '🇾🇪', name: 'Yemen', currency: 'YER', symbol: '﷼' },
  { code: 'PS', flag: '🇵🇸', name: 'Palestine', currency: 'ILS', symbol: '₪' },
  { code: 'AO', flag: '🇦🇴', name: 'Angola', currency: 'AOA', symbol: 'Kz' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkina Faso', currency: 'XOF', symbol: 'CFA' },
  { code: 'BI', flag: '🇧🇮', name: 'Burundi', currency: 'BIF', symbol: 'Fr' },
  { code: 'BJ', flag: '🇧🇯', name: 'Benin', currency: 'XOF', symbol: 'CFA' },
  { code: 'BW', flag: '🇧🇼', name: 'Botswana', currency: 'BWP', symbol: 'P' },
  { code: 'CF', flag: '🇨🇫', name: 'Central African Republic', currency: 'XAF', symbol: 'FCFA' },
  { code: 'CG', flag: '🇨🇬', name: 'Congo', currency: 'XAF', symbol: 'FCFA' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire", currency: 'XOF', symbol: 'CFA' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroon', currency: 'XAF', symbol: 'FCFA' },
  { code: 'CV', flag: '🇨🇻', name: 'Cabo Verde', currency: 'CVE', symbol: 'Esc' },
  { code: 'DJ', flag: '🇩🇯', name: 'Djibouti', currency: 'DJF', symbol: 'Fdj' },
  { code: 'ER', flag: '🇪🇷', name: 'Eritrea', currency: 'ERN', symbol: 'Nfk' },
  { code: 'GA', flag: '🇬🇦', name: 'Gabon', currency: 'XAF', symbol: 'FCFA' },
  { code: 'GM', flag: '🇬🇲', name: 'Gambia', currency: 'GMD', symbol: 'D' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinea', currency: 'GNF', symbol: 'Fr' },
  { code: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinea', currency: 'XAF', symbol: 'FCFA' },
  { code: 'GW', flag: '🇬🇼', name: 'Guinea-Bissau', currency: 'XOF', symbol: 'CFA' },
  { code: 'KM', flag: '🇰🇲', name: 'Comoros', currency: 'KMF', symbol: 'Fr' },
  { code: 'LR', flag: '🇱🇷', name: 'Liberia', currency: 'LRD', symbol: '$' },
  { code: 'LS', flag: '🇱🇸', name: 'Lesotho', currency: 'LSL', symbol: 'L' },
  { code: 'LY', flag: '🇱🇾', name: 'Libya', currency: 'LYD', symbol: 'LD' },
  { code: 'MG', flag: '🇲🇬', name: 'Madagascar', currency: 'MGA', symbol: 'Ar' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali', currency: 'XOF', symbol: 'CFA' },
  { code: 'MR', flag: '🇲🇷', name: 'Mauritania', currency: 'MRU', symbol: 'UM' },
  { code: 'MU', flag: '🇲🇺', name: 'Mauritius', currency: 'MUR', symbol: '₨' },
  { code: 'MW', flag: '🇲🇼', name: 'Malawi', currency: 'MWK', symbol: 'MK' },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambique', currency: 'MZN', symbol: 'MT' },
  { code: 'NA', flag: '🇳🇦', name: 'Namibia', currency: 'NAD', symbol: '$' },
  { code: 'NE', flag: '🇳🇪', name: 'Niger', currency: 'XOF', symbol: 'CFA' },
  { code: 'RW', flag: '🇷🇼', name: 'Rwanda', currency: 'RWF', symbol: 'Fr' },
  { code: 'SC', flag: '🇸🇨', name: 'Seychelles', currency: 'SCR', symbol: '₨' },
  { code: 'SD', flag: '🇸🇩', name: 'Sudan', currency: 'SDG', symbol: '£' },
  { code: 'SL', flag: '🇸🇱', name: 'Sierra Leone', currency: 'SLL', symbol: 'Le' },
  { code: 'SN', flag: '🇸🇳', name: 'Senegal', currency: 'XOF', symbol: 'CFA' },
  { code: 'SO', flag: '🇸🇴', name: 'Somalia', currency: 'SOS', symbol: 'Sh' },
  { code: 'SS', flag: '🇸🇸', name: 'South Sudan', currency: 'SSP', symbol: '£' },
  { code: 'ST', flag: '🇸🇹', name: 'Sao Tome and Principe', currency: 'STN', symbol: 'Db' },
  { code: 'SZ', flag: '🇸🇿', name: 'Eswatini', currency: 'SZL', symbol: 'L' },
  { code: 'TD', flag: '🇹🇩', name: 'Chad', currency: 'XAF', symbol: 'FCFA' },
  { code: 'TG', flag: '🇹🇬', name: 'Togo', currency: 'XOF', symbol: 'CFA' },
  { code: 'ZM', flag: '🇿🇲', name: 'Zambia', currency: 'ZMW', symbol: 'ZK' },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwe', currency: 'ZWL', symbol: '$' },
  { code: 'AG', flag: '🇦🇬', name: 'Antigua and Barbuda', currency: 'XCD', symbol: '$' },
  { code: 'BB', flag: '🇧🇧', name: 'Barbados', currency: 'BBD', symbol: '$' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia', currency: 'BOB', symbol: 'Bs' },
  { code: 'BS', flag: '🇧🇸', name: 'Bahamas', currency: 'BSD', symbol: '$' },
  { code: 'BZ', flag: '🇧🇿', name: 'Belize', currency: 'BZD', symbol: '$' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica', currency: 'CRC', symbol: '₡' },
  { code: 'CU', flag: '🇨🇺', name: 'Cuba', currency: 'CUP', symbol: '$' },
  { code: 'DM', flag: '🇩🇲', name: 'Dominica', currency: 'XCD', symbol: '$' },
  { code: 'DO', flag: '🇩🇴', name: 'Dominican Republic', currency: 'DOP', symbol: 'RD$' },
  { code: 'EC', flag: '🇪🇨', name: 'Ecuador', currency: 'USD', symbol: '$' },
  { code: 'GD', flag: '🇬🇩', name: 'Grenada', currency: 'XCD', symbol: '$' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemala', currency: 'GTQ', symbol: 'Q' },
  { code: 'GY', flag: '🇬🇾', name: 'Guyana', currency: 'GYD', symbol: '$' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduras', currency: 'HNL', symbol: 'L' },
  { code: 'HT', flag: '🇭🇹', name: 'Haiti', currency: 'HTG', symbol: 'G' },
  { code: 'JM', flag: '🇯🇲', name: 'Jamaica', currency: 'JMD', symbol: '$' },
  { code: 'KN', flag: '🇰🇳', name: 'Saint Kitts and Nevis', currency: 'XCD', symbol: '$' },
  { code: 'LC', flag: '🇱🇨', name: 'Saint Lucia', currency: 'XCD', symbol: '$' },
  { code: 'NI', flag: '🇳🇮', name: 'Nicaragua', currency: 'NIO', symbol: 'C$' },
  { code: 'PA', flag: '🇵🇦', name: 'Panama', currency: 'PAB', symbol: 'B/.' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay', currency: 'PYG', symbol: '₲' },
  { code: 'SR', flag: '🇸🇷', name: 'Suriname', currency: 'SRD', symbol: '$' },
  { code: 'SV', flag: '🇸🇻', name: 'El Salvador', currency: 'USD', symbol: '$' },
  { code: 'TT', flag: '🇹🇹', name: 'Trinidad and Tobago', currency: 'TTD', symbol: '$' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay', currency: 'UYU', symbol: '$U' },
  { code: 'VC', flag: '🇻🇨', name: 'Saint Vincent', currency: 'XCD', symbol: '$' },
  { code: 'FJ', flag: '🇫🇯', name: 'Fiji', currency: 'FJD', symbol: '$' },
  { code: 'KI', flag: '🇰🇮', name: 'Kiribati', currency: 'AUD', symbol: 'A$' },
  { code: 'MH', flag: '🇲🇭', name: 'Marshall Islands', currency: 'USD', symbol: '$' },
  { code: 'FM', flag: '🇫🇲', name: 'Micronesia', currency: 'USD', symbol: '$' },
  { code: 'NR', flag: '🇳🇷', name: 'Nauru', currency: 'AUD', symbol: 'A$' },
  { code: 'PG', flag: '🇵🇬', name: 'Papua New Guinea', currency: 'PGK', symbol: 'K' },
  { code: 'PW', flag: '🇵🇼', name: 'Palau', currency: 'USD', symbol: '$' },
  { code: 'SB', flag: '🇸🇧', name: 'Solomon Islands', currency: 'SBD', symbol: '$' },
  { code: 'TL', flag: '🇹🇱', name: 'Timor-Leste', currency: 'USD', symbol: '$' },
  { code: 'TO', flag: '🇹🇴', name: 'Tonga', currency: 'TOP', symbol: 'T$' },
  { code: 'TV', flag: '🇹🇻', name: 'Tuvalu', currency: 'AUD', symbol: 'A$' },
  { code: 'VU', flag: '🇻🇺', name: 'Vanuatu', currency: 'VUV', symbol: 'Vt' },
  { code: 'WS', flag: '🇼🇸', name: 'Samoa', currency: 'WST', symbol: 'T' },
  { code: 'AD', flag: '🇦🇩', name: 'Andorra', currency: 'EUR', symbol: '€' },
  { code: 'CY', flag: '🇨🇾', name: 'Cyprus', currency: 'EUR', symbol: '€' },
  { code: 'EE', flag: '🇪🇪', name: 'Estonia', currency: 'EUR', symbol: '€' },
  { code: 'IS', flag: '🇮🇸', name: 'Iceland', currency: 'ISK', symbol: 'kr' },
  { code: 'LI', flag: '🇱🇮', name: 'Liechtenstein', currency: 'CHF', symbol: 'Fr' },
  { code: 'LT', flag: '🇱🇹', name: 'Lithuania', currency: 'EUR', symbol: '€' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourg', currency: 'EUR', symbol: '€' },
  { code: 'LV', flag: '🇱🇻', name: 'Latvia', currency: 'EUR', symbol: '€' },
  { code: 'MC', flag: '🇲🇨', name: 'Monaco', currency: 'EUR', symbol: '€' },
  { code: 'MT', flag: '🇲🇹', name: 'Malta', currency: 'EUR', symbol: '€' },
  { code: 'SM', flag: '🇸🇲', name: 'San Marino', currency: 'EUR', symbol: '€' },
  { code: 'GI', flag: '🇬🇮', name: 'Gibraltar', currency: 'GIP', symbol: '£' },
  { code: 'KP', flag: '🇰🇵', name: 'North Korea', currency: 'KPW', symbol: '₩' },
  { code: 'XK', flag: '🇽🇰', name: 'Kosovo', currency: 'EUR', symbol: '€' },
]

// Searchable Country Dropdown for SubscriptionModal
function CountryDropdown({ value, onChange, theme }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const selected = ALL_COUNTRIES.find(c => c.code === value) || ALL_COUNTRIES[0]
  const filtered = search
    ? ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.currency.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )
    : ALL_COUNTRIES

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="px-3 py-1.5 rounded-lg text-sm border outline-none flex items-center gap-2"
        style={{ background: theme.surface, color: theme.text, borderColor: theme.border, minWidth: '200px' }}>
        <span>{selected.flag}</span>
        <span>{selected.name}</span>
        <span className="ml-auto text-xs opacity-50">({selected.currency})</span>
        <span className="text-xs opacity-40">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl shadow-xl overflow-hidden"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, width: '260px', maxHeight: '280px' }}>
          <div className="p-2 sticky top-0" style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country or currency..."
              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: `${theme.accent}10`, color: theme.text, border: `1px solid ${theme.border}` }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
            {filtered.length === 0 && (
              <div className="text-xs text-center py-3" style={{ color: theme.muted }}>No results</div>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80 transition-opacity"
                style={{
                  background: value === c.code ? `${theme.accent}15` : 'transparent',
                  color: theme.text,
                }}>
                <span>{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono opacity-60 text-[10px]">{c.symbol} {c.currency}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Loads Razorpay checkout script dynamically
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * SubscriptionModal
 *
 * Props:
 *   onClose       – called when user closes (only when trial NOT expired)
 *   onSuccess     – called after successful payment & plan activation
 *   trialExpired  – boolean; when true hides X button and filters free plans
 */
export default function SubscriptionModal({ onClose, onSuccess, trialExpired = false }) {
  const { theme, user, refreshUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [couponValidated, setCouponValidated] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState('IN')

  const currencyInfo = ALL_COUNTRIES.find(c => c.code === country) || ALL_COUNTRIES[0]
  const [paymentStep, setPaymentStep] = useState('select') // 'select' | 'processing' | 'success' | 'failed'
  const [lastError, setLastError] = useState('')

  useEffect(() => {
    api.get(`/plans?country=${country}`)
      .then(res => {
        let list = res.data?.data?.plans || []
        if (trialExpired) {
          list = list.filter(p => p.price > 0 && p.name?.toLowerCase() !== 'free')
        }
        setPlans(list)
        const popular = list.find(p => p.isPopular)
        setSelectedPlanId(popular?._id || list[0]?._id || '')
      })
      .catch(() => setPlans([]))
  }, [country, trialExpired])

  const selectedPlan = plans.find(p => p._id === selectedPlanId)

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        orderAmount: selectedPlan?.price || 0,
      })
      setCouponValidated(res.data.data.coupon)
      toast.success('Coupon applied!')
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code')
      setCouponValidated(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const calcFinalPrice = useCallback(() => {
    if (!selectedPlan) return 0
    let price = selectedPlan.price
    if (couponValidated) {
      if (couponValidated.discountType === 'percentage') {
        price -= (price * couponValidated.discountValue) / 100
      } else {
        price -= couponValidated.discountValue
      }
    }
    return Math.max(0, Math.round(price * 100) / 100)
  }, [selectedPlan, couponValidated])

  /**
   * Main subscribe flow:
   * 1. Create order on backend
   * 2. Open Razorpay checkout
   * 3. On payment success → verify on backend → activate plan
   */
  const handleSubscribe = async () => {
    if (!selectedPlanId) return toast.error('Please select a plan')
    setLoading(true)
    setPaymentStep('processing')
    setLastError('')

    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load payment gateway. Check your internet connection.')
      }

      // Step 2: Create order on backend
      const orderRes = await api.post('/payments/create-order', {
        planId: selectedPlanId,
        couponCode: couponValidated ? couponCode.trim().toUpperCase() : undefined,
        referralCode: referralCode || undefined,
      })

      const { orderId, amount, currency, paymentId, razorpayKeyId, plan } = orderRes.data.data

      // Step 3: Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const options = {
          key: razorpayKeyId,
          amount,           // in paise
          currency,
          name: 'NetVault',
          description: `${plan.name} Subscription`,
          order_id: orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          notes: {
            planId: selectedPlanId,
            tenantId: user?.tenantId || '',
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            backdropclose: false,
            escape: false,
            animation: true,
          },
          handler: async function (response) {
            // Step 4: Verify payment on backend
            try {
              setPaymentStep('processing')
              await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId,
              })
              setPaymentStep('success')
              toast.success(`🎉 Subscription activated! Welcome to ${plan.name}!`)
              // Refresh user/tenant data in context
              if (typeof refreshUser === 'function') refreshUser()
              setTimeout(() => onSuccess?.(), 1500)
              resolve()
            } catch (verifyErr) {
              const msg = verifyErr.response?.data?.message || 'Payment verification failed'
              setPaymentStep('failed')
              setLastError(msg)
              reject(new Error(msg))
            }
          },
          // Called when user closes checkout modal
          'modal.ondismiss': async function () {
            try {
              await api.post('/payments/failed', {
                razorpayOrderId: orderId,
                reason: 'User dismissed checkout',
              })
            } catch (_) { }
            setPaymentStep('select')
            setLoading(false)
            resolve() // resolve so the outer promise doesn't hang
          },
        }

        const rzp = new window.Razorpay(options)

        rzp.on('payment.failed', async function (response) {
          const desc = response.error?.description || 'Payment failed'
          try {
            await api.post('/payments/failed', {
              razorpayOrderId: orderId,
              reason: desc,
            })
          } catch (_) { }
          setPaymentStep('failed')
          setLastError(desc)
          toast.error(`Payment failed: ${desc}`)
          reject(new Error(desc))
        })

        rzp.open()
      })

    } catch (err) {
      if (paymentStep !== 'failed') {
        const msg = err.response?.data?.message || err.message || 'Something went wrong'
        setLastError(msg)
        setPaymentStep('failed')
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Success state
  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
        <div className="w-full max-w-md rounded-2xl shadow-2xl p-8 text-center"
          style={{ background: theme.bg2, border: `1px solid ${theme.border}` }}>
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Check size={40} style={{ color: '#22c55e' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>Payment Successful!</h2>
          <p className="text-sm mb-6" style={{ color: theme.muted }}>
            Your subscription has been activated. Enjoy full access to NetVault!
          </p>
          <div className="w-8 h-1 rounded-full mx-auto animate-pulse" style={{ background: theme.accent }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: theme.bg2, border: `1px solid ${theme.border}` }}
      >
        {/* ── Header ── */}
        <div className="p-5 sm:p-6 border-b sticky top-0 z-10"
          style={{ borderColor: theme.border, background: theme.bg2 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
                <Crown size={20} style={{ color: '#fff' }} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.text }}>
                  {trialExpired ? 'Your Free Trial Has Expired' : 'Upgrade Your Plan'}
                </h2>
                <p className="text-xs sm:text-sm" style={{ color: theme.muted }}>
                  {trialExpired
                    ? 'Subscribe to continue using NetVault'
                    : 'Choose a plan that fits your needs'}
                </p>
              </div>
            </div>
            {!trialExpired && onClose && (
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ color: theme.muted }}>
                <X size={18} />
              </button>
            )}
          </div>

          {trialExpired && (
            <div className="mt-4 p-3 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#EF4444' }}>
                Your 7-day free trial has ended. All features are temporarily restricted.
                Subscribe to a paid plan to restore full access.
              </p>
            </div>
          )}

          {/* Failed state inline notice */}
          {paymentStep === 'failed' && lastError && (
            <div className="mt-3 p-3 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
              <div className="flex-1">
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#EF4444' }}>Payment Failed</p>
                <p className="text-xs" style={{ color: '#EF4444' }}>{lastError}</p>
              </div>
              <button onClick={() => { setPaymentStep('select'); setLastError('') }}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* ── Country ── */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium flex-shrink-0" style={{ color: theme.muted }}>
              Your Country:
            </label>
            <CountryDropdown
              value={country}
              onChange={(code) => { setCountry(code); setCouponValidated(null) }}
              theme={theme}
            />
          </div>

          {/* ── Plans grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {plans.map((plan, idx) => {
              const Icon = PLAN_ICONS[idx % 3] || Zap
              const isSelected = selectedPlanId === plan._id
              return (
                <button key={plan._id}
                  onClick={() => { setSelectedPlanId(plan._id); setCouponValidated(null) }}
                  className="relative p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${theme.accent}20, ${theme.accent2}20)`
                      : theme.surface,
                    border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                    boxShadow: isSelected ? `0 0 0 1px ${theme.accent}40` : 'none',
                  }}>
                  {plan.isPopular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                      Most Popular
                    </span>
                  )}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: isSelected ? `${theme.accent}30` : `${theme.accent}15` }}>
                    <Icon size={18} style={{ color: theme.accent }} />
                  </div>
                  <div className="font-semibold text-sm mb-1" style={{ color: theme.text }}>
                    {plan.displayName}
                  </div>
                  <div className="text-xl font-bold" style={{ color: isSelected ? theme.accent : theme.text }}>
                    {currencyInfo.symbol}{plan.price}
                    <span className="text-xs font-normal" style={{ color: theme.muted }}>
                      /{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {[
                      `${plan.maxDomains} Domains`,
                      `${plan.maxClients} Clients`,
                      `${plan.maxHosting} Hosting`,
                      `${plan.maxStaff} Staff`,
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: theme.muted }}>
                        <Check size={11} style={{ color: theme.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {/* ── Coupon & Referral ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: theme.muted }}>
                <Tag size={11} /> Coupon Code
              </label>
              <div className="flex gap-2">
                <input value={couponCode}
                  onChange={e => { setCouponCode(e.target.value); setCouponValidated(null); setCouponError('') }}
                  placeholder="SAVE20"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    background: theme.surface,
                    color: theme.text,
                    borderColor: couponError ? '#EF4444' : couponValidated ? '#22c55e' : theme.border,
                  }} />
                <button onClick={handleValidateCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                  style={{ background: `${theme.accent}20`, color: theme.accent, border: `1px solid ${theme.accent}40` }}>
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{couponError}</p>}
              {couponValidated && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#22c55e' }}>
                  ✓ {couponValidated.code} —{' '}
                  {couponValidated.discountType === 'percentage'
                    ? `${couponValidated.discountValue}% off`
                    : `${currencyInfo.symbol}${couponValidated.discountValue} off`}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: theme.muted }}>
                <Gift size={11} /> Referral Code (Optional)
              </label>
              <input value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                placeholder="REF-XXXXX"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: theme.surface, color: theme.text, borderColor: theme.border }} />
            </div>
          </div>

          {/* ── Price summary ── */}
          {selectedPlan && (
            <div className="p-4 rounded-xl" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex justify-between text-sm mb-2" style={{ color: theme.muted }}>
                <span>{selectedPlan.displayName} ({selectedPlan.billingCycle})</span>
                <span>{currencyInfo.symbol}{selectedPlan.price}</span>
              </div>
              {couponValidated && (
                <div className="flex justify-between text-sm mb-2" style={{ color: '#22c55e' }}>
                  <span>Discount ({couponValidated.code})</span>
                  <span>
                    -{couponValidated.discountType === 'percentage'
                      ? `${couponValidated.discountValue}%`
                      : `${currencyInfo.symbol}${couponValidated.discountValue}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t"
                style={{ borderColor: theme.border, color: theme.text }}>
                <span>Total Due</span>
                <span style={{ color: theme.accent }}>
                  {currencyInfo.symbol}{calcFinalPrice()}
                  <span className="text-xs font-normal ml-1" style={{ color: theme.muted }}>
                    /{selectedPlan.billingCycle === 'yearly' ? 'yr' : 'mo'}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ── Subscribe button ── */}
          <button
            onClick={handleSubscribe}
            disabled={loading || !selectedPlanId || paymentStep === 'processing'}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60 transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}>
            {paymentStep === 'processing' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing Payment…
              </>
            ) : (
              <>
                <CreditCard size={18} />
                {paymentStep === 'failed' ? 'Retry Payment' : `Pay ${currencyInfo.symbol}${calcFinalPrice()}`}
                {selectedPlan && (
                  <span className="opacity-80 text-sm font-normal">
                    — {selectedPlan.displayName}
                  </span>
                )}
              </>
            )}
          </button>

          {/* ── Security note ── */}
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: theme.muted }}>
            <Shield size={12} />
            <span>Payments secured by Razorpay · 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}