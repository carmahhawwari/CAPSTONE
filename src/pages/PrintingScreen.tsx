import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getFriends } from '@/lib/friends'
import { getReceivedUnprintedReceipts } from '@/lib/receipts'
import printerImg from '@/assets/printer.png'
import wifiSymbol from '@/assets/wifi-symbol.svg'
import { submitPrintJob, checkNearestPrinter } from '@/lib/printJob'
import { markReceiptAsPrinted } from '@/lib/receipts'
import type { FriendProfile, Receipt } from '@/types/app'
import type { Block, TextStyle } from '@/types/canvas'
import { FONT_STYLES } from '@/types/canvas'

type PrintState = 'select' | 'confirm' | 'locating' | 'no-location' | 'no-printer' | 'printing' | 'done' | 'failed'

export default function PrintingScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { user } = useAuth()
  const [state, setState] = useState<PrintState>('select')
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null)
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [unprinted, setUnprinted] = useState<Receipt[]>([])
  const [receiptState, setReceiptState] = useState<any>((location.state as any)?.receiptState || null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const isTestMode = !searchParams.get('to') && !searchParams.get('email')

  useEffect(() => {
    if ((location.state as any)?.receiptState) {
      setReceiptState((location.state as any).receiptState)
    }
  }, [location.state])

  useEffect(() => {
    const loadRecipientInfo = async () => {
      try {
        const friendId = searchParams.get('to')
        const email = searchParams.get('email')

        if (email) {
          setRecipientEmail(email)
          setState('confirm')
        } else if (friendId && user?.id) {
          const friends = await getFriends(user.id)
          const friend = friends.find(f => f.friendRowId === friendId)
          if (friend) {
            setSelectedFriend(friend)
          }
          setState('confirm')
        } else if (user?.email) {
          // Load received unprinted receipts
          const receipts = await getReceivedUnprintedReceipts(user.email)
          setUnprinted(receipts)
        }
      } catch (err) {
        console.error('Failed to load recipient info:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipientInfo()
  }, [searchParams, user?.id, user?.email])

  useEffect(() => {
    if (state === 'locating') {
      const checkPrinter = async () => {
        try {
          // In test mode, skip printer check and go straight to printing
          if (isTestMode) {
            setState('printing')
            const timer = setTimeout(() => {
              setState('done')
              setTimeout(() => navigate('/home'), 1000)
            }, 3000)
            return () => clearTimeout(timer)
          }

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
  }, [state, navigate, isTestMode])

  useEffect(() => {
    if (state === 'done' && user?.id && receiptState && receiptRef.current) {
      const submitPrint = async () => {
        const receiptId = searchParams.get('receiptId')
        try {
          const recipientName = selectedFriend
            ? selectedFriend.profile.display_name || selectedFriend.profile.username || 'Friend'
            : recipientEmail?.split('@')[0] || 'Unknown'

          const finalRecipientEmail = selectedFriend
            ? selectedFriend.profile.username
              ? `${selectedFriend.profile.username}@stanford.edu`
              : undefined
            : recipientEmail || undefined

          await submitPrintJob({
            receiptElement: receiptRef.current!,
            recipientName,
            recipientId: selectedFriend?.profile.id,
            recipientEmail: finalRecipientEmail,
            skipGeofence: isTestMode,
            cornerSticker: receiptState.cornerSticker ? {
              imageUrl: receiptState.cornerSticker.ditheredDataUrl || receiptState.cornerSticker.fullUrl,
              offsetX: receiptState.cornerSticker.offsetX ?? 0,
              offsetY: receiptState.cornerSticker.offsetY ?? 0,
              rotation: receiptState.cornerSticker.rotation ?? 0,
              scale: receiptState.cornerSticker.scale ?? 1,
            } : undefined,
            receiptStateJson: JSON.stringify(receiptState),
          })

          if (receiptId) {
            await markReceiptAsPrinted(receiptId)
          }
        } catch (err) {
          console.error('Failed to submit print job:', err)
        }
      }
      submitPrint()
    }
  }, [state, user?.id, receiptState, selectedFriend, recipientEmail, isTestMode, searchParams])

  const handleBack = () => navigate('/home')

  const handleConfirmPrint = () => {
    setState('locating')
  }

  const recipientName = selectedFriend
    ? selectedFriend.profile.display_name || selectedFriend.profile.username || 'Friend'
    : recipientEmail?.split('@')[0] || 'Unknown'

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      {/* Receipt Selection State */}
      {state === 'select' && !isLoading && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <h2 className="text-xl font-bold text-black">Print Received Messages</h2>
          {unprinted.length > 0 ? (
            <>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {unprinted.map((receipt) => (
                  <button
                    key={receipt.id}
                    onClick={() => {
                      // Navigate to the receipt page with print parameter
                      navigate(`/r/${receipt.id}?print=true`)
                    }}
                    className="w-full p-4 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-black">From: {receipt.from}</p>
                        <p className="text-sm text-gray-600">{receipt.date}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleBack}
                className="w-full px-6 py-2 text-gray-700 text-center font-medium hover:text-black mt-4"
              >
                Cancel
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-gray-600 text-center">No messages waiting to print</p>
              <button
                onClick={handleBack}
                className="w-full px-6 py-2 text-gray-700 text-center font-medium hover:text-black"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation State */}
      {state === 'confirm' && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-black">
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
            className="w-full px-6 py-2 text-gray-700 text-center font-medium hover:text-black"
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
            <p className="text-xl font-semibold text-black mb-2">
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
            className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Location Permission Denied */}
      {state === 'no-location' && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xl font-semibold text-black mb-2">
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
            className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Done/Success - will auto-navigate */}
      {state === 'done' && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xl font-semibold text-black">Print sent!</p>
          </div>
        </div>
      )}

      {/* Hidden receipt for rasterization */}
      {receiptState && (
        <div className="absolute -left-[9999px]" style={{ width: 0, height: 0, overflow: 'hidden' }}>
          <div
            ref={receiptRef}
            className="bg-white overflow-hidden"
            style={{ fontFamily: 'Georgia, serif', width: '576px', padding: '16px 20px', backgroundColor: '#ffffff', color: '#222121', position: 'relative' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', marginTop: '12px' }}>
              {receiptState.headerVariant === 'simple' ? (
                <img src="/src/assets/icons/header-logo.svg" alt="Inklings" style={{ height: '64px', width: 'auto' }} />
              ) : receiptState.headerVariant === 'squids-checkers' ? (
                <img src="/src/assets/icons/header-squids-checkers.svg" alt="Inklings squids checkers" style={{ height: '80px', width: 'auto' }} />
              ) : receiptState.headerVariant === 'squids-v1' ? (
                <img src="/src/assets/icons/header-squids-v1.svg" alt="Inklings squids v1" style={{ height: '80px', width: 'auto' }} />
              ) : null}
            </div>

            {/* Recipient Bar */}
            <svg width="100%" height="20" viewBox="0 0 100 20" style={{ marginBottom: '12px', display: 'block', backgroundColor: 'white' }} preserveAspectRatio="none">
              <path d="M0,8 Q25,2 50,8 T100,8 L100,18 Q75,20 50,18 T0,18 Z" fill="black" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', marginTop: '8px', fontFamily: "'Printvetica', 'Inter Variable', sans-serif", fontSize: '32px', color: '#222121', lineHeight: 1.5 }}>
              <span>To: {recipientName}</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Current Prompt */}
            {receiptState.currentPrompt && receiptState.currentPrompt !== 'No prompt' && (
              <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.5 }}>
                {receiptState.currentPrompt}
              </div>
            )}

            {/* Render blocks */}
            <div style={{ marginBottom: '16px' }}>
              {receiptState.blocks?.map((block: Block) => (
                <div key={block.id} style={{ marginBottom: '8px' }}>
                  {block.type === 'text' && (
                    <div
                      style={{
                        ...FONT_STYLES[block.style as TextStyle],
                        fontSize: `${FONT_STYLES[block.style as TextStyle].fontSize * (block.fontSizeMultiplier ?? 1)}px`,
                        fontWeight: block.fontWeight ?? FONT_STYLES[block.style as TextStyle].fontWeight,
                        fontStyle: block.isItalic ? 'italic' : 'normal',
                        textDecoration: block.isBold ? 'underline' : 'none',
                        color: '#1f2937',
                        lineHeight: 1.6,
                      }}
                    >
                      {block.content}
                    </div>
                  )}
                  {block.type === 'image' && (
                    <img src={block.dataUrl} alt="block" style={{ maxWidth: '100%', marginBottom: '8px' }} />
                  )}
                  {block.type === 'sticker' && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>[sticker]</div>
                  )}
                </div>
              ))}
            </div>

            {/* Signature */}
            {receiptState.signature && receiptState.signature.text && (
              <div
                style={{
                  fontFamily: "'Inter Variable', sans-serif",
                  fontSize: `${14 * (receiptState.signature.scale ?? 1)}px`,
                  color: '#4b5563',
                  fontStyle: 'italic',
                  marginLeft: `${receiptState.signature.offsetX ?? 0}px`,
                  marginTop: `${receiptState.signature.offsetY ?? 0}px`,
                  lineHeight: 1.4,
                }}
              >
                {receiptState.signature.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
