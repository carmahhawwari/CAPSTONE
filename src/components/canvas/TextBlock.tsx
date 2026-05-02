import { useRef, useEffect } from 'react'
import type { TextStyle } from '@/types/canvas'
import { FONT_STYLES } from '@/types/canvas'

interface TextBlockProps {
  content: string
  style: TextStyle
  fontSizeMultiplier?: number
  redactionLevel?: number
  fontWeight?: number
  isItalic?: boolean
  isBold?: boolean
  isActive: boolean
  onContentChange: (content: string) => void
  onFocus: () => void
  onDelete: () => void
}

export default function TextBlock({
  content,
  style,
  fontSizeMultiplier = 1,
  redactionLevel = 50,
  fontWeight,
  isItalic = false,
  isBold = false,
  isActive,
  onContentChange,
  onFocus,
  onDelete,
}: TextBlockProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  let fontConfig = FONT_STYLES[style]
  const adjustedFontSize = fontConfig.fontSize * fontSizeMultiplier

  if (style === 'redaction') {
    fontConfig = {
      ...fontConfig,
      fontFamily: `redaction-${redactionLevel}, sans-serif`,
    }
  }

  if (fontWeight !== undefined) {
    fontConfig = {
      ...fontConfig,
      fontWeight,
    }
  }

  if (isBold) {
    fontConfig = {
      ...fontConfig,
      fontWeight: 700,
    }
  }

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content, adjustedFontSize, fontConfig.fontFamily, fontConfig.lineHeight])

  return (
    <div className={`group relative ${isActive ? 'ring-1 ring-fill-tertiary ring-offset-1 rounded' : ''}`}>
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Type something..."
        rows={1}
        className="w-full outline-none resize-none bg-transparent border-0 p-0 placeholder:text-gray-300"
        style={{
          fontFamily: fontConfig.fontFamily,
          fontSize: adjustedFontSize,
          fontWeight: fontConfig.fontWeight as any,
          fontStyle: isItalic ? 'italic' : 'normal',
          lineHeight: fontConfig.lineHeight,
          textTransform: fontConfig.textTransform ?? 'none',
          color: '#000',
          overflow: 'hidden',
        }}
      />
      {isActive && (
        <button
          onClick={onDelete}
          className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
          aria-label="Delete block"
        >
          &times;
        </button>
      )}
    </div>
  )
}
