import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
import { PENDING_COUNT } from '@/data/mock'

export default function HomeScreen() {
  const navigate = useNavigate()
  const [printing, setPrinting] = useState(false)

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-10">Home</h1>

        {/* Printer with animation */}
        <div className="w-full flex flex-col items-center mb-12">
          {printing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-10">
                {/* WiFi signal animation */}
                <svg width="56" height="48" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                  <path d="M4 16C13.6 7.2 42.4 7.2 52 16" stroke="#3263FE" strokeWidth="4" strokeLinecap="round" />
                  <path d="M12 24C19.2 17.6 36.8 17.6 44 24" stroke="#3263FE" strokeWidth="4" strokeLinecap="round" />
                  <path d="M20 32C23.6 28.8 32.4 28.8 36 32" stroke="#3263FE" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="28" cy="42" r="3.5" fill="#3263FE" />
                </svg>

                {/* Printer */}
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="82" y="15" width="36" height="65" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
                  <rect x="50" y="75" width="100" height="80" rx="8" fill="#E87B3A" />
                  <rect x="56" y="100" width="88" height="48" rx="4" fill="#D4692A" />
                  <rect x="80" y="78" width="40" height="6" rx="2" fill="#C55E22" />
                  <text x="100" y="132" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">PRINTER</text>
                  <ellipse cx="100" cy="162" rx="48" ry="8" fill="#00000015" />
                </svg>

                <p className="text-gray-700">Sending to printer...</p>
              </div>
            </div>
          )}

          <button
            onClick={async () => {
              setPrinting(true)
              // Simulate sending, then hide
              setTimeout(() => {
                setPrinting(false)
              }, 2500)
            }}
            disabled={printing}
            className="w-full flex flex-col items-center active:opacity-70 transition-opacity disabled:opacity-50 cursor-pointer"
            aria-label="Print"
          >
            <div className="relative">
              <PrinterIllustration />
              {PENDING_COUNT > 0 && (
                <div className="absolute -top-2 -right-2 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{PENDING_COUNT}</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Archives */}
        <button
          onClick={() => navigate('/archive')}
          className="w-full flex flex-col items-center active:opacity-70 transition-opacity"
          aria-label="Open archives"
        >
          <ArchivesIllustration />
        </button>

        <button
          onClick={() => navigate('/test-print')}
          className="mt-8 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 active:opacity-70 transition-opacity"
          aria-label="Open test print composer"
        >
          Test Print Composer
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

function PrinterIllustration() {
  return (
    <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Paper coming out */}
      <rect x="82" y="20" width="36" height="60" rx="2" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      {/* Printer body */}
      <rect x="50" y="75" width="100" height="80" rx="8" fill="#E87B3A" />
      {/* Printer front face */}
      <rect x="56" y="100" width="88" height="48" rx="4" fill="#D4692A" />
      {/* Paper slot */}
      <rect x="80" y="78" width="40" height="6" rx="2" fill="#C55E22" />
      {/* Label */}
      <text x="100" y="132" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">PRINTER</text>
      {/* Shadow */}
      <ellipse cx="100" cy="162" rx="48" ry="8" fill="#00000015" />
    </svg>
  )
}

function ArchivesIllustration() {
  return (
    <svg width="180" height="160" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Box body */}
      <rect x="40" y="70" width="140" height="90" rx="6" fill="#D1D5DB" />
      {/* Box front */}
      <rect x="46" y="76" width="128" height="78" rx="4" fill="#C4C9D1" />
      {/* Colored folder tabs */}
      {[
        { x: 52, color: '#F87171' },
        { x: 72, color: '#FCD34D' },
        { x: 92, color: '#6EE7B7' },
        { x: 112, color: '#60A5FA' },
        { x: 132, color: '#A78BFA' },
        { x: 152, color: '#FB923C' },
      ].map(({ x, color }) => (
        <rect key={x} x={x} y="52" width="14" height="30" rx="3" fill={color} />
      ))}
      {/* Label */}
      <text x="110" y="122" textAnchor="middle" fill="#6B7280" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">ARCHIVES</text>
      {/* Shadow */}
      <ellipse cx="110" cy="166" rx="55" ry="8" fill="#00000010" />
    </svg>
  )
}
