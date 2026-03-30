import { useState } from 'react';
import type { OrbitPerson } from '@/types';

interface StampPortraitProps {
  person: OrbitPerson;
  className?: string;
}

export default function StampPortrait({ person, className = '' }: StampPortraitProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-[18px] text-[26px] font-semibold text-[#fff8ef] ${className}`}
        style={{ background: person.accent }}
      >
        {person.avatar}
      </div>
    );
  }

  return (
    <img
      src={person.stampImage}
      alt={`${person.name} stamp portrait`}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
