import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import TextBlock from '@/components/canvas/TextBlock'
import ImageBlock from '@/components/canvas/ImageBlock'
import StickerBlock from '@/components/canvas/StickerBlock'
import BlockToolbar from '@/components/canvas/BlockToolbar'
import StickerPicker from '@/components/canvas/StickerPicker'
import FontStylePicker from '@/components/canvas/FontStylePicker'
import FontSizeSlider from '@/components/canvas/FontSizeSlider'
import ImageAdjustmentPanel from '@/components/canvas/ImageAdjustmentPanel'
import { DEFAULT_ADJUSTMENTS } from '@/lib/imageProcessing'
import { loadDraft, saveDraft } from '@/lib/onboardingDraft'
import { getFriends } from '@/lib/friends'
import { useAuth } from '@/contexts/AuthContext'
import type { Block, TextStyle } from '@/types/canvas'
import type { FriendProfile } from '@/types/app'
import { newBlockId } from '@/types/canvas'

const PROMPTS = [
  'What was the best part of your day yesterday?',
  'What is something you have been thankful for recently?',
  'Tell me something you\'ve been excited about.',
  'What made you smile today?',
  'What\'s something you want to remember from this week?',
]

interface ReceiptEditorProps {
  onboarding?: boolean
}

function friendLabel(f: FriendProfile): string {
  return f.profile.display_name || f.profile.username || 'Friend'
}

export default function ReceiptEditor({ onboarding = false }: ReceiptEditorProps = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const draft = loadDraft()

  // State
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [selectedFriendId, setSelectedFriendId] = useState('')
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Generate 3 random prompts + no prompt option
  const [prompts] = useState(() => {
    const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5)
    return [...shuffled.slice(0, 3), 'No prompt']
  })

  const currentPrompt = prompts[currentPromptIndex]

  const nextPrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % prompts.length)
  }

  const prevPrompt = () => {
    setCurrentPromptIndex((prev) => (prev - 1 + prompts.length) % prompts.length)
  }

  // For authenticated users: load friends
  useEffect(() => {
    if (!onboarding && user) {
      getFriends(user.id).then((loadedFriends) => {
        setFriends(loadedFriends)
        // Auto-select friend from query parameter if provided
        const toParam = searchParams.get('to')
        if (toParam) {
          const friendMatch = loadedFriends.find(f => f.profile.id === toParam)
          if (friendMatch) {
            setSelectedFriendId(friendMatch.profile.id)
          }
        }
      }).catch((e) => setError(e.message ?? 'Failed to load friends'))
    }
  }, [user, onboarding, searchParams])

  const recipientName = onboarding ? draft.recipient?.name ?? '' : ''
  const selectedFriend = friends.find(f => f.profile.id === selectedFriendId)

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

  const handleContinue = () => {
    if (blocks.length === 0) return
    saveDraft({ content: { blocks, prompt: currentPrompt === 'No prompt' ? '' : currentPrompt } })
    navigate('/onboard/deliver')
  }

  const handleSend = () => {
    if (!selectedFriendId || !selectedFriend || blocks.length === 0) return
    // TODO: Implement actual sending to printer
    navigate(`/printing?to=${selectedFriendId}`)
  }

  const handleSave = () => {
    if (blocks.length === 0) return
    // TODO: Implement actual saving to archive
    navigate('/archive')
  }

  const activeBlock = blocks.find(b => b.id === activeBlockId)

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="px-6 pt-8 flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Receipt</h1>

        {/* Friend picker - only for authenticated users */}
        {!onboarding && friends.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">To</label>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {friends.map((f) => {
                const label = friendLabel(f).split(' ')[0]
                return (
                  <button
                    key={f.profile.id}
                    onClick={() => setSelectedFriendId(f.profile.id)}
                    className={`flex flex-col items-center gap-1.5 flex-shrink-0 transition-opacity ${
                      selectedFriendId && selectedFriendId !== f.profile.id ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    <div
                      className={`rounded-full p-0.5 transition-all ${
                        selectedFriendId === f.profile.id ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                      }`}
                    >
                      {f.profile.avatar_url ? (
                        <img src={f.profile.avatar_url} alt="" width={48} height={48} className="rounded-full object-cover" style={{ width: 48, height: 48 }} />
                      ) : (
                        <Avatar avatarId={1} size={48} />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 w-16 text-center leading-tight">
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
            To: {recipientName || (selectedFriend ? friendLabel(selectedFriend).split(' ')[0] : '___')}
          </div>
          <div className="text-sm text-gray-600 pb-3 border-b border-dashed border-gray-200">
            From: {user?.email?.split('@')[0] ?? 'Me'}
          </div>

          {/* Prompt Picker */}
          <div className="flex items-center gap-3 py-2">
            <button
              onClick={prevPrompt}
              className="text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              &lt;
            </button>
            <div className="flex-1 text-center">
              {currentPrompt === 'No prompt' ? (
                <p className="text-xs text-gray-400 italic">(no prompt)</p>
              ) : (
                <p className="text-xs text-gray-500 italic leading-relaxed">{currentPrompt}</p>
              )}
            </div>
            <button
              onClick={nextPrompt}
              className="text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              &gt;
            </button>
          </div>

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
                      fontSizeMultiplier={block.fontSizeMultiplier}
                      isActive={activeBlockId === block.id}
                      onContentChange={content => updateBlock(block.id, { content })}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  )}
                  {block.type === 'image' && (
                    <ImageBlock
                      dataUrl={block.dataUrl}
                      adjustments={block.adjustments}
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
            Love, Me
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
          <div className="mt-4 space-y-2">
            <FontStylePicker
              current={activeBlock.style}
              onChange={style => updateBlock(activeBlock.id, { style: style as TextStyle })}
            />
            <FontSizeSlider
              value={activeBlock.fontSizeMultiplier ?? 1}
              onChange={fontSizeMultiplier => updateBlock(activeBlock.id, { fontSizeMultiplier })}
            />
          </div>
        )}

        {/* Image Adjustment Panel - shown when image block is active */}
        {activeBlock?.type === 'image' && (
          <ImageAdjustmentPanel
            dataUrl={activeBlock.dataUrl}
            adjustments={activeBlock.adjustments ?? DEFAULT_ADJUSTMENTS}
            onAdjustmentsChange={adjustments => updateBlock(activeBlock.id, { adjustments })}
          />
        )}

        {/* Sticker Picker Modal */}
        {showStickerPicker && (
          <StickerPicker
            onSelect={handleAddSticker}
            onClose={() => setShowStickerPicker(false)}
          />
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600">{error}</p>
        )}

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          {onboarding ? (
            <button
              onClick={handleContinue}
              disabled={blocks.length === 0}
              className="w-full py-3.5 rounded-xl bg-black text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:bg-gray-800 transition-colors"
            >
              Continue to Send
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={blocks.length === 0}
                className="flex-1 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:bg-gray-50 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedFriendId || blocks.length === 0}
                className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:bg-blue-700 transition-colors"
              >
                Send to Printer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
