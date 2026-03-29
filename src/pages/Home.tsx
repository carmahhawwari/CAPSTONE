import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCw, Sparkles } from 'lucide-react';
import { spinPrompts } from '@/lib/mock-data';
import { useOrbit } from '@/contexts/orbit';

export default function Home() {
  const navigate = useNavigate();
  const { orbit, currentContact, canRespin, incoming, respin } = useOrbit();
  const [revealed, setRevealed] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!currentContact || !orbit.length) {
      return;
    }

    const contactIndex = orbit.findIndex((person) => person.id === currentContact.id);
    const segmentAngle = 360 / orbit.length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealed(false);
    setRotation(1620 - contactIndex * segmentAngle);

    const timeout = window.setTimeout(() => {
      setRevealed(true);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [currentContact, orbit]);

  if (!currentContact) {
    return null;
  }

  const prompt = spinPrompts[orbit.findIndex((person) => person.id === currentContact.id) % spinPrompts.length];
  const segmentAngle = 360 / orbit.length;

  return (
    <div className="pt-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.3em] text-dusty">Today&apos;s spin</p>
          <h1 className="mt-3 font-[var(--font-display)] text-[38px] leading-none font-semibold text-ink">
            Let Orbit choose.
          </h1>
        </div>
        <div className="orbit-card rounded-full px-4 py-2 text-[13px] text-muted">
          {canRespin ? '1 re-spin left' : 'Choice locked in'}
        </div>
      </div>

      <div className="hardware-shell wheel-frame wheel-shadow mt-7 rounded-[40px] px-4 py-8">
        <div className="mb-4 flex items-center justify-between px-2 text-[11px] uppercase tracking-[0.24em] text-dusty">
          <span>Orbit picker</span>
          <div className="flex items-center gap-2">
            <span className="printer-led text-[color:var(--color-gold)]" />
            <span className="printer-led text-[color:var(--color-olive)]" />
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[320px] flex-col items-center">
          <div className="wheel-pointer absolute top-0 z-30 -translate-y-[8px]" />
          <div className="wheel-metal relative mt-5 flex h-[300px] w-[300px] items-center justify-center rounded-full border border-[rgba(79,58,48,0.12)]">
            <div
              className="absolute inset-[18px] rounded-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 2200ms cubic-bezier(0.18, 0.9, 0.16, 1)',
              }}
            >
              {orbit.map((person, index) => {
                const angle = index * segmentAngle;
                return (
                  <div
                    key={person.id}
                    className="absolute left-1/2 top-1/2 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 items-start justify-center"
                    style={{ transform: `rotate(${angle}deg) translateY(-114px)` }}
                  >
                    <div
                      className="wheel-segment-card flex h-[90px] w-[90px] flex-col items-center justify-center rounded-[22px] px-3 text-center"
                      style={{ transform: `rotate(${-angle}deg)` }}
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[20px] font-semibold text-[#fffaf1]"
                        style={{ background: person.accent }}
                      >
                        {person.avatar}
                      </span>
                      <span className="mt-2 text-[11px] font-semibold text-ink">{person.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative z-20 flex h-[108px] w-[108px] items-center justify-center rounded-full border border-[rgba(79,58,48,0.12)] bg-[linear-gradient(180deg,rgba(255,249,242,0.98),rgba(225,208,189,0.96))] shadow-[0_18px_28px_rgba(84,58,42,0.18)]">
              <div className={`text-center transition-opacity ${revealed ? 'opacity-100' : 'opacity-40'}`}>
                <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Picked</p>
                <p className="mt-2 text-[18px] font-semibold text-ink">{currentContact.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`paper-note mt-8 rounded-[28px] px-5 py-5 transition-all ${revealed ? 'fade-up' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 text-[13px] uppercase tracking-[0.22em] text-dusty">
            <Sparkles size={15} />
            Warm nudge
          </div>
          <p className="mt-3 text-[18px] leading-7 text-muted">{prompt.copy}</p>
          <p className="mt-5 font-[var(--font-display)] text-[30px] leading-none font-semibold text-ink">
            Send {currentContact.name} a note?
          </p>
          <p className="mt-3 text-[15px] leading-6 text-muted">
            {currentContact.relationship} in {currentContact.city}. Last reached out {currentContact.lastContact}.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/write')}
              className="button-primary flex-1 rounded-[20px] px-4 py-4 text-[16px] font-semibold"
            >
              Yes, I&apos;ll write
            </button>
            <button
              type="button"
              onClick={respin}
              disabled={!canRespin}
              className="button-secondary flex items-center justify-center gap-2 rounded-[20px] px-4 py-4 text-[15px] font-medium disabled:opacity-45"
            >
              <RotateCw size={16} />
              Re-spin
            </button>
          </div>
        </div>
      </div>

      <Link to="/history" className="paper-note mt-6 block rounded-[28px] px-5 py-5">
        <p className="text-[12px] uppercase tracking-[0.26em] text-dusty">Letterbox</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-[var(--font-display)] text-[28px] leading-none font-semibold text-ink">
              {incoming.length} waiting to print
            </p>
            <p className="mt-3 text-[15px] leading-6 text-muted">
              Incoming notes arrive one-way and unfold slowly, like paper feeding through a tiny machine.
            </p>
          </div>
          <div className="rounded-full bg-[rgba(217,161,74,0.18)] px-4 py-2 text-[13px] text-ink">
            Open inbox
          </div>
        </div>
      </Link>
    </div>
  );
}
