import { Camera, Heart } from 'lucide-react';
import type { OrbitNote } from '@/types';

interface LetterCardProps {
  note: OrbitNote;
  counterpartName: string;
  isReceived?: boolean;
}

export default function LetterCard({ note, counterpartName, isReceived = false }: LetterCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-[rgba(48,38,31,0.08)] bg-white px-4 py-4 text-left shadow-[0_12px_24px_rgba(43,34,29,0.08)]">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[rgba(66,53,45,0.58)]">
        <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        <span className="inline-flex items-center gap-2">
          {note.imageName && <Camera size={12} />}
          {note.promptLabel && <Heart size={12} />}
        </span>
      </div>
      <div className="mt-3 text-[12px] uppercase tracking-[0.18em] text-[rgba(66,53,45,0.58)]">
        <p>{isReceived ? `From ${counterpartName}` : `To ${counterpartName}`}</p>
      </div>
      {note.promptLabel && (
        <p className="mt-3 border-y border-dashed border-[rgba(48,38,31,0.12)] py-3 text-[14px] italic leading-6 text-[rgba(40,32,27,0.84)]">
          {note.promptLabel}
        </p>
      )}
      <p className="mt-4 text-[15px] leading-7 text-[rgba(24,20,17,0.94)]">{note.content}</p>
      {note.imageName && (
        <div className="mt-4 rounded-[1rem] bg-[linear-gradient(180deg,#f1f1f1,#d9d9d9)] px-4 py-7 text-center text-[12px] uppercase tracking-[0.18em] text-[rgba(37,37,37,0.6)] grayscale">
          {note.imageName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ')}
        </div>
      )}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="text-[12px] uppercase tracking-[0.18em] text-[rgba(66,53,45,0.58)]">
          <p>Signature</p>
          <p className="mt-2 font-[var(--font-display)] text-[22px] normal-case tracking-normal text-[rgba(18,15,13,0.92)]">
            {note.signatureName ?? note.senderName}
          </p>
        </div>
        <div className="text-[24px] text-[rgba(18,15,13,0.92)]">{note.stamp ?? '✶'}</div>
      </div>
    </article>
  );
}
