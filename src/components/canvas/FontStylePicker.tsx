import type { TextStyle } from '@/types/canvas'
import { FONT_STYLES, STYLE_LABELS } from '@/types/canvas'

const STYLES: TextStyle[] = ['liquida', 'dottonoji', 'tsuchinoko', 'redaction', 'inter', 'normal', 'heading', 'handwriting', 'pixel', 'shout', 'artsy', 'decorative', 'comic', 'bold']

interface FontStylePickerProps {
  current: TextStyle
  onChange: (style: TextStyle) => void
}

export default function FontStylePicker({ current, onChange }: FontStylePickerProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
      {STYLES.map(s => {
        const config = FONT_STYLES[s]
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              current === s
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
            style={{
              fontFamily: config.fontFamily,
              fontSize: Math.min(config.fontSize, 13),
            }}
          >
            {STYLE_LABELS[s]}
          </button>
        )
      })}
    </div>
  )
}
