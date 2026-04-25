import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDraft, saveDraft } from '@/lib/onboardingDraft'

const inputClass =
  'font-inter text-mini text-text-primary placeholder:text-text-tertiary border-fill-tertiary bg-bg-tertiary rounded-md w-full border px-4 py-4 focus:outline-none focus:border-fill-primary'

export default function OnboardRecipient() {
  const navigate = useNavigate()
  const [name, setName] = useState(() => loadDraft().recipient?.name ?? '')

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const existingPhone = loadDraft().recipient?.phone ?? ''
    saveDraft({ recipient: { name: name.trim(), phone: existingPhone } })
    navigate('/onboard/compose')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-regular-semibold text-text-primary">
          Who do you want to send this to?
        </h1>
        <p className="text-subheadline text-text-secondary mt-2">
          Just a name for now — you can add their number at the end.
        </p>

        <form onSubmit={handleContinue} className="mt-10 flex w-full flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Their name"
            className={inputClass}
            autoFocus
          />

          <button
            type="submit"
            className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
