import { useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { FRIENDS } from '@/data/mock'

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#374151" strokeWidth="1.8" />
      <path d="M2 8L12 14L22 8" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function FriendsScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="px-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mr-2">Friends</h1>
          <div className="flex -space-x-2">
            {FRIENDS.slice(0, 3).map(f => (
              <div key={f.id} className="rounded-full border-2 border-white overflow-hidden">
                <Avatar avatarId={f.avatarId} size={36} />
              </div>
            ))}
          </div>
        </div>

        {/* Friend list */}
        <div className="flex flex-col gap-3">
          {FRIENDS.map(friend => (
            <button
              key={friend.id}
              onClick={() => navigate(`/friends/${friend.id}`)}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm active:opacity-70 transition-opacity text-left w-full"
            >
              <Avatar avatarId={friend.avatarId} size={52} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{friend.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{friend.address}</p>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation()
                  navigate(`/compose?to=${friend.id}`)
                }}
                className="p-2 rounded-lg active:bg-gray-100"
                aria-label={`Send message to ${friend.name}`}
              >
                <MailIcon />
              </button>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
