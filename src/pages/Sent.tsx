import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useSocial } from '@/contexts/social';
import { useOrbit } from '@/contexts/orbit';
import { fontOptions, stationeryTemplates } from '@/lib/mock-data';

export default function Sent() {
  const { lastSentNote } = useOrbit();
  const { getPersonById } = useSocial();

  if (!lastSentNote) {
    return <Navigate to="/" replace />;
  }

  const template = stationeryTemplates.find((item) => item.id === lastSentNote.templateId) ?? stationeryTemplates[0];
  const font = fontOptions.find((item) => item.id === lastSentNote.fontId) ?? fontOptions[0];
  const recipient = getPersonById(lastSentNote.recipientId);

  return (
    <div className="pt-8 pb-10">
      <div className="orbit-card rounded-[32px] px-5 py-6">
        <div className="flex items-center gap-3 text-[14px] text-olive">
          <CheckCircle2 size={18} />
          Sent to {lastSentNote.recipientName}
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-[36px] leading-none font-semibold text-ink">
          It&apos;s on the way.
        </h1>
        <p className="mt-4 text-[17px] leading-7 text-muted">
          Orbit carries the note quietly. No thread, no reply bubble, no pressure.
        </p>

        <div className={`paper-note receipt-paper ticket-edge ${template.paper} mt-7 rounded-[28px] px-5 py-6`}>
          <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Outgoing note</p>
          <p className={`mt-5 text-[22px] leading-9 text-ink ${font.className}`}>{lastSentNote.content}</p>
          <div className="mt-6 flex items-center justify-between border-t border-[color:var(--color-line)] pt-4 text-[14px] text-muted">
            <span>For {recipient?.name}</span>
            <span>{lastSentNote.stamp}</span>
          </div>
        </div>

        <div className="mt-7 flex gap-3">
          <Link to="/" className="button-primary flex-1 rounded-[20px] px-4 py-4 text-center text-[16px] font-semibold">
            Back to spin
          </Link>
          <Link to="/history" className="button-secondary flex-1 rounded-[20px] px-4 py-4 text-center text-[16px] font-semibold">
            Open letterbox
          </Link>
        </div>
      </div>
    </div>
  );
}
