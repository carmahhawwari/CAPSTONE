import { useState, useEffect } from 'react'
import { applyImageAdjustments, type ImageAdjustments, DEFAULT_ADJUSTMENTS } from '@/lib/imageProcessing'

interface ImageAdjustmentPanelProps {
  dataUrl: string
  adjustments: ImageAdjustments
  onAdjustmentsChange: (adjustments: ImageAdjustments) => void
}

export default function ImageAdjustmentPanel({
  dataUrl,
  adjustments,
  onAdjustmentsChange,
}: ImageAdjustmentPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const applyChanges = async () => {
      setIsProcessing(true)
      try {
        // Apply adjustments to preview
        await applyImageAdjustments(dataUrl, adjustments)
      } finally {
        setIsProcessing(false)
      }
    }

    applyChanges()
  }, [adjustments, dataUrl])

  const handleChange = (key: keyof ImageAdjustments, value: any) => {
    onAdjustmentsChange({ ...adjustments, [key]: value })
  }

  const resetAdjustments = () => {
    onAdjustmentsChange(DEFAULT_ADJUSTMENTS)
  }

  return (
    <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Image Tools</h3>
        <button
          onClick={resetAdjustments}
          className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:border-gray-400 text-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Brightness */}
      <div>
        <label className="text-xs font-medium text-gray-600 flex justify-between">
          Brightness
          <span>{adjustments.brightness > 0 ? '+' : ''}{adjustments.brightness}</span>
        </label>
        <input
          type="range"
          min="-100"
          max="100"
          step="10"
          value={adjustments.brightness}
          onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Contrast */}
      <div>
        <label className="text-xs font-medium text-gray-600 flex justify-between">
          Contrast
          <span>{adjustments.contrast > 0 ? '+' : ''}{adjustments.contrast}</span>
        </label>
        <input
          type="range"
          min="-100"
          max="100"
          step="10"
          value={adjustments.contrast}
          onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Dithering */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-2">Dithering</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['threshold', 'ordered', 'floyd-steinberg'] as const).map((method) => (
            <button
              key={method}
              onClick={() => handleChange('dithering', method)}
              className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                adjustments.dithering === method
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {method === 'floyd-steinberg' ? 'F-S' : method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>

        {/* Dithering Parameters */}
        {adjustments.dithering === 'threshold' && (
          <div>
            <label className="text-xs font-medium text-gray-600 flex justify-between">
              Threshold
              <span>{adjustments.thresholdValue}</span>
            </label>
            <input
              type="range"
              min="0"
              max="255"
              step="5"
              value={adjustments.thresholdValue}
              onChange={(e) => handleChange('thresholdValue', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lower = more black | Higher = more white</p>
          </div>
        )}

        {adjustments.dithering === 'ordered' && (
          <div>
            <label className="text-xs font-medium text-gray-600 flex justify-between">
              Pattern Intensity
              <span>{adjustments.orderedScale.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={adjustments.orderedScale}
              onChange={(e) => handleChange('orderedScale', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Weaker (0.5) = smoother | Stronger (2.0) = more pattern</p>
          </div>
        )}

        {adjustments.dithering === 'floyd-steinberg' && (
          <div>
            <label className="text-xs font-medium text-gray-600 flex justify-between">
              Error Diffusion
              <span>{adjustments.fsStrength.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={adjustments.fsStrength}
              onChange={(e) => handleChange('fsStrength', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Weaker (0.5) = less diffusion | Stronger (1.5) = more tonal range</p>
          </div>
        )}
      </div>

      {isProcessing && (
        <p className="text-xs text-gray-500 italic">Processing...</p>
      )}
    </div>
  )
}
