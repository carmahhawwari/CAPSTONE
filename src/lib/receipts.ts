import { supabase } from './supabase'
import { Receipt } from '@/types/app'

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
      .from('print_jobs')
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
    }))
  } catch (error) {
    console.error('getReceiptsByFriend exception:', error)
    return []
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
      .from('print_jobs')
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
    }))
  } catch (error) {
    console.error('getReceiptsByCurrentUser exception:', error)
    return []
  }
}
