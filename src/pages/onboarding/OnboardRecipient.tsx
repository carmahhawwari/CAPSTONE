import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDraft, saveDraft, clearDraft } from '@/lib/onboardingDraft'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import PageTransition from '@/components/PageTransition'
import SendingAnimation from '@/components/SendingAnimation'

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

    const minDelay = new Promise((r) => setTimeout(r, 3000))

    try {
      let senderName = user?.user_metadata?.display_name || user?.email || 'A friend'

      if (supabase && user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', user.id)
            .single()

          if (profile?.display_name) {
            senderName = profile.display_name
          } else if (profile?.username) {
            senderName = profile.username
          }
        } catch (e) {
          console.log('Could not fetch sender display name, falling back to:', senderName)
        }
      }

      const sendRequest = supabase
        ? supabase.functions
            .invoke('send-recipt-email', {
              body: {
                recipientEmail,
                senderName,
                content: currentDraft.content,
              },
            })
            .then(({ error: invokeErr }) => {
              if (invokeErr) throw invokeErr
            })
        : Promise.resolve()

      await Promise.all([sendRequest, minDelay])

      clearDraft()
      navigate('/onboard/sent')
    } catch (err) {
      console.warn('Send failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to send. Please try again.')
      setSending(false)
    }
  }

  if (sending) {
    return (
      <PageTransition className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="h-full max-h-[80vh] w-full max-w-md">
          <SendingAnimation />
        </div>
      </PageTransition>
    )
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
            className="bg-black text-white font-semibold rounded-md mt-8 flex w-full h-14 items-center justify-center disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Inkling'}
          </button>
        </form>
      </div>
    </PageTransition>
  )
}
