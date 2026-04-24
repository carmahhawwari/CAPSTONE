import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { clearDraft, loadDraft } from '@/lib/onboardingDraft'
import type { Block } from '@/types/canvas'

type Mode = 'create-account' | 'onboard-delivery'

type Props = {
  mode?: Mode
}

const inputClass =
  'font-inter text-mini text-text-primary placeholder:text-text-tertiary border-fill-tertiary bg-bg-tertiary rounded-md w-full border px-4 py-4 focus:outline-none focus:border-fill-primary'

function messageFromBlocks(blocks: Block[]): string {
  return blocks
    .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
    .map((b) => b.content)
    .filter(Boolean)
    .join('\n')
    .trim()
}

export default function SignUp({ mode = 'create-account' }: Props = {}) {
  const navigate = useNavigate()
  const isDelivery = mode === 'onboard-delivery'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [senderName, setSenderName] = useState('')
  const [draftMessage, setDraftMessage] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!isDelivery) return
    const draft = loadDraft()
    if (draft.recipient) {
      setRecipientName(draft.recipient.name)
      setRecipientPhone(draft.recipient.phone)
    }
    const blocks = draft.content?.blocks ?? []
    setDraftMessage(messageFromBlocks(blocks))
    const signOff = blocks.find((b) => b.type === 'text' && b.content.startsWith('— '))
    if (signOff && signOff.type === 'text') {
      setSenderName(signOff.content.replace(/^— /, ''))
    }
  }, [isDelivery])

  const title = isDelivery
    ? sent
      ? 'Sent!'
      : 'One last thing'
    : 'Create your account'
  const subtitle = isDelivery
    ? sent
      ? `Your Inklings is on its way to ${recipientName || 'your friend'}.`
      : recipientName
        ? `We'll text your receipt to ${recipientName}.`
        : "We'll text your receipt."
    : 'For your password, use at least 8 chars, and a symbol'

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/find-friends')
  }

  const handleSendReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientPhone.trim()) return
    if (!supabase) {
      setError('Supabase not configured')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-recipt', {
        body: {
          recipientPhone: recipientPhone.trim(),
          senderName: senderName.trim() || 'someone',
          message: draftMessage || 'a little note',
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      clearDraft()
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-regular-semibold text-text-primary">{title}</h1>
        <p className="text-subheadline text-text-secondary mt-2">{subtitle}</p>

        {!isDelivery && (
          <form onSubmit={handleCreateAccount} className="mt-10 flex w-full flex-col gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First Name"
              className={inputClass}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Last Name"
              className={inputClass}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className={inputClass}
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className={inputClass}
            />

            <button
              type="submit"
              className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4"
            >
              Continue
            </button>
          </form>
        )}

        {isDelivery && !sent && (
          <form onSubmit={handleSendReceipt} className="mt-10 flex w-full flex-col gap-3">
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              required
              placeholder={recipientName ? `${recipientName}'s phone` : 'Recipient phone'}
              className={inputClass}
            />

            {error && <p className="text-mini text-fill-red">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4 disabled:opacity-40"
            >
              {submitting ? 'Sending…' : 'Send Inklings'}
            </button>
          </form>
        )}

        {isDelivery && sent && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-headline text-text-inverse bg-fill-primary rounded-md mt-10 w-full py-4"
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}
