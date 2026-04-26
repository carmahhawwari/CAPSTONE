import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { clearDraft, loadDraft } from '@/lib/onboardingDraft'
import type { Block } from '@/types/canvas'

function messageFromBlocks(blocks: Block[]): string {
  return blocks
    .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
    .map((b) => b.content)
    .filter(Boolean)
    .join('\n')
    .trim()
}

async function deliverDraftAsEmail(senderName: string): Promise<void> {
  if (!supabase) return
  const draft = loadDraft()
  if (!draft.recipient?.name || !draft.content) return

  const recipientEmail = `${draft.recipient.name}@stanford.edu`
  const message = messageFromBlocks(draft.content.blocks) || 'a little note'

  try {
    const { data, error } = await supabase.functions.invoke('send-recipt-email', {
      body: { recipientEmail, senderName, message },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    clearDraft()
  } catch (err) {
    // Don't block signup if delivery fails — log for the dev console.
    console.warn('Receipt email delivery failed:', err)
  }
}

export default function SignUp() {
  const { signUp } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isOnboardingDeliver = location.pathname.startsWith('/onboard/deliver')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up with email/password
      await signUp(email, password)

      // If Supabase is configured, create/update profile with name
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const username = email.split('@')[0]
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username,
              display_name: `${firstName} ${lastName}`,
            })
        }
      }

      // If this signup is part of the onboarding flow, fire the receipt email.
      if (isOnboardingDeliver) {
        await deliverDraftAsEmail(`${firstName} ${lastName}`.trim() || 'A friend')
      }

      navigate('/onboard/verify-email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-regular-semibold text-text-primary">
          Create your account
        </h1>
        <p className="text-subheadline text-text-secondary mt-2">
          For your password, use at least 8 chars, and a symbol
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full flex-col gap-3"
        >
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="First Name"
            className={inputClass}
            disabled={loading}
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Last Name"
            className={inputClass}
            disabled={loading}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className={inputClass}
            disabled={loading}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password (8+ chars)"
            className={inputClass}
            disabled={loading}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 mt-4 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
