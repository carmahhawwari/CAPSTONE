import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDraft, saveDraft } from '@/lib/onboardingDraft'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Who do you want to send this to?
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Just a name for now — you can add their number at the end.
        </p>

        <form onSubmit={handleContinue} className="mt-10 flex w-full flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Their name"
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            autoFocus
          />

          <button
            type="submit"
            className="bg-black text-white font-semibold rounded-md mt-8 w-full py-4"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
