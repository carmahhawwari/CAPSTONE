import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import TextBlock from '@/components/canvas/TextBlock'
import ImageBlock from '@/components/canvas/ImageBlock'
import StickerBlock from '@/components/canvas/StickerBlock'
import BlockToolbar from '@/components/canvas/BlockToolbar'
import StickerPicker from '@/components/canvas/StickerPicker'
import GiphyStickerPicker from '@/components/canvas/GiphyStickerPicker'
import FontStylePicker from '@/components/canvas/FontStylePicker'
import FontSizeSlider from '@/components/canvas/FontSizeSlider'
import FontWeightSlider from '@/components/canvas/FontWeightSlider'
import RedactionLevelSlider from '@/components/canvas/RedactionLevelSlider'
import ImageAdjustmentPanel from '@/components/canvas/ImageAdjustmentPanel'
import { DEFAULT_ADJUSTMENTS } from '@/lib/imageProcessing'
import { loadDraft, saveDraft } from '@/lib/onboardingDraft'
import { getFriends } from '@/lib/friends'
import { useAuth } from '@/contexts/AuthContext'
import type { Block, TextStyle, CornerSticker } from '@/types/canvas'
import type { FriendProfile } from '@/types/app'
import { newBlockId } from '@/types/canvas'
import headerLogoSvg from '@/assets/icons/header-logo.svg'
import headerSquidsSvg from '@/assets/icons/header-squids.svg'
import recipientBarSvg from '@/assets/icons/recipient-bar.svg'

const PROMPTS = [
  'The best part of my day yesterday was...',
  'Something I\'ve been thankful for recently is...',
  'Something I\'ve been excited about is...',
  'Something that made me smile today was...',
  'Something I want to remember from this week is...',
]

const FONTS_WITH_ITALIC = ['inter', 'normal', 'heading', 'handwriting', 'liquida', 'dottonoji', 'tsuchinoko', 'redaction'] as const
const DEFAULT_CORNER_STICKER_ROTATION = 0
const DEFAULT_CORNER_STICKER_SCALE = 1.1
const MIN_CORNER_STICKER_SCALE = 0.5
const MAX_CORNER_STICKER_SCALE = 2.5
const CORNER_STICKER_DRAG_CLAMP = 0.35
const CORNER_STICKER_SIZE = 224

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeCornerSticker(sticker: CornerSticker): CornerSticker {
  return {
    ...sticker,
    rotation: sticker.rotation ?? DEFAULT_CORNER_STICKER_ROTATION,
    scale: sticker.scale ?? DEFAULT_CORNER_STICKER_SCALE,
    offsetX: sticker.offsetX ?? 0,
    offsetY: sticker.offsetY ?? 0,
  }
}

function supportsItalic(style: TextStyle): boolean {
  return FONTS_WITH_ITALIC.includes(style as any)
}

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
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [cornerSticker, setCornerSticker] = useState<CornerSticker | null>(null)
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [stickerActive, setStickerActive] = useState(false)
  const [headerVariant, setHeaderVariant] = useState<'simple' | 'logo'>('simple')
  const receiptRef = useRef<HTMLDivElement>(null)
  const cornerStickerAreaRef = useRef<HTMLDivElement>(null)
  const activeStickerPointersRef = useRef(new Map<number, { x: number; y: number }>())
  const stickerGestureRef = useRef<
    | {
      type: 'drag'
      pointerId: number
      startX: number
      startY: number
      initialOffsetX: number
      initialOffsetY: number
    }
    | {
      type: 'pinch'
      startDistance: number
      initialScale: number
    }
    | null
  >(null)

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
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setBlocks(blocks.filter(block => block.id !== deleteConfirmId))
      setActiveBlockId(null)
      setDeleteConfirmId(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetBlockId: string) => {
    if (!draggedBlockId || draggedBlockId === targetBlockId) return

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId)
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newBlocks = [...blocks]
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, draggedBlock)
    setBlocks(newBlocks)
    setDraggedBlockId(null)
  }

  const handleContinue = () => {
    if (blocks.length === 0) return
    saveDraft({
      content: {
        blocks,
        prompt: currentPrompt === 'No prompt' ? '' : currentPrompt,
        cornerSticker: cornerSticker ?? undefined,
        headerVariant,
      },
    })
    navigate('/onboard/deliver')
  }

  const clampStickerOffsets = (offsetX: number, offsetY: number) => {
    const area = cornerStickerAreaRef.current
    if (!area) return { offsetX, offsetY }

    const maxHorizontalOffset = area.clientWidth * CORNER_STICKER_DRAG_CLAMP
    const maxVerticalOffset = area.clientHeight * CORNER_STICKER_DRAG_CLAMP

    return {
      offsetX: clamp(offsetX, -maxHorizontalOffset, maxHorizontalOffset),
      offsetY: clamp(offsetY, -maxVerticalOffset, maxVerticalOffset),
    }
  }

  const updateCornerSticker = (updates: Partial<CornerSticker> | ((current: CornerSticker) => Partial<CornerSticker>)) => {
    setCornerSticker((current) => {
      if (!current) return current
      const nextUpdates = typeof updates === 'function' ? updates(current) : updates
      return normalizeCornerSticker({ ...current, ...nextUpdates })
    })
  }

  const handleSelectCornerSticker = (sticker: CornerSticker) => {
    setCornerSticker(normalizeCornerSticker(sticker))
    setStickerActive(true)
  }

  const getStickerPointerDistance = () => {
    const pointers = [...activeStickerPointersRef.current.values()]
    if (pointers.length < 2) return null
    return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y)
  }

  const resetStickerGesture = () => {
    stickerGestureRef.current = null
  }

  const handleCornerStickerPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!cornerSticker) return

    if (!stickerActive) {
      setStickerActive(true)
      return
    }

    e.preventDefault()
    e.stopPropagation()

    activeStickerPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)

    if (activeStickerPointersRef.current.size === 1) {
      stickerGestureRef.current = {
        type: 'drag',
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        initialOffsetX: cornerSticker.offsetX ?? 0,
        initialOffsetY: cornerSticker.offsetY ?? 0,
      }
      return
    }

    if (activeStickerPointersRef.current.size === 2) {
      const startDistance = getStickerPointerDistance()
      if (!startDistance) return
      stickerGestureRef.current = {
        type: 'pinch',
        startDistance,
        initialScale: cornerSticker.scale ?? DEFAULT_CORNER_STICKER_SCALE,
      }
    }
  }

  const handleCornerStickerPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!activeStickerPointersRef.current.has(e.pointerId)) return

    e.preventDefault()
    activeStickerPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const gesture = stickerGestureRef.current
    if (!gesture) return

    if (gesture.type === 'drag') {
      if (gesture.pointerId !== e.pointerId) return

      const nextOffsets = clampStickerOffsets(
        gesture.initialOffsetX + (e.clientX - gesture.startX),
        gesture.initialOffsetY + (e.clientY - gesture.startY),
      )

      updateCornerSticker(nextOffsets)
      return
    }

    const distance = getStickerPointerDistance()
    if (!distance) return

    updateCornerSticker({
      scale: clamp(
        gesture.initialScale * (distance / gesture.startDistance),
        MIN_CORNER_STICKER_SCALE,
        MAX_CORNER_STICKER_SCALE,
      ),
    })
  }

  const handleCornerStickerPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    activeStickerPointersRef.current.delete(e.pointerId)

    if (activeStickerPointersRef.current.size === 1 && cornerSticker) {
      const [[pointerId, pointer]] = activeStickerPointersRef.current.entries()
      stickerGestureRef.current = {
        type: 'drag',
        pointerId,
        startX: pointer.x,
        startY: pointer.y,
        initialOffsetX: cornerSticker.offsetX ?? 0,
        initialOffsetY: cornerSticker.offsetY ?? 0,
      }
      return
    }

    resetStickerGesture()
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Share an Inkling</h1>

        {/* Header variant selector */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setHeaderVariant('simple')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              headerVariant === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setHeaderVariant('logo')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              headerVariant === 'logo'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Logo
          </button>
        </div>

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
          className="bg-white border border-gray-200 rounded-sm shadow-sm p-5 mb-6 space-y-3 overflow-hidden"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {/* Header */}
          {headerVariant === 'simple' ? (
            <>
              <div className="text-center mb-2">
                <img src={headerLogoSvg} alt="Inklings" className="h-16 mx-auto" />
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="bg-black text-white px-3 py-2 text-sm font-semibold mb-1">
                To: {recipientName || (selectedFriend ? friendLabel(selectedFriend).split(' ')[0] : '___')}
              </div>
              <img src={recipientBarSvg} alt="" className="w-full h-auto mb-3" />
            </>
          ) : (
            <>
              <div className="text-center mb-3 flex justify-center">
                <img src={headerSquidsSvg} alt="Inklings squids" className="h-24" />
              </div>
              <div className="bg-black text-white px-3 py-2 text-sm font-semibold mb-1">
                To: {recipientName || (selectedFriend ? friendLabel(selectedFriend).split(' ')[0] : '___')}
              </div>
              <img src={recipientBarSvg} alt="" className="w-full h-auto mb-3" />
            </>
          )}

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
                <div
                  key={block.id}
                  draggable
                  onClick={() => setActiveBlockId(block.id)}
                  onDragStart={() => handleDragStart(block.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(block.id)}
                  className={`cursor-move select-none ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                >
                  {block.type === 'text' && (
                    <TextBlock
                      content={block.content}
                      style={block.style}
                      fontSizeMultiplier={block.fontSizeMultiplier}
                      redactionLevel={block.redactionLevel}
                      fontWeight={block.fontWeight}
                      isItalic={block.isItalic}
                      isBold={block.isBold}
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

          {/* Corner sticker */}
          <div ref={cornerStickerAreaRef} className="relative h-56 mt-6 mb-0">
            {cornerSticker ? (
              <div
                className="absolute bottom-0 right-0 group"
                style={{
                  transform: `translate(${cornerSticker.offsetX ?? 0}px, ${cornerSticker.offsetY ?? 0}px)`,
                }}
              >
                <button
                  type="button"
                  onPointerDown={handleCornerStickerPointerDown}
                  onPointerMove={handleCornerStickerPointerMove}
                  onPointerUp={handleCornerStickerPointerUp}
                  onPointerCancel={handleCornerStickerPointerUp}
                  className={`focus:outline-none transform transition-all ${
                    stickerActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:scale-110 active:scale-90'
                  }`}
                  style={{
                    transform: `rotate(${cornerSticker.rotation ?? DEFAULT_CORNER_STICKER_ROTATION}deg) scale(${cornerSticker.scale ?? DEFAULT_CORNER_STICKER_SCALE})`,
                    touchAction: stickerActive ? 'none' : 'auto',
                  }}
                  aria-pressed={stickerActive}
                >
                  {cornerSticker.ditheredDataUrl ? (
                    <img
                      src={cornerSticker.ditheredDataUrl}
                      alt="Corner sticker"
                      className="object-contain"
                      style={{ width: CORNER_STICKER_SIZE, height: CORNER_STICKER_SIZE }}
                    />
                  ) : (
                    <img
                      src={cornerSticker.fullUrl}
                      crossOrigin="anonymous"
                      alt="Corner sticker"
                      className="object-contain"
                      style={{ width: CORNER_STICKER_SIZE, height: CORNER_STICKER_SIZE, filter: 'grayscale(100%)' }}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCornerSticker(null)}
                  className={`absolute -top-4 -left-4 w-7 h-7 rounded-full bg-red-500 text-white text-lg flex items-center justify-center hover:bg-red-600 transition-colors shadow-md ${
                    stickerActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label="Remove corner sticker"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowGiphyPicker(true)}
                className="absolute bottom-0 right-0 w-28 h-28 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-5xl hover:text-gray-400 hover:border-gray-300 transition-all focus:outline-none"
              >
                +
              </button>
            )}
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
            {activeBlock.style === 'redaction' && (
              <RedactionLevelSlider
                value={activeBlock.redactionLevel ?? 50}
                onChange={redactionLevel => updateBlock(activeBlock.id, { redactionLevel })}
              />
            )}
            {activeBlock.style === 'inter' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <FontWeightSlider
                    value={activeBlock.fontWeight ?? 400}
                    onChange={fontWeight => updateBlock(activeBlock.id, { fontWeight })}
                  />
                </div>
                {supportsItalic(activeBlock.style) && (
                  <button
                    onClick={() => updateBlock(activeBlock.id, { isItalic: !activeBlock.isItalic })}
                    className={`mt-8 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                      activeBlock.isItalic
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    style={{ fontStyle: 'italic' }}
                  >
                    I
                  </button>
                )}
              </div>
            )}
            {activeBlock.style === 'tsuchinoko' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateBlock(activeBlock.id, { isBold: !activeBlock.isBold })}
                  className={`px-3 py-2 rounded text-sm font-bold transition-colors ${
                    activeBlock.isBold
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Bold
                </button>
                {supportsItalic(activeBlock.style) && (
                  <button
                    onClick={() => updateBlock(activeBlock.id, { isItalic: !activeBlock.isItalic })}
                    className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                      activeBlock.isItalic
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    style={{ fontStyle: 'italic' }}
                  >
                    I
                  </button>
                )}
              </div>
            )}
            {supportsItalic(activeBlock.style) && activeBlock.style !== 'inter' && activeBlock.style !== 'tsuchinoko' && (
              <button
                onClick={() => updateBlock(activeBlock.id, { isItalic: !activeBlock.isItalic })}
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                  activeBlock.isItalic
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
                style={{ fontStyle: 'italic' }}
              >
                I
              </button>
            )}
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

        {/* Corner Sticker Control Panel */}
        {cornerSticker && stickerActive && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Adjust sticker</h3>

            {/* Rotation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-600">Rotation</label>
                <span className="text-xs text-gray-500">{cornerSticker.rotation ?? DEFAULT_CORNER_STICKER_ROTATION}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={cornerSticker.rotation ?? DEFAULT_CORNER_STICKER_ROTATION}
                onChange={e => updateCornerSticker({ rotation: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Scale Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-600">Scale</label>
                <span className="text-xs text-gray-500">{(cornerSticker.scale ?? DEFAULT_CORNER_STICKER_SCALE).toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={MIN_CORNER_STICKER_SCALE}
                max={MAX_CORNER_STICKER_SCALE}
                step="0.1"
                value={cornerSticker.scale ?? DEFAULT_CORNER_STICKER_SCALE}
                onChange={e => updateCornerSticker({ scale: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <p className="text-xs text-gray-500">
              Use one finger to drag and two fingers to scale while this panel is open.
            </p>

            {/* Reset Button */}
            <button
              onClick={() => updateCornerSticker({
                rotation: DEFAULT_CORNER_STICKER_ROTATION,
                scale: DEFAULT_CORNER_STICKER_SCALE,
                offsetX: 0,
                offsetY: 0,
              })}
              className="w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset to default
            </button>

            {/* Close Panel */}
            <button
              onClick={() => setStickerActive(false)}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Sticker Picker Modal */}
        {showStickerPicker && (
          <StickerPicker
            onSelect={handleAddSticker}
            onClose={() => setShowStickerPicker(false)}
          />
        )}

        {/* GIPHY Sticker Picker Modal */}
        {showGiphyPicker && (
          <GiphyStickerPicker
            onSelect={handleSelectCornerSticker}
            onClose={() => setShowGiphyPicker(false)}
          />
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600">{error}</p>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom">
              <p className="text-sm text-gray-700">
                Delete this block? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold text-sm active:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold text-sm active:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
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

        {/* Mobile Trash Button */}
        {blocks.length > 0 && (
          <div className="mt-4 md:hidden">
            <button
              onClick={() => activeBlockId && deleteBlock(activeBlockId)}
              disabled={!activeBlockId}
              className="w-full py-3 rounded-lg bg-red-50 text-red-600 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              Delete Block
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
