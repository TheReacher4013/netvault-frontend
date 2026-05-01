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











