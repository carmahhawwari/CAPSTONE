import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { submitPrintJob } from '@/lib/printJob'
import type { Block, TextStyle } from '@/types/canvas'
import { FONT_STYLES } from '@/types/canvas'

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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [receipt, setReceipt] = useState<DeliveredReceipt | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)
  const [printed, setPrinted] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const shouldAutoPrint = searchParams.get('print') === 'true'

  useEffect(() => {
    if (authLoading) return
    if (!id) return

    // If user is not logged in, don't try to load
    if (!user?.email) {
      setLoadError('Not authenticated')
      return
    }

    if (!supabase) {
      setLoadError('Supabase not configured')
      return
    }

    supabase
      .from('delivered_receipts')
      .select('*')
      .eq('id', id)
      .eq('recipient_email', user.email)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error) {
          setLoadError(error.message)
          return
        }
        if (!data) {
          setLoadError('Receipt not found')
          return
        }
        try {
          const parsed: DeliveredReceipt = {
            ...data,
            content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
          }
          setReceipt(parsed)
          if (data.printed_at) setPrinted(true)
        } catch (err) {
          setLoadError('Failed to parse receipt data: ' + (err instanceof Error ? err.message : String(err)))
        }
      })
  }, [id, user?.email, authLoading])

  const handlePrint = async () => {
    if (!receipt || !receiptRef.current) return
    setPrintError(null)
    setPrinting(true)
    try {
      const receiptState = {
        blocks: receipt.content.blocks,
        currentPrompt: receipt.content.prompt || 'No prompt',
        headerVariant: 'simple',
      }
      const jobId = await submitPrintJob({
        receiptElement: receiptRef.current,
        recipientName: receipt.recipient_email.split('@')[0],
        recipientEmail: receipt.recipient_email,
        messageText: messageFromBlocks(receipt.content.blocks),
        receiptStateJson: JSON.stringify(receiptState),
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

  // Auto-print when page loads with print=true parameter
  useEffect(() => {
    if (receipt && receiptRef.current && shouldAutoPrint && !printing && !printed) {
      handlePrint()
    }
  }, [receipt, shouldAutoPrint, printing, printed])

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

  const dateStr = new Date(receipt.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm text-center"
      >
        <p className="text-callout text-text-secondary uppercase tracking-[0.2em]">📬 you've got mail</p>
        <h1 className="text-regular-semibold text-text-primary mt-3 leading-tight">
          {receipt.sender_name} has sent you an inkling.
        </h1>
        <p className="text-subheadline text-text-secondary mt-3">
          Head to onCall to receive your message.
        </p>

        {printError && <p className="text-mini text-fill-red mt-4">{printError}</p>}

        <button
          type="button"
          onClick={handlePrint}
          disabled={printing || printed}
          className="text-headline text-text-inverse bg-fill-primary rounded-md mt-8 w-full py-4 disabled:opacity-50"
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
      </motion.div>

      {/* Hidden receipt — kept in DOM so html2canvas can rasterize it for the print job. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: 0,
          height: 0,
          opacity: 0,
          overflow: 'hidden',
        }}
      >
        <div
          ref={receiptRef}
          style={{ fontFamily: 'Georgia, serif', padding: '16px 20px', backgroundColor: '#ffffff', color: '#222121', position: 'relative', width: '576px' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', marginTop: '12px' }}>
            <img src="/src/assets/icons/header-logo.svg" alt="Inklings" style={{ height: '64px', width: 'auto' }} />
          </div>

          {/* Recipient Bar */}
          <svg width="100%" height="20" viewBox="0 0 100 20" style={{ marginBottom: '12px', display: 'block', backgroundColor: 'white' }} preserveAspectRatio="none">
            <path d="M0,8 Q25,2 50,8 T100,8 L100,18 Q75,20 50,18 T0,18 Z" fill="black" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', marginTop: '8px', fontFamily: "'Printvetica', 'Inter Variable', sans-serif", fontSize: '32px', color: '#222121', lineHeight: 1.5 }}>
            <span>From: {receipt.sender_name}</span>
            <span>{dateStr}</span>
          </div>

          {/* Current Prompt */}
          {receipt.content.prompt && receipt.content.prompt !== 'No prompt' && (
            <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.5 }}>
              {receipt.content.prompt}
            </div>
          )}

          {/* Render blocks */}
          <div style={{ marginBottom: '16px' }}>
            {receipt.content.blocks.map((block: Block, i: number) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                {block.type === 'text' && (
                  <div
                    style={{
                      ...FONT_STYLES[block.style as TextStyle],
                      fontSize: `${FONT_STYLES[block.style as TextStyle].fontSize * (block.fontSizeMultiplier ?? 1) * 2.5}px`,
                      fontWeight: block.fontWeight ?? FONT_STYLES[block.style as TextStyle].fontWeight,
                      fontStyle: block.isItalic ? 'italic' : 'normal',
                      textDecoration: block.isBold ? 'underline' : 'none',
                      color: '#1f2937',
                      lineHeight: 1.6,
                    }}
                  >
                    {block.content}
                  </div>
                )}
                {block.type === 'image' && (
                  <img src={block.dataUrl} alt="block" style={{ maxWidth: '100%', marginBottom: '8px' }} />
                )}
                {block.type === 'sticker' && (
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>[sticker]</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid #000', padding: '16px', fontSize: '24px' }}>
            Love,
            <br />
            {receipt.sender_name}
          </div>
        </div>
      </div>
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
