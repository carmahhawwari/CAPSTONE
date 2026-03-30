import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StampPortrait from '@/components/StampPortrait';
import { useSocial } from '@/contexts/social';
import { useOrbit } from '@/contexts/orbit';
import type { OrbitPerson } from '@/types';

export default function Home() {
  const { incoming, sentNotes } = useOrbit();
  const { getPersonById } = useSocial();
  const [archiveIndex, setArchiveIndex] = useState(0);
  const [archivesExpanded, setArchivesExpanded] = useState(false);
  const [printerAssetsMissing, setPrinterAssetsMissing] = useState(false);
  const [folderImageMissing, setFolderImageMissing] = useState(false);

  const seenArchiveIds = new Set<string>();
  const archivePeople = [...incoming.map((note) => note.senderId), ...sentNotes.map((note) => note.recipientId)]
    .map((id) => getPersonById(id))
    .filter((person): person is OrbitPerson => {
      if (!person || seenArchiveIds.has(person.id)) {
        return false;
      }

      seenArchiveIds.add(person.id);
      return true;
    });
  const activeIndex = archivePeople.length ? archiveIndex % archivePeople.length : 0;
  const activeArchive = archivePeople[activeIndex] ?? null;
  const rightArchive = archivePeople.length > 1 ? archivePeople[(activeIndex + 1) % archivePeople.length] : null;

  useEffect(() => {
    if (archivePeople.length < 2 || archivesExpanded) {
      return;
    }

    const interval = window.setInterval(() => {
      setArchiveIndex((previous) => (previous + 1) % archivePeople.length);
    }, 3200);

    return () => {
      window.clearInterval(interval);
    };
  }, [archivePeople.length, archivesExpanded]);

  return (
    <div className="home-layout pt-8 pb-12">
      <section>
        <p className="home-section-title">Your Inbox</p>
        <Link to="/history" className="home-printer-link">
          <div className={`home-splash ${incoming.length ? 'home-splash-active' : ''}`} />
          {printerAssetsMissing ? (
            <div className="printer-body home-printer-fallback rounded-[34px] px-5 pt-5 pb-7">
              <div className="mb-4 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.24em] text-[rgba(53,41,35,0.72)]">
                <span>Inbox printer</span>
                <div className="flex items-center gap-2">
                  <span className="printer-led text-[color:var(--color-olive)]" />
                  <span className="printer-led text-[color:var(--color-gold)]" />
                </div>
              </div>
              <div className="printer-slot mx-auto h-6 w-[86%] rounded-full" />
            </div>
          ) : (
            <div className="home-printer-composite">
              <img
                src="/images/printer-back.png"
                alt=""
                className="home-printer-layer home-printer-back"
                onError={() => setPrinterAssetsMissing(true)}
              />
              <div className="home-printer-paper" />
              <img
                src="/images/printer-front.png"
                alt="Inbox printer"
                className="home-printer-layer home-printer-front"
                onError={() => setPrinterAssetsMissing(true)}
              />
            </div>
          )}
          {incoming.length > 0 && <div className="home-inbox-badge">{incoming.length}</div>}
        </Link>
      </section>

      <section className="mt-16">
        <p className="home-section-title">Your Archives</p>
        {archivesExpanded ? (
          <div className="archive-scroll-wrap">
            <div className="archive-scroll-row">
              {archivePeople.map((person, index) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setArchiveIndex(index)}
                  className={`archive-scroll-card ${index === activeIndex ? 'archive-scroll-card-active' : ''}`}
                >
                  <ArchiveFolderArt person={person} folderImageMissing={folderImageMissing} onFolderImageError={() => setFolderImageMissing(true)} />
                  <span className="archive-scroll-name">{person.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setArchivesExpanded(false)}
              className="button-secondary mt-5 rounded-full px-4 py-2 text-[12px] font-medium uppercase tracking-[0.18em]"
            >
              Collapse
            </button>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => setArchivesExpanded(true)} className="archive-stack-button">
              <div className="archive-stage">
                {activeArchive && (
                  <div className="archive-folder archive-folder-center">
                    <ArchiveFolderArt person={activeArchive} folderImageMissing={folderImageMissing} onFolderImageError={() => setFolderImageMissing(true)} />
                  </div>
                )}

                {rightArchive && (
                  <div className="archive-folder archive-folder-right">
                    <ArchiveFolderArt person={rightArchive} folderImageMissing={folderImageMissing} onFolderImageError={() => setFolderImageMissing(true)} />
                  </div>
                )}
              </div>
            </button>

            {activeArchive && <p className="home-archive-label">{activeArchive.name}</p>}

            {archivePeople.length > 1 && (
              <div className="archive-dots">
                {archivePeople.map((person, index) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => setArchiveIndex(index)}
                    className={`archive-dot ${index === activeIndex ? 'archive-dot-active' : ''}`}
                    aria-label={`View archive for ${person.name}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

interface ArchiveFolderArtProps {
  person: OrbitPerson;
  folderImageMissing: boolean;
  onFolderImageError: () => void;
}

function ArchiveFolderArt({ person, folderImageMissing, onFolderImageError }: ArchiveFolderArtProps) {
  return (
    <div className="archive-folder-art">
      {folderImageMissing ? (
        <div className="archive-folder-fallback" />
      ) : (
        <img
          src="/images/folder.png"
          alt=""
          className="archive-folder-image"
          onError={onFolderImageError}
        />
      )}
      <div className="archive-folder-stamp-shell">
        <StampPortrait person={person} className="archive-folder-stamp" />
      </div>
    </div>
  );
}
