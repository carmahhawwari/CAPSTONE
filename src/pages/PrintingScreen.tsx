import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FRIENDS } from '@/data/mock'

export default function PrintingScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const friendId = searchParams.get('to')
  const friend = FRIENDS.find(f => f.id === friendId)

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 2500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10">
      <p className="text-base text-gray-700">
        {friend ? `Sending to ${friend.name.split(' ')[0]}...` : 'Sending to printer...'}
      </p>

      {/* Wifi icon */}
      <svg width="56" height="48" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16C13.6 7.2 42.4 7.2 52 16" stroke="#3263FE" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 24C19.2 17.6 36.8 17.6 44 24" stroke="#3263FE" strokeWidth="4" strokeLinecap="round" />
        <path d="M20 32C23.6 28.8 32.4 28.8 36 32" stroke="#3263FE" strokeWidth="4" strokeLinecap="round" />
        <circle cx="28" cy="42" r="3.5" fill="#3263FE" />
      </svg>

      {/* Printer enlarged */}
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="82" y="15" width="36" height="65" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        <rect x="50" y="75" width="100" height="80" rx="8" fill="#E87B3A" />
        <rect x="56" y="100" width="88" height="48" rx="4" fill="#D4692A" />
        <rect x="80" y="78" width="40" height="6" rx="2" fill="#C55E22" />
        <text x="100" y="132" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">PRINTER</text>
        <ellipse cx="100" cy="162" rx="48" ry="8" fill="#00000015" />
      </svg>
    </div>
  )
}
