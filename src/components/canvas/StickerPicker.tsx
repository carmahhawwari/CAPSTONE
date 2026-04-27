import { motion } from 'framer-motion'
import { STICKERS } from '@/data/stickers'

interface StickerPickerProps {
  onSelect: (stickerId: string) => void
  onClose: () => void
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm p-6 shadow-xl border border-fill-tertiary bg-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Choose a sticker</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1 w-6 h-6 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {STICKERS.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onClose() }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {s.svg}
              </div>
              <span className="text-[10px] text-gray-500">{s.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
