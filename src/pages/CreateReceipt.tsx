import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDraft, saveDraft } from '@/lib/onboardingDraft'
import { newBlockId, type Block } from '@/types/canvas'
import paperTexture from '@/assets/paper-texture.jpg'

type Props = {
  onboarding?: boolean
}

export default function CreateReceipt({ onboarding = false }: Props = {}) {
  const navigate = useNavigate()
  const [message, setMessage] = useState(() => {
    if (!onboarding) return ''
    const blocks = loadDraft().content?.blocks ?? []
    const text = blocks.find((b) => b.type === 'text')
    return text && text.type === 'text' ? text.content : ''
  })
  const [image, setImage] = useState<string | null>(() => {
    if (!onboarding) return null
    const blocks = loadDraft().content?.blocks ?? []
    const img = blocks.find((b) => b.type === 'image')
    return img && img.type === 'image' ? img.dataUrl : null
  })
  const [senderName, setSenderName] = useState('')
  const [recipientName, setRecipientName] = useState(() => {
    if (!onboarding) return ''
    return loadDraft().recipient?.name ?? ''
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSend = () => {
    if (onboarding) {
      const blocks: Block[] = []
      if (image) blocks.push({ id: newBlockId(), type: 'image', dataUrl: image })
      if (message.trim()) blocks.push({ id: newBlockId(), type: 'text', content: message.trim(), style: 'normal' })
      if (senderName.trim()) {
        blocks.push({ id: newBlockId(), type: 'text', content: `— ${senderName.trim()}`, style: 'normal' })
      }
      saveDraft({
        content: { blocks, prompt: '' },
        recipient: recipientName.trim()
          ? { name: recipientName.trim(), phone: loadDraft().recipient?.phone ?? '' }
          : null,
      })
      navigate('/onboard/deliver')
      return
    }
    navigate('/receipt-sent')
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-12 pb-8">
      <header className="flex items-end justify-between">
        <h1 className="text-regular-semibold text-text-primary">
          {onboarding ? 'Write your receipt' : 'Create Recipt'}
        </h1>
        <IconButton
          label={onboarding ? 'Back' : 'Home'}
          onClick={() => navigate(onboarding ? '/onboard' : '/home')}
        >
          <HomeIcon />
        </IconButton>
      </header>

      <div className="flex flex-1 items-center justify-center py-8">
        <div
          className="w-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(${paperTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 6px 20px rgba(34, 33, 33, 0.08), 0 1px 3px rgba(34, 33, 33, 0.06)',
            fontFamily: 'var(--font-printvetica)',
          }}
        >
        <div className="text-headline text-text-primary border-fill-primary border-b-2 py-4 text-center">
          {dateStr}
        </div>

        <div className="border-fill-primary flex items-center gap-1 border-b-2 px-4 py-2 text-body">
          <span className="text-text-primary font-semibold">To:</span>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="name"
            className="text-text-primary placeholder:text-text-tertiary bg-transparent focus:outline-none"
          />
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
              className="border-fill-tertiary flex aspect-[4/3] w-full items-center justify-center overflow-hidden border"
              style={{ boxShadow: '0 2px 6px rgba(34, 33, 33, 0.12)' }}
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
            {image && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setImage(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                aria-label="Remove image"
                className="bg-fill-primary text-text-inverse absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center"
              >
                <XIcon />
              </button>
            )}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message belongs here"
            rows={3}
            className="text-body text-text-primary placeholder:text-text-tertiary w-full resize-none bg-transparent focus:outline-none"
          />
        </div>

        <div className="border-fill-primary text-body text-text-primary border-t-2 p-4">
          <div>Love,</div>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="your name"
            className="text-text-primary placeholder:text-text-tertiary w-full bg-transparent focus:outline-none"
          />
        </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSend}
        className="text-headline text-text-inverse bg-fill-primary rounded-md w-full py-4"
      >
        {onboarding ? 'Continue' : 'Send to Inklings'}
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
