import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import printerImg from '@/assets/printer.png'
import wifiSymbol from '@/assets/wifi-symbol.svg'

export default function PrintingScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      {/* WiFi Symbol with Flash Animation */}
      <div className="mb-16">
        <img
          src={wifiSymbol}
          alt="WiFi"
          className="w-36 h-36 object-contain mx-auto"
          style={{
            animation: 'wifi-flash 1s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes wifi-flash {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
        `}</style>
      </div>

      {/* Printer and Receipts Image */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src={printerImg}
          alt="Printer"
          className="max-w-xs h-auto object-contain"
        />
      </div>

      {/* Status Text */}
      <p className="text-gray-600 text-base font-medium">Sending to printer...</p>
    </div>
  )
}
