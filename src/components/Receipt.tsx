import type { Receipt as ReceiptType } from '@/types/app'

interface ReceiptProps {
  receipt: ReceiptType
  className?: string
}

export default function Receipt({ receipt, className = '' }: ReceiptProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden ${className}`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-dashed border-gray-200 space-y-1.5">
        <div className="flex justify-between items-start text-xs text-gray-500">
          <span>{receipt.date}</span>
        </div>
        <div className="text-sm font-semibold text-gray-800 leading-snug break-words">To: {receipt.to}</div>
        <div className="text-sm text-gray-600 leading-snug break-words">From: {receipt.from}</div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {receipt.prompt && (
          <p className="text-xs text-gray-500 italic mb-3 leading-relaxed">{receipt.prompt}</p>
        )}
        {receipt.imageDataUrl && (
          <div className="mb-3 overflow-hidden rounded border border-gray-200 bg-white">
            <img
              src={receipt.imageDataUrl}
              alt="Receipt attachment"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{receipt.content}</p>
      </div>

      {/* Signature */}
      <div className="px-5 pb-4 text-sm text-gray-600 italic leading-snug break-words">
        Love, &nbsp;{receipt.from}
      </div>

      {/* Torn edge effect */}
      <div
        className="h-3 w-full"
        style={{
          background: 'white',
          maskImage:
            'repeating-linear-gradient(90deg, transparent, transparent 4px, white 4px, white 8px), linear-gradient(180deg, white 40%, transparent 100%)',
          WebkitMaskImage:
            'repeating-linear-gradient(90deg, transparent, transparent 4px, white 4px, white 8px), linear-gradient(180deg, white 40%, transparent 100%)',
          borderTop: '1px dashed #e5e7eb',
        }}
      />
    </div>
  )
}
