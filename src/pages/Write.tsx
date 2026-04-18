import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft, ImagePlus, Mic, SquareDashedBottomCode } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useOrbit } from '@/contexts/orbit';
import { fontOptions, stampOptions, stationeryTemplates } from '@/lib/mock-data';
import { ReceiptCanvas } from '@/components/ReceiptCanvas';
import { flattenReceiptBlocks, receiptBlocksHaveContent, createTextBlock } from '@/lib/receipt-blocks';
import type { ReceiptBlock } from '@/types';

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
  const [imageName, setImageName] = useState('');
  const [audioName, setAudioName] = useState('');
  const [receiptBlocks, setReceiptBlocks] = useState<ReceiptBlock[]>([createTextBlock()]);

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isSubmitting && (!currentContact || !selectedPrompt)) {
    return <Navigate to="/prompts" replace />;
  }

  if (!currentContact || !selectedPrompt) {
    return null;
  }

  const receiptCopy = flattenReceiptBlocks(receiptBlocks).trim();
  const canSend = receiptBlocksHaveContent(receiptBlocks);

  const handleSend = () => {
    if (!canSend) {
      return;
    }

    setIsSubmitting(true);
    sendNote({
      recipientId: currentContact.id,
      content: receiptCopy,
      promptLabel: selectedPrompt.text,
      templateId,
      fontId,
      stamp,
      receiptBlocks,
      imageName: imageName || undefined,
      audioName: audioName || undefined,
      signatureName: user.name,
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
        <p className="text-[12px] uppercase tracking-[0.28em] text-dusty">Compose</p>
        <h1 className="mt-3 font-[var(--font-display)] text-[36px] leading-none font-semibold text-ink">
          Build the receipt.
        </h1>
      </div>

      <div className="orbit-card mt-6 rounded-[30px] px-5 py-5">
        <p className="text-[14px] text-muted">Prompt selected</p>
        <p className="mt-3 text-[18px] leading-7 text-ink">{selectedPrompt.text}</p>
      </div>

      <ReceiptCanvas blocks={receiptBlocks} onChange={setReceiptBlocks} />

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

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className="button-primary mt-6 w-full rounded-[22px] px-5 py-4 text-[16px] font-semibold disabled:opacity-45"
      >
        Submit receipt
      </button>
    </div>
  );
}
