import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { submitPrintJob } from '@/lib/printJob'
import Receipt from '@/components/Receipt'
import type { Receipt as ReceiptType } from '@/types/app'

export default function CreateReceipt() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Get recipient ID from URL params
  const recipientId = searchParams.get('to')

  // Build receipt object for display
  const receipt: ReceiptType = {
    id: 'draft',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    to: recipientId ? `Friend ${recipientId.slice(0, 8)}` : 'Friend',
    from: user?.user_metadata?.display_name ?? 'You',
    prompt: undefined,
    content: message || '(your message will appear here)',
    imageDataUrl: image || undefined,
    friendId: recipientId || 'unknown',
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSend = async () => {
    if (!receiptRef.current) {
      setError('Receipt element not found')
      return
    }

    if (!user?.id) {
      setError('Not logged in')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await submitPrintJob({
        receiptElement: receiptRef.current,
        recipientName: recipientId ? `Friend ${recipientId.slice(0, 8)}` : 'Unknown',
        messageText: message,
        recipientId: recipientId ?? undefined,
      })
      navigate('/receipt-sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 pt-6 pb-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Receipt</h1>
        <button
          onClick={() => navigate('/home')}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Go home"
        >
          ←
        </button>
      </header>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 py-8">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attach Image (optional)</label>
          <div className="relative">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border-2 border-gray-300 rounded-md w-full overflow-hidden hover:border-gray-400 transition bg-gray-50"
            >
              {image ? (
                <img src={image} alt="Uploaded" className="w-full h-auto object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 py-12">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5M5 12L12 5L19 12" />
                  </svg>
                  <span className="text-sm">Upload image</span>
                </div>
              )}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Remove image"
                className="bg-red-500 text-white absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-red-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Receipt Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
          <div ref={receiptRef} className="max-w-sm mx-auto">
            <Receipt receipt={receipt} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={loading || !message}
        className="bg-blue-500 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {loading ? 'Sending...' : 'Send Receipt'}
      </button>
    </div>
  )
}

