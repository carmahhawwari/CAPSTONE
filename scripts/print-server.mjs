#!/usr/bin/env node
/**
 * Local ESC/POS print server for testing.
 *
 * Usage:
 *   node scripts/print-server.mjs [device_path]
 *
 * Examples:
 *   node scripts/print-server.mjs /dev/usb/lp0
 *   node scripts/print-server.mjs /dev/cu.usbserial-1234
 *   node scripts/print-server.mjs              # dry-run mode (no printer)
 *
 * Endpoints:
 *   POST /print    — send raw ESC/POS bytes to the printer
 *   POST /preview  — receive base64 ESC/POS, return a PNG of the decoded bitmap
 *   GET  /status   — health check
 */

import { createServer } from 'node:http'
import { access, writeFile, open } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createCanvas } from './canvas-shim.mjs'

const PORT = 9100
const PRINTER_WIDTH_DOTS = 576
const execFileAsync = promisify(execFile)

async function pathExists(path) {
  try {
    await access(path, fsConstants.W_OK)
    return true
  } catch {
    return false
  }
}

async function discoverDevicePath(requestedPath) {
  if (requestedPath && (await pathExists(requestedPath))) {
    return requestedPath
  }

  const candidates = [
    '/dev/usb/lp0',
    '/dev/usb/lp1',
    '/dev/cu.usbserial',
    '/dev/cu.usbmodem',
    '/dev/cu.usb',
  ]

  for (const candidate of candidates) {
    if (candidate.endsWith('*')) continue
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  try {
    const { stdout } = await execFileAsync('sh', ['-lc', 'ls /dev/cu.* /dev/tty.* 2>/dev/null | grep -iE "usb|serial|modem|printer|pos|brightek" | head -n 1'])
    const discovered = stdout.trim()
    if (discovered && (await pathExists(discovered))) {
      return discovered
    }
  } catch {
    // ignore and fall through to dry-run
  }

  return null
}

const requestedDevicePath = process.argv[2] || null
const devicePathPromise = discoverDevicePath(requestedDevicePath)

if (!requestedDevicePath) {
  console.log('⚠  No device path provided — attempting auto-discovery (falls back to dry-run)')
  console.log('   Usage: node scripts/print-server.mjs /dev/cu.usbserial-1234\n')
}

const server = createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/status') {
    const devicePath = await devicePathPromise
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, device: devicePath, mode: devicePath ? 'live' : 'dry-run' }))
    return
  }

  if (req.method === 'POST' && req.url === '/print') {
    try {
      const devicePath = await devicePathPromise
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const data = Buffer.concat(chunks)

      console.log(`Received ${data.length} bytes`)

      if (devicePath) {
        const fd = await open(devicePath, 'w')
        await fd.write(data)
        await fd.close()
        console.log(`Sent to ${devicePath}`)
      } else {
        await writeFile('last-print.bin', data)
        console.log('Saved to last-print.bin (dry-run)')
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('OK')
    } catch (e) {
      console.error('Print error:', e.message)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(e.message)
    }
    return
  }

  if (req.method === 'POST' && req.url === '/preview') {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const b64 = Buffer.concat(chunks).toString('utf-8')
      const data = Buffer.from(b64, 'base64')

      // Parse GS v 0 command to extract bitmap
      const png = decodeEscPosToPng(data)

      res.writeHead(200, { 'Content-Type': 'image/png' })
      res.end(png)
    } catch (e) {
      console.error('Preview error:', e.message)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(e.message)
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

/**
 * Parse ESC/POS buffer, extract the GS v 0 bitmap, render to PNG.
 * Falls back to a text error image if canvas is not available.
 */
function decodeEscPosToPng(data) {
  // Find GS v 0: bytes 0x1D 0x76 0x30
  let offset = -1
  for (let i = 0; i < data.length - 7; i++) {
    if (data[i] === 0x1D && data[i + 1] === 0x76 && data[i + 2] === 0x30) {
      offset = i
      break
    }
  }
  if (offset === -1) throw new Error('No GS v 0 command found in data')

  const m = data[offset + 3]
  const xL = data[offset + 4]
  const xH = data[offset + 5]
  const yL = data[offset + 6]
  const yH = data[offset + 7]
  const bytesPerLine = xL + (xH << 8)
  const height = yL + (yH << 8)
  const width = bytesPerLine * 8
  const bitmapStart = offset + 8

  console.log(`Preview: ${width}x${height} (${bytesPerLine} bytes/line, mode ${m})`)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const byteIdx = bitmapStart + y * bytesPerLine + Math.floor(x / 8)
      const bitIdx = 7 - (x % 8)
      const isBlack = (data[byteIdx] >> bitIdx) & 1
      const px = (y * width + x) * 4
      const val = isBlack ? 0 : 255
      imgData.data[px] = val
      imgData.data[px + 1] = val
      imgData.data[px + 2] = val
      imgData.data[px + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toBuffer('image/png')
}

server.listen(PORT, () => {
  console.log(`\n🖨  ESC/POS print server running on http://localhost:${PORT}`)
  devicePathPromise.then((devicePath) => {
    console.log(`   Mode: ${devicePath ? `LIVE → ${devicePath}` : 'DRY-RUN (no printer)'}`)
  })
  console.log(`   Endpoints:`)
  console.log(`     POST /print    — send raw bytes to printer`)
  console.log(`     POST /preview  — base64 ESC/POS → PNG`)
  console.log(`     GET  /status   — health check\n`)
})
