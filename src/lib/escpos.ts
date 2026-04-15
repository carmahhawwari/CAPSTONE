import html2canvas from 'html2canvas'

// POS80 is 80mm wide, at 203 DPI that's ~576 dots
const PRINTER_WIDTH_DOTS = 576

const CAPTURE_ATTR = 'data-escpos-capture'

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

/**
 * Render a DOM element to a 1-bit bitmap ESC/POS buffer ready for the printer.
 * Returns a Uint8Array containing full ESC/POS commands (init, bitmap, cut).
 */
export async function renderToPrintBuffer(element: HTMLElement): Promise<Uint8Array> {
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
      },
    })

    // 2. Get pixel data and convert to 1-bit
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const mono = ditherFloydSteinberg(imageData)

    // 3. Build ESC/POS command buffer
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

/**
 * Floyd-Steinberg dithering: converts RGBA ImageData to a 1-bit array.
 * Returns a flat array where each value is 0 (white) or 1 (black).
 */
function ditherFloydSteinberg(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData
  // Convert to grayscale float buffer
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    // Luminance weights
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

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

  // GS v 0 — raster bit image command
  const gsv0 = new Uint8Array([
    0x1D, 0x76, 0x30, // GS v 0
    0x00,              // m = 0 (normal)
    bytesPerLine & 0xFF, (bytesPerLine >> 8) & 0xFF, // xL, xH
    height & 0xFF, (height >> 8) & 0xFF,             // yL, yH
  ])

  // Feed + partial cut
  const feed = new Uint8Array([0x1B, 0x64, 0x04]) // ESC d 4 — feed 4 lines
  const cut = new Uint8Array([0x1D, 0x56, 0x42, 0x00]) // GS V B 0 — partial cut

  // Concatenate all parts
  const total = init.length + gsv0.length + bitmapData.length + feed.length + cut.length
  const buffer = new Uint8Array(total)
  let offset = 0
  for (const part of [init, gsv0, bitmapData, feed, cut]) {
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
