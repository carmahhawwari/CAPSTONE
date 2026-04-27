import { supabase } from './supabase'
import type { Receipt } from '@/types/app'

export interface PrintJobInput {
  sender_id: string
  recipient_id?: string
  recipient_name: string
  message_text: string
  payload_base64: string
}

/**
 * Get all receipts (print jobs) sent to a specific friend.
 * Uses recipient_id to match jobs sent to that profile.
 */
export async function getReceiptsByFriend(
  currentUserId: string,
  friendProfileId: string
): Promise<Receipt[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('delivered_receipts')
      .select('*')
      .eq('sender_id', currentUserId)
      .eq('recipient_id', friendProfileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getReceiptsByFriend error:', error)
      return []
    }

    return (data || []).map((job: any) => ({
      id: job.id,
      date: new Date(job.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      to: job.recipient_name ?? 'Unknown',
      from: 'You',
      content: job.message_text ?? '(printed message)',
      friendId: friendProfileId,
      receiptStateJson: job.receipt_state_json,
      printedAt: job.printed_at,
    }))
  } catch (error) {
    console.error('getReceiptsByFriend exception:', error)
    return []
  }
}

/**
 * Save a print job to the archive.
 */
export async function savePrintJob(job: PrintJobInput): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    const { error } = await supabase.from('print_jobs').insert({
      sender_id: job.sender_id,
      recipient_id: job.recipient_id || null,
      recipient_name: job.recipient_name,
      message_text: job.message_text,
      payload_base64: job.payload_base64,
    })

    if (error) {
      console.error('savePrintJob error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('savePrintJob exception:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get all receipts (print jobs) sent by the current user.
 * Used for the full archive view.
 */
export async function getReceiptsByCurrentUser(userId: string): Promise<Receipt[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('delivered_receipts')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getReceiptsByCurrentUser error:', error)
      return []
    }

    return (data || []).map((job: any) => ({
      id: job.id,
      date: new Date(job.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      to: job.recipient_name ?? 'Unknown',
      from: 'You',
      content: job.message_text ?? '(printed message)',
      friendId: job.recipient_id ?? '',
      receiptStateJson: job.receipt_state_json,
    }))
  } catch (error) {
    console.error('getReceiptsByCurrentUser exception:', error)
    return []
  }
}

/**
 * Get all receipts received by the current user from a specific friend.
 */
export async function getReceivedReceiptsByFriend(
  currentUserId: string,
  friendProfileId: string
): Promise<Receipt[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('delivered_receipts')
      .select('*')
      .eq('sender_id', friendProfileId)
      .eq('recipient_id', currentUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getReceivedReceiptsByFriend error:', error)
      return []
    }

    return (data || []).map((job: any) => ({
      id: job.id,
      date: new Date(job.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      to: 'You',
      from: job.recipient_name ?? 'Unknown',
      content: job.message_text ?? '(printed message)',
      friendId: friendProfileId,
      receiptStateJson: job.receipt_state_json,
      printedAt: job.printed_at,
    }))
  } catch (error) {
    console.error('getReceivedReceiptsByFriend exception:', error)
    return []
  }
}

/**
 * Get all receipts received by the current user.
 */
export async function getReceivedReceiptsByCurrentUser(userId: string): Promise<Receipt[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('delivered_receipts')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getReceivedReceiptsByCurrentUser error:', error)
      return []
    }

    return (data || []).map((job: any) => ({
      id: job.id,
      date: new Date(job.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      to: 'You',
      from: job.recipient_name ?? 'Unknown',
      content: job.message_text ?? '(printed message)',
      friendId: job.sender_id ?? '',
      receiptStateJson: job.receipt_state_json,
    }))
  } catch (error) {
    console.error('getReceivedReceiptsByCurrentUser exception:', error)
    return []
  }
}
