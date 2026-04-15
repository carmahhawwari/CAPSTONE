import { useEffect, useRef, useState } from 'react'
import Receipt from '@/components/Receipt'
import { renderToPrintBuffer, bufferToBase64 } from '@/lib/escpos'
import type { DitherMethod } from '@/lib/escpos'
import { PRINT_SERVER_URL } from '@/lib/printBackend'
import { RECEIPTS } from '@/data/mock'
import type { Receipt as ReceiptType } from '@/types/app'

type Status = 'idle' | 'rendering' | 'sending' | 'done' | 'error'

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(out).set(bytes)
  return out
}

function ditherImageData(imageData: ImageData, method: DitherMethod): Uint8Array {
  const { width, height, data } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  const result = new Uint8Array(width * height)
  if (method === 'threshold') {
    for (let i = 0; i < gray.length; i++) result[i] = gray[i] < 128 ? 1 : 0
    return result
  }

  if (method === 'ordered') {
    const bayer4x4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ]
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const threshold = (bayer4x4[y % 4][x % 4] + 0.5) * (255 / 16)
        result[idx] = gray[idx] < threshold ? 1 : 0
      }
    }
    return result
  }

  if (method === 'atkinson') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const oldPixel = gray[idx]
        const newPixel = oldPixel < 128 ? 0 : 255
        result[idx] = newPixel === 0 ? 1 : 0
        const error = (oldPixel - newPixel) / 8

        if (x + 1 < width) gray[idx + 1] += error
        if (x + 2 < width) gray[idx + 2] += error
        if (y + 1 < height) {
          if (x - 1 >= 0) gray[(y + 1) * width + (x - 1)] += error
          gray[(y + 1) * width + x] += error
          if (x + 1 < width) gray[(y + 1) * width + (x + 1)] += error
        }
        if (y + 2 < height) gray[(y + 2) * width + x] += error
      }
    }
    return result
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const oldPixel = gray[idx]
      const newPixel = oldPixel < 128 ? 0 : 255
      result[idx] = newPixel === 0 ? 1 : 0
      const error = oldPixel - newPixel

      if (x + 1 < width) gray[idx + 1] += error * 7 / 16
      if (y + 1 < height) {
        if (x - 1 >= 0) gray[(y + 1) * width + (x - 1)] += error * 3 / 16
        gray[(y + 1) * width + x] += error * 5 / 16
        if (x + 1 < width) gray[(y + 1) * width + (x + 1)] += error * 1 / 16
      }
    }
  }

  return result
}

async function renderDitheredImageDataUrl(
  source: string,
  ditherMethod: DitherMethod,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Could not read image file'))
    img.src = source
  })

  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height)
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create image canvas')
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const mono = ditherImageData(imageData, ditherMethod)
  const out = ctx.createImageData(width, height)

  for (let i = 0; i < mono.length; i++) {
    const px = i * 4
    const val = mono[i] ? 0 : 255
    out.data[px] = val
    out.data[px + 1] = val
    out.data[px + 2] = val
    out.data[px + 3] = 255
  }

  ctx.putImageData(out, 0, 0)
  return canvas.toDataURL('image/png')
}

export default function TestPrintScreen() {
  const receiptRef = useRef<HTMLDivElement>(null)
  const livePreviewUrlRef = useRef<string | null>(null)
  const livePreviewRunRef = useRef(0)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [lastSize, setLastSize] = useState<number | null>(null)
  const [ditherMethod, setDitherMethod] = useState<DitherMethod>('floyd-steinberg')
  const [liveBitmapUrl, setLiveBitmapUrl] = useState<string | null>(null)
  const [livePreviewError, setLivePreviewError] = useState('')
  const [uploadedImageSource, setUploadedImageSource] = useState<string | null>(null)

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

  async function generatePreviewUrl(target: HTMLElement): Promise<string> {
    const buffer = await renderToPrintBuffer(target, { ditherMethod })
    const b64 = bufferToBase64(buffer)
    const res = await fetch(PRINT_SERVER_URL + '/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: b64,
    })

    if (!res.ok) {
      throw new Error(`Preview failed: ${res.status}`)
    }

    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }

  async function handleImageSelected(file: File | null) {
    if (!file) {
      setUploadedImageSource(null)
      setCustom({ ...custom, imageDataUrl: undefined })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setUploadedImageSource(result)
      }
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!uploadedImageSource) return

    let cancelled = false
    ;(async () => {
      try {
        const dithered = await renderDitheredImageDataUrl(uploadedImageSource, ditherMethod, 576, 320)
        if (cancelled) return
        setCustom((prev) => ({ ...prev, imageDataUrl: dithered }))
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [uploadedImageSource, ditherMethod])

  async function handlePrint() {
    if (!receiptRef.current) return

    setStatus('rendering')
    setError('')

    try {
      const buffer = await renderToPrintBuffer(receiptRef.current, { ditherMethod })
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
      const buffer = await renderToPrintBuffer(receiptRef.current, { ditherMethod })
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

    try {
      const url = await generatePreviewUrl(receiptRef.current)
      window.open(url, '_blank')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!receiptRef.current) return

    let cancelled = false
    const runId = ++livePreviewRunRef.current
    const timerId = window.setTimeout(async () => {
      if (!receiptRef.current) return
      try {
        const nextUrl = await generatePreviewUrl(receiptRef.current)
        if (cancelled || runId !== livePreviewRunRef.current) {
          URL.revokeObjectURL(nextUrl)
          return
        }

        if (livePreviewUrlRef.current) {
          URL.revokeObjectURL(livePreviewUrlRef.current)
        }
        livePreviewUrlRef.current = nextUrl
        setLiveBitmapUrl(nextUrl)
        setLivePreviewError('')
      } catch (e) {
        if (cancelled || runId !== livePreviewRunRef.current) return
        setLivePreviewError(e instanceof Error ? e.message : String(e))
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [selectedIdx, custom.to, custom.from, custom.prompt, custom.content, custom.imageDataUrl, ditherMethod])

  useEffect(() => {
    return () => {
      if (livePreviewUrlRef.current) {
        URL.revokeObjectURL(livePreviewUrlRef.current)
        livePreviewUrlRef.current = null
      }
    }
  }, [])

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

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">Dithering method</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            value={ditherMethod}
            onChange={(e) => setDitherMethod(e.target.value as DitherMethod)}
          >
            <option value="floyd-steinberg">Floyd-Steinberg (default)</option>
            <option value="atkinson">Atkinson</option>
            <option value="ordered">Ordered (Bayer 4x4)</option>
            <option value="threshold">Threshold (hard black/white)</option>
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
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-gray-600 block">Optional image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                onChange={(e) => handleImageSelected(e.target.files?.[0] ?? null)}
              />
              {custom.imageDataUrl && (
                <div className="space-y-2">
                  <img
                    src={custom.imageDataUrl}
                    alt="Selected attachment"
                    className="max-h-36 rounded border border-gray-200"
                  />
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    onClick={() => {
                      setUploadedImageSource(null)
                      setCustom({ ...custom, imageDataUrl: undefined })
                    }}
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
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

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Live bitmap preview (updates as you edit):</p>
          <div className="bg-white border border-gray-200 rounded p-2 min-h-24">
            {liveBitmapUrl ? (
              <img
                src={liveBitmapUrl}
                alt="Live printer bitmap preview"
                className="w-full h-auto border border-gray-200"
              />
            ) : (
              <p className="text-xs text-gray-500">Generating preview...</p>
            )}
          </div>
          {livePreviewError && <p className="text-xs text-red-600 mt-1">Live preview error: {livePreviewError}</p>}
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
          <p>2. Start the local print server in queue mode (recommended):</p>
          <code className="block bg-gray-50 p-2 rounded text-xs">node scripts/print-server.mjs Brightek_POS80</code>
          <p>3. Optional: direct device mode:</p>
          <code className="block bg-gray-50 p-2 rounded text-xs">node scripts/print-server.mjs /dev/cu.usbserial-1234</code>
          <p>4. Click <strong>Print</strong> above to send the receipt</p>
          <hr className="border-gray-200" />
          <p className="text-xs text-gray-400">
            <strong>Preview Bitmap</strong> renders the ESC/POS data back to a PNG so you can verify the dithering without wasting paper.
            <br />
            <strong>Download .bin</strong> saves the raw ESC/POS binary — you can send it manually: <code>lp -d Brightek_POS80 -o raw receipt.bin</code>
          </p>
        </div>
      </div>
    </div>
  )
}
