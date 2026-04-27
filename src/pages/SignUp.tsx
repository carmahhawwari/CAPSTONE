import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { clearDraft, loadDraft } from '@/lib/onboardingDraft'

async function deliverDraftAsEmail(senderName: string): Promise<void> {
  if (!supabase) return
  const draft = loadDraft()
  if (!draft.recipient?.name || !draft.content) return

  const recipientEmail = `${draft.recipient.name}@stanford.edu`

  try {
    const { data, error } = await supabase.functions.invoke('send-recipt-email', {
      body: {
        recipientEmail,
        senderName,
        content: draft.content,
      },
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
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next')
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

      if (nextPath) {
        navigate(nextPath)
      } else if (isOnboardingDeliver) {
        navigate('/onboard/sent')
      } else {
        navigate('/home')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fill-primary'

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
            className="w-full px-4 py-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fill-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 mt-4 bg-fill-primary text-white rounded-md font-medium hover:opacity-80 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-text-secondary">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-fill-primary font-medium hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
