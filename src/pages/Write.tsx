import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Image, Pencil, X, Undo2, Eraser, Type, Sticker } from 'lucide-react';
import { todayAssignment, users, prompts } from '@/lib/mock-data';

const COLORS = ['#2F2B2A', '#E03C00', '#4A3D9E', '#D4890C', '#3A4A2E', '#8C9DB5'];
const BRUSH_SIZES = [3, 6, 12];
const STICKERS = ['❤️', '⭐', '🌸', '✨', '🌙', '🔥', '💌', '🦋', '🌿', '☀️'];

type Tool = 'none' | 'draw' | 'eraser' | 'text' | 'sticker';

export default function Write() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  // Drawing state
  const [tool, setTool] = useState<Tool>('none');
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [selectedSticker, setSelectedSticker] = useState(STICKERS[0]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerOverlays, setStickerOverlays] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textOverlays, setTextOverlays] = useState<{ id: string; text: string; x: number; y: number; color: string }[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const isEditing = tool !== 'none';

  const writeTo = users.find((u) => u.id === todayAssignment.writeToUserId);
  const todayPrompt = prompts[0];

  // Init canvas when entering edit mode
  useEffect(() => {
    if (!isEditing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Transparent background — drawings overlay the letter
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (history.length === 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([imageData]);
    }
  }, [isEditing]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (tool === 'text') {
      lastPos.current = getPos(e);
      setShowTextInput(true);
      return;
    }
    if (tool === 'sticker') {
      const pos = getPos(e);
      setStickerOverlays((prev) => [...prev, { id: Date.now().toString(), emoji: selectedSticker, x: pos.x, y: pos.y }]);
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
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    lastPos.current = pos;
  }, [isDrawing, tool, color, brushSize, getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
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
    setTextOverlays((prev) => [...prev, { id: Date.now().toString(), text: textInputValue, x: lastPos.current!.x, y: lastPos.current!.y, color }]);
    setTextInputValue('');
    setShowTextInput(false);
  };

  const handleSend = () => {
    if (!content.trim()) return;
    setSent(true);
    setTimeout(() => navigate('/'), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImages((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  if (sent) {
    return (
      <div className="min-h-dvh bg-background px-5 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-forest flex items-center justify-center mb-5">
          <Check size={28} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[22px] font-normal text-primary tracking-[-0.01em] font-serif">Sent</p>
        <p className="text-[15px] text-secondary mt-1">Your letter to {writeTo?.name} is on its way.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-28">
      {/* Back */}
      <Link to="/" className="sticky top-4 z-40 w-[44px] h-[44px] rounded-full liquid-glass-btn flex items-center justify-center mb-8">
        <ChevronLeft size={22} className="text-primary" />
      </Link>

      {/* To */}
      <div className="mb-2">
        <p className="text-[13px] text-meta uppercase tracking-wider">Writing to</p>
        <p className="text-[24px] text-primary font-normal tracking-[-0.02em] font-serif">{writeTo?.name}</p>
      </div>

      {/* Prompt */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[16px] text-primary font-medium">Prompt</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>
        <div className="bg-surface rounded-xl px-5 py-4">
          <p className="text-[15px] text-secondary leading-relaxed font-serif">"{todayPrompt.text}"</p>
        </div>
      </div>

      {/* Letter card — text + canvas overlay + images */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[16px] text-primary font-medium">Your letter</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>

        <div className="bg-surface rounded-xl overflow-hidden relative">
          {/* Text area */}
          <textarea
            placeholder="Write something real..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full px-5 py-5 text-[16px] text-primary-body leading-relaxed min-h-[280px] resize-none outline-none placeholder:text-meta bg-transparent font-serif ${isEditing ? 'pointer-events-none' : ''}`}
          />

          {/* Canvas overlay for drawing — sits on top of text */}
          {isEditing && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none z-10"
              style={{ cursor: tool === 'draw' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'pointer' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          )}

          {/* Sticker overlays */}
          {stickerOverlays.map((s) => (
            <div key={s.id} className="absolute pointer-events-none z-20 text-[28px]" style={{ left: s.x - 14, top: s.y - 14 }}>
              {s.emoji}
            </div>
          ))}

          {/* Text overlays */}
          {textOverlays.map((t) => (
            <div key={t.id} className="absolute pointer-events-none z-20 font-semibold text-[16px]" style={{ left: t.x, top: t.y - 16, color: t.color }}>
              {t.text}
            </div>
          ))}

          {/* Uploaded images */}
          {images.length > 0 && (
            <div className="px-5 pb-4 flex gap-2 flex-wrap relative z-20">
              {images.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center cursor-pointer border-none">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom toolbar */}
          <div className="flex items-center gap-1 px-3 py-2.5 border-t border-dividers relative z-30">
            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-lg flex items-center justify-center text-red hover:bg-hover-fill transition-colors cursor-pointer bg-transparent border-none">
              <Image size={20} strokeWidth={1.8} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

            <button onClick={() => setTool(isEditing ? 'none' : 'draw')} className={`w-10 h-10 rounded-lg flex items-center justify-center hover:bg-hover-fill transition-colors cursor-pointer border-none ${isEditing ? 'text-red bg-red/10' : 'text-red bg-transparent'}`}>
              <Pencil size={20} strokeWidth={1.8} />
            </button>
          </div>

          {/* Drawing controls — overlays below Done */}
          {isEditing && (
            <div className="border-t border-dividers px-3 py-3 relative z-30 bg-surface">
              {/* Done button */}
              <button onClick={() => setTool('none')} className="w-full py-2.5 mb-3 bg-primary text-white rounded-lg text-[14px] font-semibold cursor-pointer border-none active:scale-[0.97] transition-transform">
                Done
              </button>

              {/* Tool buttons */}
              <div className="flex items-center gap-1 mb-3">
                {(['draw', 'eraser', 'text', 'sticker'] as Tool[]).map((t) => {
                  const icons = { draw: 'Draw', eraser: 'Erase', text: 'Text', sticker: 'Sticker' };
                  const IconComp = { draw: Pencil, eraser: Eraser, text: Type, sticker: Sticker }[t];
                  return (
                    <button
                      key={t}
                      onClick={() => { setTool(t); if (t === 'sticker') setShowStickerPicker(!showStickerPicker); }}
                      className={`flex-1 py-2 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-colors flex items-center justify-center gap-1 ${tool === t ? 'bg-primary text-white' : 'bg-transparent text-secondary'}`}
                    >
                      <IconComp size={13} /> {icons[t]}
                    </button>
                  );
                })}
                <button onClick={undo} className="w-9 py-2 rounded-lg flex items-center justify-center cursor-pointer border-none bg-transparent text-meta">
                  <Undo2 size={15} />
                </button>
              </div>

              {/* Colors + brush */}
              {(tool === 'draw' || tool === 'text') && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className="w-6 h-6 rounded-full cursor-pointer border-none"
                        style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 3px ${c}` : 'none' }}
                      />
                    ))}
                  </div>
                  {tool === 'draw' && (
                    <div className="flex items-center gap-1.5">
                      {BRUSH_SIZES.map((size) => (
                        <button key={size} onClick={() => setBrushSize(size)} className={`rounded-full cursor-pointer border-none ${brushSize === size ? 'bg-primary' : 'bg-meta/30'}`} style={{ width: size + 8, height: size + 8 }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sticker picker */}
              {showStickerPicker && tool === 'sticker' && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {STICKERS.map((emoji) => (
                    <button key={emoji} onClick={() => { setSelectedSticker(emoji); setShowStickerPicker(false); }} className={`w-9 h-9 rounded-lg flex items-center justify-center text-[20px] cursor-pointer border-none ${selectedSticker === emoji ? 'bg-hover-fill' : 'bg-transparent'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Text input modal */}
      {showTextInput && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-8">
          <div className="bg-surface rounded-xl p-5 w-full max-w-[320px]">
            <input autoFocus type="text" placeholder="Type something..." value={textInputValue} onChange={(e) => setTextInputValue(e.target.value)} className="w-full px-4 py-3 text-[16px] text-primary border border-dividers rounded-lg outline-none bg-transparent font-serif" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowTextInput(false)} className="flex-1 py-2.5 text-[14px] text-secondary rounded-lg border border-dividers cursor-pointer bg-transparent">Cancel</button>
              <button onClick={addTextOverlay} className="flex-1 py-2.5 text-[14px] text-white bg-primary rounded-lg cursor-pointer border-none">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!content.trim()}
        className={`w-full rounded-xl py-[16px] text-[16px] font-semibold mt-6 active:scale-[0.98] transition-all cursor-pointer text-white ${content.trim() ? 'bg-primary hover:opacity-90' : 'bg-tertiary cursor-not-allowed'}`}
      >
        Send Letter
      </button>
    </div>
  );
}
