// DNS management is now embedded directly in the Domain Detail page.
// This file redirects for backward compatibility with any bookmarked URLs.
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function DNSManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/domains/${id}`, { replace: true })
  }, [id, navigate])
  return null
}











