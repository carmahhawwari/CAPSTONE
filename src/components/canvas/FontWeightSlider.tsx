interface FontWeightSliderProps {
  value: number
  onChange: (value: number) => void
}

export default function FontWeightSlider({ value, onChange }: FontWeightSliderProps) {
  const weightLabels: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Normal',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  }

  return (
    <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-gray-700">Weight</h3>
        <span className="text-xs text-gray-600">{weightLabels[value] || value}</span>
      </div>
      <input
        type="range"
        min="100"
        max="900"
        step="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
      />
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>100</span>
        <span>900</span>
      </div>
    </div>
  )
}
