import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { fontOptions, orbitCandidates, stationeryTemplates } from '@/lib/mock-data';
import { useOrbit } from '@/contexts/orbit';

export default function History() {
  const { incoming, sentNotes } = useOrbit();

  return (
    <div className="pt-8 pb-10">
      <h1 className="font-[var(--font-display)] text-[38px] leading-none font-semibold text-ink">
        Letterbox
      </h1>
      <p className="mt-4 text-[17px] leading-7 text-muted">
        Incoming notes arrive like paper, not threads. Tap one to watch it print.
      </p>

      <div className="mt-7 flex flex-col gap-4">
        {incoming.map((note, index) => {
          const template = stationeryTemplates.find((item) => item.id === note.templateId) ?? stationeryTemplates[0];
          const sender = orbitCandidates.find((person) => person.id === note.senderId);

          return (
            <Link
              key={note.id}
              to={`/read/${note.id}`}
              className={`orbit-card ${template.paper} rounded-[28px] px-5 py-5`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">
                    {index === 0 ? 'Ready to print' : 'In the box'}
                  </p>
                  <p className="mt-3 font-[var(--font-display)] text-[28px] leading-none font-semibold text-ink">
                    {sender?.name}
                  </p>
                  <p className="mt-2 text-[15px] leading-6 text-muted">{note.preview}</p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-semibold text-[#fff8ef]"
                  style={{ background: sender?.accent ?? '#d3835d' }}
                >
                  {sender?.avatar ?? note.senderName.slice(0, 1)}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[color:var(--color-line)] pt-4 text-[14px] text-muted">
                <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                <span className="flex items-center gap-1">
                  Open note
                  <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="orbit-card mt-8 rounded-[28px] px-5 py-5">
        <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Sent recently</p>
        <div className="mt-4 flex flex-col gap-3">
          {sentNotes.slice(0, 3).map((note) => {
            const font = fontOptions.find((item) => item.id === note.fontId) ?? fontOptions[0];
            return (
              <div
                key={note.id}
                className="rounded-[22px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.78)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">To {note.recipientName}</p>
                  <span className="text-[13px] text-dusty">{note.stamp}</span>
                </div>
                <p className={`mt-3 text-[16px] leading-7 text-muted ${font.className}`}>{note.preview}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
