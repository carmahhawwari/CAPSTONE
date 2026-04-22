import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { submitPrintJob } from '@/lib/printJob'

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

  const receiptNumber = '00-00-000'
  const recipientId = searchParams.get('to')

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
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-12 pb-8">
      <header className="flex items-end justify-between">
        <h1 className="text-regular-semibold text-text-primary">Create Recipt</h1>
        <IconButton label="Home" onClick={() => navigate('/home')}>
          <HomeIcon />
        </IconButton>
      </header>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 items-center justify-center py-8">
        <div ref={receiptRef} className="border-fill-primary bg-bg-primary rounded-md w-full border-2">
        <div className="text-headline text-text-primary border-fill-primary border-b-2 py-4 text-center">
          {receiptNumber}
        </div>

        <div className="flex flex-col gap-4 p-4">
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
              className="border-fill-primary rounded-md flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-2"
            >
              {image ? (
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ArrowUpIcon />
                  <span className="text-headline text-text-primary">
                    upload image
                  </span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Remove image"
              className="bg-fill-primary text-text-inverse absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full"
            >
              <XIcon />
            </button>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message belongs here"
            rows={3}
            className="text-body text-text-tertiary placeholder:text-text-tertiary w-full resize-none bg-transparent focus:outline-none"
          />
        </div>

        <div className="text-body text-text-primary border-fill-primary border-t-2 p-4 text-right">
          <div>love,</div>
          <div>name</div>
        </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="text-headline text-text-inverse bg-fill-primary rounded-md w-full py-4 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send to Inklings'}
      </button>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="border-fill-primary flex h-11 w-11 items-center justify-center rounded-full border-2"
    >
      {children}
    </button>
  )
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V14H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 19V5M5 12L12 5L19 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
