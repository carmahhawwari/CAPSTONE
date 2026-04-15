import type { ReactNode } from 'react'

export interface StickerDef {
  id: string
  label: string
  svg: ReactNode
}

const S = 64

export const STICKERS: StickerDef[] = [
  {
    id: 'heart',
    label: 'Heart',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <path d="M32 56S6 40 6 22a13 13 0 0126 0 13 13 0 0126 0C58 40 32 56 32 56z" stroke="black" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'star',
    label: 'Star',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <path d="M32 4l8.5 17.2L59 24l-13.5 13.2L48.7 56 32 47.2 15.3 56l3.2-18.8L5 24l18.5-2.8z" stroke="black" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'smiley',
    label: 'Smiley',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="26" stroke="black" strokeWidth="3" />
        <circle cx="22" cy="26" r="3" fill="black" />
        <circle cx="42" cy="26" r="3" fill="black" />
        <path d="M20 40c4 6 20 6 24 0" stroke="black" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'sun',
    label: 'Sun',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="12" stroke="black" strokeWidth="3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
          const r1 = 17, r2 = 26, rad = (a * Math.PI) / 180
          return (
            <line key={a} x1={32 + r1 * Math.cos(rad)} y1={32 + r1 * Math.sin(rad)} x2={32 + r2 * Math.cos(rad)} y2={32 + r2 * Math.sin(rad)} stroke="black" strokeWidth="3" strokeLinecap="round" />
          )
        })}
      </svg>
    ),
  },
  {
    id: 'flower',
    label: 'Flower',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="7" stroke="black" strokeWidth="2.5" />
        {[0, 60, 120, 180, 240, 300].map(a => {
          const rad = (a * Math.PI) / 180
          return <circle key={a} cx={32 + 13 * Math.cos(rad)} cy={32 + 13 * Math.sin(rad)} r="7" stroke="black" strokeWidth="2.5" />
        })}
      </svg>
    ),
  },
  {
    id: 'coffee',
    label: 'Coffee',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <rect x="12" y="24" width="32" height="28" rx="4" stroke="black" strokeWidth="3" />
        <path d="M44 30h6a6 6 0 010 12h-6" stroke="black" strokeWidth="3" />
        <path d="M20 18c2-4 4-4 4 0" stroke="black" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 14c2-4 4-4 4 0" stroke="black" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 18c2-4 4-4 4 0" stroke="black" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'pizza',
    label: 'Pizza',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <path d="M32 6L8 56h48z" stroke="black" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="28" cy="36" r="4" stroke="black" strokeWidth="2" />
        <circle cx="36" cy="44" r="3" stroke="black" strokeWidth="2" />
        <circle cx="32" cy="24" r="3" stroke="black" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'music',
    label: 'Music',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <ellipse cx="18" cy="48" rx="8" ry="6" stroke="black" strokeWidth="3" />
        <ellipse cx="46" cy="44" rx="8" ry="6" stroke="black" strokeWidth="3" />
        <path d="M26 48V16l28-8v36" stroke="black" strokeWidth="3" />
        <path d="M26 16l28-8" stroke="black" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'thumbsup',
    label: 'Thumbs Up',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <path d="M18 30v24h6V30zm10 24h16c3 0 5-2 6-5l4-14c1-3-1-5-4-5H36l2-8c1-3-1-6-4-6l-6 14v19z" stroke="black" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'sparkle',
    label: 'Sparkle',
    svg: (
      <svg width={S} height={S} viewBox="0 0 64 64" fill="none">
        <path d="M32 4l4 14h14l-11 8 4 14-11-8-11 8 4-14L14 18h14z" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M48 36l2 7h7l-6 4 2 7-5-4-6 4 3-7-6-4h7z" stroke="black" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 38l2 5h5l-4 3 1 5-4-3-4 3 2-5-4-3h5z" stroke="black" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
]
