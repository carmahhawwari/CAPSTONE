import { supabase } from '@/lib/supabase'

export type FriendProfile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
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

export async function addFriend(targetUserId: string): Promise<void> {
  const client = getClient()
  const followerId = await requireUserId()
  if (followerId === targetUserId) throw new Error('You cannot add yourself')

  const { error } = await client
    .from('follows')
    .insert({ follower_id: followerId, following_id: targetUserId })

  if (error && error.code !== '23505') throw error
}

export async function removeFriend(targetUserId: string): Promise<void> {
  const client = getClient()
  const followerId = await requireUserId()

  const { error } = await client
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', targetUserId)

  if (error) throw error
}

export async function isFollowing(targetUserId: string): Promise<boolean> {
  const client = getClient()
  const followerId = await requireUserId()

  const { data, error } = await client
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function getFriends(): Promise<FriendProfile[]> {
  const client = getClient()
  const followerId = await requireUserId()

  const { data, error } = await client
    .from('follows')
    .select('profiles:following_id (id, username, display_name, avatar_url)')
    .eq('follower_id', followerId)

  if (error) throw error

  return (data ?? [])
    .map((row) => (row as { profiles: FriendProfile | null }).profiles)
    .filter((p): p is FriendProfile => p !== null)
}

export async function getFollowingIds(): Promise<Set<string>> {
  const client = getClient()
  const followerId = await requireUserId()

  const { data, error } = await client
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId)

  if (error) throw error
  return new Set((data ?? []).map((r) => r.following_id))
}
