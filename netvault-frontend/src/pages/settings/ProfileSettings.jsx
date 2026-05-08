import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, authService } from '../../services/api'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, PageHeader, Input, Loader } from '../../components/ui/index'
import TwoFactorSection from './TwoFactorSection'
import { AlertTriangle, Shield, Building2, User, Lock, Trash2, Camera, Upload, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

const fetchMyTenant = () => api.get('/tenant/me')
const updateMyTenant = (data) => api.put('/tenant/me', data)

// Full 196 country codes list
const COUNTRY_CODES = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', phoneLength: 11, phonePattern: /^\d{10,11}$/ },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', phoneLength: 9, phonePattern: /^\d{9,10}$/ },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AF', dial: '+93', flag: '🇦🇫', name: 'Afghanistan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AL', dial: '+355', flag: '🇦🇱', name: 'Albania', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algeria', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AD', dial: '+376', flag: '🇦🇩', name: 'Andorra', phoneLength: 6, phonePattern: /^\d{6}$/ },
  { code: 'AO', dial: '+244', flag: '🇦🇴', name: 'Angola', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'AG', dial: '+1268', flag: '🇦🇬', name: 'Antigua and Barbuda', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'AM', dial: '+374', flag: '🇦🇲', name: 'Armenia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'AZ', dial: '+994', flag: '🇦🇿', name: 'Azerbaijan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'BS', dial: '+1242', flag: '🇧🇸', name: 'Bahamas', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'BB', dial: '+1246', flag: '🇧🇧', name: 'Barbados', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'BY', dial: '+375', flag: '🇧🇾', name: 'Belarus', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'BZ', dial: '+501', flag: '🇧🇿', name: 'Belize', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Benin', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'BT', dial: '+975', flag: '🇧🇹', name: 'Bhutan', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'BO', dial: '+591', flag: '🇧🇴', name: 'Bolivia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'BA', dial: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'BW', dial: '+267', flag: '🇧🇼', name: 'Botswana', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil', phoneLength: 11, phonePattern: /^\d{10,11}$/ },
  { code: 'BN', dial: '+673', flag: '🇧🇳', name: 'Brunei', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgaria', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'BI', dial: '+257', flag: '🇧🇮', name: 'Burundi', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'CV', dial: '+238', flag: '🇨🇻', name: 'Cabo Verde', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'KH', dial: '+855', flag: '🇰🇭', name: 'Cambodia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroon', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CF', dial: '+236', flag: '🇨🇫', name: 'Central African Republic', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'TD', dial: '+235', flag: '🇹🇩', name: 'Chad', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China', phoneLength: 11, phonePattern: /^\d{11}$/ },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'KM', dial: '+269', flag: '🇰🇲', name: 'Comoros', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CR', dial: '+506', flag: '🇨🇷', name: 'Costa Rica', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'HR', dial: '+385', flag: '🇭🇷', name: 'Croatia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CU', dial: '+53', flag: '🇨🇺', name: 'Cuba', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'CY', dial: '+357', flag: '🇨🇾', name: 'Cyprus', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Czech Republic', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'DJ', dial: '+253', flag: '🇩🇯', name: 'Djibouti', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'DM', dial: '+1767', flag: '🇩🇲', name: 'Dominica', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'DO', dial: '+1809', flag: '🇩🇴', name: 'Dominican Republic', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'SV', dial: '+503', flag: '🇸🇻', name: 'El Salvador', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'GQ', dial: '+240', flag: '🇬🇶', name: 'Equatorial Guinea', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'ER', dial: '+291', flag: '🇪🇷', name: 'Eritrea', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'EE', dial: '+372', flag: '🇪🇪', name: 'Estonia', phoneLength: 8, phonePattern: /^\d{7,8}$/ },
  { code: 'SZ', dial: '+268', flag: '🇸🇿', name: 'Eswatini', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'ET', dial: '+251', flag: '🇪🇹', name: 'Ethiopia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'FJ', dial: '+679', flag: '🇫🇯', name: 'Fiji', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland', phoneLength: 10, phonePattern: /^\d{9,10}$/ },
  { code: 'GA', dial: '+241', flag: '🇬🇦', name: 'Gabon', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'GM', dial: '+220', flag: '🇬🇲', name: 'Gambia', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'GE', dial: '+995', flag: '🇬🇪', name: 'Georgia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Greece', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'GD', dial: '+1473', flag: '🇬🇩', name: 'Grenada', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'GT', dial: '+502', flag: '🇬🇹', name: 'Guatemala', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinea', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'GW', dial: '+245', flag: '🇬🇼', name: 'Guinea-Bissau', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'GY', dial: '+592', flag: '🇬🇾', name: 'Guyana', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'HT', dial: '+509', flag: '🇭🇹', name: 'Haiti', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'HN', dial: '+504', flag: '🇭🇳', name: 'Honduras', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'HU', dial: '+36', flag: '🇭🇺', name: 'Hungary', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'IS', dial: '+354', flag: '🇮🇸', name: 'Iceland', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia', phoneLength: 11, phonePattern: /^\d{9,12}$/ },
  { code: 'IR', dial: '+98', flag: '🇮🇷', name: 'Iran', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Iraq', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy', phoneLength: 10, phonePattern: /^\d{9,10}$/ },
  { code: 'JM', dial: '+1876', flag: '🇯🇲', name: 'Jamaica', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan', phoneLength: 10, phonePattern: /^\d{10,11}$/ },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'KZ', dial: '+7', flag: '🇰🇿', name: 'Kazakhstan', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'KI', dial: '+686', flag: '🇰🇮', name: 'Kiribati', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'KG', dial: '+996', flag: '🇰🇬', name: 'Kyrgyzstan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'LA', dial: '+856', flag: '🇱🇦', name: 'Laos', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'LV', dial: '+371', flag: '🇱🇻', name: 'Latvia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon', phoneLength: 8, phonePattern: /^\d{7,8}$/ },
  { code: 'LS', dial: '+266', flag: '🇱🇸', name: 'Lesotho', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'LR', dial: '+231', flag: '🇱🇷', name: 'Liberia', phoneLength: 7, phonePattern: /^\d{7,8}$/ },
  { code: 'LY', dial: '+218', flag: '🇱🇾', name: 'Libya', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'LI', dial: '+423', flag: '🇱🇮', name: 'Liechtenstein', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'LT', dial: '+370', flag: '🇱🇹', name: 'Lithuania', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'LU', dial: '+352', flag: '🇱🇺', name: 'Luxembourg', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'MG', dial: '+261', flag: '🇲🇬', name: 'Madagascar', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'MW', dial: '+265', flag: '🇲🇼', name: 'Malawi', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia', phoneLength: 9, phonePattern: /^\d{9,10}$/ },
  { code: 'MV', dial: '+960', flag: '🇲🇻', name: 'Maldives', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MT', dial: '+356', flag: '🇲🇹', name: 'Malta', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MH', dial: '+692', flag: '🇲🇭', name: 'Marshall Islands', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'MR', dial: '+222', flag: '🇲🇷', name: 'Mauritania', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MU', dial: '+230', flag: '🇲🇺', name: 'Mauritius', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'FM', dial: '+691', flag: '🇫🇲', name: 'Micronesia', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'MD', dial: '+373', flag: '🇲🇩', name: 'Moldova', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MC', dial: '+377', flag: '🇲🇨', name: 'Monaco', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MN', dial: '+976', flag: '🇲🇳', name: 'Mongolia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'ME', dial: '+382', flag: '🇲🇪', name: 'Montenegro', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'MZ', dial: '+258', flag: '🇲🇿', name: 'Mozambique', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'MM', dial: '+95', flag: '🇲🇲', name: 'Myanmar', phoneLength: 9, phonePattern: /^\d{8,9}$/ },
  { code: 'NA', dial: '+264', flag: '🇳🇦', name: 'Namibia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'NR', dial: '+674', flag: '🇳🇷', name: 'Nauru', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'NI', dial: '+505', flag: '🇳🇮', name: 'Nicaragua', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Niger', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'PW', dial: '+680', flag: '🇵🇼', name: 'Palau', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'PA', dial: '+507', flag: '🇵🇦', name: 'Panama', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'PG', dial: '+675', flag: '🇵🇬', name: 'Papua New Guinea', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'PY', dial: '+595', flag: '🇵🇾', name: 'Paraguay', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Romania', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'RW', dial: '+250', flag: '🇷🇼', name: 'Rwanda', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'KN', dial: '+1869', flag: '🇰🇳', name: 'Saint Kitts and Nevis', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'LC', dial: '+1758', flag: '🇱🇨', name: 'Saint Lucia', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'VC', dial: '+1784', flag: '🇻🇨', name: 'Saint Vincent', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'WS', dial: '+685', flag: '🇼🇸', name: 'Samoa', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'SM', dial: '+378', flag: '🇸🇲', name: 'San Marino', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'ST', dial: '+239', flag: '🇸🇹', name: 'Sao Tome and Principe', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Senegal', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'RS', dial: '+381', flag: '🇷🇸', name: 'Serbia', phoneLength: 9, phonePattern: /^\d{8,9}$/ },
  { code: 'SC', dial: '+248', flag: '🇸🇨', name: 'Seychelles', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'SL', dial: '+232', flag: '🇸🇱', name: 'Sierra Leone', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'SK', dial: '+421', flag: '🇸🇰', name: 'Slovakia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SI', dial: '+386', flag: '🇸🇮', name: 'Slovenia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'SB', dial: '+677', flag: '🇸🇧', name: 'Solomon Islands', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'SO', dial: '+252', flag: '🇸🇴', name: 'Somalia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'SS', dial: '+211', flag: '🇸🇸', name: 'South Sudan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SD', dial: '+249', flag: '🇸🇩', name: 'Sudan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SR', dial: '+597', flag: '🇸🇷', name: 'Suriname', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'SY', dial: '+963', flag: '🇸🇾', name: 'Syria', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan', phoneLength: 9, phonePattern: /^\d{9,10}$/ },
  { code: 'TJ', dial: '+992', flag: '🇹🇯', name: 'Tajikistan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'TL', dial: '+670', flag: '🇹🇱', name: 'Timor-Leste', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'TO', dial: '+676', flag: '🇹🇴', name: 'Tonga', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'TT', dial: '+1868', flag: '🇹🇹', name: 'Trinidad and Tobago', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'TM', dial: '+993', flag: '🇹🇲', name: 'Turkmenistan', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'TV', dial: '+688', flag: '🇹🇻', name: 'Tuvalu', phoneLength: 6, phonePattern: /^\d{6}$/ },
  { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'UY', dial: '+598', flag: '🇺🇾', name: 'Uruguay', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'UZ', dial: '+998', flag: '🇺🇿', name: 'Uzbekistan', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'VU', dial: '+678', flag: '🇻🇺', name: 'Vanuatu', phoneLength: 7, phonePattern: /^\d{7}$/ },
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela', phoneLength: 10, phonePattern: /^\d{10}$/ },
  { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam', phoneLength: 10, phonePattern: /^\d{9,10}$/ },
  { code: 'YE', dial: '+967', flag: '🇾🇪', name: 'Yemen', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'ZM', dial: '+260', flag: '🇿🇲', name: 'Zambia', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'ZW', dial: '+263', flag: '🇿🇼', name: 'Zimbabwe', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea', phoneLength: 10, phonePattern: /^\d{9,10}$/ },
  { code: 'KP', dial: '+850', flag: '🇰🇵', name: 'North Korea', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'MK', dial: '+389', flag: '🇲🇰', name: 'North Macedonia', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'PS', dial: '+970', flag: '🇵🇸', name: 'Palestine', phoneLength: 9, phonePattern: /^\d{9}$/ },
  { code: 'XK', dial: '+383', flag: '🇽🇰', name: 'Kosovo', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'MO', dial: '+853', flag: '🇲🇴', name: 'Macau', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'GI', dial: '+350', flag: '🇬🇮', name: 'Gibraltar', phoneLength: 8, phonePattern: /^\d{8}$/ },
  { code: 'IM', dial: '+44', flag: '🇮🇲', name: 'Isle of Man', phoneLength: 10, phonePattern: /^\d{10}$/ },
]

// Map country code → subscription plans currency
const COUNTRY_PLAN_MAP = {
  IN: 'INR', US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD',
  DE: 'EUR', FR: 'EUR', AE: 'AED', SG: 'SGD', NZ: 'NZD',
}

// Searchable Country Code Dropdown Component
function CountryCodeDropdown({ value, onChange, theme }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const selected = COUNTRY_CODES.find(c => c.dial === value) || COUNTRY_CODES[0]
  const filtered = search
    ? COUNTRY_CODES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )
    : COUNTRY_CODES

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0" style={{ minWidth: '110px' }}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="w-full px-2 py-2.5 rounded-xl border text-sm flex items-center gap-1 outline-none"
        style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}>
        <span>{selected.flag}</span>
        <span className="font-mono text-xs">{selected.dial}</span>
        <span className="ml-auto opacity-50 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl shadow-xl overflow-hidden"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, width: '220px', maxHeight: '260px' }}>
          <div className="p-2 sticky top-0" style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: `${theme.accent}10`, color: theme.text, border: `1px solid ${theme.border}` }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
            {filtered.length === 0 && (
              <div className="text-xs text-center py-3" style={{ color: theme.muted }}>No results</div>
            )}
            {filtered.map(c => (
              <button
                key={`${c.code}-${c.dial}`}
                type="button"
                onClick={() => { onChange(c.dial); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80 transition-opacity"
                style={{
                  background: value === c.dial ? `${theme.accent}15` : 'transparent',
                  color: theme.text,
                }}>
                <span>{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono opacity-60">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfileSettings() {
  // ── CHANGE 1: markProfileUpdated added ──────────────────────────────
  const { user: contextUser, theme, logout, refreshTrialInfo, markProfileUpdated, refreshUser } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('personal')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const avatarInputRef = useRef(null)
  const logoInputRef = useRef(null)

  // ── Personal profile ────────────────────────────────
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.me(),
    staleTime: 30_000,
  })
  const user = meData?.data?.data?.user || contextUser

  // ── isAdmin derived early so tenant query can use it ──
  const isAdmin = user?.role === 'admin'

  // ── Company settings (admin only) — declared BEFORE useEffects that reference tenant ──
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: fetchMyTenant,
    enabled: isAdmin,
  })

  const tenant = tenantData?.data?.data?.tenant
  const plan = tenant?.planId

  // ── State ──────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', countryCode: '+91', orgName: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [companyForm, setCompanyForm] = useState({
    orgName: '', website: '', address: '', phone: '', countryCode: '+91', country: 'IN',
    settings: { emailAlerts: true, smsAlerts: false, currency: 'INR', alertDays: [30, 15, 7, 1] },
  })
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace('/api', '')

  const getAvatarUrl = (av) => {
    if (!av) return null
    if (av.startsWith('http')) return av
    return `${API_BASE}${av}`
  }

  // ── useEffects — tenant is declared above, no TDZ ──
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        countryCode: user.countryCode || '+91',
      }))
      if (user.avatar) setAvatarPreview(getAvatarUrl(user.avatar))
    }
  }, [user?._id])

  // Populate orgName from tenant when available
  useEffect(() => {
    if (tenant?.orgName) {
      setProfile(prev => ({ ...prev, orgName: tenant.orgName }))
    }
  }, [tenant?._id])

  useEffect(() => {
    if (tenant) {
      setCompanyForm({
        orgName: tenant.orgName || '',
        website: tenant.website || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        countryCode: tenant.countryCode || '+91',
        country: tenant.country || 'IN',
        settings: tenant.settings || companyForm.settings,
      })
      if (tenant.logo) setLogoPreview(getAvatarUrl(tenant.logo))
    }
  }, [tenant?._id])

  // ── Avatar upload ──────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Only image files are allowed')
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')

    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)

    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await api.post('/users/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Profile photo updated!')
      qc.invalidateQueries(['me'])
      refreshUser?.()
      refreshTrialInfo?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  const profileMut = useMutation({
    mutationFn: d => userService.updateProfile(d),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['me']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const pwMut = useMutation({
    mutationFn: d => authService.changePassword(d),
    onSuccess: () => {
      toast.success('Password changed')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  })

  const emailChanged = user && profile.email.trim().toLowerCase() !== user.email.toLowerCase()

  const handleSaveProfile = () => {
    if (!profile.email.trim()) return toast.error('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return toast.error('Please enter a valid email address')
    if (profile.name.trim() && !/^[a-zA-Z\s'.,-]+$/.test(profile.name.trim())) return toast.error('Name should contain only letters')

    if (profile.phone) {
      const digits = profile.phone.replace(/\D/g, '')
      const selectedCC = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
      if (selectedCC && !selectedCC.phonePattern.test(digits)) {
        return toast.error(`Enter a valid ${selectedCC.phoneLength}-digit number for ${selectedCC.name}`)
      }
      if (!selectedCC && (digits.length < 6 || digits.length > 15)) {
        return toast.error('Please enter a valid contact number (6-15 digits)')
      }
    }

    if (emailChanged) {
      const confirmed = window.confirm(
        `Change email from ${user.email} to ${profile.email}?\n\nYou will use the new email the next time you log in.`
      )
      if (!confirmed) return
    }

    if (isAdmin && profile.orgName !== undefined && profile.orgName !== (tenant?.orgName || '')) {
      saveTenantMut.mutate({ ...companyForm, orgName: profile.orgName })
    }
    profileMut.mutate(profile)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    pwMut.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Only image files are allowed')
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')

    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)

    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      await api.post('/tenant/me/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Company logo updated!')
      qc.invalidateQueries(['my-tenant'])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  // ── CHANGE 2: markProfileUpdated() called on company settings save ──
  const saveTenantMut = useMutation({
    mutationFn: updateMyTenant,
    onSuccess: () => {
      toast.success('Company settings saved')
      qc.invalidateQueries(['my-tenant'])
      markProfileUpdated?.()   // instantly flips profileCompleted=true in AuthContext
      // → TrialPopup will show only "Subscribe" card next session
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  })

  const handleSettings = (key, val) =>
    setCompanyForm(f => ({ ...f, settings: { ...f.settings, [key]: val } }))

  const handleCountryChange = (countryCode) => {
    const entry = COUNTRY_CODES.find(c => c.code === countryCode)
    setCompanyForm(f => ({
      ...f,
      country: countryCode,
      countryCode: entry?.dial || '+91',
      settings: { ...f.settings, currency: COUNTRY_PLAN_MAP[countryCode] || 'USD' },
    }))
  }

  // ── Tabs ──────────────────────────────────────────
  const TABS = [
    { key: 'personal', label: 'My Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    ...(isAdmin ? [{ key: 'company', label: 'Company', icon: Building2 }] : []),
    ...(isAdmin ? [{ key: 'subscription', label: 'Subscription', icon: Shield }] : []),
  ]

  if (meLoading) return <Loader text="Loading profile..." />

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Profile & Settings" subtitle="Manage your account, security, and company details" />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === key ? theme.surface : 'transparent',
              color: activeTab === key ? theme.accent : theme.muted,
              border: activeTab === key ? `1px solid ${theme.border}` : '1px solid transparent',
            }}>
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Personal Info ── */}
      {activeTab === 'personal' && (
        <Card>
          <CardHeader title="Personal Information" />
          <div className="p-6 space-y-4">
            {/* Avatar upload row */}
            <div className="flex items-center gap-4 mb-2">
              <div className="relative group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar"
                    className="w-16 h-16 rounded-2xl object-cover"
                    style={{ border: `2px solid ${theme.border}` }} />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.55)' }}>
                  {avatarUploading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={18} color="#fff" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: theme.text }}>{user?.name}</p>
                <p className="text-xs font-mono" style={{ color: theme.muted }}>{user?.email}</p>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-[11px] mt-1 flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: theme.accent }}>
                  <Upload size={10} /> Upload Photo
                </button>
              </div>
            </div>

            {/* Setup completion notice if profile is incomplete */}
            {(!user?.name || user.name === user?.email?.split('@')[0]) && (
              <div className="flex items-start gap-3 p-3 rounded-xl mb-2"
                style={{ background: `${theme.accent}08`, border: `1px solid ${theme.accent}30` }}>
                <div className="text-xs">
                  <p className="font-semibold mb-1" style={{ color: theme.accent }}>👋 Complete your profile</p>
                  <p style={{ color: theme.muted }}>
                    Add your name and organisation name to personalise your experience.
                  </p>
                </div>
              </div>
            )}

            <Input label="Full Name"
              value={profile.name}
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\s'.,-]/g, '')
                setProfile(p => ({ ...p, name: val }))
              }}
              placeholder="e.g. Rahul Kumar" />

            {isAdmin && (
              <Input label="Organisation / Company Name"
                value={profile.orgName}
                onChange={e => setProfile(p => ({ ...p, orgName: e.target.value }))}
                placeholder="e.g. Acme Digital Agency" />
            )}

            <Input label="Email ID" type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />

            {emailChanged && (
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(240,160,69,0.08)', border: '1px solid rgba(240,160,69,0.25)' }}>
                <AlertTriangle size={14} style={{ color: '#F0A045' }} className="flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold mb-1" style={{ color: theme.text }}>You're changing your email</p>
                  <p style={{ color: theme.muted }}>
                    Next login, use <span className="font-mono font-semibold" style={{ color: theme.text }}>{profile.email}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Contact number with country code */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.muted }}>Contact Number</label>
              <div className="flex gap-2">
                <CountryCodeDropdown
                  value={profile.countryCode}
                  onChange={dial => setProfile(p => ({ ...p, countryCode: dial, phone: '' }))}
                  theme={theme}
                />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => {
                    const cc = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
                    const maxLen = cc?.phoneLength || 15
                    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen)
                    setProfile(p => ({ ...p, phone: val }))
                  }}
                  placeholder={
                    (() => {
                      const cc = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
                      return cc ? `${cc.phoneLength}-digit number` : 'Enter contact number'
                    })()
                  }
                  className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: theme.muted }}>
                {(() => {
                  const cc = COUNTRY_CODES.find(c => c.dial === profile.countryCode)
                  return cc ? `Format: ${cc.dial} + ${cc.phoneLength}-digit number (${cc.name})` : 'Enter your contact number'
                })()}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button loading={profileMut.isPending} onClick={handleSaveProfile}>
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)}
                style={{ color: '#C94040' }}>
                <Trash2 size={13} /> Delete Account
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab: Security ── */}
      {activeTab === 'security' && (
        <>
          <Card>
            <CardHeader title="Change Password" />
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <Input label="Current Password" type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="••••••••" />
              <Input label="New Password" type="password"
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min 6 characters" />
              <Input label="Confirm New Password" type="password"
                value={passwords.confirmPassword}
                onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="••••••••" />
              <Button type="submit" loading={pwMut.isPending}>Change Password</Button>
            </form>
          </Card>
          <TwoFactorSection user={user} refetchUser={() => qc.invalidateQueries(['me'])} />
        </>
      )}

      {/* ── Tab: Company (admin only) ── */}
      {activeTab === 'company' && isAdmin && (
        <Card className="p-6">
          <CardHeader title="Company Profile" subtitle="Update your agency information" />
          {tenantLoading ? (
            <div className="py-8 text-center text-sm" style={{ color: theme.muted }}>Loading...</div>
          ) : (
            <div className="space-y-4 mt-4">
              {/* Logo upload */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: theme.muted }}>Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="logo"
                        className="w-16 h-16 rounded-xl object-cover"
                        style={{ border: `2px solid ${theme.border}` }} />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
                        style={{ background: `${theme.accent}18`, color: theme.accent, border: `2px dashed ${theme.border}` }}>
                        {companyForm.orgName?.charAt(0) || '?'}
                      </div>
                    )}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      {logoUploading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={18} color="#fff" />}
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </div>
                  <div>
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="text-sm flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      style={{ color: theme.accent }}>
                      <Upload size={13} /> Upload Logo
                    </button>
                    <p className="text-xs mt-1" style={{ color: theme.muted }}>PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              <Input label="Company / Agency Name *" name="orgName"
                value={companyForm.orgName}
                onChange={e => setCompanyForm(f => ({ ...f, orgName: e.target.value }))}
                placeholder="Acme Digital Agency" />

              {/* Country selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: theme.muted }}>
                  <Globe size={11} /> Country
                </label>
                <select
                  value={companyForm.country}
                  onChange={e => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}>
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: theme.muted }}>
                  Your country determines available subscription plans and currency.
                </p>
              </div>

              {/* Company contact with country code */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.muted }}>Company Phone</label>
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    value={companyForm.countryCode}
                    onChange={dial => setCompanyForm(f => ({ ...f, countryCode: dial }))}
                    theme={theme}
                  />
                  <input
                    type="tel"
                    value={companyForm.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 15)
                      setCompanyForm(f => ({ ...f, phone: val }))
                    }}
                    placeholder="Company phone number"
                    className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: theme.surface, color: theme.text, borderColor: theme.border }}
                  />
                </div>
              </div>

              <Input label="Website" name="website"
                value={companyForm.website}
                onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://acme.com" />

              <Input label="Address" name="address"
                value={companyForm.address}
                onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Mumbai, Maharashtra, India" />

              {/* Alert preferences */}
              <div className="mt-2 pt-5" style={{ borderTop: `1px solid ${theme.border}` }}>
                <p className="text-xs font-semibold mb-4" style={{ color: theme.muted }}>Alert Preferences</p>
                <div className="space-y-3">
                  {[
                    { key: 'emailAlerts', label: 'Email alerts for expiry reminders' },
                    { key: 'smsAlerts', label: 'SMS alerts (requires Twilio setup)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                        checked={companyForm.settings[key]}
                        onChange={e => handleSettings(key, e.target.checked)}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm" style={{ color: theme.text }}>{label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>Alert Days (days before expiry)</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7, 15, 30, 60].map(d => {
                      const active = companyForm.settings.alertDays?.includes(d)
                      return (
                        <button key={d} type="button"
                          onClick={() => {
                            const curr = companyForm.settings.alertDays || []
                            handleSettings('alertDays',
                              active ? curr.filter(x => x !== d) : [...curr, d].sort((a, b) => b - a)
                            )
                          }}
                          className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-all"
                          style={{
                            background: active ? `${theme.accent}20` : 'transparent',
                            borderColor: active ? theme.accent : theme.border,
                            color: active ? theme.accent : theme.muted,
                          }}>
                          {d}d
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button loading={saveTenantMut.isPending} onClick={() => saveTenantMut.mutate(companyForm)}>
                  Save Company Settings
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Tab: Subscription ── */}
      {activeTab === 'subscription' && isAdmin && (
        <div className="space-y-4">
          {tenantLoading ? (
            <div className="py-8 text-center text-sm" style={{ color: theme.muted }}>Loading subscription info...</div>
          ) : (
            <>
              {/* Plan header card */}
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)` }}>
                    <Shield size={20} style={{ color: theme.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-bold capitalize" style={{ color: theme.text }}>
                        {plan?.displayName || tenant?.planName || 'Free Plan'}
                      </p>
                      {tenant?.isOnTrial && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B40' }}>
                          🕐 Trial
                        </span>
                      )}
                      {tenant?.planStatus === 'active' && !tenant?.isOnTrial && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#16a34a22', color: '#16a34a', border: '1px solid #16a34a40' }}>
                          ✓ Active
                        </span>
                      )}
                      {tenant?.planStatus === 'trial_expired' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#dc262622', color: '#dc2626', border: '1px solid #dc262640' }}>
                          ⚠ Trial Expired
                        </span>
                      )}
                      {tenant?.planStatus === 'pending' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#6366f122', color: '#6366f1', border: '1px solid #6366f140' }}>
                          ⏳ Pending Approval
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: theme.muted }}>
                      {plan?.price === 0 ? 'Free forever' :
                        plan?.price ? `${tenant?.settings?.currency || '₹'}${plan.price} / ${plan.billingCycle || 'month'}` :
                          'Contact admin for pricing'}
                    </p>
                  </div>
                  {/* Dates */}
                  <div className="text-right flex-shrink-0">
                    {tenant?.isOnTrial && tenant?.trialEndDate && (
                      <>
                        <p className="text-[10px] font-mono" style={{ color: theme.muted }}>Trial ends</p>
                        <p className="text-sm font-mono font-bold" style={{ color: '#F59E0B' }}>
                          {new Date(tenant.trialEndDate).toLocaleDateString('en-IN')}
                        </p>
                        {(() => {
                          const days = Math.max(0, Math.ceil((new Date(tenant.trialEndDate) - new Date()) / 86400000))
                          return <p className="text-[10px]" style={{ color: days <= 2 ? '#dc2626' : theme.muted }}>{days} day{days !== 1 ? 's' : ''} left</p>
                        })()}
                      </>
                    )}
                    {tenant?.subscriptionEnd && !tenant?.isOnTrial && (
                      <>
                        <p className="text-[10px] font-mono" style={{ color: theme.muted }}>Renews</p>
                        <p className="text-sm font-mono font-bold" style={{ color: theme.accent }}>
                          {new Date(tenant.subscriptionEnd).toLocaleDateString('en-IN')}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Trial warning */}
                {tenant?.isOnTrial && (
                  <div className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    <span>You're on a free trial. Subscribe before it expires to retain all your data and features.</span>
                  </div>
                )}
                {tenant?.planStatus === 'trial_expired' && (
                  <div className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
                    style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                    <span>Your trial has expired. Contact support to reactivate your subscription.</span>
                  </div>
                )}
              </Card>

              {/* Plan features + limits */}
              <Card className="p-5">
                <p className="text-xs font-semibold mb-4" style={{ color: theme.muted }}>PLAN DETAILS & LIMITS</p>

                {/* Limits grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Domains', max: tenant?.maxDomains, icon: '🌐' },
                    { label: 'Clients', max: tenant?.maxClients, icon: '👥' },
                    { label: 'Hosting Accounts', max: tenant?.maxHosting, icon: '🖥' },
                    { label: 'Staff Members', max: tenant?.maxStaff, icon: '👤' },
                  ].map(({ label, max, icon }) => {
                    const isUnlimited = !max || max >= 99999
                    return (
                      <div key={label} className="p-3 rounded-xl"
                        style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs flex items-center gap-1" style={{ color: theme.muted }}>
                            <span>{icon}</span> {label}
                          </span>
                          <span className="text-xs font-mono font-bold" style={{ color: isUnlimited ? '#16a34a' : theme.text }}>
                            {isUnlimited ? '∞ Unlimited' : max}
                          </span>
                        </div>
                        {!isUnlimited && (
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${theme.accent}15` }}>
                            <div className="h-full rounded-full transition-all" style={{ width: '0%', background: theme.accent }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Plan features list */}
                {(plan?.features || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold mb-3" style={{ color: theme.muted }}>INCLUDED FEATURES</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs" style={{ color: theme.text }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#16a34a20' }}>
                            <span style={{ color: '#16a34a', fontSize: 9 }}>✓</span>
                          </div>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Billing cycle */}
                {plan && (
                  <div className="mt-4 pt-4 flex flex-wrap gap-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                    {[
                      { label: 'Billing Cycle', value: plan.billingCycle || 'Monthly' },
                      { label: 'Trial Period', value: `${plan.trialDays || 7} days` },
                      { label: 'Currency', value: tenant?.settings?.currency || plan.currency || 'INR' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-mono uppercase" style={{ color: theme.muted }}>{label}</p>
                        <p className="text-sm font-semibold capitalize" style={{ color: theme.text }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <p className="text-[10px] text-center" style={{ color: theme.muted }}>
                To upgrade, downgrade, or cancel your subscription, contact your platform administrator.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Delete Account Confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,64,64,0.12)' }}>
                <Trash2 size={16} style={{ color: '#C94040' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: theme.text }}>Delete Account</p>
                <p className="text-xs" style={{ color: theme.muted }}>This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: theme.muted }}>
              Type <span className="font-mono font-bold" style={{ color: theme.text }}>DELETE</span> to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
              style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }} className="flex-1">
                Cancel
              </Button>
              <button
                disabled={deleteInput !== 'DELETE'}
                onClick={() => {
                  toast.error('Account deletion requires contacting support.')
                  setShowDeleteConfirm(false)
                  setDeleteInput('')
                }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: deleteInput === 'DELETE' ? '#C94040' : `#C9404020`,
                  color: deleteInput === 'DELETE' ? '#fff' : '#C94040',
                }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}