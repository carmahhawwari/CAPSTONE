import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getFriends } from '@/lib/friends'
import Avatar from '@/components/Avatar'
import printerImg from '@/assets/printer.png'
import type { FriendProfile } from '@/types/app'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showFriendPicker, setShowFriendPicker] = useState(false)
  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadFriends = async () => {
      setLoading(true)
      const loadedFriends = await getFriends(user.id)
      setFriends(loadedFriends)
      setLoading(false)
    }
    loadFriends()
  }, [user])

  const handleSendClick = () => {
    navigate('/share/recipient')
  }

  const handleSelectFriend = (friendId: string) => {
    setShowFriendPicker(false)
    setFriendSearchQuery('')
    navigate(`/compose?to=${friendId}`)
  }

  const handleSelectEmail = (email: string) => {
    setShowFriendPicker(false)
    setFriendSearchQuery('')
    navigate(`/compose?email=${encodeURIComponent(email)}`)
  }

  const isSunetId = (id: string) => {
    return /^[a-z0-9]+$/.test(id) && id.length > 0 && !friendSearchQuery.includes('@')
  }

  const sunetId = friendSearchQuery
  const isSunetInputValid = isSunetId(sunetId)
  const sunetEmail = isSunetInputValid ? `${sunetId}@stanford.edu` : null

  const filteredFriends = friends.filter(f =>
    (f.profile.display_name || f.profile.username || 'Friend')
      .toLowerCase()
      .includes(friendSearchQuery.toLowerCase())
  )

  const handlePrintClick = () => {
    navigate('/prints')
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base px-6 pt-8 pb-8">
      <header className="flex items-end justify-between">
        <h1 className="text-regular-semibold text-text-primary">Home</h1>
        <div className="flex flex-col gap-2">
          <IconButton
            label="Profile"
            onClick={() => navigate('/profile')}
          >
            <ProfileIcon />
          </IconButton>
          <IconButton
            label="Letters"
            onClick={() => navigate('/letters')}
          >
            <ArchiveIcon />
          </IconButton>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 w-4/5 mx-auto">
        <Tile label="Printer" onClick={handlePrintClick}>
          <PrinterPlaceholder />
        </Tile>
        <PrimaryTile label="Share an Inkling" onClick={handleSendClick} />
      </div>

      {/* Friend Selection Modal */}
      {showFriendPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Send to</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search friends or enter SUNet ID..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value.toLowerCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fill-primary mb-4 pr-32"
                  autoFocus
                />
                {friendSearchQuery && !friendSearchQuery.includes(' ') && (
                  <span className="absolute right-4 top-2 text-gray-400 pointer-events-none text-base">@stanford.edu</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading friends...</p>
              ) : (
                <>
                  {isSunetInputValid && sunetEmail && (
                    <button
                      onClick={() => handleSelectEmail(sunetEmail)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-secondary transition-colors text-left border border-fill-tertiary bg-bg-secondary"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-fill-tertiary flex items-center justify-center">
                        <span className="text-sm font-semibold text-text-primary">@</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{sunetEmail}</span>
                        <p className="text-xs text-gray-500">New recipient</p>
                      </div>
                    </button>
                  )}
                  {filteredFriends.length === 0 && !isSunetInputValid ? (
                    <p className="text-sm text-gray-500 text-center py-6">
                      {friendSearchQuery ? 'No friends found' : 'Search friends or enter a SUNet ID'}
                    </p>
                  ) : (
                    filteredFriends.map((f) => {
                      const label = f.profile.display_name || f.profile.username || 'Friend'
                      return (
                        <button
                          key={f.profile.id}
                          onClick={() => handleSelectFriend(f.profile.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          {f.profile.avatar_url ? (
                            <img src={f.profile.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover flex-shrink-0" style={{ width: 40, height: 40 }} />
                          ) : (
                            <div className="flex-shrink-0">
                              <Avatar avatarId={1} size={40} />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{label}</span>
                        </button>
                      )
                    })
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => setShowFriendPicker(false)}
              className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold text-sm active:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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

function Tile({
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
      className="bg-bg-primary rounded-md flex aspect-[16/9] w-full items-center justify-center active:opacity-70"
    >
      {children}
    </button>
  )
}

function PrimaryTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-headline text-text-inverse bg-fill-primary rounded-md flex aspect-[16/9] w-full items-center justify-center active:opacity-80 transition-opacity"
    >
      {label}
    </button>
  )
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArchiveIcon() {
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
        d="M4 6h16v2H4V6zm1 3h14v9c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V9zm3 2v5h2v-5H8zm4 0v5h2v-5h-2z"
        fill="currentColor"
      />
    </svg>
  )
}

function PrinterPlaceholder() {
  return (
    <img
      src={printerImg}
      alt="Printer"
      className="h-full w-full object-contain p-6"
    />
  )
}

