import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Company settings merged into profile page — redirect
export default function CompanySettings() {
    const navigate = useNavigate()
    useEffect(() => { navigate('/settings/profile', { replace: true }) }, [])
    return null
}
