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
import { renderToPrintBuffer } from '@/lib/escpos'
import { submitPrintJob } from '@/lib/printJob'
import { useAuth } from '@/contexts/AuthContext'
import type { Block, TextStyle, CornerSticker, Signature } from '@/types/canvas'
import type { FriendProfile } from '@/types/app'
import { newBlockId, FONT_STYLES, STYLE_LABELS } from '@/types/canvas'
import headerLogoSvg from '@/assets/icons/header-logo.svg'
import headerSquidsCheckersSvg from '@/assets/icons/header-squids-checkers.svg'
import headerSquidsV1Svg from '@/assets/icons/header-squids-v1.svg'
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
  testMode?: boolean
}

function friendLabel(f: FriendProfile): string {
  return f.profile.display_name || f.profile.username || 'Friend'
}

export default function ReceiptEditor({ onboarding = false, testMode = false }: ReceiptEditorProps = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const draft = loadDraft()

  // State
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testPrintStatus, setTestPrintStatus] = useState<'idle' | 'rendering' | 'sending' | 'done' | 'error'>('idle')
  const [testPrintError, setTestPrintError] = useState<string | null>(null)
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [selectedFriendId, setSelectedFriendId] = useState('')
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [cornerSticker, setCornerSticker] = useState<CornerSticker | null>(null)
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null)
  const [showGiphyPicker, setShowGiphyPicker] = useState(false)
  const [stickerActive, setStickerActive] = useState(false)
  const [signature, setSignature] = useState<Signature>(() => {
    if (onboarding) {
      const draftSignature = loadDraft().content?.signature
      if (draftSignature) return draftSignature
    }
    const sunetId = user?.email?.split('@')[0] || ''
    return { text: sunetId ? `Love, ${sunetId}` : 'Love, ', style: 'inter' }
  })
  const [signatureActive, setSignatureActive] = useState(false)
  const [headerVariant, setHeaderVariant] = useState<'simple' | 'squids-checkers' | 'squids-v1' | 'none'>('simple')
  const [showFriendPicker, setShowFriendPicker] = useState(false)
  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const receiptRef = useRef<HTMLDivElement>(null)
  const cornerStickerAreaRef = useRef<HTMLDivElement>(null)
  const signatureAreaRef = useRef<HTMLDivElement>(null)
  const activeStickerPointersRef = useRef(new Map<number, { x: number; y: number }>())
  const activeSignaturePointersRef = useRef(new Map<number, { x: number; y: number }>())
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
  const signatureGestureRef = useRef<
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

  const prevHeaderVariant = () => {
    const variants = ['simple', 'squids-checkers', 'squids-v1', 'none'] as const
    const currentIndex = variants.indexOf(headerVariant)
    const prevIndex = (currentIndex - 1 + variants.length) % variants.length
    setHeaderVariant(variants[prevIndex])
  }

  const nextHeaderVariant = () => {
    const variants = ['simple', 'squids-checkers', 'squids-v1', 'none'] as const
    const currentIndex = variants.indexOf(headerVariant)
    const nextIndex = (currentIndex + 1) % variants.length
    setHeaderVariant(variants[nextIndex])
  }

  // For authenticated users: load friends
  useEffect(() => {
    if (!onboarding && user) {
      getFriends(user.id).then((loadedFriends) => {
        setFriends(loadedFriends)
        // Auto-select friend from query parameter if provided
        const toParam = searchParams.get('to')
        const emailParam = searchParams.get('email')

        if (emailParam) {
          setRecipientEmail(decodeURIComponent(emailParam))
        } else if (toParam) {
          const friendMatch = loadedFriends.find(f => f.profile.id === toParam)
          if (friendMatch) {
            setSelectedFriendId(friendMatch.profile.id)
          }
        }
      }).catch((e) => setError(e.message ?? 'Failed to load friends'))
    }
  }, [user, onboarding, searchParams])

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

  const recipientName = onboarding ? draft.recipient?.name ?? '' : ''
  const selectedFriend = friends.find(f => f.profile.id === selectedFriendId)

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
        signature,
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

  const getSignaturePointerDistance = () => {
    const pointers = [...activeSignaturePointersRef.current.values()]
    if (pointers.length < 2) return null
    return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y)
  }

  const resetSignatureGesture = () => {
    signatureGestureRef.current = null
  }

  const clampSignatureOffsets = (offsetX: number, offsetY: number) => {
    const area = signatureAreaRef.current
    if (!area) return { offsetX, offsetY }

    const maxHorizontalOffset = area.clientWidth * CORNER_STICKER_DRAG_CLAMP
    const maxVerticalOffset = area.clientHeight * CORNER_STICKER_DRAG_CLAMP

    return {
      offsetX: clamp(offsetX, -maxHorizontalOffset, maxHorizontalOffset),
      offsetY: clamp(offsetY, -maxVerticalOffset, maxVerticalOffset),
    }
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

  const handleSignaturePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!signatureActive) {
      setSignatureActive(true)
      return
    }

    e.preventDefault()
    e.stopPropagation()

    activeSignaturePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    ;(e.currentTarget as any).setPointerCapture(e.pointerId)

    if (activeSignaturePointersRef.current.size === 1) {
      signatureGestureRef.current = {
        type: 'drag',
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        initialOffsetX: signature.offsetX ?? 0,
        initialOffsetY: signature.offsetY ?? 0,
      }
      return
    }

    if (activeSignaturePointersRef.current.size === 2) {
      const startDistance = getSignaturePointerDistance()
      if (!startDistance) return
      signatureGestureRef.current = {
        type: 'pinch',
        startDistance,
        initialScale: signature.scale ?? 1,
      }
    }
  }

  const handleSignaturePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeSignaturePointersRef.current.has(e.pointerId)) return

    e.preventDefault()
    activeSignaturePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const gesture = signatureGestureRef.current
    if (!gesture) return

    if (gesture.type === 'drag') {
      if (gesture.pointerId !== e.pointerId) return

      const nextOffsets = clampSignatureOffsets(
        gesture.initialOffsetX + (e.clientX - gesture.startX),
        gesture.initialOffsetY + (e.clientY - gesture.startY),
      )

      updateSignature(nextOffsets)
      return
    }

    const distance = getSignaturePointerDistance()
    if (!distance) return

    updateSignature({
      scale: clamp(
        gesture.initialScale * (distance / gesture.startDistance),
        MIN_CORNER_STICKER_SCALE,
        MAX_CORNER_STICKER_SCALE,
      ),
    })
  }

  const handleSignaturePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.currentTarget as any).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as any).releasePointerCapture(e.pointerId)
    }
    activeSignaturePointersRef.current.delete(e.pointerId)

    if (activeSignaturePointersRef.current.size === 1) {
      const [[pointerId, pointer]] = activeSignaturePointersRef.current.entries()
      signatureGestureRef.current = {
        type: 'drag',
        pointerId,
        startX: pointer.x,
        startY: pointer.y,
        initialOffsetX: signature.offsetX ?? 0,
        initialOffsetY: signature.offsetY ?? 0,
      }
      return
    }

    resetSignatureGesture()
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

  const getReceiptState = () => ({
    blocks,
    currentPrompt,
    headerVariant,
    signature,
    cornerSticker,
  })

  const handleSend = () => {
    if (blocks.length === 0) return
    const receiptState = getReceiptState()
    if (testMode) {
      navigate(`/printing`, { state: { receiptState } })
      return
    }
    if (recipientEmail) {
      navigate(`/printing?email=${encodeURIComponent(recipientEmail)}`, { state: { receiptState } })
      return
    }
    if (!selectedFriendId || !selectedFriend) {
      setShowFriendPicker(true)
      return
    }
    navigate(`/printing?to=${selectedFriendId}`, { state: { receiptState } })
  }

  const handleSelectFriendFromPicker = (friendId: string) => {
    setSelectedFriendId(friendId)
    setShowFriendPicker(false)
    setFriendSearchQuery('')
    const receiptState = getReceiptState()
    navigate(`/printing?to=${friendId}`, { state: { receiptState } })
  }

  const filteredFriends = friends.filter(f =>
    friendLabel(f).toLowerCase().includes(friendSearchQuery.toLowerCase())
  )

  const handleSave = () => {
    if (blocks.length === 0) return
    // TODO: Implement actual saving to archive
    navigate('/archive')
  }

  const handleTestPrint = async () => {
    if (blocks.length === 0 || !receiptRef.current || !user?.id) return

    setTestPrintStatus('rendering')
    setTestPrintError(null)

    try {
      // Clone the receipt element and strip Tailwind classes to avoid oklch color parsing issues
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'fixed'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.backgroundColor = '#ffffff'
      tempDiv.appendChild(receiptClone)
      document.body.appendChild(tempDiv)

      // Remove all class attributes and styles to prevent oklch color issues
      receiptClone.removeAttribute('class')
      receiptClone.querySelectorAll('[class]').forEach(el => {
        el.removeAttribute('class')
      })

      // Set safe explicit styles
      receiptClone.style.backgroundColor = '#ffffff'
      receiptClone.style.color = '#222121'
      receiptClone.style.fontFamily = 'Georgia, serif'
      receiptClone.style.width = '576px'

      try {
        const buffer = await renderToPrintBuffer(receiptClone)
        console.log('✓ Rasterization successful! Buffer size:', buffer.length, 'bytes')
        setTestPrintStatus('sending')

        try {
          await submitPrintJob({
            receiptElement: receiptClone,
            recipientName: 'Test',
            messageText: 'Test receipt print',
            skipGeofence: true,
          })
          console.log('✓ Print submitted successfully')
        } catch (submitErr) {
          console.warn('Print submission failed (this is OK for testing rasterization):', submitErr)
          // For test mode, rasterization success is the important part
        }

        setTestPrintStatus('done')
        setTimeout(() => setTestPrintStatus('idle'), 2000)
      } finally {
        document.body.removeChild(tempDiv)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Test print error:', err)
      setTestPrintError(msg)
      setTestPrintStatus('error')
    }
  }

  const activeBlock = blocks.find(b => b.id === activeBlockId)

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <div className="px-6 pt-8 flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Share an Inkling</h1>

        {/* Friend picker - only for authenticated users, not in test mode */}
        {!onboarding && !testMode && friends.length > 0 && (
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
                        selectedFriendId === f.profile.id ? 'ring-2 ring-fill-primary ring-offset-2' : ''
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

        {/* Preview / Editor — receipt-shaped with torn bottom edge */}
        <div
          ref={receiptRef}
          className="bg-white shadow-md mb-6 overflow-hidden mx-auto"
          style={{ fontFamily: 'Georgia, serif', borderTop: '1px solid rgba(0,0,0,0.08)', borderLeft: '1px solid rgba(0,0,0,0.08)', borderRight: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#ffffff', color: '#222121', width: '576px', maxWidth: '100%' }}
        >
        <div className="p-5 space-y-3">
          {/* Header */}
          {/* Header with Logo and Arrows */}
          <div className="flex items-center justify-center gap-4 mb-6 mt-6">
            <button
              onClick={prevHeaderVariant}
              className="text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              &lt;
            </button>
            <div className="flex-shrink-0">
              {headerVariant === 'simple' ? (
                <img src={headerLogoSvg} alt="Inklings" className="h-16" />
              ) : headerVariant === 'squids-checkers' ? (
                <img src={headerSquidsCheckersSvg} alt="Inklings squids checkers" style={{ height: '138.24px' }} />
              ) : headerVariant === 'squids-v1' ? (
                <img src={headerSquidsV1Svg} alt="Inklings squids v1" style={{ height: '138.24px' }} />
              ) : null}
            </div>
            <button
              onClick={nextHeaderVariant}
              className="text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              &gt;
            </button>
          </div>

          {/* Recipient Bar */}
          <div className="relative mb-3">
            <img src={recipientBarSvg} alt="" className="w-full h-auto" />
            <div className="absolute inset-0 flex items-center px-3 text-white z-10" style={{ fontFamily: "var(--font-printvetica)", fontSize: '15.4px' }}>
              To: {recipientName || recipientEmail || (selectedFriend ? friendLabel(selectedFriend).split(' ')[0] : '___')}
            </div>
            {/* Date */}
            <div className="absolute top-1/2 right-3 text-xs text-white z-20" style={{ fontFamily: "var(--font-printvetica)", transform: 'translateY(-50%)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
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
                <div
                  key={block.id}
                  draggable
                  onClick={() => {
                    setActiveBlockId(block.id)
                    setStickerActive(false)
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

          {/* Signature and Corner sticker - Same row */}
          <div className="pt-2 mt-6 flex gap-4 items-end">
            {/* Signature - Left side */}
            <div className="flex-1">
              <div
                ref={signatureAreaRef}
                className="relative h-20"
                onPointerDown={handleSignaturePointerDown}
                onPointerMove={handleSignaturePointerMove}
                onPointerUp={handleSignaturePointerUp}
                onPointerCancel={handleSignaturePointerUp}
                style={{ touchAction: signatureActive ? 'none' : 'auto' }}
              >
                <div
                  className={`absolute left-0 top-0 ${signatureActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{
                    transform: `translate(${signature.offsetX ?? 0}px, ${signature.offsetY ?? 0}px) rotate(${signature.rotation ?? 0}deg) scale(${signature.scale ?? 1})`,
                    transformOrigin: '0 0',
                  }}
                >
                  {(() => {
                    const sunetId = user?.email?.split('@')[0] || ''
                    const defaultText = sunetId ? `Love, ${sunetId}` : 'Love, '
                    const isEdited = signature.text !== defaultText
                    const sunetPart = sunetId ? sunetId : ''

                    return (
                      <div>
                        <div>
                          <input
                            type="text"
                            value={signature.text}
                            onChange={(e) => updateSignature({ text: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            className={`whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-fill-primary px-1 py-0 bg-transparent border-0 ${signatureActive ? 'ring-2 ring-fill-primary' : ''}`}
                            style={{
                              fontFamily: FONT_STYLES[signature.style].fontFamily,
                              fontSize: `${FONT_STYLES[signature.style].fontSize}px`,
                              fontWeight: FONT_STYLES[signature.style].fontWeight,
                              lineHeight: FONT_STYLES[signature.style].lineHeight,
                              pointerEvents: signatureActive ? 'auto' : 'none',
                            }}
                          />
                        </div>
                        {!isEdited && sunetPart && (
                          <div style={{
                            fontSize: `${FONT_STYLES[signature.style].fontSize}px`,
                            color: '#999',
                            marginTop: '2px',
                          }}>
                            ({sunetId})
                          </div>
                        )}
                        {isEdited && sunetPart && (
                          <div style={{
                            fontSize: `${FONT_STYLES[signature.style].fontSize * 0.6}px`,
                            color: '#999',
                            marginTop: '2px',
                          }}>
                            ({sunetId})
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Corner sticker - Right side */}
            <div ref={cornerStickerAreaRef} className="relative h-56 w-56 flex-shrink-0">
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
                  onClick={() => {
                    setCornerSticker(null)
                    setStickerActive(false)
                  }}
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
        </div>
        {/* Torn zigzag bottom edge */}
        <div
          aria-hidden
          className="h-3 w-full bg-white"
          style={{
            maskImage:
              'linear-gradient(white, white), repeating-linear-gradient(135deg, transparent 0 6px, white 6px 12px)',
            WebkitMaskImage:
              'linear-gradient(white, white), repeating-linear-gradient(135deg, transparent 0 6px, white 6px 12px)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
          }}
        />
        <svg
          aria-hidden
          className="block w-full"
          height="14"
          viewBox="0 0 100 14"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L100,0 L100,4 L96,10 L92,4 L88,10 L84,4 L80,10 L76,4 L72,10 L68,4 L64,10 L60,4 L56,10 L52,4 L48,10 L44,4 L40,10 L36,4 L32,10 L28,4 L24,10 L20,4 L16,10 L12,4 L8,10 L4,4 L0,10 Z"
            fill="white"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="0.5"
          />
        </svg>
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
                        ? 'bg-fill-primary text-white'
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
                      ? 'bg-fill-primary text-white'
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
                        ? 'bg-fill-primary text-white'
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
                    ? 'bg-fill-primary text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
                style={{ fontStyle: 'italic' }}
              >
                I
              </button>
            )}
          </div>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
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
              className="w-full px-3 py-2 text-xs font-medium text-white bg-fill-primary rounded-lg hover:opacity-80 transition-colors"
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

        {/* Friend Selection Modal */}
        {showFriendPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Send to</h2>
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fill-primary mb-4"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                {filteredFriends.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No friends found</p>
                ) : (
                  filteredFriends.map((f) => (
                    <button
                      key={f.profile.id}
                      onClick={() => handleSelectFriendFromPicker(f.profile.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {f.profile.avatar_url ? (
                        <img src={f.profile.avatar_url} alt="" width={40} height={40} className="rounded-full object-cover flex-shrink-0" style={{ width: 40, height: 40 }} />
                      ) : (
                        <div className="flex-shrink-0">
                          <Avatar avatarId={1} size={40} />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{friendLabel(f)}</span>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowFriendPicker(false)}
                className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold text-sm active:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600">{error}</p>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this section? This action cannot be undone.
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

        {/* Inline CTA — placed at end of scroll content so it works reliably on iOS Safari */}
        <div className="mt-8 mb-6 flex gap-3">
          {onboarding ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={blocks.length === 0}
              className="text-callout text-text-inverse bg-fill-primary rounded-md w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
            >
              Continue to Send
            </button>
          ) : testMode ? (
            <>
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={blocks.length === 0 || testPrintStatus !== 'idle'}
                className="text-callout text-text-inverse bg-fill-primary rounded-md w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
              >
                {testPrintStatus === 'idle' && 'Test Print'}
                {testPrintStatus === 'rendering' && 'Rendering...'}
                {testPrintStatus === 'sending' && 'Sending...'}
                {testPrintStatus === 'done' && 'Sent!'}
                {testPrintStatus === 'error' && 'Error'}
              </button>
              {testPrintError && (
                <p className="text-xs text-red-600 mt-2">{testPrintError}</p>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={blocks.length === 0}
                className="text-callout text-text-primary border-fill-tertiary bg-white rounded-md flex-1 border py-3.5 disabled:opacity-40 disabled:cursor-not-allowed active:bg-bg-secondary transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={blocks.length === 0}
                className="text-callout text-text-inverse bg-fill-primary rounded-md flex-1 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
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
