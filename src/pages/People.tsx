import { useState } from 'react';
import { orbitCandidates } from '@/lib/mock-data';
import { useOrbit } from '@/contexts/orbit';

export default function People() {
  const { orbitIds, updateOrbit } = useOrbit();
  const [selectedIds, setSelectedIds] = useState<string[]>(orbitIds);

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

  return (
    <div className="pt-8 pb-10">
      <h1 className="font-[var(--font-display)] text-[38px] leading-none font-semibold text-ink">
        Your orbit
      </h1>
      <p className="mt-4 text-[17px] leading-7 text-muted">
        Keep it intentionally small. The constraint is part of the product.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3">
        {orbitCandidates.map((person) => {
          const selected = selectedIds.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => togglePerson(person.id)}
              className={`orbit-card rounded-[26px] px-4 py-4 text-left transition-all ${
                selected ? 'ring-2 ring-[rgba(64,50,44,0.45)]' : ''
              }`}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-semibold text-[#fff8ef]"
                style={{ background: person.accent }}
              >
                {person.avatar}
              </div>
              <p className="mt-3 text-[16px] font-semibold text-ink">{person.name}</p>
              <p className="mt-1 text-[13px] text-muted">{person.relationship}</p>
              <p className="mt-3 text-[13px] leading-5 text-dusty">{person.memory}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => updateOrbit(selectedIds)}
        className="button-primary mt-7 w-full rounded-[22px] px-5 py-4 text-[16px] font-semibold"
      >
        Save orbit
      </button>
    </div>
  );
}
