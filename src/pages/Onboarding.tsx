import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { orbitCandidates, starterOrbitIds } from '@/lib/mock-data';
import { useOrbit } from '@/contexts/orbit';

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOrbit();
  const [selectedIds, setSelectedIds] = useState<string[]>(starterOrbitIds);

  const togglePerson = (personId: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(personId)) {
        return previous.filter((id) => id !== personId);
      }

      if (previous.length >= 8) {
        return previous;
      }

      return [...previous, personId];
    });
  };

  const handleContinue = () => {
    completeOnboarding(selectedIds);
    navigate('/');
  };

  return (
    <div className="pt-8 pb-10">
      <div className="orbit-card rounded-[34px] px-5 py-6">
        <div className="flex items-center gap-3 text-[13px] uppercase tracking-[0.24em] text-dusty">
          <Sparkles size={16} />
          First time here
        </div>

        <h1 className="mt-4 font-[var(--font-display)] text-[36px] leading-[1.02] font-semibold text-ink">
          Build a small orbit.
        </h1>
        <p className="mt-4 text-[17px] leading-7 text-muted">
          Choose 4 to 8 close-but-distant people. We&apos;ll pick who to write to when you open the app.
        </p>

        <div className="mt-7 rounded-[28px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.7)] p-4">
          <p className="text-[15px] font-medium text-ink">How this works</p>
          <p className="mt-2 text-[15px] leading-7 text-muted">
            Every time you open Orbit, we&apos;ll pick someone for you. All you have to do is show up.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {orbitCandidates.map((person) => {
            const selected = selectedIds.includes(person.id);
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => togglePerson(person.id)}
                className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                  selected
                    ? 'border-transparent bg-[rgba(64,50,44,0.92)] text-[#fff8ef]'
                    : 'border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] text-ink'
                }`}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[18px] font-semibold"
                  style={{
                    background: selected ? 'rgba(255,255,255,0.16)' : person.accent,
                    color: selected ? '#fff8ef' : '#fffaf1',
                  }}
                >
                  {person.avatar}
                </div>
                <p className="mt-3 text-[16px] font-semibold">{person.name}</p>
                <p className={`mt-1 text-[13px] ${selected ? 'text-[#ead8c9]' : 'text-muted'}`}>
                  {person.relationship}
                </p>
                <p className={`mt-3 text-[13px] leading-5 ${selected ? 'text-[#f6ede1]' : 'text-dusty'}`}>
                  {person.memory}
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedIds.length < 4}
          className="button-primary mt-7 flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-[16px] font-semibold disabled:opacity-45"
        >
          First spin
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
