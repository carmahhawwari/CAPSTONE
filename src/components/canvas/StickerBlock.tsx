import { AnimatePresence, motion } from 'framer-motion'
import { STICKERS } from '@/data/stickers'

interface StickerBlockProps {
  stickerId: string
  size?: number
  outline?: boolean
  isActive: boolean
  onFocus: () => void
  onDelete: () => void
  onSizeChange?: (size: number) => void
  onOutlineToggle?: (outline: boolean) => void
}

const DEFAULT_SIZE = 64

export default function StickerBlock({
  stickerId,
  size = DEFAULT_SIZE,
  outline = false,
  isActive,
  onFocus,
  onDelete,
  onSizeChange,
  onOutlineToggle,
}: StickerBlockProps) {
  const sticker = STICKERS.find(s => s.id === stickerId)
  if (!sticker) return null

  return (
    <motion.div
      layout
      className={`group relative flex flex-col items-center py-2 ${isActive ? 'ring-2 ring-blue-400 ring-offset-1 rounded-md' : ''}`}
      onClick={onFocus}
    >
      <motion.div
        layout
        style={{ width: size, height: size }}
        className={`flex items-center justify-center [&>svg]:w-full [&>svg]:h-full ${outline ? 'rounded-md p-1.5' : ''}`}
      >
        <div
          className={outline ? 'border border-gray-900 rounded-md p-1 w-full h-full flex items-center justify-center' : 'w-full h-full flex items-center justify-center'}
        >
          {sticker.svg}
        </div>
      </motion.div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mt-2 flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="range"
              min={32}
              max={160}
              step={4}
              value={size}
              onChange={(e) => onSizeChange?.(Number(e.target.value))}
              className="w-28 accent-gray-900"
              aria-label="Sticker size"
            />
            <button
              type="button"
              onClick={() => onOutlineToggle?.(!outline)}
              aria-pressed={outline}
              className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
                outline ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              Outline
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isActive && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="absolute -right-3 -top-3 w-6 h-6 rounded-md bg-red-500 text-white text-xs flex items-center justify-center shadow"
          aria-label="Delete block"
        >
          &times;
        </button>
      )}
    </motion.div>
  )
}
