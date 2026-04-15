import { useParams, useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import Receipt from '@/components/Receipt'
import BottomNav from '@/components/BottomNav'
import { FRIENDS, RECEIPTS } from '@/data/mock'

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FriendDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const friend = FRIENDS.find(f => f.id === id)
  const receipts = RECEIPTS.filter(r => r.friendId === id)

  if (!friend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Friend not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 pt-6 pb-4">
        <button onClick={() => navigate('/friends')} className="p-1 rounded-lg active:bg-gray-100">
          <BackIcon />
        </button>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-4 px-6 pb-6">
        <Avatar avatarId={friend.avatarId} size={72} />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{friend.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{friend.address}</p>
        </div>
      </div>

      {/* Memories */}
      <div className="px-6 flex-1">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Memories</h3>
        {receipts.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No letters yet. Send the first one!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {receipts.map(r => (
              <Receipt key={r.id} receipt={r} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
