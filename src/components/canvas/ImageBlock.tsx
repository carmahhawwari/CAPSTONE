import { useRef } from 'react'

interface ImageBlockProps {
  dataUrl: string
  isActive: boolean
  onImageChange: (dataUrl: string) => void
  onFocus: () => void
  onDelete: () => void
}

export default function ImageBlock({
  dataUrl,
  isActive,
  onImageChange,
  onFocus,
  onDelete,
}: ImageBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageChange(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  if (!dataUrl) {
    return (
      <button
        onClick={() => {
          onFocus()
          inputRef.current?.click()
        }}
        className="w-full py-8 border-2 border-dashed border-gray-300 rounded flex flex-col items-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="text-sm">Add Photo</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
      </button>
    )
  }

  return (
    <div
      className={`group relative ${isActive ? 'ring-2 ring-blue-400 ring-offset-1 rounded' : ''}`}
      onClick={onFocus}
    >
      <img
        src={dataUrl}
        alt=""
        className="w-full h-auto max-h-[400px] object-cover rounded"
      />
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
