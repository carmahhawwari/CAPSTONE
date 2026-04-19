import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Auth bypassed — advance to home.
    navigate('/home')
  }

  const inputClass =
    'font-inter text-mini text-text-primary placeholder:text-text-tertiary border-fill-tertiary bg-bg-tertiary rounded-md w-full border px-4 py-4 focus:outline-none focus:border-fill-primary'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-regular-semibold text-text-primary">Log in</h1>
        <p className="text-subheadline text-text-secondary mt-2">
          Enter your email and password to log back into your account
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex w-full flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className={inputClass}
          />

          <button
            type="submit"
            className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4"
          >
            Continue
          </button>

          <Link
            to="/forgot-password"
            className="text-subheadline text-text-primary mt-3 self-center underline"
          >
            Forgot password?
          </Link>
        </form>
      </div>
    </div>
  )
}
