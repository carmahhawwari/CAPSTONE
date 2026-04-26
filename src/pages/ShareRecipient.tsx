import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ShareRecipient() {
  const navigate = useNavigate()
  const [sunet, setSunet] = useState('')

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    const id = sunet.trim().toLowerCase()
    if (!id) return
    const email = `${id}@stanford.edu`
    navigate(`/compose?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-regular-semibold text-text-primary">
          Who do you want to send this to?
        </h1>

        <form onSubmit={handleContinue} className="mt-10 flex w-full flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={sunet}
              onChange={(e) => setSunet(e.target.value.toLowerCase())}
              required
              placeholder="Enter SUNet ID"
              className="font-inter text-mini text-text-primary placeholder:text-text-tertiary border-fill-tertiary bg-bg-tertiary rounded-md w-full border px-4 py-4 pr-32 focus:outline-none focus:border-fill-primary"
              autoFocus
            />
            <span className="text-callout text-text-tertiary absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              @stanford.edu
            </span>
          </div>

          <button
            type="submit"
            className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="text-callout text-text-secondary mt-2 w-full text-center"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
