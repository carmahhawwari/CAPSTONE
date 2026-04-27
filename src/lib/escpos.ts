import html2canvas from 'html2canvas'

// POS80 is 80mm wide, at 203 DPI that's ~576 dots
const PRINTER_WIDTH_DOTS = 576

const CAPTURE_ATTR = 'data-escpos-capture'

export type DitherMethod = 'floyd-steinberg' | 'atkinson' | 'ordered' | 'threshold'

export interface CornerStickerData {
  imageUrl: string
  offsetX: number
  offsetY: number
  rotation: number
  scale: number
}

interface RenderToPrintOptions {
  ditherMethod?: DitherMethod
  cornerSticker?: CornerStickerData
}

function inlineComputedStyles(sourceRoot: HTMLElement, clonedRoot: HTMLElement): void {
  const sourceNodes = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>('*'))]
  const clonedNodes = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll<HTMLElement>('*'))]

  const count = Math.min(sourceNodes.length, clonedNodes.length)
  for (let i = 0; i < count; i++) {
    const source = sourceNodes[i]
    const target = clonedNodes[i]
    const computed = window.getComputedStyle(source)
    for (let j = 0; j < computed.length; j++) {
      const prop = computed.item(j)
      target.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop))
    }
    target.removeAttribute('class')
  }
}

function applyCaptureStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style')
  style.setAttribute('data-escpos-capture-style', 'true')
  style.textContent = `
[${CAPTURE_ATTR}],
[${CAPTURE_ATTR}] * {
  color: #111827 !important;
  background-color: #ffffff !important;
  border-color: #d1d5db !important;
  outline-color: #d1d5db !important;
  text-shadow: none !important;
  box-shadow: none !important;
}
`
  doc.head.appendChild(style)
  return style
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * Render a DOM element to a 1-bit bitmap ESC/POS buffer ready for the printer.
 * Returns a Uint8Array containing full ESC/POS commands (init, bitmap, cut).
 */
export async function renderToPrintBuffer(
  element: HTMLElement,
  options: RenderToPrintOptions = {},
): Promise<Uint8Array> {
  const previousCaptureAttr = element.getAttribute(CAPTURE_ATTR)
  const captureStyle = applyCaptureStyle(document)
  const captureId = Math.random().toString(36).slice(2)
  element.setAttribute(CAPTURE_ATTR, captureId)

  const cssWidth = Math.max(1, Math.round(element.getBoundingClientRect().width))
  const scale = PRINTER_WIDTH_DOTS / cssWidth

  try {
    // 1. Rasterize DOM to canvas at 576-dot effective width
    const canvas = await html2canvas(element, {
      width: cssWidth,
      scale,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector<HTMLElement>(`[${CAPTURE_ATTR}="${captureId}"]`)
        if (!clonedElement) return

        inlineComputedStyles(element, clonedElement)
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove())

        // Remove all class attributes to prevent oklch color parsing errors
        clonedElement.removeAttribute('class')
        clonedElement.querySelectorAll('[class]').forEach((node) => {
          node.removeAttribute('class')
        })
      },
    })

    // 2. Get pixel data and convert receipt to 1-bit (dither before sticker)
    let ctx = canvas.getContext('2d')!
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const mono = ditherImage(imageData, options.ditherMethod ?? 'floyd-steinberg')

    // 3. If corner sticker provided, composite it onto the 1-bit image
    if (options.cornerSticker) {
      try {
        console.log('[escpos] Loading corner sticker:', options.cornerSticker.imageUrl.substring(0, 50))
        const stickerImg = await loadImage(options.cornerSticker.imageUrl)
        console.log('[escpos] Sticker loaded:', stickerImg.width, 'x', stickerImg.height)

        // Calculate sticker position and size
        const stickerX = Math.round(options.cornerSticker.offsetX * scale)
        const stickerY = Math.round(options.cornerSticker.offsetY * scale)
        const stickerWidth = Math.round(stickerImg.width * options.cornerSticker.scale)
        const stickerHeight = Math.round(stickerImg.height * options.cornerSticker.scale)

        console.log('[escpos] Canvas:', canvas.width, 'x', canvas.height)
        console.log('[escpos] Drawing sticker at x:', stickerX, 'y:', stickerY, 'w:', stickerWidth, 'h:', stickerHeight, 'rot:', options.cornerSticker.rotation)

        // Draw sticker to temp canvas for dithering
        const stickerCanvas = document.createElement('canvas')
        stickerCanvas.width = stickerWidth
        stickerCanvas.height = stickerHeight
        const stickerCtx = stickerCanvas.getContext('2d')!

        // Draw with rotation
        stickerCtx.save()
        stickerCtx.translate(stickerWidth / 2, stickerHeight / 2)
        stickerCtx.rotate((options.cornerSticker.rotation * Math.PI) / 180)
        stickerCtx.drawImage(stickerImg, -stickerWidth / 2, -stickerHeight / 2, stickerWidth, stickerHeight)
        stickerCtx.restore()

        // Dither the sticker separately
        const stickerImageData = stickerCtx.getImageData(0, 0, stickerWidth, stickerHeight)
        const stickerMono = ditherImage(stickerImageData, 'floyd-steinberg')

        // Composite dithered sticker onto the receipt mono image
        for (let y = 0; y < stickerHeight; y++) {
          for (let x = 0; x < stickerWidth; x++) {
            const destX = stickerX + x
            const destY = stickerY + y
            if (destX >= 0 && destX < canvas.width && destY >= 0 && destY < canvas.height) {
              const srcIdx = y * stickerWidth + x
              const destIdx = destY * canvas.width + destX
              // Use sticker pixel if it's black (1)
              if (stickerMono[srcIdx]) {
                mono[destIdx] = 1
              }
            }
          }
        }
        console.log('[escpos] Sticker composited successfully')
      } catch (err) {
        console.error('[escpos] Failed to composite corner sticker:', err)
      }
    }

    // 4. Build ESC/POS command buffer
    return buildEscPosBuffer(mono, canvas.width, canvas.height)
  } finally {
    captureStyle.remove()
    if (previousCaptureAttr === null) {
      element.removeAttribute(CAPTURE_ATTR)
    } else {
      element.setAttribute(CAPTURE_ATTR, previousCaptureAttr)
    }
  }
}

function toGrayscaleFloat(imageData: ImageData): Float32Array {
  const { data } = imageData
  const gray = new Float32Array(imageData.width * imageData.height)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }
  return gray
}

function ditherImage(imageData: ImageData, method: DitherMethod): Uint8Array {
  switch (method) {
    case 'threshold':
      return ditherThreshold(imageData)
    case 'ordered':
      return ditherOrdered(imageData)
    case 'atkinson':
      return ditherAtkinson(imageData)
    case 'floyd-steinberg':
    default:
      return ditherFloydSteinberg(imageData)
  }
}

function ditherThreshold(imageData: ImageData): Uint8Array {
  const gray = toGrayscaleFloat(imageData)
  const result = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    result[i] = gray[i] < 128 ? 1 : 0
  }
  return result
}

function ditherOrdered(imageData: ImageData): Uint8Array {
  const { width, height } = imageData
  const gray = toGrayscaleFloat(imageData)
  const result = new Uint8Array(gray.length)
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

function ditherAtkinson(imageData: ImageData): Uint8Array {
  const { width, height } = imageData
  const gray = toGrayscaleFloat(imageData)
  const result = new Uint8Array(width * height)

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
      if (y + 2 < height) {
        gray[(y + 2) * width + x] += error
      }
    }
  }

  return result
}

/**
 * Floyd-Steinberg dithering: converts RGBA ImageData to a 1-bit array.
 * Returns a flat array where each value is 0 (white) or 1 (black).
 */
function ditherFloydSteinberg(imageData: ImageData): Uint8Array {
  const { width, height } = imageData
  const gray = toGrayscaleFloat(imageData)

  const result = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const oldPixel = gray[idx]
      const newPixel = oldPixel < 128 ? 0 : 255
      result[idx] = newPixel === 0 ? 1 : 0 // 1 = black dot, 0 = white
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

/**
 * Build an ESC/POS binary buffer using GS v 0 (raster bit image).
 *
 * Command format: GS v 0 m xL xH yL yH [data]
 *   - m = 0 (normal mode)
 *   - xL/xH = bytes per line (width / 8) as little-endian 16-bit
 *   - yL/yH = number of lines as little-endian 16-bit
 *   - data = packed 1-bit pixels, MSB first, 1 = black
 */
function buildEscPosBuffer(mono: Uint8Array, width: number, height: number): Uint8Array {
  const bytesPerLine = Math.ceil(width / 8)
  const chunkHeight = 48

  // Pack 1-bit pixels into bytes (MSB = leftmost pixel)
  const bitmapData = new Uint8Array(bytesPerLine * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mono[y * width + x]) {
        const byteIdx = y * bytesPerLine + Math.floor(x / 8)
        const bitIdx = 7 - (x % 8)
        bitmapData[byteIdx] |= (1 << bitIdx)
      }
    }
  }

  // ESC @ — initialize printer
  const init = new Uint8Array([0x1B, 0x40])

  // Many thermal printers are more stable when raster data is sent in smaller vertical chunks.
  const chunks: Uint8Array[] = []
  for (let startY = 0; startY < height; startY += chunkHeight) {
    const thisChunkHeight = Math.min(chunkHeight, height - startY)
    const gsv0 = new Uint8Array([
      0x1D, 0x76, 0x30, // GS v 0
      0x00, // m = 0 (normal)
      bytesPerLine & 0xFF,
      (bytesPerLine >> 8) & 0xFF,
      thisChunkHeight & 0xFF,
      (thisChunkHeight >> 8) & 0xFF,
    ])

    const chunkBytes = new Uint8Array(bytesPerLine * thisChunkHeight)
    const from = startY * bytesPerLine
    const to = from + chunkBytes.length
    chunkBytes.set(bitmapData.subarray(from, to))

    chunks.push(gsv0, chunkBytes)
  }

  // Feed + partial cut
  const feed = new Uint8Array([0x1B, 0x64, 0x04]) // ESC d 4 — feed 4 lines
  const cut = new Uint8Array([0x1D, 0x56, 0x42, 0x00]) // GS V B 0 — partial cut

  // Concatenate all parts
  const chunkTotal = chunks.reduce((sum, part) => sum + part.length, 0)
  const total = init.length + chunkTotal + feed.length + cut.length
  const buffer = new Uint8Array(total)
  let offset = 0
  for (const part of [init, ...chunks, feed, cut]) {
    buffer.set(part, offset)
    offset += part.length
  }

  return buffer
}

/**
 * Convert the print buffer to a base64 string for sending via Supabase.
 */
export function bufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}
