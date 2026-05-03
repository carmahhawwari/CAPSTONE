interface BlockToolbarProps {
  onAddText: () => void
  onAddImage: () => void
}

export default function BlockToolbar({ onAddText, onAddImage }: BlockToolbarProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button
        onClick={onAddText}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg bg-black text-white text-base font-semibold active:opacity-80 transition-opacity"
      >
        + Text
      </button>
      <button
        onClick={onAddImage}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg bg-black text-white text-base font-semibold active:opacity-80 transition-opacity"
      >
        + Image
      </button>
    </div>
  )
}
