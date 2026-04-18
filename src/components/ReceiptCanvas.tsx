import { useMemo } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { fontOptions } from '@/lib/mock-data';
import {
  createImageBlock,
  createTextBlock,
  createWordArtBlock,
  flattenReceiptBlocks,
  receiptBlocksHaveContent,
} from '@/lib/receipt-blocks';
import type { ReceiptBlock, ReceiptImageBlock, ReceiptTextBlock, ReceiptWordArtBlock } from '@/types';

const maxBlockCount = 8;

interface ReceiptCanvasProps {
  blocks: ReceiptBlock[];
  onChange: (blocks: ReceiptBlock[]) => void;
}

export function ReceiptCanvas({ blocks, onChange }: ReceiptCanvasProps) {
  const canAddMore = blocks.length < maxBlockCount;
  const hasContent = useMemo(() => receiptBlocksHaveContent(blocks), [blocks]);

  const updateBlock = (blockId: string, updater: (block: ReceiptBlock) => ReceiptBlock) => {
    onChange(blocks.map((block) => (block.id === blockId ? updater(block) : block)));
  };

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const nextBlocks = [...blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(nextIndex, 0, moved);
    onChange(nextBlocks);
  };

  const removeBlock = (blockId: string) => {
    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    onChange(nextBlocks.length ? nextBlocks : [createTextBlock()]);
  };

  const addBlock = (type: ReceiptBlock['type']) => {
    if (!canAddMore) {
      return;
    }

    if (type === 'text') {
      onChange([...blocks, createTextBlock()]);
      return;
    }

    if (type === 'word-art') {
      onChange([...blocks, createWordArtBlock()]);
      return;
    }

    onChange([...blocks, createImageBlock()]);
  };

  const handleImageUpload = async (blockId: string, file: File | undefined) => {
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    updateBlock(blockId, (block) =>
      block.type === 'image'
        ? { ...block, src: dataUrl, name: file.name }
        : block,
    );
  };

  return (
    <div className="orbit-card mt-4 rounded-[30px] px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Receipt canvas</p>
          <p className="mt-2 text-[15px] leading-6 text-muted">Build the note out of up to eight blocks. Mix body text, word art, and images.</p>
        </div>
        <div className="rounded-full border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.8)] px-3 py-1 text-[12px] font-medium text-ink">
          {blocks.length}/{maxBlockCount}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock('text')}
          disabled={!canAddMore}
          className="button-secondary flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Plus size={15} /> Text block
        </button>
        <button
          type="button"
          onClick={() => addBlock('word-art')}
          disabled={!canAddMore}
          className="button-secondary flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Plus size={15} /> Word art
        </button>
        <button
          type="button"
          onClick={() => addBlock('image')}
          disabled={!canAddMore}
          className="button-secondary flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ImagePlus size={15} /> Image block
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-[24px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.82)] px-4 py-4 shadow-[0_10px_24px_rgba(80,58,48,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">
                  Block {index + 1} of {blocks.length}
                </p>
                <p className="mt-1 text-[16px] font-semibold text-ink">{block.type === 'text' ? 'Text' : block.type === 'word-art' ? 'Word art' : 'Image'}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, -1)}
                  disabled={index === 0}
                  className="rounded-full border border-[color:var(--color-line)] p-2 text-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Move block up"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 1)}
                  disabled={index === blocks.length - 1}
                  className="rounded-full border border-[color:var(--color-line)] p-2 text-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Move block down"
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="rounded-full border border-[color:var(--color-line)] p-2 text-muted hover:text-[color:var(--color-clay)]"
                  aria-label="Remove block"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {block.type === 'text' && (
              <TextBlockEditor block={block} onChange={(next) => updateBlock(block.id, () => next)} />
            )}

            {block.type === 'word-art' && (
              <WordArtBlockEditor block={block} onChange={(next) => updateBlock(block.id, () => next)} />
            )}

            {block.type === 'image' && (
              <ImageBlockEditor
                block={block}
                onChange={(next) => updateBlock(block.id, () => next)}
                onUpload={(file) => handleImageUpload(block.id, file)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[30px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.66)] px-4 py-4">
        <div className="flex items-center justify-between gap-3 text-[12px] uppercase tracking-[0.24em] text-dusty">
          <span>Live preview</span>
          <span>{hasContent ? 'Ready to send' : 'Add some content'}</span>
        </div>
        <div className="receipt-strip mt-4 rounded-[26px] px-4 py-4">
          <ReceiptBlocksPreview blocks={blocks} />
        </div>
      </div>
    </div>
  );
}

function TextBlockEditor({ block, onChange }: { block: ReceiptTextBlock; onChange: (next: ReceiptTextBlock) => void }) {
  return (
    <div className="mt-4 grid gap-3">
      <label className="text-[13px] text-muted">
        Text
        <textarea
          rows={4}
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[15px] leading-7 text-ink outline-none"
          placeholder="Write a paragraph for the receipt..."
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[13px] text-muted">
          Font
          <select
            value={block.fontId}
            onChange={(event) => onChange({ ...block, fontId: event.target.value })}
            className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[14px] text-ink outline-none"
          >
            {fontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-muted">
          Size {block.size}px
          <input
            type="range"
            min={14}
            max={24}
            value={block.size}
            onChange={(event) => onChange({ ...block, size: Number(event.target.value) })}
            className="mt-3 w-full accent-[color:var(--color-clay)]"
          />
        </label>
      </div>
    </div>
  );
}

function WordArtBlockEditor({ block, onChange }: { block: ReceiptWordArtBlock; onChange: (next: ReceiptWordArtBlock) => void }) {
  return (
    <div className="mt-4 grid gap-3">
      <label className="text-[13px] text-muted">
        Word art text
        <input
          type="text"
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[15px] text-ink outline-none"
          placeholder="Big, bold words..."
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="text-[13px] text-muted">
          Font
          <select
            value={block.fontId}
            onChange={(event) => onChange({ ...block, fontId: event.target.value })}
            className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-3 py-3 text-[14px] text-ink outline-none"
          >
            {fontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-muted">
          Weight
          <select
            value={block.weight}
            onChange={(event) => onChange({ ...block, weight: event.target.value as WordArtBlockWeight })}
            className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-3 py-3 text-[14px] text-ink outline-none"
          >
            <option value="bold">Bold</option>
            <option value="black">Black</option>
          </select>
        </label>
        <label className="text-[13px] text-muted">
          Size {block.size}px
          <input
            type="range"
            min={24}
            max={56}
            value={block.size}
            onChange={(event) => onChange({ ...block, size: Number(event.target.value) })}
            className="mt-3 w-full accent-[color:var(--color-clay)]"
          />
        </label>
      </div>
      <label className="text-[13px] text-muted">
        Transform
        <select
          value={block.transform}
          onChange={(event) => onChange({ ...block, transform: event.target.value as WordArtBlockTransform })}
          className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[14px] text-ink outline-none"
        >
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
        </select>
      </label>
    </div>
  );
}

function ImageBlockEditor({
  block,
  onChange,
  onUpload,
}: {
  block: ReceiptImageBlock;
  onChange: (next: ReceiptImageBlock) => void;
  onUpload: (file: File | undefined) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      <label className="text-[13px] text-muted">
        Image name
        <input
          type="text"
          value={block.name}
          onChange={(event) => onChange({ ...block, name: event.target.value })}
          className="mt-2 w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[15px] text-ink outline-none"
          placeholder="sunset-photo.jpg"
        />
      </label>
      <label className="text-[13px] text-muted">
        Upload image
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onUpload(event.target.files?.[0])}
          className="mt-2 block w-full rounded-[18px] border border-[color:var(--color-line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[14px] text-ink outline-none"
        />
      </label>
      <div className="overflow-hidden rounded-[22px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.85)]">
        {block.src ? (
          <img src={block.src} alt={block.name || 'Uploaded receipt block'} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center px-6 text-center text-[14px] leading-6 text-dusty">
            Add an image to see it inside the receipt canvas.
          </div>
        )}
      </div>
    </div>
  );
}

type WordArtBlockWeight = ReceiptWordArtBlock['weight'];
type WordArtBlockTransform = ReceiptWordArtBlock['transform'];

export function ReceiptBlocksPreview({ blocks }: { blocks: ReceiptBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          const font = fontOptions.find((item) => item.id === block.fontId) ?? fontOptions[0];
          return (
            <p key={block.id} className={`whitespace-pre-wrap text-ink ${font.className}`} style={{ fontSize: `${block.size}px`, lineHeight: 1.5 }}>
              {block.text || <span className="text-dusty">Empty text block</span>}
            </p>
          );
        }

        if (block.type === 'word-art') {
          const font = fontOptions.find((item) => item.id === block.fontId) ?? fontOptions[0];
          return (
            <div
              key={block.id}
              className={`text-ink ${font.className}`}
              style={{ fontSize: `${block.size}px`, lineHeight: 1.02, fontWeight: block.weight === 'black' ? 900 : 700, textTransform: block.transform }}
            >
              {block.text || <span className="text-dusty">Word art block</span>}
            </div>
          );
        }

        return (
          <div key={block.id} className="overflow-hidden rounded-[20px] border border-[color:var(--color-line)] bg-[rgba(255,251,245,0.84)]">
            {block.src ? (
              <img src={block.src} alt={block.name || `Image block ${index + 1}`} className="h-52 w-full object-cover" />
            ) : (
              <div className="flex h-52 items-center justify-center px-6 text-center text-[14px] leading-6 text-dusty">
                Image blocks keep the source attached until you upload a file.
              </div>
            )}
            {block.name && <p className="px-4 py-3 text-[12px] uppercase tracking-[0.2em] text-dusty">{block.name}</p>}
          </div>
        );
      })}

      {!blocks.length && (
        <div className="rounded-[20px] border border-dashed border-[color:var(--color-line)] px-4 py-6 text-center text-[14px] text-dusty">
          Add a block to start building the receipt.
        </div>
      )}

      {blocks.length > 0 && <p className="text-[12px] uppercase tracking-[0.2em] text-dusty">{flattenReceiptBlocks(blocks) || 'No printable text yet'}</p>}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read image file'));
    reader.readAsDataURL(file);
  });
}