import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authService, otpService } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ui/ThemeToggle'
import {
  ArrowRight, ArrowLeft, Check, Eye, EyeOff, Star, Mail,
  ShieldCheck, Tag, X, Zap, Building2, Rocket, Globe, Gift,
  Lock, CheckCircle2, Clock, Search, ChevronDown,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const PLAN_ICONS = { 0: Zap, 1: Building2, 2: Rocket }

// ── Full ~196-country list 
const ALL_COUNTRIES = [
  { code: 'AF', dial: '+93', flag: '🇦🇫', name: 'Afghanistan', currency: 'AFN', symbol: '؋' },
  { code: 'AL', dial: '+355', flag: '🇦🇱', name: 'Albania', currency: 'ALL', symbol: 'L' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algeria', currency: 'DZD', symbol: 'دج' },
  { code: 'AD', dial: '+376', flag: '🇦🇩', name: 'Andorra', currency: 'EUR', symbol: '€' },
  { code: 'AO', dial: '+244', flag: '🇦🇴', name: 'Angola', currency: 'AOA', symbol: 'Kz' },
  { code: 'AG', dial: '+1', flag: '🇦🇬', name: 'Antigua and Barbuda', currency: 'XCD', symbol: '$' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina', currency: 'ARS', symbol: '$' },
  { code: 'AM', dial: '+374', flag: '🇦🇲', name: 'Armenia', currency: 'AMD', symbol: '֏' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria', currency: 'EUR', symbol: '€' },
  { code: 'AZ', dial: '+994', flag: '🇦🇿', name: 'Azerbaijan', currency: 'AZN', symbol: '₼' },
  { code: 'BS', dial: '+1', flag: '🇧🇸', name: 'Bahamas', currency: 'BSD', symbol: '$' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain', currency: 'BHD', symbol: '.د.ب' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh', currency: 'BDT', symbol: '৳' },
  { code: 'BB', dial: '+1', flag: '🇧🇧', name: 'Barbados', currency: 'BBD', symbol: '$' },
  { code: 'BY', dial: '+375', flag: '🇧🇾', name: 'Belarus', currency: 'BYN', symbol: 'Br' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium', currency: 'EUR', symbol: '€' },
  { code: 'BZ', dial: '+501', flag: '🇧🇿', name: 'Belize', currency: 'BZD', symbol: '$' },
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Benin', currency: 'XOF', symbol: 'CFA' },
  { code: 'BT', dial: '+975', flag: '🇧🇹', name: 'Bhutan', currency: 'BTN', symbol: 'Nu' },
  { code: 'BO', dial: '+591', flag: '🇧🇴', name: 'Bolivia', currency: 'BOB', symbol: 'Bs' },
  { code: 'BA', dial: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina', currency: 'BAM', symbol: 'KM' },
  { code: 'BW', dial: '+267', flag: '🇧🇼', name: 'Botswana', currency: 'BWP', symbol: 'P' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil', currency: 'BRL', symbol: 'R$' },
  { code: 'BN', dial: '+673', flag: '🇧🇳', name: 'Brunei', currency: 'BND', symbol: '$' },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgaria', currency: 'BGN', symbol: 'лв' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso', currency: 'XOF', symbol: 'CFA' },
  { code: 'BI', dial: '+257', flag: '🇧🇮', name: 'Burundi', currency: 'BIF', symbol: 'Fr' },
  { code: 'CV', dial: '+238', flag: '🇨🇻', name: 'Cabo Verde', currency: 'CVE', symbol: '$' },
  { code: 'KH', dial: '+855', flag: '🇰🇭', name: 'Cambodia', currency: 'KHR', symbol: '៛' },
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroon', currency: 'XAF', symbol: 'CFA' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', currency: 'CAD', symbol: 'C$' },
  { code: 'CF', dial: '+236', flag: '🇨🇫', name: 'Central African Republic', currency: 'XAF', symbol: 'CFA' },
  { code: 'TD', dial: '+235', flag: '🇹🇩', name: 'Chad', currency: 'XAF', symbol: 'CFA' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile', currency: 'CLP', symbol: '$' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China', currency: 'CNY', symbol: '¥' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia', currency: 'COP', symbol: '$' },
  { code: 'KM', dial: '+269', flag: '🇰🇲', name: 'Comoros', currency: 'KMF', symbol: 'Fr' },
  { code: 'CD', dial: '+243', flag: '🇨🇩', name: 'Congo (DRC)', currency: 'CDF', symbol: 'Fr' },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo (Republic)', currency: 'XAF', symbol: 'CFA' },
  { code: 'CR', dial: '+506', flag: '🇨🇷', name: 'Costa Rica', currency: 'CRC', symbol: '₡' },
  { code: 'HR', dial: '+385', flag: '🇭🇷', name: 'Croatia', currency: 'EUR', symbol: '€' },
  { code: 'CU', dial: '+53', flag: '🇨🇺', name: 'Cuba', currency: 'CUP', symbol: '$' },
  { code: 'CY', dial: '+357', flag: '🇨🇾', name: 'Cyprus', currency: 'EUR', symbol: '€' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Czech Republic', currency: 'CZK', symbol: 'Kč' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark', currency: 'DKK', symbol: 'kr' },
  { code: 'DJ', dial: '+253', flag: '🇩🇯', name: 'Djibouti', currency: 'DJF', symbol: 'Fr' },
  { code: 'DM', dial: '+1', flag: '🇩🇲', name: 'Dominica', currency: 'XCD', symbol: '$' },
  { code: 'DO', dial: '+1', flag: '🇩🇴', name: 'Dominican Republic', currency: 'DOP', symbol: '$' },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador', currency: 'USD', symbol: '$' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt', currency: 'EGP', symbol: '£' },
  { code: 'SV', dial: '+503', flag: '🇸🇻', name: 'El Salvador', currency: 'USD', symbol: '$' },
  { code: 'GQ', dial: '+240', flag: '🇬🇶', name: 'Equatorial Guinea', currency: 'XAF', symbol: 'CFA' },
  { code: 'ER', dial: '+291', flag: '🇪🇷', name: 'Eritrea', currency: 'ERN', symbol: 'Nfk' },
  { code: 'EE', dial: '+372', flag: '🇪🇪', name: 'Estonia', currency: 'EUR', symbol: '€' },
  { code: 'SZ', dial: '+268', flag: '🇸🇿', name: 'Eswatini', currency: 'SZL', symbol: 'L' },
  { code: 'ET', dial: '+251', flag: '🇪🇹', name: 'Ethiopia', currency: 'ETB', symbol: 'Br' },
  { code: 'FJ', dial: '+679', flag: '🇫🇯', name: 'Fiji', currency: 'FJD', symbol: '$' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland', currency: 'EUR', symbol: '€' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', currency: 'EUR', symbol: '€' },
  { code: 'GA', dial: '+241', flag: '🇬🇦', name: 'Gabon', currency: 'XAF', symbol: 'CFA' },
  { code: 'GM', dial: '+220', flag: '🇬🇲', name: 'Gambia', currency: 'GMD', symbol: 'D' },
  { code: 'GE', dial: '+995', flag: '🇬🇪', name: 'Georgia', currency: 'GEL', symbol: '₾' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', currency: 'EUR', symbol: '€' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana', currency: 'GHS', symbol: '₵' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Greece', currency: 'EUR', symbol: '€' },
  { code: 'GD', dial: '+1', flag: '🇬🇩', name: 'Grenada', currency: 'XCD', symbol: '$' },
  { code: 'GT', dial: '+502', flag: '🇬🇹', name: 'Guatemala', currency: 'GTQ', symbol: 'Q' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinea', currency: 'GNF', symbol: 'Fr' },
  { code: 'GW', dial: '+245', flag: '🇬🇼', name: 'Guinea-Bissau', currency: 'XOF', symbol: 'CFA' },
  { code: 'GY', dial: '+592', flag: '🇬🇾', name: 'Guyana', currency: 'GYD', symbol: '$' },
  { code: 'HT', dial: '+509', flag: '🇭🇹', name: 'Haiti', currency: 'HTG', symbol: 'G' },
  { code: 'HN', dial: '+504', flag: '🇭🇳', name: 'Honduras', currency: 'HNL', symbol: 'L' },
  { code: 'HU', dial: '+36', flag: '🇭🇺', name: 'Hungary', currency: 'HUF', symbol: 'Ft' },
  { code: 'IS', dial: '+354', flag: '🇮🇸', name: 'Iceland', currency: 'ISK', symbol: 'kr' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia', currency: 'IDR', symbol: 'Rp' },
  { code: 'IR', dial: '+98', flag: '🇮🇷', name: 'Iran', currency: 'IRR', symbol: '﷼' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Iraq', currency: 'IQD', symbol: 'ع.د' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland', currency: 'EUR', symbol: '€' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel', currency: 'ILS', symbol: '₪' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy', currency: 'EUR', symbol: '€' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: 'Ivory Coast', currency: 'XOF', symbol: 'CFA' },
  { code: 'JM', dial: '+1', flag: '🇯🇲', name: 'Jamaica', currency: 'JMD', symbol: '$' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan', currency: 'JPY', symbol: '¥' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan', currency: 'JOD', symbol: 'د.ا' },
  { code: 'KZ', dial: '+7', flag: '🇰🇿', name: 'Kazakhstan', currency: 'KZT', symbol: '₸' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya', currency: 'KES', symbol: 'KSh' },
  { code: 'KI', dial: '+686', flag: '🇰🇮', name: 'Kiribati', currency: 'AUD', symbol: 'A$' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait', currency: 'KWD', symbol: 'د.ك' },
  { code: 'KG', dial: '+996', flag: '🇰🇬', name: 'Kyrgyzstan', currency: 'KGS', symbol: 'лв' },
  { code: 'LA', dial: '+856', flag: '🇱🇦', name: 'Laos', currency: 'LAK', symbol: '₭' },
  { code: 'LV', dial: '+371', flag: '🇱🇻', name: 'Latvia', currency: 'EUR', symbol: '€' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon', currency: 'LBP', symbol: '£' },
  { code: 'LS', dial: '+266', flag: '🇱🇸', name: 'Lesotho', currency: 'LSL', symbol: 'L' },
  { code: 'LR', dial: '+231', flag: '🇱🇷', name: 'Liberia', currency: 'LRD', symbol: '$' },
  { code: 'LY', dial: '+218', flag: '🇱🇾', name: 'Libya', currency: 'LYD', symbol: 'ل.د' },
  { code: 'LI', dial: '+423', flag: '🇱🇮', name: 'Liechtenstein', currency: 'CHF', symbol: 'Fr' },
  { code: 'LT', dial: '+370', flag: '🇱🇹', name: 'Lithuania', currency: 'EUR', symbol: '€' },
  { code: 'LU', dial: '+352', flag: '🇱🇺', name: 'Luxembourg', currency: 'EUR', symbol: '€' },
  { code: 'MG', dial: '+261', flag: '🇲🇬', name: 'Madagascar', currency: 'MGA', symbol: 'Ar' },
  { code: 'MW', dial: '+265', flag: '🇲🇼', name: 'Malawi', currency: 'MWK', symbol: 'MK' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia', currency: 'MYR', symbol: 'RM' },
  { code: 'MV', dial: '+960', flag: '🇲🇻', name: 'Maldives', currency: 'MVR', symbol: 'Rf' },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali', currency: 'XOF', symbol: 'CFA' },
  { code: 'MT', dial: '+356', flag: '🇲🇹', name: 'Malta', currency: 'EUR', symbol: '€' },
  { code: 'MH', dial: '+692', flag: '🇲🇭', name: 'Marshall Islands', currency: 'USD', symbol: '$' },
  { code: 'MR', dial: '+222', flag: '🇲🇷', name: 'Mauritania', currency: 'MRU', symbol: 'UM' },
  { code: 'MU', dial: '+230', flag: '🇲🇺', name: 'Mauritius', currency: 'MUR', symbol: 'Rs' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico', currency: 'MXN', symbol: '$' },
  { code: 'FM', dial: '+691', flag: '🇫🇲', name: 'Micronesia', currency: 'USD', symbol: '$' },
  { code: 'MD', dial: '+373', flag: '🇲🇩', name: 'Moldova', currency: 'MDL', symbol: 'L' },
  { code: 'MC', dial: '+377', flag: '🇲🇨', name: 'Monaco', currency: 'EUR', symbol: '€' },
  { code: 'MN', dial: '+976', flag: '🇲🇳', name: 'Mongolia', currency: 'MNT', symbol: '₮' },
  { code: 'ME', dial: '+382', flag: '🇲🇪', name: 'Montenegro', currency: 'EUR', symbol: '€' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco', currency: 'MAD', symbol: 'د.م.' },
  { code: 'MZ', dial: '+258', flag: '🇲🇿', name: 'Mozambique', currency: 'MZN', symbol: 'MT' },
  { code: 'MM', dial: '+95', flag: '🇲🇲', name: 'Myanmar', currency: 'MMK', symbol: 'K' },
  { code: 'NA', dial: '+264', flag: '🇳🇦', name: 'Namibia', currency: 'NAD', symbol: '$' },
  { code: 'NR', dial: '+674', flag: '🇳🇷', name: 'Nauru', currency: 'AUD', symbol: 'A$' },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal', currency: 'NPR', symbol: 'Rs.' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands', currency: 'EUR', symbol: '€' },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$' },
  { code: 'NI', dial: '+505', flag: '🇳🇮', name: 'Nicaragua', currency: 'NIO', symbol: 'C$' },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Niger', currency: 'XOF', symbol: 'CFA' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway', currency: 'NOK', symbol: 'kr' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman', currency: 'OMR', symbol: 'ر.ع.' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', currency: 'PKR', symbol: '₨' },
  { code: 'PW', dial: '+680', flag: '🇵🇼', name: 'Palau', currency: 'USD', symbol: '$' },
  { code: 'PA', dial: '+507', flag: '🇵🇦', name: 'Panama', currency: 'PAB', symbol: 'B/.' },
  { code: 'PG', dial: '+675', flag: '🇵🇬', name: 'Papua New Guinea', currency: 'PGK', symbol: 'K' },
  { code: 'PY', dial: '+595', flag: '🇵🇾', name: 'Paraguay', currency: 'PYG', symbol: '₲' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru', currency: 'PEN', symbol: 'S/.' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines', currency: 'PHP', symbol: '₱' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland', currency: 'PLN', symbol: 'zł' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal', currency: 'EUR', symbol: '€' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar', currency: 'QAR', symbol: 'ر.ق' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Romania', currency: 'RON', symbol: 'lei' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia', currency: 'RUB', symbol: '₽' },
  { code: 'RW', dial: '+250', flag: '🇷🇼', name: 'Rwanda', currency: 'RWF', symbol: 'Fr' },
  { code: 'KN', dial: '+1', flag: '🇰🇳', name: 'Saint Kitts and Nevis', currency: 'XCD', symbol: '$' },
  { code: 'LC', dial: '+1', flag: '🇱🇨', name: 'Saint Lucia', currency: 'XCD', symbol: '$' },
  { code: 'VC', dial: '+1', flag: '🇻🇨', name: 'Saint Vincent and Grenadines', currency: 'XCD', symbol: '$' },
  { code: 'WS', dial: '+685', flag: '🇼🇸', name: 'Samoa', currency: 'WST', symbol: 'T' },
  { code: 'SM', dial: '+378', flag: '🇸🇲', name: 'San Marino', currency: 'EUR', symbol: '€' },
  { code: 'ST', dial: '+239', flag: '🇸🇹', name: 'Sao Tome and Principe', currency: 'STN', symbol: 'Db' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س' },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Senegal', currency: 'XOF', symbol: 'CFA' },
  { code: 'RS', dial: '+381', flag: '🇷🇸', name: 'Serbia', currency: 'RSD', symbol: 'din' },
  { code: 'SC', dial: '+248', flag: '🇸🇨', name: 'Seychelles', currency: 'SCR', symbol: 'Rs' },
  { code: 'SL', dial: '+232', flag: '🇸🇱', name: 'Sierra Leone', currency: 'SLL', symbol: 'Le' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', currency: 'SGD', symbol: 'S$' },
  { code: 'SK', dial: '+421', flag: '🇸🇰', name: 'Slovakia', currency: 'EUR', symbol: '€' },
  { code: 'SI', dial: '+386', flag: '🇸🇮', name: 'Slovenia', currency: 'EUR', symbol: '€' },
  { code: 'SB', dial: '+677', flag: '🇸🇧', name: 'Solomon Islands', currency: 'SBD', symbol: '$' },
  { code: 'SO', dial: '+252', flag: '🇸🇴', name: 'Somalia', currency: 'SOS', symbol: 'Sh' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa', currency: 'ZAR', symbol: 'R' },
  { code: 'SS', dial: '+211', flag: '🇸🇸', name: 'South Sudan', currency: 'SSP', symbol: '£' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain', currency: 'EUR', symbol: '€' },
  { code: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka', currency: 'LKR', symbol: 'Rs' },
  { code: 'SD', dial: '+249', flag: '🇸🇩', name: 'Sudan', currency: 'SDG', symbol: 'ج.س.' },
  { code: 'SR', dial: '+597', flag: '🇸🇷', name: 'Suriname', currency: 'SRD', symbol: '$' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden', currency: 'SEK', symbol: 'kr' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland', currency: 'CHF', symbol: 'Fr' },
  { code: 'SY', dial: '+963', flag: '🇸🇾', name: 'Syria', currency: 'SYP', symbol: '£' },
  { code: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan', currency: 'TWD', symbol: '$' },
  { code: 'TJ', dial: '+992', flag: '🇹🇯', name: 'Tajikistan', currency: 'TJS', symbol: 'SM' },
  { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania', currency: 'TZS', symbol: 'Sh' },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand', currency: 'THB', symbol: '฿' },
  { code: 'TL', dial: '+670', flag: '🇹🇱', name: 'Timor-Leste', currency: 'USD', symbol: '$' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo', currency: 'XOF', symbol: 'CFA' },
  { code: 'TO', dial: '+676', flag: '🇹🇴', name: 'Tonga', currency: 'TOP', symbol: 'T$' },
  { code: 'TT', dial: '+1', flag: '🇹🇹', name: 'Trinidad and Tobago', currency: 'TTD', symbol: '$' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia', currency: 'TND', symbol: 'د.ت' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey', currency: 'TRY', symbol: '₺' },
  { code: 'TM', dial: '+993', flag: '🇹🇲', name: 'Turkmenistan', currency: 'TMT', symbol: 'T' },
  { code: 'TV', dial: '+688', flag: '🇹🇻', name: 'Tuvalu', currency: 'AUD', symbol: 'A$' },
  { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda', currency: 'UGX', symbol: 'Sh' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine', currency: 'UAH', symbol: '₴' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'United Arab Emirates', currency: 'AED', symbol: 'AED' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'UY', dial: '+598', flag: '🇺🇾', name: 'Uruguay', currency: 'UYU', symbol: '$' },
  { code: 'UZ', dial: '+998', flag: '🇺🇿', name: 'Uzbekistan', currency: 'UZS', symbol: 'лв' },
  { code: 'VU', dial: '+678', flag: '🇻🇺', name: 'Vanuatu', currency: 'VUV', symbol: 'Vt' },
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela', currency: 'VES', symbol: 'Bs.S' },
  { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam', currency: 'VND', symbol: '₫' },
  { code: 'YE', dial: '+967', flag: '🇾🇪', name: 'Yemen', currency: 'YER', symbol: '﷼' },
  { code: 'ZM', dial: '+260', flag: '🇿🇲', name: 'Zambia', currency: 'ZMW', symbol: 'ZK' },
  { code: 'ZW', dial: '+263', flag: '🇿🇼', name: 'Zimbabwe', currency: 'ZWL', symbol: '$' },
]

// ── Reusable searchable country dropdown ──────────────────────────────────
function CountryDropdown({ value, onChange, theme }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const searchRef = useRef(null)

  const selected = ALL_COUNTRIES.find(c => c.code === value) || ALL_COUNTRIES.find(c => c.code === 'IN')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_COUNTRIES
    return ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.currency.toLowerCase().includes(q)
    )
  }, [search])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  const handleSelect = (code) => { onChange(code); setOpen(false); setSearch('') }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
        style={{
          background: `${theme.accent}08`,
          borderColor: open ? theme.accent : theme.border,
          color: theme.text,
          outline: 'none',
        }}
      >
        <span className="text-lg leading-none shrink-0">{selected.flag}</span>
        <span className="flex-1 text-left truncate text-sm">{selected.name}</span>
        <span className="text-xs font-mono shrink-0" style={{ color: theme.muted }}>{selected.dial}</span>
        <ChevronDown
          size={14}
          style={{
            color: theme.muted,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search bar */}
          <div className="p-2 shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}
            >
              <Search size={12} style={{ color: theme.muted, flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country, code, currency…"
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: theme.text }}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} style={{ color: theme.muted }}>
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: theme.muted }}>No countries found</p>
            ) : filtered.map(c => {
              const isSel = c.code === value
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                  style={{
                    background: isSel ? `${theme.accent}15` : 'transparent',
                    color: isSel ? theme.accent : theme.text,
                  }}
                >
                  <span className="text-base leading-none shrink-0">{c.flag}</span>
                  <span className="flex-1 truncate text-xs">{c.name}</span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: theme.muted }}>{c.dial}</span>
                  <span className="text-[10px] font-mono shrink-0 w-10 text-right" style={{ color: theme.muted }}>{c.currency}</span>
                  {isSel && <Check size={10} style={{ color: theme.accent, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {/* Footer count */}
          <div
            className="px-3 py-1.5 text-[10px] font-mono shrink-0"
            style={{ color: theme.muted, borderTop: `1px solid ${theme.border}` }}
          >
            {filtered.length} / {ALL_COUNTRIES.length} countries
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Register ─────────────────────────────────────────────────────────
export default function Register() {
  const [params] = useSearchParams()
  const { theme } = useTheme()
  const preselectedPlan = params.get('plan')
  const refCode = params.get('ref') || ''

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)

  // Country
  const [country, setCountry] = useState('IN')

  // Plans
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(preselectedPlan || '')
  const [loading, setLoading] = useState(false)

  // OTP
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const otpInputRef = useRef(null)

  // Coupon
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [manualCouponInput, setManualCouponInput] = useState('')
  const [manualCouponError, setManualCouponError] = useState('')
  const [manualCouponLoading, setManualCouponLoading] = useState(false)

  const selectedCountry = ALL_COUNTRIES.find(c => c.code === country) || ALL_COUNTRIES.find(c => c.code === 'IN')
  const currSymbol = selectedCountry.symbol

  // ── Fetch plans on country change ──────────────────────────────────────
  useEffect(() => {
    setPlansLoading(true)
    setSelectedCoupon(null)
    api.get(`/plans?country=${country}`)
      .then(res => {
        const list = res.data?.data?.plans || []
        setPlans(list)
        if (preselectedPlan && list.find(p => p._id === preselectedPlan)) {
          setSelectedPlanId(preselectedPlan)
        } else if (list.length) {
          const popular = list.find(p => p.isPopular)
          setSelectedPlanId(popular?._id || list[0]._id)
        } else {
          setSelectedPlanId('')
        }
      })
      .catch(() => { setPlans([]); setSelectedPlanId('') })
      .finally(() => setPlansLoading(false))
  }, [country])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  useEffect(() => {
    if (step === 2) setTimeout(() => otpInputRef.current?.focus(), 100)
  }, [step])

  const selectedPlan = plans.find(p => p._id === selectedPlanId)

  // ── Coupon ─────────────────────────────────────────────────────────────
  const handleManualApply = async () => {
    if (!manualCouponInput.trim()) return
    setManualCouponLoading(true)
    setManualCouponError('')
    try {
      const res = await api.post('/coupons/validate', {
        code: manualCouponInput.trim().toUpperCase(),
        orderAmount: selectedPlan?.price || 0,
      })
      const { coupon, extraDays } = res.data.data
      setSelectedCoupon({ ...coupon, extraDays })
      toast.success(
        coupon.discountType === 'duration'
          ? `Coupon applied — ${extraDays} extra days added!`
          : 'Coupon applied!'
      )
    } catch (err) {
      setManualCouponError(err.response?.data?.message || 'Invalid coupon code')
    } finally {
      setManualCouponLoading(false)
    }
  }

  // ── Validators ─────────────────────────────────────────────────────────
  const validators = {
    email: v => {
      if (!v.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
      return ''
    },
    password: v => {
      if (!v) return 'Password is required'
      if (v.length < 6) return 'Password must be at least 6 characters'
      return ''
    },
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (validators[name]) setErrors(prev => ({ ...prev, [name]: validators[name](value) }))
  }

  const handleCountryChange = (code) => {
    setCountry(code)
    setSelectedPlanId('')
    setSelectedCoupon(null)
  }

  const validateStep1 = () => {
    const newErrors = {}
    Object.keys(validators).forEach(f => {
      const err = validators[f]?.(form[f] || '')
      if (err) newErrors[f] = err
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Continue = async (e) => {
    e.preventDefault()
    if (!validateStep1()) return
    setOtpSending(true)
    try {
      try {
        await authService.checkEmail(form.email.trim().toLowerCase())
      } catch (emailErr) {
        if (emailErr.response?.status === 409) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in.' }))
          setOtpSending(false)
          return
        }
      }
      await otpService.send(form.email.trim().toLowerCase())
      toast.success(`Verification code sent to ${form.email}`)
      setStep(2)
      setResendIn(60)
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (/already registered|email.*exist|duplicate/i.test(msg)) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in.' }))
      } else {
        toast.error(msg || 'Failed to send verification code')
      }
    } finally {
      setOtpSending(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0) return
    setOtpSending(true)
    try {
      await otpService.send(form.email.trim().toLowerCase())
      toast.success('New code sent — check your inbox')
      setOtp('')
      setResendIn(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter the 6-digit code')
    setOtpVerifying(true)
    try {
      await otpService.verify(form.email.trim().toLowerCase(), otp)
      toast.success('Email verified!')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPlanId) return toast.error('Please select a plan')
    setLoading(true)
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        planId: selectedPlanId,
        country,
        countryCode: selectedCountry.dial,
        ...(selectedCoupon && { couponCode: selectedCoupon.code }),
        ...(refCode && { referralCode: refCode }),
      }
      const res = await authService.register(payload)
      const { token } = res.data.data
      localStorage.setItem('nv_token', token)
      toast.success('Account created! Welcome to NetVault 🎉')
      setTimeout(() => { window.location.href = '/dashboard' }, 800)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (/already registered|email.*exist|duplicate/i.test(msg)) {
        toast.error('This email is already registered.')
        setStep(1)
        setErrors(prev => ({ ...prev, email: 'Already registered. Please sign in.' }))
      } else {
        toast.error(msg)
      }
      setLoading(false)
    }
  }

  // ── Price calc ─────────────────────────────────────────────────────────
  const originalPrice = selectedPlan?.price || 0
  const discountAmount = selectedCoupon && selectedCoupon.discountType !== 'duration'
    ? selectedCoupon.discountType === 'percentage'
      ? Math.round((originalPrice * selectedCoupon.discountValue) / 100)
      : Math.min(selectedCoupon.discountValue, originalPrice)
    : 0
  const finalPrice = originalPrice - discountAmount

  const STEPS = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Verify email' },
    { n: 3, label: 'Choose plan' },
  ]

  const FieldError = ({ name }) =>
    errors[name] ? <p className="text-[10px] font-mono mt-1" style={{ color: '#C94040' }}>{errors[name]}</p> : null

  const inputStyle = (hasError) => ({
    background: `${theme.accent}08`,
    border: `1px solid ${hasError ? '#C94040' : theme.border}`,
    color: theme.text,
  })

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: theme.bg }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${theme.accent}15, transparent)` }} />

      {/* Nav */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#12100C' }}>N</div>
          <span className="font-display font-bold text-lg">
            Net<span style={{ color: theme.accent }}>Vault</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Stepper */}
      <div className="relative z-10 max-w-lg mx-auto px-6 mb-6">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= s.n ? theme.accent : 'transparent',
                  color: step >= s.n ? '#fff' : theme.muted,
                  border: step >= s.n ? 'none' : `1px solid ${theme.border}`,
                }}>
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className="text-[11px] font-mono hidden sm:inline"
                style={{ color: step >= s.n ? theme.text : theme.muted }}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: theme.border }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 max-w-lg mx-auto px-6 pb-16">
        <div className="rounded-2xl p-7" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Create your account</h1>
              <p className="text-xs mb-5 font-mono" style={{ color: theme.muted }}>
                🎉 Start your <strong style={{ color: theme.accent }}>7-day free trial</strong> — no credit card required
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: Clock, text: '7-day free trial' },
                  { icon: CheckCircle2, text: 'No credit card' },
                  { icon: Lock, text: 'Secure & private' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ background: `${theme.accent}10`, color: theme.muted, border: `1px solid ${theme.border}` }}>
                    <Icon size={10} style={{ color: theme.accent }} /> {text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleStep1Continue} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Email address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="you@company.com" autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle(errors.email)} />
                  <FieldError name="email" />
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange}
                      placeholder="Min 6 characters" autoComplete="new-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                      style={inputStyle(errors.password)} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70"
                      style={{ color: theme.text }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <FieldError name="password" />
                </div>

                {/* Country — searchable */}
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1.5" style={{ color: theme.muted }}>
                    <Globe size={11} /> Your country
                  </label>
                  <CountryDropdown value={country} onChange={handleCountryChange} theme={theme} />
                  <p className="text-[10px] mt-1.5" style={{ color: theme.muted }}>
                    Determines your available plans and billing currency.
                  </p>
                </div>

                {/* Live plan preview */}
                {plans.length > 0 && !plansLoading && (
                  <div className="rounded-xl p-3" style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                    <p className="text-[10px] font-mono mb-2 uppercase" style={{ color: theme.muted }}>
                      Plans available for {selectedCountry.name} ({selectedCountry.currency})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {plans.map(p => (
                        <div key={p._id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                          style={{ background: `${theme.accent}12`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
                          <span className="font-semibold">{p.displayName}</span>
                          <span style={{ color: theme.muted }}>{p.price === 0 ? 'Free' : `${currSymbol}${p.price}/mo`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {plansLoading && (
                  <div className="flex items-center gap-2 text-xs py-2" style={{ color: theme.muted }}>
                    <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                      style={{ borderColor: `${theme.accent}30`, borderTopColor: theme.accent }} />
                    Loading plans for {selectedCountry.name}…
                  </div>
                )}

                <button type="submit" disabled={otpSending}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpSending ? 'Sending code…' : (<>Continue <ArrowRight size={14} /></>)}
                </button>
              </form>

              <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: theme.accent }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ─── STEP 2: OTP ─── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={18} style={{ color: theme.accent }} />
                <h1 className="font-display font-bold text-2xl">Check your email</h1>
              </div>
              <p className="text-xs mb-6 font-mono" style={{ color: theme.muted }}>
                We sent a 6-digit code to <strong style={{ color: theme.text }}>{form.email}</strong>
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: theme.muted }}>Verification code</label>
                  <input ref={otpInputRef}
                    inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={otp} autoComplete="one-time-code"
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full px-3 py-3 rounded-xl text-center text-2xl font-mono tracking-[0.4em] outline-none"
                    style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }} />
                </div>
                <button type="submit" disabled={otpVerifying || otp.length !== 6}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {otpVerifying ? 'Verifying…' : (<><ShieldCheck size={14} />Verify & continue</>)}
                </button>
                <div className="flex items-center justify-between pt-2 text-xs" style={{ color: theme.muted }}>
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 hover:underline">
                    <ArrowLeft size={11} /> Change email
                  </button>
                  {resendIn > 0 ? <span>Resend in {resendIn}s</span> : (
                    <button type="button" onClick={handleResend} disabled={otpSending}
                      className="font-semibold hover:underline disabled:opacity-60"
                      style={{ color: theme.accent }}>Resend code</button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* ─── STEP 3: Plan selection ─── */}
          {step === 3 && (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Choose your plan</h1>
              <p className="text-xs mb-4 font-mono" style={{ color: theme.muted }}>
                🎉 All plans start with a <strong style={{ color: theme.accent }}>7-day free trial</strong>
              </p>

              {/* Country selector — also available on step 3 to switch */}
              <div className="rounded-xl p-3 mb-4" style={{ background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase" style={{ color: theme.muted }}>
                    Billing country & currency
                  </span>
                  {plansLoading && (
                    <div className="flex items-center gap-1.5 text-[10px]" style={{ color: theme.accent }}>
                      <div className="w-2.5 h-2.5 border-2 rounded-full animate-spin"
                        style={{ borderColor: `${theme.accent}30`, borderTopColor: theme.accent }} />
                      Updating…
                    </div>
                  )}
                </div>
                <CountryDropdown value={country} onChange={handleCountryChange} theme={theme} />
                <p className="text-[10px] mt-1.5" style={{ color: theme.muted }}>
                  Plans below shown in <strong>{selectedCountry.currency}</strong> ({currSymbol})
                </p>
              </div>

              {refCode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
                  style={{ background: '#16a34a15', border: '1px solid #16a34a40', color: '#16a34a' }}>
                  <Gift size={12} />
                  Referral <strong>{refCode}</strong> applied — bonus on your first invoice!
                </div>
              )}

              {/* Plans */}
              {plansLoading ? (
                <div className="text-center py-10 text-sm" style={{ color: theme.muted }}>
                  <div className="inline-block w-5 h-5 border-2 rounded-full animate-spin mb-2"
                    style={{ borderColor: `${theme.accent}30`, borderTopColor: theme.accent }} />
                  <div>Loading plans for {selectedCountry.name}…</div>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-sm rounded-xl"
                  style={{ color: theme.muted, background: `${theme.accent}06`, border: `1px solid ${theme.border}` }}>
                  No plans available for this country yet.
                  <br />
                  <button onClick={() => handleCountryChange('IN')}
                    className="text-xs mt-2 underline" style={{ color: theme.accent }}>
                    Switch to India
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 mb-5">
                  {plans.map((p, idx) => {
                    const isSelected = selectedPlanId === p._id
                    const PlanIcon = PLAN_ICONS[idx] || Zap
                    return (
                      <button key={p._id} type="button"
                        onClick={() => { setSelectedPlanId(p._id); setSelectedCoupon(null) }}
                        className="text-left rounded-2xl transition-all relative overflow-hidden"
                        style={{
                          background: isSelected ? `${theme.accent}12` : `${theme.accent}05`,
                          border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? theme.accent : theme.border}`,
                          padding: isSelected ? '15px' : '16px',
                          boxShadow: isSelected ? `0 4px 20px ${theme.accent}20` : 'none',
                        }}>

                        {p.isPopular && (
                          <div className="absolute top-0 right-0 flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded-bl-xl"
                            style={{ background: theme.accent, color: '#fff' }}>
                            <Star size={7} /> Popular
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: isSelected ? `${theme.accent}25` : `${theme.accent}10` }}>
                            <PlanIcon size={18} style={{ color: isSelected ? theme.accent : theme.muted }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-sm" style={{ color: theme.text }}>{p.displayName}</span>
                              <div className="flex items-baseline gap-0.5 flex-shrink-0">
                                {p.price === 0 ? (
                                  <span className="font-display font-bold text-base" style={{ color: isSelected ? theme.accent : theme.text }}>Free</span>
                                ) : (
                                  <>
                                    <span className="font-display font-bold text-base" style={{ color: isSelected ? theme.accent : theme.text }}>
                                      {currSymbol}{p.price}
                                    </span>
                                    <span className="text-[10px]" style={{ color: theme.muted }}>/mo</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px]" style={{ color: theme.muted }}>
                              <span>{p.maxDomains >= 99999 ? '∞' : p.maxDomains} Domains</span>
                              <span>{p.maxClients >= 99999 ? '∞' : p.maxClients} Clients</span>
                              <span>{p.maxHosting >= 99999 ? '∞' : p.maxHosting} Hosting</span>
                            </div>

                            {(p.features || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {p.features.slice(0, 3).map(f => (
                                  <span key={f} className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                                    style={{
                                      background: isSelected ? `${theme.accent}18` : `${theme.accent}08`,
                                      color: isSelected ? theme.accent : theme.muted,
                                      border: `1px solid ${isSelected ? `${theme.accent}30` : theme.border}`,
                                    }}>{f}</span>
                                ))}
                                {p.features.length > 3 && (
                                  <span className="text-[9px] font-mono" style={{ color: theme.muted }}>
                                    +{p.features.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-[9px] font-mono" style={{ color: '#22c55e' }}>✓ 7-day free trial included</div>
                          </div>

                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: isSelected ? theme.accent : 'transparent', border: `2px solid ${isSelected ? theme.accent : theme.border}` }}>
                            {isSelected && <Check size={10} color="#fff" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Coupon */}
              {selectedPlan && selectedPlan.price > 0 && (
                <div className="mb-5">
                  <label className="text-xs font-semibold block mb-2" style={{ color: theme.muted }}>
                    <Tag size={11} className="inline mr-1" /> Have a coupon code?
                  </label>
                  {selectedCoupon ? (
                    <div className="rounded-xl p-3" style={{ background: '#16a34a12', border: '1px solid #16a34a40' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Check size={14} style={{ color: '#16a34a' }} />
                          <span className="font-mono font-bold text-sm" style={{ color: '#16a34a' }}>{selectedCoupon.code}</span>
                        </div>
                        <button type="button" onClick={() => { setSelectedCoupon(null); setManualCouponInput('') }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted }}>
                          <X size={14} />
                        </button>
                      </div>
                      {selectedCoupon.discountType === 'duration' ? (
                        <div className="text-xs pt-2" style={{ borderTop: '1px solid #16a34a30', color: '#16a34a' }}>
                          🗓 <strong>{selectedCoupon.durationDays || selectedCoupon.extraDays} extra days</strong> added after trial!
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs pt-2" style={{ borderTop: '1px solid #16a34a30' }}>
                          <div className="flex justify-between" style={{ color: theme.muted }}>
                            <span>Plan price</span><span>{currSymbol}{originalPrice}/mo</span>
                          </div>
                          <div className="flex justify-between" style={{ color: '#16a34a' }}>
                            <span>Discount</span><span>- {currSymbol}{discountAmount}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-1"
                            style={{ color: theme.text, borderTop: `1px solid ${theme.border}` }}>
                            <span>After trial</span>
                            <span style={{ color: theme.accent }}>{currSymbol}{finalPrice}/mo</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={manualCouponInput}
                        onChange={e => { setManualCouponInput(e.target.value.toUpperCase()); setManualCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleManualApply()}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none font-mono uppercase"
                        style={{ background: `${theme.accent}08`, border: `1px solid ${manualCouponError ? '#C94040' : theme.border}`, color: theme.text }} />
                      <button type="button" onClick={handleManualApply}
                        disabled={!manualCouponInput.trim() || manualCouponLoading}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                        style={{ background: theme.accent, color: '#fff' }}>
                        {manualCouponLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {manualCouponError && <p className="text-[10px] font-mono mt-1.5" style={{ color: '#C94040' }}>{manualCouponError}</p>}
                </div>
              )}

              {/* Order summary */}
              {selectedPlan && (
                <div className="p-4 rounded-xl mb-5" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: theme.muted }}>ORDER SUMMARY</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Plan</span>
                      <span style={{ color: theme.text, fontWeight: 600 }}>{selectedPlan.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Country</span>
                      <span style={{ color: theme.text }}>{selectedCountry.flag} {selectedCountry.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>Currency</span>
                      <span style={{ color: theme.text }}>{selectedCountry.currency} ({currSymbol})</span>
                    </div>
                    <div className="flex justify-between" style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
                      <span style={{ color: theme.muted }}>Free trial</span>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>7 days ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.muted }}>After trial</span>
                      <span style={{ color: theme.text }}>
                        {selectedPlan.price === 0 ? 'Free forever' : `${currSymbol}${originalPrice}/month`}
                      </span>
                    </div>
                    {selectedCoupon && selectedCoupon.discountType === 'duration' && (
                      <div className="flex justify-between" style={{ color: '#16a55a' }}>
                        <span>Coupon bonus</span>
                        <span>+{selectedCoupon.durationDays || selectedCoupon.extraDays} days</span>
                      </div>
                    )}
                    {selectedCoupon && selectedCoupon.discountType !== 'duration' && discountAmount > 0 && (
                      <>
                        <div className="flex justify-between" style={{ color: '#16a34a' }}>
                          <span>Coupon ({selectedCoupon.code})</span>
                          <span>- {currSymbol}{discountAmount}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1"
                          style={{ borderTop: `1px solid ${theme.border}`, color: theme.text }}>
                          <span>Total after trial</span>
                          <span style={{ color: theme.accent }}>{currSymbol}{finalPrice}/mo</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} disabled={loading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
                  style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" onClick={handleSubmit}
                  disabled={loading || !selectedPlanId || plansLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: theme.accent, color: '#fff' }}>
                  {loading ? 'Creating your account…' : (<>Start 7-day free trial <ArrowRight size={14} /></>)}
                </button>
              </div>

              <p className="text-[10px] text-center mt-3" style={{ color: theme.muted }}>
                No credit card required. Cancel any time. By signing up, you agree to our terms.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}