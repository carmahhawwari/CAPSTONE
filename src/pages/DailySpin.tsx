import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import StampPortrait from '@/components/StampPortrait';
import { useOrbit } from '@/contexts/orbit';

export default function DailySpin() {
  const navigate = useNavigate();
  const { orbit, currentContact, canRespin, needsDailySpin, respin, startDailySpin } = useOrbit();
  const [revealed, setRevealed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [transitionReady, setTransitionReady] = useState(false);
  const [spotlightX, setSpotlightX] = useState(18);
  const [spinRun, setSpinRun] = useState(0);

  useEffect(() => {
    startDailySpin();
  }, [startDailySpin]);

  useEffect(() => {
    if (!currentContact || !orbit.length) {
      return;
    }

    const index = orbit.findIndex((person) => person.id === currentContact.id);
    const slideHeight = 184;
    const targetOffset = index * slideHeight;
    const startOffset = targetOffset + orbit.length * slideHeight * 2;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealed(false);
    setTransitionReady(false);
    setSpotlightX(18);
    setOffset(startOffset);

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setTransitionReady(true);
        setSpotlightX(52);
        setOffset(targetOffset);
      });
    });

    const timeout = window.setTimeout(() => {
      setRevealed(true);
    }, 2800);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(timeout);
    };
  }, [currentContact, orbit, spinRun]);

  if (!currentContact) {
    return (
      <div className="flex min-h-dvh flex-col justify-center py-8">
        <div className="orbit-card rounded-[32px] px-5 py-6">
          <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Loading spin</p>
          <p className="mt-4 text-[18px] leading-7 text-muted">
            Preparing today&apos;s recipient.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center py-8">
      <div className="hardware-shell rounded-[40px] px-5 py-7">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[12px] uppercase tracking-[0.3em] text-dusty">First open today</p>
          <button
            type="button"
            onClick={() => setSpinRun((previous) => previous + 1)}
            className="button-secondary rounded-full px-4 py-2 text-[12px] font-medium uppercase tracking-[0.18em]"
          >
            Reset anim
          </button>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-[40px] leading-none font-semibold text-ink">
          Today&apos;s recipient.
        </h1>
        <p className="mt-4 text-[17px] leading-7 text-muted">
          Orbit makes the first decision so you can skip the hesitation and start with someone real.
        </p>

        <div className="spotlight-stage printer-body mt-7 overflow-hidden rounded-[34px] px-5 py-5">
          <div
            className="pointer-events-none absolute inset-0 transition-[background] duration-[2600ms]"
            style={{
              background: `radial-gradient(circle at ${spotlightX}% 48%, rgba(255,247,220,0.36) 0%, rgba(255,247,220,0.22) 16%, rgba(18,15,13,0.72) 38%, rgba(18,15,13,0.84) 100%)`,
            }}
          />

          <div className="relative mx-auto flex h-[400px] w-[280px] items-center justify-center">
            <svg
              viewBox="0 0 320 320"
              className={`starburst absolute h-[320px] w-[320px] transition-all duration-700 ${revealed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
            >
              <g fill="none" stroke="#F4D46D" strokeWidth="10" strokeLinecap="round" opacity="0.92">
                {Array.from({ length: 16 }).map((_, index) => {
                  const angle = (index * Math.PI * 2) / 16;
                  const x1 = 160 + Math.cos(angle) * 82;
                  const y1 = 160 + Math.sin(angle) * 82;
                  const x2 = 160 + Math.cos(angle) * 138;
                  const y2 = 160 + Math.sin(angle) * 138;
                  return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />;
                })}
              </g>
            </svg>

            <div className="roulette-mask relative z-10 flex h-[240px] w-[240px] items-center justify-center rounded-full">
              <div
                className="stamp-roulette-track"
                style={{
                  transform: `translateY(calc(184px - ${offset}px))`,
                  transition: transitionReady ? 'transform 2800ms cubic-bezier(0.14, 0.92, 0.18, 1)' : 'none',
                }}
              >
                {orbit.concat(orbit).concat(orbit).map((person, index) => (
                  <div key={`${person.id}-${index}`} className="flex h-[184px] items-center justify-center">
                    <div className="stamp-shell rotate-[7deg]">
                      <StampPortrait
                        person={person}
                        className="h-[152px] w-[124px] object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 transition-all ${revealed ? 'fade-up' : 'opacity-0'}`}>
          <p className="font-[var(--font-display)] text-[34px] leading-none font-semibold text-ink">
            {currentContact.name}
          </p>
          <p className="mt-3 text-[15px] leading-6 text-muted">
            {currentContact.city} · last reached out {currentContact.lastContact}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/prompts')}
              className="button-primary flex-1 rounded-[22px] px-5 py-4 text-[16px] font-semibold"
            >
              Choose a prompt
            </button>
            <button
              type="button"
              onClick={respin}
              disabled={!canRespin || !needsDailySpin}
              className="button-secondary flex items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-[15px] font-medium disabled:opacity-45"
            >
              <RotateCw size={16} />
              Re-spin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
