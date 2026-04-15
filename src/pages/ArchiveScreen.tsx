import { useState } from 'react'
import Receipt from '@/components/Receipt'
import BottomNav from '@/components/BottomNav'
import { FRIENDS, RECEIPTS } from '@/data/mock'

export default function ArchiveScreen() {
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const filters = [
    { id: 'all', label: 'All' },
    ...FRIENDS.map(f => ({ id: f.id, label: f.name.split(' ')[0] })),
  ]

  const filtered =
    activeFilter === 'all' ? RECEIPTS : RECEIPTS.filter(r => r.friendId === activeFilter)

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="px-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Archive</h1>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Receipt list */}
        <div className="flex flex-col gap-4">
          {filtered.map(r => (
            <Receipt key={r.id} receipt={r} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
