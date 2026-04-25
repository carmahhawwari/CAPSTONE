import type { TextStyle } from '@/types/canvas'
import { FONT_STYLES, STYLE_LABELS } from '@/types/canvas'

const STANDARD_STYLES: TextStyle[] = ['inter', 'normal', 'heading', 'handwriting']
const DISPLAY_STYLES: TextStyle[] = ['liquida', 'dottonoji', 'tsuchinoko', 'redaction', 'pixel', 'shout', 'artsy', 'decorative', 'comic', 'bold']

interface FontStylePickerProps {
  current: TextStyle
  onChange: (style: TextStyle) => void
}

function FontButton({ style, current, onChange }: { style: TextStyle; current: TextStyle; onChange: (s: TextStyle) => void }) {
  const config = FONT_STYLES[style]
  return (
    <button
      onClick={() => onChange(style)}
      className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
        current === style
          ? 'bg-black text-white border-black'
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
      }`}
      style={{
        fontFamily: config.fontFamily,
        fontSize: Math.min(config.fontSize, 13),
      }}
    >
      {STYLE_LABELS[style]}
    </button>
  )
}

export default function FontStylePicker({ current, onChange }: FontStylePickerProps) {
  return (
    <div className="space-y-2">
      {/* Standard Type */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">Standard</p>
        <div className="flex gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
          {STANDARD_STYLES.map(s => (
            <FontButton key={s} style={s} current={current} onChange={onChange} />
          ))}
        </div>
      </div>

      {/* Display Type */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">Display</p>
        <div className="flex gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
          {DISPLAY_STYLES.map(s => (
            <FontButton key={s} style={s} current={current} onChange={onChange} />
          ))}
        </div>
      </div>
    </div>
  )
}
