import { STICKERS } from '@/data/stickers'

interface StickerPickerProps {
  onSelect: (stickerId: string, svg: React.ReactNode) => void
  onClose: () => void
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-t-2xl w-full max-w-md px-6 pt-4 pb-8 animate-in slide-in-from-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose a sticker</h3>
        <div className="grid grid-cols-5 gap-3">
          {STICKERS.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id, s.svg); onClose() }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {s.svg}
              </div>
              <span className="text-[10px] text-gray-500">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
