import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import printerImg from '@/assets/printer.png'
import wifiSymbol from '@/assets/wifi-symbol.svg'
import { checkNearestPrinter } from '@/lib/printJob'

type PrintState = 'locating' | 'no-location' | 'no-printer' | 'printing' | 'done' | 'failed'

export default function PrintingScreen() {
  const navigate = useNavigate()
  const [state, setState] = useState<PrintState>('locating')

  useEffect(() => {
    const checkPrinter = async () => {
      try {
        const printerId = await checkNearestPrinter()

        if (printerId === null) {
          // No location data or no printer in range
          setState('no-printer')
          return
        }

        // Printer found - show printing state
        setState('printing')

        // Auto-complete after 3 seconds (simulating print job processing)
        const timer = setTimeout(() => {
          setState('done')
          setTimeout(() => navigate('/home'), 1000)
        }, 3000)

        return () => clearTimeout(timer)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to locate printer'

        // Check if it's a location permission issue
        if (message.includes('position') || !navigator.geolocation) {
          setState('no-location')
        } else {
          setState('no-printer')
        }
      }
    }

    checkPrinter()
  }, [navigate])

  const handleBack = () => navigate('/home')

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      {/* Locating or Printing State */}
      {(state === 'locating' || state === 'printing') && (
        <>
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

          <div className="flex-1 flex items-center justify-center">
            <img
              src={printerImg}
              alt="Printer"
              className="max-w-xs h-auto object-contain"
            />
          </div>

          <p className="text-gray-600 text-base font-medium">
            {state === 'locating' ? 'Finding your printer...' : 'Sending to printer...'}
          </p>
        </>
      )}

      {/* No Printer in Range */}
      {state === 'no-printer' && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Hmm... you're not near one of our printers.
            </p>
            <p className="text-sm text-gray-600">
              Move closer to a printer location and try again.
            </p>
          </div>

          <img
            src={printerImg}
            alt="Printer"
            className="max-w-xs h-auto object-contain opacity-50"
          />

          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Location Permission Denied */}
      {state === 'no-location' && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Location access needed
            </p>
            <p className="text-sm text-gray-600 max-w-xs">
              Please enable location access in your browser to find your nearest printer.
            </p>
          </div>

          <img
            src={printerImg}
            alt="Printer"
            className="max-w-xs h-auto object-contain opacity-50"
          />

          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Done/Success - will auto-navigate */}
      {state === 'done' && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">Print sent!</p>
          </div>
        </div>
      )}
    </div>
  )
}
