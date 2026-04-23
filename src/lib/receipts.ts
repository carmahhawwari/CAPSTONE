import { supabase } from '@/lib/supabase'
import { submitPrintJob } from '@/lib/printJob'
import type { Block } from '@/types/canvas'
import type { Json } from '@/types/database'

export type ReceiptContent = {
  blocks: Block[]
  prompt: string
}

export type ReceiptRow = {
  id: string
  author_id: string
  recipient_id: string | null
  content: ReceiptContent
  print_job_id: string | null
  created_at: string
}

export type ReceiptWithProfiles = ReceiptRow & {
  author: { id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null
  recipient: { id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null
}

function getClient() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

async function requireUserId(): Promise<string> {
  const client = getClient()
  const { data, error } = await client.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function saveReceipt(content: ReceiptContent): Promise<ReceiptRow> {
  const client = getClient()
  const authorId = await requireUserId()

  const { data, error } = await client
    .from('receipts')
    .insert({
      author_id: authorId,
      recipient_id: null,
      content: content as unknown as Json,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as ReceiptRow
}

export async function sendReceipt(opts: {
  content: ReceiptContent
  recipientId: string
  recipientName: string
  receiptElement: HTMLElement
}): Promise<ReceiptRow> {
  const client = getClient()
  const authorId = await requireUserId()

  if (authorId === opts.recipientId) throw new Error('You cannot send to yourself')

  const printJobId = await submitPrintJob({
    receiptElement: opts.receiptElement,
    recipientName: opts.recipientName,
  })

  const { data, error } = await client
    .from('receipts')
    .insert({
      author_id: authorId,
      recipient_id: opts.recipientId,
      content: opts.content as unknown as Json,
      print_job_id: printJobId.startsWith('local-') ? null : printJobId,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as ReceiptRow
}

export async function getArchive(): Promise<ReceiptWithProfiles[]> {
  const client = getClient()
  const userId = await requireUserId()

  const { data, error } = await client
    .from('receipts')
    .select(`
      *,
      author:author_id (id, display_name, username, avatar_url),
      recipient:recipient_id (id, display_name, username, avatar_url)
    `)
    .or(`author_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ReceiptWithProfiles[]
}

export async function getReceiptsWithFriend(friendId: string): Promise<ReceiptWithProfiles[]> {
  const client = getClient()
  const userId = await requireUserId()

  const { data, error } = await client
    .from('receipts')
    .select(`
      *,
      author:author_id (id, display_name, username, avatar_url),
      recipient:recipient_id (id, display_name, username, avatar_url)
    `)
    .or(
      `and(author_id.eq.${userId},recipient_id.eq.${friendId}),and(author_id.eq.${friendId},recipient_id.eq.${userId})`,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ReceiptWithProfiles[]
}
