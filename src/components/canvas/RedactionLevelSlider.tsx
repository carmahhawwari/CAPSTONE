interface RedactionLevelSliderProps {
  value: number
  onChange: (value: number) => void
}

export default function RedactionLevelSlider({ value, onChange }: RedactionLevelSliderProps) {
  const levelLabels: Record<number, string> = {
    10: 'Light',
    20: 'Light Medium',
    35: 'Medium',
    50: 'Heavy',
    70: 'Heavier',
    100: 'Maximum',
  }

  return (
    <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Redaction Level</h3>
        <span className="text-xs text-gray-600">{levelLabels[value] || value}</span>
      </div>
      <input
        type="range"
        min="10"
        max="100"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>Light (10)</span>
        <span>Maximum (100)</span>
      </div>
    </div>
  )
}
