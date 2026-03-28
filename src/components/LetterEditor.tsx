import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Undo2, Eraser, Type, Sticker } from 'lucide-react';

const COLORS = ['#2F2B2A', '#E03C00', '#4A3D9E', '#D4890C', '#3A4A2E', '#8C9DB5'];
const BRUSH_SIZES = [3, 6, 12];
const STICKERS = ['❤️', '⭐', '🌸', '✨', '🌙', '🔥', '💌', '🦋', '🌿', '☀️'];

interface LetterEditorProps {
  letterText: string;
  images: string[];
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

type Tool = 'draw' | 'eraser' | 'text' | 'sticker';

export default function LetterEditor({ letterText, images, onSave, onClose }: LetterEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [selectedSticker, setSelectedSticker] = useState(STICKERS[0]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas with letter content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw letter text
    ctx.fillStyle = '#3A3634';
    ctx.font = '16px Georgia, serif';
    const maxWidth = rect.width - 48;
    const lineHeight = 24;
    let y = 36;

    const words = letterText.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), 24, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 24, y);

    // Draw images below text
    if (images.length > 0) {
      y += lineHeight + 12;
      images.forEach((src, i) => {
        const img = new window.Image();
        img.onload = () => {
          const imgSize = 64;
          ctx.drawImage(img, 24 + i * (imgSize + 8), y, imgSize, imgSize);
        };
        img.src = src;
      });
    }

    // Save initial state
    setTimeout(() => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([imageData]);
    }, 100);
  }, [letterText, images]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  }, []);

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (tool === 'text') {
      const pos = getPos(e);
      setShowTextInput(true);
      lastPos.current = pos;
      return;
    }
    if (tool === 'sticker') {
      const pos = getPos(e);
      setStickerOverlays((prev) => [
        ...prev,
        { id: Date.now().toString(), emoji: selectedSticker, x: pos.x, y: pos.y, size: 32 },
      ]);
      return;
    }

    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, [tool, getPos, selectedSticker]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || (tool !== 'draw' && tool !== 'eraser')) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, tool, color, brushSize, getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;

    // Save to history
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev, imageData]);
    }
  }, [isDrawing]);

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
  };

  const addTextOverlay = () => {
    if (!textInputValue.trim() || !lastPos.current) return;
    setTextOverlays((prev) => [
      ...prev,
      { id: Date.now().toString(), text: textInputValue, x: lastPos.current!.x, y: lastPos.current!.y, color },
    ]);
    setTextInputValue('');
    setShowTextInput(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render text overlays onto canvas
    textOverlays.forEach((t) => {
      ctx.fillStyle = t.color;
      ctx.font = 'bold 18px Inter Variable, sans-serif';
      ctx.fillText(t.text, t.x, t.y);
    });

    // Render sticker overlays
    stickerOverlays.forEach((s) => {
      ctx.font = `${s.size}px serif`;
      ctx.fillText(s.emoji, s.x - s.size / 2, s.y + s.size / 3);
    });

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3">
        <button onClick={onClose} className="w-[44px] h-[44px] rounded-full bg-[#ECECEC] flex items-center justify-center cursor-pointer border-none">
          <X size={20} className="text-primary" />
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-[15px] font-semibold cursor-pointer border-none active:scale-[0.97] transition-transform"
        >
          Done
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 px-5 pb-3 overflow-hidden">
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-surface" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />

          {/* Sticker overlays (rendered as DOM for draggability) */}
          {stickerOverlays.map((s) => (
            <div
              key={s.id}
              className="absolute pointer-events-none"
              style={{ left: s.x - s.size / 2, top: s.y - s.size / 2, fontSize: s.size }}
            >
              {s.emoji}
            </div>
          ))}

          {/* Text overlays */}
          {textOverlays.map((t) => (
            <div
              key={t.id}
              className="absolute pointer-events-none font-semibold text-[18px]"
              style={{ left: t.x, top: t.y - 20, color: t.color }}
            >
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* Text input modal */}
      {showTextInput && (
        <div className="absolute inset-0 z-60 bg-black/30 flex items-center justify-center px-8">
          <div className="bg-surface rounded-xl p-5 w-full max-w-[320px]">
            <input
              autoFocus
              type="text"
              placeholder="Type something..."
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              className="w-full px-4 py-3 text-[16px] text-primary border border-dividers rounded-lg outline-none bg-transparent font-serif"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowTextInput(false)} className="flex-1 py-2.5 text-[14px] text-secondary rounded-lg border border-dividers cursor-pointer bg-transparent">Cancel</button>
              <button onClick={addTextOverlay} className="flex-1 py-2.5 text-[14px] text-white bg-primary rounded-lg cursor-pointer border-none">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Sticker picker */}
      {showStickerPicker && (
        <div className="px-5 pb-2">
          <div className="bg-surface rounded-xl p-3 flex flex-wrap gap-2">
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { setSelectedSticker(emoji); setShowStickerPicker(false); }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-[22px] cursor-pointer border-none transition-colors ${
                  selectedSticker === emoji ? 'bg-hover-fill' : 'bg-transparent'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="px-5 pb-8 pt-2">
        <div className="bg-surface rounded-xl p-3">
          {/* Tools */}
          <div className="flex items-center gap-1 mb-3">
            <button
              onClick={() => setTool('draw')}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-colors ${
                tool === 'draw' ? 'bg-primary text-white' : 'bg-transparent text-secondary'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-colors flex items-center justify-center gap-1 ${
                tool === 'eraser' ? 'bg-primary text-white' : 'bg-transparent text-secondary'
              }`}
            >
              <Eraser size={14} /> Erase
            </button>
            <button
              onClick={() => setTool('text')}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-colors flex items-center justify-center gap-1 ${
                tool === 'text' ? 'bg-primary text-white' : 'bg-transparent text-secondary'
              }`}
            >
              <Type size={14} /> Text
            </button>
            <button
              onClick={() => { setTool('sticker'); setShowStickerPicker(!showStickerPicker); }}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-colors flex items-center justify-center gap-1 ${
                tool === 'sticker' ? 'bg-primary text-white' : 'bg-transparent text-secondary'
              }`}
            >
              <Sticker size={14} /> Sticker
            </button>
            <button
              onClick={undo}
              className="w-10 py-2.5 rounded-lg flex items-center justify-center cursor-pointer border-none bg-transparent text-meta hover:text-primary transition-colors"
            >
              <Undo2 size={16} />
            </button>
          </div>

          {/* Color + brush size (for draw mode) */}
          {(tool === 'draw' || tool === 'text') && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full cursor-pointer border-none transition-transform"
                    style={{
                      backgroundColor: c,
                      transform: color === c ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 3.5px ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
              {tool === 'draw' && (
                <div className="flex items-center gap-2">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`rounded-full cursor-pointer border-none transition-colors ${
                        brushSize === size ? 'bg-primary' : 'bg-meta/30'
                      }`}
                      style={{ width: size + 10, height: size + 10 }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
