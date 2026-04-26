import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { submitPrintJob } from '@/lib/printJob'
import type { Block } from '@/types/canvas'

type DeliveredReceipt = {
  id: string
  sender_name: string
  recipient_email: string
  content: { blocks: Block[]; prompt?: string }
  print_job_id: string | null
  printed_at: string | null
  created_at: string
}

export default function RecipientReceipt() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [receipt, setReceipt] = useState<DeliveredReceipt | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)
  const [printed, setPrinted] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    if (!supabase) {
      setLoadError('Supabase not configured')
      return
    }
    supabase
      .from('delivered_receipts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message)
          return
        }
        if (!data) {
          setLoadError('Receipt not found')
          return
        }
        setReceipt(data as unknown as DeliveredReceipt)
        if ((data as { printed_at?: string | null }).printed_at) setPrinted(true)
      })
  }, [id])

  const handlePrint = async () => {
    if (!receipt || !receiptRef.current) return
    setPrintError(null)
    setPrinting(true)
    try {
      const jobId = await submitPrintJob({
        receiptElement: receiptRef.current,
        recipientName: receipt.recipient_email.split('@')[0],
        messageText: messageFromBlocks(receipt.content.blocks),
      })
      if (supabase && !jobId.startsWith('local-')) {
        await (supabase.from('delivered_receipts' as never) as any)
          .update({ print_job_id: jobId, printed_at: new Date().toISOString() })
          .eq('id', receipt.id)
      }
      setPrinted(true)
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : 'Print failed')
    } finally {
      setPrinting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <p className="text-callout text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (loadError || !receipt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-regular-semibold text-text-primary">Receipt not found</h1>
          <p className="text-subheadline text-text-secondary mt-2">
            {loadError ?? 'This link may have expired.'}
          </p>
          <Link to="/" className="text-callout text-text-primary mt-6 inline-block underline">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  // Unauthenticated view: claim the receipt
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-callout text-text-secondary uppercase tracking-[0.2em]">📬 you've got mail</p>
          <h1 className="text-regular-semibold text-text-primary mt-3">
            {receipt.sender_name} sent you a message
          </h1>
          <p className="text-subheadline text-text-secondary mt-3">
            Make a quick Inklings account to read it and print it on the receipt printer.
          </p>
          <Link
            to={`/signup?next=${encodeURIComponent(`/r/${receipt.id}`)}`}
            className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 block w-full py-4"
          >
            Click to continue
          </Link>
          <Link
            to={`/login?next=${encodeURIComponent(`/r/${receipt.id}`)}`}
            className="text-callout text-text-secondary mt-4 inline-block"
          >
            I already have an account
          </Link>
        </div>
      </div>
    )
  }

  // Authenticated view: show receipt + print
  const dateStr = new Date(receipt.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-12 pb-8">
      <h1 className="text-regular-semibold text-text-primary text-center">
        From {receipt.sender_name}
      </h1>

      <div className="flex flex-1 items-center justify-center py-6">
        <div
          ref={receiptRef}
          className="w-full max-w-sm"
          style={{
            backgroundColor: '#fbf6e6',
            border: '1px solid #969696',
            fontFamily: 'Georgia, serif',
          }}
        >
          <div style={{ borderBottom: '2px solid #1a1a1a', padding: '16px', textAlign: 'center', fontSize: 18 }}>
            {dateStr}
          </div>
          <div style={{ borderBottom: '2px solid #1a1a1a', padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
            From: {receipt.sender_name}
          </div>
          <div style={{ padding: '16px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {receipt.content.blocks.map((b, i) => {
              if (b.type === 'text') {
                return (
                  <p key={i} style={{ margin: '0 0 12px' }}>
                    {b.content}
                  </p>
                )
              }
              if (b.type === 'image') {
                return (
                  <img
                    key={i}
                    src={b.dataUrl}
                    alt=""
                    style={{ width: '100%', display: 'block', marginBottom: 12 }}
                  />
                )
              }
              return null
            })}
          </div>
          <div style={{ borderTop: '2px solid #1a1a1a', padding: '16px', fontSize: 14 }}>
            Love,
            <br />
            {receipt.sender_name}
          </div>
        </div>
      </div>

      {printError && <p className="text-mini text-fill-red mt-2 text-center">{printError}</p>}

      <button
        type="button"
        onClick={handlePrint}
        disabled={printing || printed}
        className="text-headline text-text-inverse bg-fill-primary rounded-md w-full py-4 disabled:opacity-50"
      >
        {printed ? 'Printed' : printing ? 'Printing…' : 'Print on the Inklings printer'}
      </button>

      <button
        type="button"
        onClick={() => navigate('/home')}
        className="text-callout text-text-secondary mt-4 w-full text-center"
      >
        Done
      </button>
    </div>
  )
}

function messageFromBlocks(blocks: Block[]): string {
  return blocks
    .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
    .map((b) => b.content)
    .filter(Boolean)
    .join('\n')
    .trim()
}
