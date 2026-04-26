import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getFriends } from '@/lib/friends'
import { savePrintJob } from '@/lib/receipts'
import printerImg from '@/assets/printer.png'
import wifiSymbol from '@/assets/wifi-symbol.svg'
import { checkNearestPrinter } from '@/lib/printJob'
import type { FriendProfile } from '@/types/app'

type PrintState = 'confirm' | 'locating' | 'no-location' | 'no-printer' | 'printing' | 'done' | 'failed'

export default function PrintingScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { user } = useAuth()
  const [state, setState] = useState<PrintState>('confirm')
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null)
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null)
  const [messageCount] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const content = (location.state as any)?.content || ''

  useEffect(() => {
    const loadRecipientInfo = async () => {
      try {
        const friendId = searchParams.get('to')
        const email = searchParams.get('email')

        if (email) {
          setRecipientEmail(email)
        } else if (friendId && user?.id) {
          const friends = await getFriends(user.id)
          const friend = friends.find(f => f.friendRowId === friendId)
          if (friend) {
            setSelectedFriend(friend)
          }
        }
      } catch (err) {
        console.error('Failed to load recipient info:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipientInfo()
  }, [searchParams, user?.id])

  useEffect(() => {
    if (state !== 'confirm') {
      const checkPrinter = async () => {
        try {
          const printerId = await checkNearestPrinter()

          if (printerId === null) {
            setState('no-printer')
            return
          }

          setState('printing')

          const timer = setTimeout(() => {
            setState('done')
            setTimeout(() => navigate('/home'), 1000)
          }, 3000)

          return () => clearTimeout(timer)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to locate printer'

          if (message.includes('position') || !navigator.geolocation) {
            setState('no-location')
          } else {
            setState('no-printer')
          }
        }
      }

      checkPrinter()
    }
  }, [state, navigate])

  useEffect(() => {
    if (state === 'done' && user?.id && content) {
      const savePrint = async () => {
        const payload = btoa(content)
        await savePrintJob({
          sender_id: user.id,
          recipient_id: selectedFriend?.profile.id,
          recipient_name:
            selectedFriend?.profile.display_name || selectedFriend?.profile.username || recipientEmail || 'Unknown',
          message_text: content,
          payload_base64: payload,
        })
      }
      savePrint()
    }
  }, [state, user?.id, content, selectedFriend, recipientEmail])

  const handleBack = () => navigate('/home')

  const handleConfirmPrint = () => {
    setState('locating')
  }

  const recipientName = selectedFriend
    ? selectedFriend.profile.display_name || selectedFriend.profile.username || 'Friend'
    : recipientEmail?.split('@')[0] || 'Unknown'

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      {/* Confirmation State */}
      {state === 'confirm' && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              {messageCount === 1 ? '1 message' : `${messageCount} messages`} waiting
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {recipientName}
            </p>
          </div>

          <button
            onClick={handleConfirmPrint}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800"
          >
            Confirm Printing
          </button>

          <button
            onClick={handleBack}
            className="w-full px-6 py-2 text-gray-700 text-center font-medium hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      )}

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
