import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getFriends } from '@/lib/friends'
import { getReceiptsByFriend } from '@/lib/receipts'
import type { FriendProfile, Receipt } from '@/types/app'

export default function ArchiveScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const loadFriends = async () => {
      const friendsList = await getFriends(user.id)
      setFriends(friendsList)
      if (friendsList.length > 0) {
        setActiveFriendId(friendsList[0].profile.id)
      }
      setLoading(false)
    }

    loadFriends()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !activeFriendId) {
      setReceipts([])
      return
    }

    const loadReceipts = async () => {
      const recs = await getReceiptsByFriend(user.id, activeFriendId)
      setReceipts(recs)
    }

    loadReceipts()
  }, [user?.id, activeFriendId])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="sticky top-0 z-10">
        <header className="bg-white relative flex items-start justify-between gap-4 px-6 pt-8 pb-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-400">No friends yet</p>
              ) : (
                friends.map((f) => {
                  const label = (f.profile.display_name || f.profile.username || 'Friend').split(' ')[0]
                  const isActive = activeFriendId === f.profile.id
                  return (
                    <button
                      key={f.friendRowId}
                      type="button"
                      onClick={() => setActiveFriendId(f.profile.id)}
                      className={
                        isActive
                          ? 'text-sm font-semibold text-white bg-blue-600 rounded-full whitespace-nowrap px-4 py-2'
                          : 'text-sm font-semibold text-gray-700 whitespace-nowrap px-3 py-2'
                      }
                    >
                      {label}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            <IconButton label="Home" onClick={() => navigate('/home')}>
              <HomeIcon />
            </IconButton>
            <IconButton label="New" onClick={() => navigate('/compose')}>
              <PlusIcon />
            </IconButton>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-full h-6"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))',
            }}
          />
        </header>
      </div>

      <div className="mt-6 flex flex-col gap-5 px-6 pb-8">
        {receipts.length === 0 ? (
          <p className="text-sm text-gray-400">No letters yet.</p>
        ) : (
          receipts.map((r) => (
            <div
              key={r.id}
              className="border-blue-200 bg-gray-50 rounded-lg border p-4 flex flex-col justify-between overflow-hidden"
            >
              <p className="text-sm text-gray-700 line-clamp-4">
                {r.content || '(no text)'}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                {r.date}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="border-gray-300 flex h-11 w-11 items-center justify-center rounded-full border-2 text-gray-700 hover:text-gray-900"
    >
      {children}
    </button>
  )
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V14H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
