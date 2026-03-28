import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { affirmations, memories, users } from '@/lib/mock-data';

const envelopeColors = ['#E03C00', '#4A3D9E', '#D4890C', '#D4907E', '#8C9DB5', '#3A4A2E'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function EnvelopeClosed({ color }: { color: string }) {
  const darker = color + 'CC';
  return (
    <svg width="100%" viewBox="0 0 353 183" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="closed-mask" fill="white">
        <path d="M0 0H353V183H0V0Z"/>
      </mask>
      <path d="M0 0H353V183H0V0Z" fill={color} fillOpacity="0.3"/>
      <path d="M353 183V187H357V183H353ZM0 183H-4V187H0V183ZM353 0H349V183H353H357V0H353ZM353 183V179H0V183V187H353V183ZM0 183H4V0H0H-4V183H0Z" fill="black" fillOpacity="0.1" mask="url(#closed-mask)"/>
      <path d="M346.395 2H6.57422L176.002 115.595L346.395 2Z" fill={color} fillOpacity="0.35" stroke={darker} strokeWidth="2"/>
    </svg>
  );
}

function EnvelopeOpen({ color }: { color: string }) {
  const darker = color + 'CC';
  return (
    <svg width="100%" viewBox="0 0 353 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="open-mask" fill="white">
        <path d="M0 117H353V300H0V117Z"/>
      </mask>
      <path d="M0 117H353V300H0V117Z" fill={color} fillOpacity="0.3"/>
      <path d="M353 300V301H354V300H353ZM0 300H-1V301H0V300ZM353 117H352V300H353H354V117H353ZM353 300V299H0V300V301H353V300ZM0 300H1V117H0H-1V300H0Z" fill="black" fillOpacity="0.1" mask="url(#open-mask)"/>
      <path d="M351.349 117.5H1.64355L176 234.399L351.349 117.5Z" fill="#F7F7F7" stroke={darker} strokeOpacity="0.5"/>
      <path d="M351.349 117.5H1.64355L176 0.600586L351.349 117.5Z" fill={color} fillOpacity="0.35" stroke={darker} strokeOpacity="0.5"/>
    </svg>
  );
}

export default function Envelope() {
  const { id } = useParams<{ id: string }>();
  const [open, setOpen] = useState(false);

  const affirmationIndex = affirmations.findIndex((a) => a.id === id);
  const affirmation = affirmations[affirmationIndex];

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!affirmation) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-secondary">Affirmation not found.</p>
      </div>
    );
  }

  const color = envelopeColors[affirmationIndex % envelopeColors.length];
  const sender = users.find((u) => u.id === affirmation.senderId);
  const memory = affirmation.contextMemoryId
    ? memories.find((m) => m.id === affirmation.contextMemoryId)
    : null;

  return (
    <div className="min-h-dvh bg-background px-5 pt-14 pb-28">
      <Link to="/" className="sticky top-4 z-40 w-[44px] h-[44px] rounded-full liquid-glass-btn flex items-center justify-center mb-8">
        <ChevronLeft size={22} className="text-primary" />
      </Link>

      <div className="max-w-[380px] mx-auto relative">
        {/* Letter card — slides up above envelope */}
        <div
          className="relative mx-3 transition-all ease-out"
          style={{
            zIndex: open ? 30 : 10,
            transform: open ? 'translateY(0)' : 'translateY(120px)',
            opacity: open ? 1 : 0,
            transitionDuration: '700ms',
            transitionDelay: open ? '300ms' : '0ms',
          }}
        >
          <div
            className="bg-surface px-6 py-7"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}
          >
            <p className="text-[18px] text-primary-body leading-relaxed font-normal font-serif">
              {affirmation.content}
            </p>

            <p className="text-[15px] text-secondary mt-5">
              — {sender?.name}
            </p>
          </div>
        </div>

        {/* Envelope SVG — switches between closed and open */}
        <div
          className="relative z-20 transition-all ease-out"
          style={{
            marginTop: open ? '-40px' : '-120px',
            transitionDuration: '600ms',
          }}
        >
          {open ? <EnvelopeOpen color={color} /> : <EnvelopeClosed color={color} />}
        </div>
      </div>
    </div>
  );
}
