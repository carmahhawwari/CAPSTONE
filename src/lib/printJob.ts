import { supabase } from './supabase'
import { renderToPrintBuffer, bufferToBase64 } from './escpos'
import { PRINT_SERVER_URL, USE_LOCAL_PRINT_SERVER } from './printBackend'

interface SubmitPrintJobOptions {
  receiptElement: HTMLElement
  recipientName: string
  messageText?: string
  recipientId?: string
  skipGeofence?: boolean
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(out).set(bytes)
  return out
}

/**
 * Get the user's current position via the Geolocation API.
 * Returns null if permission is denied or unavailable.
 */
function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  })
}

/**
 * Check which printer is nearest to the user's current location via geofence.
 * Returns the printer UUID if one is within range, or null if not.
 * Throws if geolocation is unavailable.
 */
export async function checkNearestPrinter(): Promise<string | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const position = await getCurrentPosition()
  if (!position) return null

  const lat = position.coords.latitude
  const lng = position.coords.longitude

  // Query the nearest_printer function
  const { data: printerId } = await supabase.rpc('nearest_printer', { lat, lng })
  return printerId ?? null
}

/**
 * Render a receipt element to ESC/POS, find the nearest printer via geofence,
 * and insert a print job into Supabase.
 *
 * Returns the job ID on success, or throws on failure.
 */
export async function submitPrintJob({ receiptElement, recipientName, messageText, recipientId, skipGeofence }: SubmitPrintJobOptions): Promise<string> {
  // 1. Render receipt to ESC/POS binary
  const buffer = await renderToPrintBuffer(receiptElement)
  const payload = bufferToBase64(buffer)

  if (USE_LOCAL_PRINT_SERVER || !supabase) {
    const response = await fetch(PRINT_SERVER_URL + '/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: toArrayBuffer(buffer),
    })

    if (!response.ok) {
      throw new Error(`Local print server returned ${response.status}: ${await response.text()}`)
    }

    return `local-${Date.now()}`
  }

  if (!supabase) throw new Error('Supabase not configured')

  // 2. Get sender's location for geofence routing (skip if test mode)
  let lat: number | null = null
  let lng: number | null = null
  if (!skipGeofence) {
    const position = await getCurrentPosition()
    lat = position?.coords.latitude ?? null
    lng = position?.coords.longitude ?? null
  }

  // 3. Find nearest printer via the DB function
  let printerId: string | null = null
  if (lat !== null && lng !== null) {
    const { data } = await supabase.rpc('nearest_printer', { lat, lng })
    printerId = data ?? null
  }

  // If no printer in range or geofence skipped, fall back to any active printer
  if (!printerId) {
    const { data: printers } = await supabase
      .from('printers')
      .select('id')
      .eq('is_active', true)
      .limit(1)
    printerId = printers?.[0]?.id ?? null
  }

  if (!printerId) throw new Error('No active printers available')

  // 4. Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // 5. Insert print job
  const { data: job, error } = await supabase
    .from('print_jobs')
    .insert({
      printer_id: printerId,
      sender_id: user?.id ?? null,
      recipient_name: recipientName,
      recipient_id: recipientId ?? null,
      message_text: messageText ?? null,
      payload_base64: payload,
      sender_latitude: lat,
      sender_longitude: lng,
    })
    .select('id')
    .single()

  if (error) throw error
  return job.id
}
