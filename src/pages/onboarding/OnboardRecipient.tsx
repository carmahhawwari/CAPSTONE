import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDraft, saveDraft, clearDraft } from '@/lib/onboardingDraft'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import PageTransition from '@/components/PageTransition'

export default function OnboardRecipient() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sunet, setSunet] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sunet.trim()) return

    setSending(true)
    setError('')

    const recipientEmail = `${sunet.trim().toLowerCase()}@stanford.edu`
    saveDraft({ recipient: { name: sunet.trim().toLowerCase(), phone: recipientEmail } })

    const currentDraft = loadDraft()
    if (!currentDraft.content) {
      setError('No receipt content found. Please go back and compose your message.')
      setSending(false)
      return
    }

    try {
      const senderName = user?.user_metadata?.display_name || 'A friend'

      if (supabase) {
        const { error: invokeErr } = await supabase.functions.invoke('send-recipt-email', {
          body: {
            recipientEmail,
            senderName,
            content: currentDraft.content,
          },
        })
        if (invokeErr) throw invokeErr
      }

      clearDraft()
      navigate('/onboard/sent')
    } catch (err) {
      console.warn('Send failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to send. Please try again.')
      setSending(false)
    }
  }

  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-black">
          Who do you want to send this to?
        </h1>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="mt-10 flex w-full flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={sunet}
              onChange={(e) => setSunet(e.target.value.toLowerCase())}
              required
              placeholder="Enter SUNet ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black pr-32"
              autoFocus
              disabled={sending}
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              @stanford.edu
            </span>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="bg-black text-white font-semibold rounded-lg mt-8 w-full py-3 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Inkling'}
          </button>
        </form>
      </div>
    </PageTransition>
  )
}
