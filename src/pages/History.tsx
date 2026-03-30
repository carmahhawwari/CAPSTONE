import { useEffect, useState } from 'react';
import { ImageIcon, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useOrbit } from '@/contexts/orbit';
import { fontOptions } from '@/lib/mock-data';

export default function History() {
  const { user } = useAuth();
  const { incoming } = useOrbit();
  const [visibleLengths, setVisibleLengths] = useState<number[]>(() => incoming.map(() => 0));
  const [printerAssetsMissing, setPrinterAssetsMissing] = useState(false);

  useEffect(() => {
    if (!incoming.length) {
      return;
    }

    let timeoutId = 0;
    let noteIndex = 0;
    let visibleLength = 0;

    const printNextChunk = () => {
      const note = incoming[noteIndex];
      visibleLength = Math.min(note.content.length, visibleLength + 3);

      setVisibleLengths((previous) => {
        const next = incoming.map((_, index) => previous[index] ?? 0);
        next[noteIndex] = visibleLength;
        return next;
      });

      if (visibleLength < note.content.length) {
        timeoutId = window.setTimeout(printNextChunk, 26);
        return;
      }

      if (noteIndex < incoming.length - 1) {
        noteIndex += 1;
        visibleLength = 0;
        timeoutId = window.setTimeout(printNextChunk, 680);
      }
    };

    timeoutId = window.setTimeout(printNextChunk, 520);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [incoming]);

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 pt-10 pb-24">
      <div className="px-4 text-center">
        <h1 className="font-[var(--font-display)] text-[34px] leading-none font-semibold text-ink">
          Message Printing...
        </h1>
      </div>

      <div className="receipt-printer-stage receipt-printer-stage-full mt-6">
        <div className="receipt-printer-shell">
          {incoming.length ? (
            <div className="receipt-roll-pocket">
              <div className="receipt-strip receipt-roll-sheet receipt-print-roll px-4 pt-4">
                {incoming.map((note, index) => {
                  const font = fontOptions.find((item) => item.id === note.fontId) ?? fontOptions[0];
                  const visibleLength = visibleLengths[index] ?? 0;
                  const hasStarted = visibleLength > 0 || (index === 0 && !visibleLengths.some((length) => length > 0));
                  const isComplete = visibleLength >= note.content.length;

                  if (!hasStarted) {
                    return null;
                  }

                  return (
                    <article key={note.id} className={index === 0 ? '' : 'receipt-roll-entry'}>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-dusty">
                        <span>{isComplete ? 'Printed' : 'Printing...'}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="receipt-meta-row">
                        <span>To: {user?.name ?? 'You'}</span>
                        <span>{note.imageName ? 'Photo enclosed' : note.audioName ? 'Audio enclosed' : 'Letter received'}</span>
                      </div>
                      {note.imageName && visibleLength > 12 && (
                        <div className="receipt-photo-panel mt-4">
                          <div className="receipt-photo-label">{note.imageName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ')}</div>
                        </div>
                      )}
                      <p className={`receipt-roll-copy mt-5 whitespace-pre-wrap text-[21px] leading-9 text-ink ${font.className}`}>
                        {note.content.slice(0, visibleLength)}
                        {!isComplete && <span className="inline-block h-6 w-[2px] animate-pulse bg-[rgba(52,43,38,0.6)] align-middle" />}
                      </p>
                      {(note.imageName || note.audioName) && isComplete && (
                        <div className="receipt-attachments mt-4 text-[13px] text-muted">
                          {note.imageName && (
                            <p className="flex items-center gap-2">
                              <ImageIcon size={14} />
                              {note.imageName}
                            </p>
                          )}
                          {note.audioName && (
                            <p className={`flex items-center gap-2 ${note.imageName ? 'mt-2' : ''}`}>
                              <Mic size={14} />
                              {note.audioName}
                            </p>
                          )}
                        </div>
                      )}
                      {isComplete && (
                        <div className="receipt-signoff">
                          <div>
                            <p className="text-[13px] uppercase tracking-[0.22em] text-dusty">From</p>
                            <p className="receipt-signature mt-2">{note.senderName}</p>
                          </div>
                          <div className="receipt-stamp-mark">{note.stamp ?? '★'}</div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="receipt-roll-pocket">
              <div className="receipt-strip receipt-roll-sheet receipt-print-roll px-4 py-5">
                <p className="text-[12px] uppercase tracking-[0.24em] text-dusty">Queue empty</p>
                <p className="mt-4 text-[18px] leading-8 text-muted">No incoming letters are waiting to print right now.</p>
              </div>
            </div>
          )}

          {printerAssetsMissing ? (
            <div className="printer-body receipt-printer-fallback rounded-[34px] px-5 pt-5 pb-7">
              <div className="mb-4 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.24em] text-[rgba(53,41,35,0.72)]">
                <span>Orbit receipt printer</span>
                <div className="flex items-center gap-2">
                  <span className="printer-led text-[color:var(--color-olive)]" />
                  <span className="printer-led text-[color:var(--color-gold)]" />
                </div>
              </div>
              <div className="printer-slot mx-auto h-6 w-[86%] rounded-full" />
            </div>
          ) : (
            <div className="receipt-printer-composite receipt-printer-composite-large">
              <img
                src="/images/printer-back.png"
                alt=""
                className="receipt-printer-layer receipt-printer-back"
                onError={() => setPrinterAssetsMissing(true)}
              />
              <img
                src="/images/printer-front.png"
                alt="Receipt printer"
                className="receipt-printer-layer receipt-printer-front"
                onError={() => setPrinterAssetsMissing(true)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
