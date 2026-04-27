import { useState, useRef } from 'react'
import { renderToPrintBuffer, bufferToBase64 } from '@/lib/escpos'
import type { Block } from '@/types/canvas'
import { FONT_STYLES } from '@/types/canvas'

export default function TestRasterization() {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'test-1',
      type: 'text',
      content: 'Test Receipt',
      style: 'heading',
      fontSizeMultiplier: 1,
    },
    {
      id: 'test-2',
      type: 'text',
      content: 'This is a test of the rasterization flow.',
      style: 'normal',
      fontSizeMultiplier: 1,
    },
  ])
  const [rasterized, setRasterized] = useState<string | null>(null)
  const [isRasterizing, setIsRasterizing] = useState(false)

  const handleAddTextBlock = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: 'text',
      content: 'New text block',
      style: 'normal',
    }
    setBlocks([...blocks, newBlock])
  }

  const handleRasterize = async () => {
    if (!receiptRef.current) return
    setIsRasterizing(true)
    try {
      const buffer = await renderToPrintBuffer(receiptRef.current)
      const base64 = bufferToBase64(buffer)
      setRasterized(base64)
      console.log('Rasterization successful!')
      console.log('Buffer size:', buffer.length, 'bytes')
      console.log('Base64 length:', base64.length, 'chars')
    } catch (err) {
      console.error('Rasterization failed:', err)
    } finally {
      setIsRasterizing(false)
    }
  }

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Receipt Rasterization Test</h1>

        <div className="grid grid-cols-2 gap-8">
          {/* Editor */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Composer</h2>
            <div className="space-y-3">
              {blocks.map(block => (
                <div key={block.id} className="flex gap-2">
                  {block.type === 'text' && (
                    <div className="flex-1">
                      <input
                        type="text"
                        value={block.content}
                        onChange={e => {
                          setBlocks(blocks.map(b =>
                            b.id === block.id ? { ...b, content: e.target.value } : b
                          ))
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddTextBlock}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Text Block
            </button>
            <button
              onClick={handleRasterize}
              disabled={isRasterizing}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {isRasterizing ? 'Rasterizing...' : 'Rasterize Receipt'}
            </button>
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div
              ref={receiptRef}
              className="bg-white p-5 border border-gray-200 rounded shadow-sm"
              style={{ fontFamily: 'Georgia, serif', width: '576px' }}
            >
              {blocks.map(block => (
                <div key={block.id} className="mb-3">
                  {block.type === 'text' && (
                    <div
                      style={{
                        ...FONT_STYLES[block.style],
                        fontSize: `${FONT_STYLES[block.style].fontSize * (block.fontSizeMultiplier ?? 1)}px`,
                      }}
                    >
                      {block.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rasterization Result */}
        {rasterized && (
          <div className="mt-8 p-4 bg-white border border-gray-200 rounded">
            <h3 className="font-semibold mb-2">Rasterized Output (Base64)</h3>
            <div className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32 font-mono">
              {rasterized.slice(0, 500)}...
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Total size: {rasterized.length} characters
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
