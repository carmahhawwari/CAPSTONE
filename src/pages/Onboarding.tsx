import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useOrbit } from '@/contexts/orbit';
import { useSocial } from '@/contexts/social';

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding, orbitIds } = useOrbit();
  const { friends } = useSocial();
  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);
  const defaultSelectedIds = useMemo(() => {
    const nextIds = orbitIds.filter((id) => friendIds.has(id));
    return nextIds.length ? nextIds : friends.slice(0, 5).map((friend) => friend.id);
  }, [friendIds, friends, orbitIds]);
  const [manualSelectedIds, setManualSelectedIds] = useState<string[] | null>(null);
  const selectedIds = (manualSelectedIds ?? defaultSelectedIds).filter((id) => friendIds.has(id));

  const togglePerson = (personId: string) => {
    setManualSelectedIds((previous) => {
      const base = (previous ?? defaultSelectedIds).filter((id) => friendIds.has(id));

      if (base.includes(personId)) {
        return base.filter((id) => id !== personId);
      }

      if (base.length >= 8) {
        return base;
      }

      return [...base, personId];
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
          Set up your circle
        </div>

        <h1 className="mt-4 font-[var(--font-display)] text-[36px] leading-[1.02] font-semibold text-ink">
          Build a small orbit.
        </h1>
        <p className="mt-4 text-[17px] leading-7 text-muted">
          Choose 1 to 8 accepted friends. We&apos;ll pick who to write to when you open the app.
        </p>

        <div className="mt-7 rounded-[28px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.7)] p-4">
          <p className="text-[15px] font-medium text-ink">How this works</p>
          <p className="mt-2 text-[15px] leading-7 text-muted">
            Every time you open Orbit, we&apos;ll pick someone for you. All you have to do is show up.
          </p>
        </div>

        {friends.length ? (
          <div className="mt-7 grid grid-cols-2 gap-3">
            {friends.map((person) => {
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
        ) : (
          <div className="mt-7 rounded-[28px] border border-dashed border-[color:var(--color-line)] bg-[rgba(255,251,245,0.72)] px-5 py-6">
            <p className="text-[17px] font-semibold text-ink">You need at least one accepted friend first.</p>
            <p className="mt-3 text-[15px] leading-7 text-muted">
              Open Your people, search by email or name, send a request, then sign in as the other account to accept it for local testing.
            </p>
            <button
              type="button"
              onClick={() => navigate('/people')}
              className="button-secondary mt-5 rounded-[20px] px-5 py-3 text-[15px] font-semibold"
            >
              Open Your people
            </button>
          </div>
        )}

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/people')}
            className="button-secondary flex-1 rounded-[22px] px-5 py-4 text-[16px] font-semibold"
          >
            Manage friends
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedIds.length}
            className="button-primary flex flex-1 items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-[16px] font-semibold disabled:opacity-45"
          >
            <span className="inline-flex items-center gap-2">
              First spin
              <ChevronRight size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
