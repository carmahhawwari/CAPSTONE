import { useState, type CSSProperties } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft, ImagePlus, Mic, SquareDashedBottomCode } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useOrbit } from '@/contexts/orbit';
import { fontOptions, stampOptions, stationeryTemplates } from '@/lib/mock-data';

const borderOptions = [
  { id: 'soft', label: 'Soft edge', className: 'border-[color:var(--color-line)]' },
  { id: 'dashed', label: 'Dashed', className: 'border-dashed border-[rgba(117,103,95,0.48)]' },
  { id: 'double', label: 'Double', className: 'border-double border-[rgba(117,103,95,0.4)]' },
];

export default function Write() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentContact, selectedPrompt, sendNote } = useOrbit();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateId, setTemplateId] = useState(stationeryTemplates[0].id);
  const [fontId, setFontId] = useState(fontOptions[0].id);
  const [stamp, setStamp] = useState(stampOptions[0]);
  const [borderId, setBorderId] = useState(borderOptions[0].id);
  const [content, setContent] = useState('');
  const [imageName, setImageName] = useState('');
  const [audioName, setAudioName] = useState('');

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isSubmitting && (!currentContact || !selectedPrompt)) {
    return <Navigate to="/prompts" replace />;
  }

  if (!currentContact || !selectedPrompt) {
    return null;
  }

  const activeTemplate = stationeryTemplates.find((template) => template.id === templateId) ?? stationeryTemplates[0];
  const activeFont = fontOptions.find((font) => font.id === fontId) ?? fontOptions[0];
  const activeBorder = borderOptions.find((border) => border.id === borderId) ?? borderOptions[0];
  const receiptRows = Math.max(10, Math.ceil(content.length / 26) + content.split('\n').length);
  const photoLabel = imageName ? imageName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ') : '';

  const handleSend = () => {
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    sendNote({
      content: content.trim(),
      templateId,
      fontId,
      stamp,
      imageName: imageName || undefined,
      audioName: audioName || undefined,
    });

    navigate('/');
  };

  return (
    <div className="pt-8 pb-10">
      <button
        type="button"
        onClick={() => navigate('/prompts')}
        className="button-secondary flex h-11 w-11 items-center justify-center rounded-full"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="mt-5">
        <p className="text-[12px] uppercase tracking-[0.28em] text-dusty">Receipt canvas</p>
        <h1 className="mt-3 font-[var(--font-display)] text-[36px] leading-none font-semibold text-ink">
          Design the letter.
        </h1>
      </div>

      <div className="orbit-card mt-6 rounded-[30px] px-5 py-5">
        <p className="text-[14px] text-muted">Prompt selected</p>
        <p className="mt-3 text-[18px] leading-7 text-ink">{selectedPrompt.text}</p>
      </div>

      <div className="orbit-card mt-4 rounded-[30px] px-5 py-5">
        <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Format</p>
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

        <div className="mt-5 grid grid-cols-2 gap-3">
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
      </div>

      <div className="orbit-card mt-4 rounded-[30px] px-5 py-5">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.24em] text-dusty">
          <SquareDashedBottomCode size={16} />
          Canvas controls
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {borderOptions.map((border) => (
            <button
              key={border.id}
              type="button"
              onClick={() => setBorderId(border.id)}
              className={`rounded-[18px] border px-3 py-3 text-[13px] font-medium ${
                borderId === border.id ? 'bg-[rgba(64,50,44,0.92)] text-[#fff7ef]' : 'bg-[rgba(255,251,245,0.8)]'
              }`}
            >
              {border.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="rounded-[20px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] px-4 py-4 text-[14px] text-muted">
            <span className="flex items-center gap-2 font-medium text-ink">
              <ImagePlus size={16} />
              Optional image
            </span>
            <input
              type="file"
              accept="image/*"
              className="mt-3 block w-full text-[12px]"
              onChange={(event) => setImageName(event.target.files?.[0]?.name ?? '')}
            />
            {imageName && <span className="mt-2 block text-[12px] text-dusty">{imageName}</span>}
          </label>

          <label className="rounded-[20px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] px-4 py-4 text-[14px] text-muted">
            <span className="flex items-center gap-2 font-medium text-ink">
              <Mic size={16} />
              Optional audio
            </span>
            <input
              type="file"
              accept="audio/*"
              className="mt-3 block w-full text-[12px]"
              onChange={(event) => setAudioName(event.target.files?.[0]?.name ?? '')}
            />
            {audioName && <span className="mt-2 block text-[12px] text-dusty">{audioName}</span>}
          </label>
        </div>
      </div>

      <div
        className={`receipt-strip ${activeBorder.className} mt-4 border-2 px-4 py-4`}
        style={{ '--receipt-accent': activeTemplate.accent } as CSSProperties}
      >
        <div className="receipt-band">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="receipt-meta-row">
          <span>To: {currentContact.name}</span>
          <span>From: {user.name}</span>
        </div>
        {imageName && (
          <div className="receipt-photo-panel mt-4">
            <div className="receipt-photo-label">{photoLabel || 'Attached photo'}</div>
          </div>
        )}
        {selectedPrompt.type === 'prompt' && <p className="receipt-kicker mt-4">Prompt: {selectedPrompt.text}</p>}
        <textarea
          rows={receiptRows}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write the message..."
          className={`receipt-compose-input mt-5 w-full resize-none bg-transparent text-[22px] leading-9 text-ink outline-none placeholder:text-dusty ${activeFont.className}`}
        />
        {(imageName || audioName) && (
          <div className="receipt-attachments mt-4 text-[13px] text-muted">
            {imageName && <p>Image enclosed: {imageName}</p>}
            {audioName && <p className={imageName ? 'mt-2' : ''}>Audio enclosed: {audioName}</p>}
          </div>
        )}
        <div className="receipt-signoff">
          <div>
            <p className="text-[13px] uppercase tracking-[0.22em] text-dusty">With love</p>
            <p className="receipt-signature mt-2">{user.name}</p>
          </div>
          <div className="receipt-stamp-mark">{stamp}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={!content.trim()}
        className="button-primary mt-6 w-full rounded-[22px] px-5 py-4 text-[16px] font-semibold disabled:opacity-45"
      >
        Submit receipt
      </button>
    </div>
  );
}
