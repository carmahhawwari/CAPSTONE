import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, ImageIcon, Mic } from 'lucide-react';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';
import { fontOptions, stationeryTemplates } from '@/lib/mock-data';

export default function Envelope() {
  const { id } = useParams();
  const { incoming } = useOrbit();
  const { getPersonById } = useSocial();
  const note = incoming.find((item) => item.id === id);
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (!note) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleLength(0);
    const timeout = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        setVisibleLength((previous) => {
          if (previous >= note.content.length) {
            window.clearInterval(interval);
            return previous;
          }

          return previous + 2;
        });
      }, 30);
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [note]);

  if (!note) {
    return <Navigate to="/history" replace />;
  }

  const sender = getPersonById(note.senderId);
  const template = stationeryTemplates.find((item) => item.id === note.templateId) ?? stationeryTemplates[0];
  const font = fontOptions.find((item) => item.id === note.fontId) ?? fontOptions[0];
  const isPrinting = visibleLength < note.content.length;

  return (
    <div className="pt-8 pb-10">
      <Link to="/history" className="button-secondary flex h-11 w-11 items-center justify-center rounded-full">
        <ChevronLeft size={20} />
      </Link>

      <div className="mt-5">
        <p className="text-[12px] uppercase tracking-[0.28em] text-dusty">Letter reveal</p>
        <h1 className="mt-3 font-[var(--font-display)] text-[34px] leading-none font-semibold text-ink">
          From {sender?.name ?? note.senderName}
        </h1>
        <p className="mt-4 text-[16px] leading-7 text-muted">
          No replying here. Just receive the note, let it land, and keep moving through the day.
        </p>
      </div>

      <div className="printer-body mt-8 rounded-[34px] px-5 pt-5 pb-7">
        <div className="mb-4 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.24em] text-[rgba(53,41,35,0.72)]">
          <span>Orbit fax reveal</span>
          <div className="flex items-center gap-2">
            <span className="printer-led text-[color:var(--color-olive)]" />
            <span className="printer-led text-[color:var(--color-gold)]" />
          </div>
        </div>
        <div className="printer-slot mx-auto h-6 w-[86%] rounded-full" />
        <div className={`paper-note receipt-paper ${template.paper} mt-4 rounded-[28px] px-5 py-6`}>
          <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.24em] text-dusty">
            <span>{isPrinting ? 'Printing...' : 'Printed'}</span>
            <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] uppercase tracking-[0.18em] text-dusty">
            <span>To: you</span>
            <span>From: {note.senderName}</span>
          </div>
          <p className={`mt-5 min-h-[220px] text-[22px] leading-9 text-ink ${font.className}`}>
            {note.content.slice(0, visibleLength)}
            {isPrinting && <span className="inline-block h-6 w-[2px] animate-pulse bg-[rgba(52,43,38,0.6)] align-middle" />}
          </p>
          {(note.imageName || note.audioName) && !isPrinting && (
            <div className="mt-4 rounded-[18px] bg-[rgba(255,251,245,0.72)] px-4 py-4 text-[14px] text-muted">
              {note.imageName && (
                <p className="flex items-center gap-2">
                  <ImageIcon size={15} />
                  {note.imageName}
                </p>
              )}
              {note.audioName && (
                <p className={`flex items-center gap-2 ${note.imageName ? 'mt-2' : ''}`}>
                  <Mic size={15} />
                  {note.audioName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
