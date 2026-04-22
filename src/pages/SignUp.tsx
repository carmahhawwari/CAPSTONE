import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up with email/password
      await signUp(email, password)

      // If Supabase is configured, update profile with name
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({
              display_name: `${firstName} ${lastName}`,
            })
            .eq('id', user.id)
        }
      }

      navigate('/find-friends')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
      setLoading(false)
    }
  }

  const inputClass =
    'font-inter text-mini text-text-primary placeholder:text-text-tertiary border-fill-tertiary bg-bg-tertiary rounded-md w-full border px-4 py-4 focus:outline-none focus:border-fill-primary'

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
            className={inputClass}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
