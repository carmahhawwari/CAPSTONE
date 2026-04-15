import { STICKERS } from '@/data/stickers'

interface StickerBlockProps {
  stickerId: string
  isActive: boolean
  onFocus: () => void
  onDelete: () => void
}

export default function StickerBlock({
  stickerId,
  isActive,
  onFocus,
  onDelete,
}: StickerBlockProps) {
  const sticker = STICKERS.find(s => s.id === stickerId)
  if (!sticker) return null

  return (
    <div
      className={`group relative flex justify-center py-2 ${isActive ? 'ring-2 ring-blue-400 ring-offset-1 rounded' : ''}`}
      onClick={onFocus}
    >
      <div className="w-16 h-16">{sticker.svg}</div>
      {isActive && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
          aria-label="Delete block"
        >
          &times;
        </button>
      )}
    </div>
  )
}
