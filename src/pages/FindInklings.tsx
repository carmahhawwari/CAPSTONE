import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getFriendshipStatus, sendFriendRequest, acceptFriendRequest } from '@/lib/friends'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

type FriendshipMap = {
  status: FriendshipStatus
  rowId?: string
}

export default function FindInklings() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friendships, setFriendships] = useState<Map<string, FriendshipMap>>(new Map())
  const [actionStates, setActionStates] = useState<Map<string, boolean>>(new Map())
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) {
      setError('Supabase not configured')
      return
    }
    const client = supabase

    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      const trimmed = query.trim()
      let builder = client
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .order('display_name', { ascending: true, nullsFirst: false })
        .limit(50)

      if (trimmed) {
        const pattern = `%${trimmed}%`
        builder = builder.or(`display_name.ilike.${pattern},username.ilike.${pattern}`)
      }

      // Filter out current user
      if (user?.id) {
        builder = builder.neq('id', user.id)
      }

      const { data, error: qErr } = await builder
      if (cancelled) return

      if (qErr) {
        setError(qErr.message)
        setUsers([])
        setFriendships(new Map())
      } else {
        const profiles = data ?? []
        setUsers(profiles)

        // Fetch friendship status for each user
        if (user?.id) {
          const map = new Map<string, FriendshipMap>()
          for (const profile of profiles) {
            const status = await getFriendshipStatus(user.id, profile.id)
            map.set(profile.id, status)
          }
          setFriendships(map)
        }
      }
      setLoading(false)
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, user?.id])

  const handleInvite = () => {
    navigate('/home')
  }

  const handleFriendAction = async (userId: string, status: FriendshipStatus, rowId?: string) => {
    if (!user?.id) return

    setActionStates(prev => new Map(prev).set(userId, true))

    try {
      if (status === 'none') {
        const result = await sendFriendRequest(user.id, userId)
        if (result.success) {
          setFriendships(prev => {
            const map = new Map(prev)
            map.set(userId, { status: 'pending_sent', rowId: userId })
            return map
          })
        }
      } else if (status === 'pending_received' && rowId) {
        const result = await acceptFriendRequest(rowId)
        if (result.success) {
          setFriendships(prev => {
            const map = new Map(prev)
            map.set(userId, { status: 'accepted', rowId })
            return map
          })
        }
      }
    } catch (err) {
      console.error('Friend action error:', err)
    } finally {
      setActionStates(prev => new Map(prev).set(userId, false))
    }
  }

  const getButtonLabel = (status: FriendshipStatus): string => {
    switch (status) {
      case 'none':
        return 'Add'
      case 'pending_sent':
        return 'Pending'
      case 'pending_received':
        return 'Accept'
      case 'accepted':
        return 'Friends'
    }
  }

  const isButtonDisabled = (status: FriendshipStatus, userId: string): boolean => {
    return status === 'pending_sent' || status === 'accepted' || actionStates.get(userId) === true
  }

  return (
    <div className="flex h-screen flex-col items-center bg-bg-base px-6 py-12">
      <div className="flex w-full max-w-sm flex-1 flex-col min-h-0">
        <h1 className="text-regular-semibold text-text-primary">
          Find your inklings
        </h1>
        <p className="text-subheadline text-text-secondary mt-2">
          Add or invite your friends to inklings to start sharing and receiving
          messages.
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ..."
          className="font-inter text-mini text-text-primary placeholder:text-text-tertiary border-fill-tertiary bg-bg-tertiary rounded-md mt-6 w-full border px-4 py-4 focus:outline-none focus:border-fill-primary"
        />

        <div className="mt-4 flex-1 overflow-y-auto">
          {error && (
            <p className="text-subheadline text-text-tertiary">
              {error}
            </p>
          )}

          {!error && users.length === 0 && !loading && (
            <p className="text-subheadline text-text-tertiary">
              {query.trim() ? 'No matches.' : 'No users yet.'}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {users.map((u) => {
              const name = u.display_name || u.username || 'Untitled'
              const handle = u.display_name && u.username ? `@${u.username}` : null
              const friendshipInfo = friendships.get(u.id) ?? { status: 'none' as FriendshipStatus }
              const isLoading = actionStates.get(u.id) === true
              const isDisabled = isButtonDisabled(friendshipInfo.status, u.id)

              return (
                <div
                  key={u.id}
                  className="border-fill-tertiary bg-bg-primary rounded-md flex items-center justify-between border px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-fill-quaternary h-10 w-10 rounded-full" />
                    )}
                    <div className="min-w-0">
                      <div className="text-body text-text-primary truncate">
                        {name}
                      </div>
                      {handle && (
                        <div className="text-subheadline text-text-tertiary truncate">
                          {handle}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFriendAction(u.id, friendshipInfo.status, friendshipInfo.rowId)}
                    disabled={isDisabled}
                    className={`text-callout rounded-md px-4 py-2 shrink-0 transition-opacity ${
                      isDisabled
                        ? 'text-text-tertiary bg-fill-quaternary'
                        : 'text-text-inverse bg-fill-primary'
                    } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    {isLoading ? 'Loading...' : getButtonLabel(friendshipInfo.status)}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleInvite}
          className="text-headline text-text-inverse bg-fill-primary rounded-md mt-4 w-full py-4 shrink-0"
        >
          Invite contacts
        </button>

        <Link
          to="/home"
          className="text-subheadline text-text-primary mt-3 self-center underline shrink-0"
        >
          skip
        </Link>
      </div>
    </div>
  )
}
