import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getFriends } from '@/lib/friends'
import { getReceiptsByFriend } from '@/lib/receipts'
import { FriendProfile, Receipt } from '@/types/app'

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
      <div className="flex min-h-screen flex-col bg-bg-base items-center justify-center">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    )
  }

  const filtered = receipts

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <div className="sticky top-0 z-10">
        <header className="bg-bg-base relative flex items-start justify-between gap-4 px-6 pt-12 pb-3">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <h1 className="text-regular-semibold text-text-primary">Archives</h1>
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              {friends.length === 0 ? (
                <p className="text-subheadline text-text-tertiary">No friends yet</p>
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
                          ? 'text-headline text-text-inverse bg-fill-primary rounded-full whitespace-nowrap px-5 py-2'
                          : 'text-headline text-text-primary whitespace-nowrap px-2 py-2'
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
              background:
                'linear-gradient(to bottom, var(--color-bg-base), rgba(253, 253, 253, 0))',
            }}
          />
        </header>
      </div>

      <div className="mt-6 flex flex-col gap-5 px-6 pb-8">
        {filtered.length === 0 ? (
          <p className="text-subheadline text-text-tertiary">
            No letters yet.
          </p>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="border-fill-primary bg-bg-primary rounded-md aspect-[16/10] w-full border-2"
            />
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
      className="border-fill-primary flex h-11 w-11 items-center justify-center rounded-full border-2"
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
