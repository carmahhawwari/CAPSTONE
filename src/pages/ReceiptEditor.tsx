import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextBlock from '@/components/canvas/TextBlock'
import ImageBlock from '@/components/canvas/ImageBlock'
import StickerBlock from '@/components/canvas/StickerBlock'
import BlockToolbar from '@/components/canvas/BlockToolbar'
import StickerPicker from '@/components/canvas/StickerPicker'
import FontStylePicker from '@/components/canvas/FontStylePicker'
import FontSizeSlider from '@/components/canvas/FontSizeSlider'
import FontWeightSlider from '@/components/canvas/FontWeightSlider'
import RedactionLevelSlider from '@/components/canvas/RedactionLevelSlider'
import ImageAdjustmentPanel from '@/components/canvas/ImageAdjustmentPanel'
import { DEFAULT_ADJUSTMENTS } from '@/lib/imageProcessing'
import { loadDraft, saveDraft } from '@/lib/onboardingDraft'
import { useAuth } from '@/contexts/AuthContext'
import type { Block, TextStyle, Signature } from '@/types/canvas'
import { newBlockId, STYLE_LABELS } from '@/types/canvas'
import headerLogoSvg from '@/assets/icons/header-logo.svg'
import recipientBarSvg from '@/assets/icons/recipient-bar.svg'

export default function ReceiptEditor() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const draft = loadDraft()

  // State
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const existing: Block[] = loadDraft().content?.blocks ?? []
    const hasImage = existing.some((b) => b.type === 'image')
    const hasText = existing.some((b) => b.type === 'text')
    const merged: Block[] = []
    if (!hasImage) merged.push({ id: newBlockId(), type: 'image', dataUrl: '' })
    if (!hasText) merged.push({ id: newBlockId(), type: 'text', content: '', style: 'inter' })
    return [...merged, ...existing]
  })
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [error, _setError] = useState<string | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [signature, setSignature] = useState<Signature>(() => {
    const draftSignature = loadDraft().content?.signature
    if (draftSignature) return draftSignature
    const displayName = (user?.user_metadata?.display_name as string) || (user?.user_metadata?.full_name as string) || ''
    const name = displayName.split(' ')[0] || user?.email?.split('@')[0] || ''
    return { text: name ? `Love, ${name}` : 'Love, ', style: 'inter' }
  })
  const [signatureActive, setSignatureActive] = useState(false)
  const headerVariant = 'simple' as const
  const receiptRef = useRef<HTMLDivElement>(null)
  const signatureAreaRef = useRef<HTMLDivElement>(null)


  // Handle deselecting signature with Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && signatureActive) {
        setSignatureActive(false)
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (signatureActive && signatureAreaRef.current && !signatureAreaRef.current.contains(e.target as Node)) {
        setSignatureActive(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
    }
  }, [signatureActive])

  const [recipientDisplayName, setRecipientDisplayName] = useState(() => {
    return draft.recipient?.name ?? ''
  })

  const addTextBlock = () => {
    const newBlock: Block = {
      id: newBlockId(),
      type: 'text',
      content: '',
      style: 'inter',
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

  const handleAddSticker = (stickerId: string) => {
    const active = blocks.find((b) => b.id === activeBlockId)
    if (active && active.type === 'sticker' && !active.stickerId) {
      // Fill the existing empty sticker slot instead of appending a new one.
      setBlocks(blocks.map((b) => (b.id === active.id ? { ...b, stickerId } : b)))
      return
    }
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
        prompt: '',
        signature,
        headerVariant,
      },
    })
    navigate('/onboard/recipient')
  }

  const updateSignature = (updates: Partial<Signature> | ((current: Signature) => Partial<Signature>)) => {
    setSignature((current) => {
      const nextUpdates = typeof updates === 'function' ? updates(current) : updates
      return {
        ...current,
        ...nextUpdates,
        rotation: nextUpdates.rotation ?? current.rotation ?? 0,
        scale: nextUpdates.scale ?? current.scale ?? 1,
        offsetX: nextUpdates.offsetX ?? current.offsetX ?? 0,
        offsetY: nextUpdates.offsetY ?? current.offsetY ?? 0,
      }
    })
  }


  const activeBlock = blocks.find(b => b.id === activeBlockId)

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="px-6 pt-8 flex-1 overflow-y-auto">

        {/* Receipt paper */}
        <div
          ref={receiptRef}
          className="bg-white shadow-md mb-6 overflow-hidden"
          style={{ fontFamily: 'Georgia, serif', borderTop: '1px solid rgba(0,0,0,0.08)', borderLeft: '1px solid rgba(0,0,0,0.08)', borderRight: '1px solid rgba(0,0,0,0.08)' }}
        >
        <div className="p-5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-center mb-6 mt-6">
            <img src={headerLogoSvg} alt="Inklings" className="h-16" />
          </div>

          {/* Recipient Bar */}
          <div className="mb-3">
            <div className="h-[24px] mb-2">
              <img src={recipientBarSvg} alt="" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Recipient Info */}
          <div className="flex items-center px-3 text-black gap-2 mb-3" style={{ fontFamily: "var(--font-printvetica)", fontSize: '15.4px', lineHeight: 1.2 }}>
            <div className="flex items-center gap-0 min-w-0 flex-1">
              <span className="shrink-0">To:&nbsp;</span>
              <input
                type="text"
                value={recipientDisplayName}
                onChange={(e) => setRecipientDisplayName(e.target.value)}
                placeholder="___"
                className="bg-transparent border-0 outline-none p-0 m-0 min-w-0 flex-1"
                style={{ fontFamily: "var(--font-printvetica)", fontSize: '15.4px', lineHeight: 1.2 }}
              />
            </div>
            <span className="ml-auto shrink-0 text-xs">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
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
                  onClick={() => {
                    setActiveBlockId(block.id)
                  }}
                  onDragStart={() => handleDragStart(block.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(block.id)}
                  className={`relative group cursor-move select-none ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
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
                      size={block.size}
                      outline={block.outline}
                      isActive={activeBlockId === block.id}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                      onSizeChange={(size) => updateBlock(block.id, { size })}
                      onOutlineToggle={(outline) => updateBlock(block.id, { outline })}
                    />
                  )}
                  {activeBlockId === block.id && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
                      className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-500 text-white text-lg flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      aria-label="Delete block"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom row: Signature */}
          <div className="mt-8 pt-4 border-t border-dashed border-gray-200">
            <div
              ref={signatureAreaRef}
              className="py-2"
            >
              <input
                type="text"
                value={signature.text}
                onChange={(e) => updateSignature({ text: e.target.value })}
                placeholder="Love, [your name]"
                className="w-full focus:outline-none border-0 bg-transparent px-0 py-1 text-sm italic"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '14px',
                  color: '#4b5563',
                }}
              />
            </div>
          </div>
        </div>
        </div>

        {/* Block Toolbar */}
        <BlockToolbar
          onAddText={addTextBlock}
          onAddImage={addImageBlock}
        />

        {/* Font Style Picker - collapsed by default; click 'Customize text' to open */}
        {activeBlock?.type === 'text' && (
          <details className="mt-4 group">
            <summary className="text-xs font-medium text-gray-500 cursor-pointer select-none list-none flex items-center gap-1 hover:text-gray-700">
              <span className="inline-block transition-transform group-open:rotate-90">›</span>
              Customize text
            </summary>
            <div className="mt-3 space-y-5">
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
              <FontWeightSlider
                value={activeBlock.fontWeight ?? 400}
                onChange={fontWeight => updateBlock(activeBlock.id, { fontWeight })}
              />
            )}
            {activeBlock.style === 'tsuchinoko' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateBlock(activeBlock.id, { isBold: !activeBlock.isBold })}
                  className={`px-3 py-2 rounded text-sm font-bold transition-colors ${
                    activeBlock.isBold
                      ? 'bg-fill-primary text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Bold
                </button>
              </div>
            )}
            </div>
          </details>
        )}

        {/* Signature Font Picker - shown when signature is active */}
        {signatureActive && (
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(STYLE_LABELS).map(([style, label]) => (
                <button
                  key={style}
                  onClick={() => updateSignature({ style: style as TextStyle })}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    signature.style === style
                      ? 'bg-fill-primary text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Adjustment Panel - collapsed by default */}
        {activeBlock?.type === 'image' && (
          <details className="mt-4 group">
            <summary className="text-xs font-medium text-gray-500 cursor-pointer select-none list-none flex items-center gap-1 hover:text-gray-700">
              <span className="inline-block transition-transform group-open:rotate-90">›</span>
              Customize image
            </summary>
            <ImageAdjustmentPanel
              dataUrl={activeBlock.dataUrl}
              adjustments={activeBlock.adjustments ?? DEFAULT_ADJUSTMENTS}
              onAdjustmentsChange={adjustments => updateBlock(activeBlock.id, { adjustments })}
            />
          </details>
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

        {/* CTA */}
        <div className="mt-10 mb-8">
          <button
            type="button"
            onClick={handleContinue}
            disabled={blocks.length === 0}
            className="text-callout text-text-inverse bg-fill-primary rounded-lg w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
          >
            Continue to Send
          </button>
        </div>

      </div>
    </div>
  )
}
