import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import TextBlock from '@/components/canvas/TextBlock'
import ImageBlock from '@/components/canvas/ImageBlock'
import StickerBlock from '@/components/canvas/StickerBlock'
import BlockToolbar from '@/components/canvas/BlockToolbar'
import StickerPicker from '@/components/canvas/StickerPicker'
import FontStylePicker from '@/components/canvas/FontStylePicker'
import { FRIENDS } from '@/data/mock'
import { submitPrintJob } from '@/lib/printJob'
import type { Block, TextStyle } from '@/types/canvas'
import { newBlockId } from '@/types/canvas'

const PROMPTS = [
  'What was the best part of your day yesterday?',
  'What is something you have been thankful for recently?',
  'Tell me something you\'ve been excited about.',
  'What made you smile today?',
  'What\'s something you want to remember from this week?',
]

export default function BlockBasedComposeScreen() {
  const navigate = useNavigate()
  const [selectedFriendId, setSelectedFriendId] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [sending, setSending] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  const selectedFriend = FRIENDS.find(f => f.id === selectedFriendId)

  const addTextBlock = () => {
    const newBlock: Block = {
      id: newBlockId(),
      type: 'text',
      content: '',
      style: 'normal',
    }
    setBlocks([...blocks, newBlock])
    setActiveBlockId(newBlock.id)
  }

  const addImageBlock = () => {
    const newBlock: Block = {
      id: newBlockId(),
      type: 'image',
      dataUrl: '',
    }
    setBlocks([...blocks, newBlock])
    setActiveBlockId(newBlock.id)
  }

  const addStickerBlock = () => {
    setShowStickerPicker(true)
  }

  const handleAddSticker = (stickerId: string) => {
    const newBlock: Block = {
      id: newBlockId(),
      type: 'sticker',
      stickerId,
    }
    setBlocks([...blocks, newBlock])
    setActiveBlockId(newBlock.id)
  }

  const updateBlock = (id: string, updates: any) => {
    setBlocks(blocks.map(block => (block.id === id ? { ...block, ...updates } : block)))
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id))
    setActiveBlockId(null)
  }

  const handleSend = async () => {
    if (!selectedFriendId || blocks.length === 0 || !receiptRef.current) return

    setSending(true)
    try {
      await submitPrintJob({
        receiptElement: receiptRef.current,
        recipientName: selectedFriend?.name ?? 'Unknown',
      })
      navigate(`/printing?to=${selectedFriendId}`)
    } catch (err) {
      console.error('Print job failed:', err)
      setSending(false)
    }
  }

  const activeBlock = blocks.find(b => b.id === activeBlockId)

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="px-6 pt-8 flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Receipt</h1>

        {/* Friend picker */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">To</label>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {FRIENDS.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFriendId(f.id)}
                className={`flex flex-col items-center gap-1.5 flex-shrink-0 transition-opacity ${
                  selectedFriendId && selectedFriendId !== f.id ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div
                  className={`rounded-full p-0.5 transition-all ${
                    selectedFriendId === f.id ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                  }`}
                >
                  <Avatar avatarId={f.avatarId} size={48} />
                </div>
                <span className="text-xs text-gray-600 w-16 text-center leading-tight">
                  {f.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview / Editor */}
        <div
          ref={receiptRef}
          className="bg-white border border-gray-200 rounded-sm shadow-sm p-5 mb-6 space-y-3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {/* Header */}
          <div className="text-xs text-gray-400 mb-2">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-sm font-semibold text-gray-800">
            To: {selectedFriend ? selectedFriend.name.split(' ')[0] : '___'}
          </div>
          <div className="text-sm text-gray-600 pb-3 border-b border-dashed border-gray-200">
            From: Matthew
          </div>

          {/* Prompt */}
          <p className="text-xs text-gray-500 italic leading-relaxed">{prompt}</p>

          {/* Blocks Editor */}
          <div className="space-y-2 my-4">
            {blocks.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6">Add text, images, or stickers...</p>
            ) : (
              blocks.map(block => (
                <div key={block.id} onClick={() => setActiveBlockId(block.id)}>
                  {block.type === 'text' && (
                    <TextBlock
                      content={block.content}
                      style={block.style}
                      isActive={activeBlockId === block.id}
                      onContentChange={content => updateBlock(block.id, { content })}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  )}
                  {block.type === 'image' && (
                    <ImageBlock
                      dataUrl={block.dataUrl}
                      isActive={activeBlockId === block.id}
                      onImageChange={dataUrl => updateBlock(block.id, { dataUrl })}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  )}
                  {block.type === 'sticker' && (
                    <StickerBlock
                      stickerId={block.stickerId}
                      isActive={activeBlockId === block.id}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Signature */}
          <div className="pt-2 border-t border-dashed border-gray-200 text-sm text-gray-600 italic">
            Love, Matthew
          </div>
        </div>

        {/* Block Toolbar */}
        <BlockToolbar
          onAddText={addTextBlock}
          onAddImage={addImageBlock}
          onAddSticker={addStickerBlock}
        />

        {/* Font Style Picker - shown when text block is active */}
        {activeBlock?.type === 'text' && (
          <div className="mt-4">
            <FontStylePicker
              current={activeBlock.style}
              onChange={style => updateBlock(activeBlock.id, { style: style as TextStyle })}
            />
          </div>
        )}

        {/* Sticker Picker Modal */}
        {showStickerPicker && (
          <StickerPicker
            onSelect={handleAddSticker}
            onClose={() => setShowStickerPicker(false)}
          />
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!selectedFriendId || blocks.length === 0 || sending}
          className="mt-6 w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:bg-blue-700 transition-colors"
        >
          {sending ? 'Sending...' : 'Send to Printer'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
