import { useRef, useState } from 'react'
import Receipt from '@/components/Receipt'
import { renderToPrintBuffer, bufferToBase64 } from '@/lib/escpos'
import { PRINT_SERVER_URL } from '@/lib/printBackend'
import { RECEIPTS } from '@/data/mock'
import type { Receipt as ReceiptType } from '@/types/app'

type Status = 'idle' | 'rendering' | 'sending' | 'done' | 'error'

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(out).set(bytes)
  return out
}

export default function TestPrintScreen() {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [lastSize, setLastSize] = useState<number | null>(null)

  // Editable custom receipt
  const [custom, setCustom] = useState<ReceiptType>({
    id: 'test',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    to: 'Test Friend',
    from: 'Test User',
    prompt: 'What made you smile today?',
    content: 'This is a test receipt for the thermal printer. If you can read this, ESC/POS bitmap printing is working!',
    friendId: 'test',
  })

  const useCustom = selectedIdx === -1
  const receipt = useCustom ? custom : RECEIPTS[selectedIdx]

  async function handlePrint() {
    if (!receiptRef.current) return

    setStatus('rendering')
    setError('')

    try {
      const buffer = await renderToPrintBuffer(receiptRef.current)
      setLastSize(buffer.length)
      setStatus('sending')

      const res = await fetch(PRINT_SERVER_URL + '/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: toArrayBuffer(buffer),
      })

      if (!res.ok) {
        throw new Error(`Print server returned ${res.status}: ${await res.text()}`)
      }

      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  async function handleDownload() {
    if (!receiptRef.current) return

    setStatus('rendering')
    setError('')

    try {
      const buffer = await renderToPrintBuffer(receiptRef.current)
      setLastSize(buffer.length)

      const blob = new Blob([toArrayBuffer(buffer)], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'receipt.bin'
      a.click()
      URL.revokeObjectURL(url)

      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  async function handlePreview() {
    if (!receiptRef.current) return

    setStatus('rendering')
    setError('')

    try {
      const buffer = await renderToPrintBuffer(receiptRef.current)
      setLastSize(buffer.length)
      const b64 = bufferToBase64(buffer)

      const res = await fetch(PRINT_SERVER_URL + '/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: b64,
      })

      if (!res.ok) {
        throw new Error(`Preview failed: ${res.status}`)
      }

      // Response is a PNG — open in new tab
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')

      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  const statusLabel: Record<Status, string> = {
    idle: '',
    rendering: 'Rendering bitmap...',
    sending: 'Sending to printer...',
    done: `Sent${lastSize ? ` (${(lastSize / 1024).toFixed(1)} KB)` : ''}`,
    error: `Error: ${error}`,
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Printer Test</h1>
        <p className="text-sm text-gray-500 mb-6">
          ESC/POS bitmap test — POS80 @ 576 dots wide
        </p>

        {/* Receipt selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">Receipt</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
          >
            <option value={-1}>Custom (editable)</option>
            {RECEIPTS.map((r, i) => (
              <option key={r.id} value={i}>
                {r.date} — {r.from} → {r.to}
              </option>
            ))}
          </select>
        </div>

        {/* Custom receipt editor */}
        {useCustom && (
          <div className="mb-4 space-y-2 bg-white border border-gray-200 rounded p-4">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="To"
                value={custom.to}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
              />
              <input
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="From"
                value={custom.from}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
              />
            </div>
            <input
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="Prompt (optional)"
              value={custom.prompt ?? ''}
              onChange={(e) => setCustom({ ...custom, prompt: e.target.value || undefined })}
            />
            <textarea
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              rows={4}
              placeholder="Content"
              value={custom.content}
              onChange={(e) => setCustom({ ...custom, content: e.target.value })}
            />
          </div>
        )}

        {/* Preview: the actual Receipt component that will be rasterized */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Receipt preview (this DOM element gets rasterized):</p>
          <div
            ref={receiptRef}
            style={{ width: '80mm', maxWidth: '100%', background: 'white' }}
          >
            <Receipt receipt={receipt} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handlePrint}
            disabled={status === 'rendering' || status === 'sending'}
            className="px-4 py-2 bg-orange-500 text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            Print
          </button>
          <button
            onClick={handlePreview}
            disabled={status === 'rendering' || status === 'sending'}
            className="px-4 py-2 bg-gray-700 text-white rounded font-medium text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            Preview Bitmap
          </button>
          <button
            onClick={handleDownload}
            disabled={status === 'rendering' || status === 'sending'}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium text-sm hover:bg-gray-300 disabled:opacity-50"
          >
            Download .bin
          </button>
        </div>

        {/* Status */}
        {status !== 'idle' && (
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : status === 'done' ? 'text-green-600' : 'text-gray-500'}`}>
            {statusLabel[status]}
          </p>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white border border-gray-200 rounded p-4 text-sm text-gray-600 space-y-3">
          <h2 className="font-semibold text-gray-800">Setup</h2>
          <p>1. Plug the POS80 into your Mac via USB</p>
          <p>2. Find the device path:</p>
          <code className="block bg-gray-50 p-2 rounded text-xs">ls /dev/usb/lp* 2&gt;/dev/null || ls /dev/cu.* | grep -i pos</code>
          <p>3. Start the local print server:</p>
          <code className="block bg-gray-50 p-2 rounded text-xs">node scripts/print-server.mjs /dev/usb/lp0</code>
          <p>4. Click <strong>Print</strong> above to send the receipt</p>
          <hr className="border-gray-200" />
          <p className="text-xs text-gray-400">
            <strong>Preview Bitmap</strong> renders the ESC/POS data back to a PNG so you can verify the dithering without wasting paper.
            <br />
            <strong>Download .bin</strong> saves the raw ESC/POS binary — you can send it manually: <code>cat receipt.bin &gt; /dev/usb/lp0</code>
          </p>
        </div>
      </div>
    </div>
  )
}
