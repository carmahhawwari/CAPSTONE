import { AnimatePresence, motion } from 'framer-motion'

interface StickerBlockProps {
  previewUrl: string
  fullUrl: string
  ditheredDataUrl?: string
  size?: number
  isActive: boolean
  onFocus: () => void
  onDelete: () => void
  onSizeChange?: (size: number) => void
}

const DEFAULT_SIZE = 64

export default function StickerBlock({
  previewUrl,
  ditheredDataUrl,
  size = DEFAULT_SIZE,
  isActive,
  onFocus,
  onDelete,
  onSizeChange,
}: StickerBlockProps) {
  return (
    <>
      <div
        className={`group relative flex flex-col items-center py-2 ${isActive ? 'ring-1 ring-fill-tertiary ring-offset-1 rounded-md' : ''}`}
        onClick={onFocus}
      >
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center"
        >
          <img
            src={ditheredDataUrl ?? previewUrl}
            alt="Sticker"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            className="grayscale"
          />
        </div>

        {isActive && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="absolute -right-3 -top-3 w-6 h-6 rounded-md bg-red-500 text-white text-xs flex items-center justify-center shadow"
            aria-label="Delete block"
          >
            &times;
          </button>
        )}
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.input
            type="range"
            min={32}
            max={160}
            step={4}
            value={size}
            onChange={(e) => onSizeChange?.(Number(e.target.value))}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mt-3 w-28 accent-black"
            aria-label="Sticker size"
            onClick={e => e.stopPropagation()}
          />
        )}
      </AnimatePresence>
    </>
  )
}
