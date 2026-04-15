export type TextStyle = 'normal' | 'heading' | 'handwriting' | 'pixel' | 'shout'

export type Block =
  | { id: string; type: 'text'; content: string; style: TextStyle }
  | { id: string; type: 'image'; dataUrl: string }
  | { id: string; type: 'sticker'; stickerId: string }

export interface FontStyleConfig {
  fontFamily: string
  fontSize: number
  fontWeight: number
  textTransform?: 'uppercase' | 'none'
  lineHeight: number
}

export const FONT_STYLES: Record<TextStyle, FontStyleConfig> = {
  normal: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.6,
  },
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  handwriting: {
    fontFamily: "'Caveat', cursive",
    fontSize: 20,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  pixel: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 10,
    fontWeight: 400,
    lineHeight: 2,
  },
  shout: {
    fontFamily: "'Permanent Marker', cursive",
    fontSize: 24,
    fontWeight: 400,
    textTransform: 'uppercase',
    lineHeight: 1.3,
  },
}

export const STYLE_LABELS: Record<TextStyle, string> = {
  normal: 'Serif',
  heading: 'Heading',
  handwriting: 'Handwriting',
  pixel: 'Pixel',
  shout: 'Shout!',
}

let _blockId = 0
export function newBlockId(): string {
  return `block-${Date.now()}-${_blockId++}`
}
