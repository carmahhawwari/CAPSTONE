import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { fontOptions, stampOptions, stationeryTemplates } from '@/lib/mock-data';
import { useOrbit } from '@/contexts/orbit';

export default function Write() {
  const navigate = useNavigate();
  const { currentContact, sendNote } = useOrbit();
  const [templateId, setTemplateId] = useState(stationeryTemplates[0].id);
  const [fontId, setFontId] = useState(fontOptions[0].id);
  const [stamp, setStamp] = useState(stampOptions[0]);
  const [content, setContent] = useState('');

  if (!currentContact) {
    return <Navigate to="/" replace />;
  }

  const activeTemplate = stationeryTemplates.find((template) => template.id === templateId) ?? stationeryTemplates[0];
  const activeFont = fontOptions.find((font) => font.id === fontId) ?? fontOptions[0];

  const handleSend = () => {
    if (!content.trim()) {
      return;
    }

    sendNote({
      content: content.trim(),
      templateId,
      fontId,
      stamp,
    });

    navigate('/sent');
  };

  return (
    <div className="pt-8 pb-10">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="button-secondary flex h-11 w-11 items-center justify-center rounded-full"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.28em] text-dusty">Compose</p>
          <h1 className="mt-3 font-[var(--font-display)] text-[36px] leading-none font-semibold text-ink">
            Write to {currentContact.name}.
          </h1>
        </div>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-[22px] font-semibold text-[#fff8ef]"
          style={{ background: currentContact.accent }}
        >
          {currentContact.avatar}
        </div>
      </div>

      <div className="orbit-card mt-6 rounded-[30px] px-5 py-5">
        <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Step 1</p>
        <p className="mt-3 text-[18px] font-semibold text-ink">Pick a page</p>
        <div className="mt-4 flex flex-col gap-3">
          {stationeryTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setTemplateId(template.id)}
              className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                template.id === templateId
                  ? 'border-transparent bg-[rgba(64,50,44,0.92)] text-[#fff7ef]'
                  : 'border-[color:var(--color-line)] bg-[rgba(255,251,245,0.76)]'
              }`}
            >
              <p className="text-[16px] font-semibold">{template.name}</p>
              <p className={`mt-1 text-[14px] ${template.id === templateId ? 'text-[#ead7ca]' : 'text-muted'}`}>
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="orbit-card mt-4 rounded-[30px] px-5 py-5">
        <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Step 2</p>
        <p className="mt-3 text-[18px] font-semibold text-ink">Choose a handwriting mood</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {fontOptions.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => setFontId(font.id)}
              className={`rounded-[20px] border px-4 py-4 text-left transition-all ${
                font.id === fontId
                  ? 'border-[rgba(64,50,44,0.6)] bg-[rgba(217,161,74,0.18)]'
                  : 'border-[color:var(--color-line)] bg-[rgba(255,251,245,0.76)]'
              }`}
            >
              <p className={`text-[18px] ${font.className}`}>{font.name}</p>
              <p className="mt-2 text-[13px] text-muted">{font.sample}</p>
            </button>
          ))}
        </div>

        <p className="mt-5 text-[14px] text-muted">Optional stamp</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {stampOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStamp(option)}
              className={`stamp-chip flex h-11 w-11 items-center justify-center rounded-full text-[20px] ${
                stamp === option ? 'bg-[rgba(64,50,44,0.92)] text-[#fff7ef]' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={`paper-note ${activeTemplate.paper} mt-4 rounded-[30px] px-5 py-6`}>
        <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Step 3</p>
        <p className="mt-3 text-[18px] font-semibold text-ink">What do you want them to know?</p>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="I’ve been thinking about..."
          className={`mt-5 min-h-[240px] w-full resize-none bg-transparent text-[22px] leading-9 text-ink outline-none placeholder:text-dusty ${activeFont.className}`}
        />
        <div className="mt-4 flex items-center justify-between border-t border-[color:var(--color-line)] pt-4 text-[14px] text-muted">
          <span>To: {currentContact.name}</span>
          <span>Stamp: {stamp}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={!content.trim()}
        className="button-primary mt-6 w-full rounded-[22px] px-5 py-4 text-[16px] font-semibold disabled:opacity-45"
      >
        Send note
      </button>
    </div>
  );
}
