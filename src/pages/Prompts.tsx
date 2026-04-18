import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import StampPortrait from '@/components/StampPortrait';
import { useOrbit } from '@/contexts/orbit';

export default function Prompts() {
  const navigate = useNavigate();
  const { currentContact, promptOptions, selectedPrompt, selectPrompt } = useOrbit();

  if (!currentContact) {
    return <Navigate to="/daily-spin" replace />;
  }

  return (
    <div className="pt-8 pb-10">
      <button
        type="button"
        onClick={() => navigate('/daily-spin')}
        className="button-secondary flex h-11 w-11 items-center justify-center rounded-full"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="mt-5">
        <p className="text-[12px] uppercase tracking-[0.28em] text-dusty">Prompt choice</p>
        <h1 className="mt-3 font-[var(--font-display)] text-[36px] leading-none font-semibold text-ink">
          Pick your way in.
        </h1>
        <p className="mt-4 text-[17px] leading-7 text-muted">
          Two gentle nudges or an open response. The person is chosen. The entry point is yours.
        </p>
      </div>

      <div className="orbit-card mt-7 rounded-[30px] px-5 py-5">
        <p className="text-[14px] text-muted">Writing to</p>
        <div className="mt-3 flex items-center gap-4">
          <StampPortrait person={currentContact} className="h-16 w-[52px] rounded-[12px] object-cover" />
          <div>
            <p className="text-[20px] font-semibold text-ink">{currentContact.name}</p>
            <p className="text-[14px] text-muted">{currentContact.relationship}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {promptOptions.map((prompt) => {
          const active = selectedPrompt?.id === prompt.id;
          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => selectPrompt(prompt.id)}
              className={`rounded-[24px] border px-5 py-5 text-left transition-all ${
                active
                  ? 'border-transparent bg-[rgba(64,50,44,0.92)] text-[#fff7ef]'
                  : 'paper-note'
              }`}
            >
              <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">
                {prompt.type === 'open' ? 'Open response' : 'Prompt'}
              </p>
              <p className={`mt-3 text-[18px] leading-7 ${active ? 'text-[#fff7ef]' : 'text-ink'}`}>
                {prompt.text}
              </p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate('/compose')}
        disabled={!selectedPrompt}
        className="button-primary mt-6 flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-[16px] font-semibold disabled:opacity-45"
      >
        Open canvas
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
