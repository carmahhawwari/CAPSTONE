import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { todayAssignment, users, memories, prompts } from '@/lib/mock-data';

export default function Write() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [showMemories, setShowMemories] = useState(false);
  const [sent, setSent] = useState(false);

  const writeTo = users.find((u) => u.id === todayAssignment.writeToUserId);
  const todayPrompt = prompts[0];

  const handleSend = () => {
    if (!content.trim()) return;
    setSent(true);
    setTimeout(() => navigate('/'), 2000);
  };

  if (sent) {
    return (
      <div className="min-h-dvh bg-background px-5 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-forest flex items-center justify-center mb-5">
          <Check size={28} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[22px] font-bold text-primary tracking-[-0.01em]">Sent</p>
        <p className="text-[15px] text-secondary mt-1">
          Your letter to {writeTo?.name} is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-28">
      {/* Back */}
      <Link to="/" className="w-12 h-12 rounded-full bg-[#ECECEC] flex items-center justify-center mb-8">
        <ChevronLeft size={22} className="text-primary" />
      </Link>

      {/* To */}
      <div className="mb-2">
        <p className="text-[13px] text-meta uppercase tracking-wider">Writing to</p>
        <p className="text-[24px] text-primary font-bold tracking-[-0.02em]">{writeTo?.name}</p>
      </div>

      {/* Prompt */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[16px] text-primary font-medium">Prompt</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>
        <div className="bg-surface rounded-2xl px-5 py-4">
          <p className="text-[15px] text-secondary italic leading-relaxed">"{todayPrompt.text}"</p>
        </div>
      </div>

      {/* Memory */}
      <div className="mt-8">
        <button
          onClick={() => setShowMemories(!showMemories)}
          className="text-[13px] text-indigo font-semibold uppercase tracking-wider cursor-pointer bg-transparent border-none"
        >
          {showMemories ? 'Hide Memories' : 'Attach a Memory'}
        </button>

        {showMemories && (
          <div className="bg-surface rounded-2xl overflow-hidden mt-3">
            {memories.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemory(selectedMemory === m.id ? null : m.id)}
                className={`w-full text-left px-5 py-[14px] transition-colors cursor-pointer flex items-center justify-between ${
                  i < memories.length - 1 ? 'border-b border-dividers' : ''
                } ${selectedMemory === m.id ? 'bg-hover-fill' : ''}`}
              >
                <div className="flex-1 mr-3">
                  <p className="text-[16px] text-primary font-medium">{m.title}</p>
                  <p className="text-[14px] text-secondary mt-0.5 line-clamp-1">{m.description}</p>
                </div>
                {selectedMemory === m.id && (
                  <Check size={18} className="text-forest shrink-0" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[16px] text-primary font-medium">Your letter</p>
          <div className="flex-1 border-t border-dashed border-dividers" />
        </div>
        <div className="bg-surface rounded-2xl overflow-hidden">
          <textarea
            placeholder="Write something real..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-5 py-5 text-[16px] text-primary-body leading-relaxed min-h-[200px] resize-none outline-none placeholder:text-meta bg-transparent"
          />
        </div>
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!content.trim()}
        className={`w-full rounded-2xl py-[16px] text-[16px] font-semibold mt-6 active:scale-[0.98] transition-all cursor-pointer text-white ${
          content.trim()
            ? 'bg-primary hover:opacity-90'
            : 'bg-tertiary cursor-not-allowed'
        }`}
      >
        Send Letter
      </button>
    </div>
  );
}
