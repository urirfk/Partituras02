import { BookOpen, Globe, Music, Printer, Redo2, Undo2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OrthogonalControlsBar } from './components/controls/OrthogonalControlsBar';
import { NoteEditPopover } from './components/editor/NoteEditPopover';
import { SplitScreenLayout } from './components/layout/SplitScreenLayout';
import { DidacticScoreCanvas } from './components/score/DidacticScoreCanvas';
import { ScoreDropzone } from './components/upload/ScoreDropzone';
import { OriginalDocumentViewer } from './components/viewer/OriginalDocumentViewer';
import { PdfExportModal } from './components/export/PdfExportModal';
import { ScoreConfigProvider } from './context/ScoreConfigContext';
import { ScoreHistoryProvider } from './context/ScoreHistoryContext';
import { useScoreHistory } from './context/useScoreHistory';
import { INITIAL_SCORE } from './data/initialScore';
import { Note, Score } from './types/music';

interface ActiveNoteState {
  note: Note;
  measureNumber: number;
  staff: 'upper' | 'lower';
  anchorPosition: { x: number; y: number };
}

const AppMain: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { score, setScore, undo, redo, canUndo, canRedo } = useScoreHistory();
  const [originalPages, setOriginalPages] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState<boolean>(false);
  const [activeNote, setActiveNote] = useState<ActiveNoteState | null>(null);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
  };

  const handleScoreLoaded = (loadedScore: Score, pages: string[]) => {
    setScore(loadedScore);
    if (pages.length > 0) {
      setOriginalPages(pages);
    }
    setIsUploadOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#fcfbf9] text-zinc-900 dark:bg-[#0c0c0e] dark:text-zinc-100 overflow-hidden select-none">
      {/* Top Header Zen */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm sm:text-base tracking-tight leading-tight">
              {t('app.title')}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg mr-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-1 rounded text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Deshacer (Ctrl+Z)"
              data-testid="undo-btn"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-1 rounded text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Rehacer (Ctrl+Y)"
              data-testid="redo-btn"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            data-testid="toggle-upload-btn"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('dropzone.selectFile')}</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            title={t('nav.language')}
            data-testid="lang-switch-btn"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language.substring(0, 2).toUpperCase()}</span>
          </button>

          {/* Stand Mode & PDF Export */}
          <button
            type="button"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('nav.standMode')}
          </button>
          <button
            type="button"
            onClick={() => setIsPdfExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-xs transition"
            data-testid="export-pdf-btn"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('nav.exportPdf')}</span>
          </button>
        </div>
      </header>

      {/* Orthogonal Didactic Controls Bar */}
      <OrthogonalControlsBar />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 overflow-hidden relative">
        <SplitScreenLayout
          originalPanel={
            <OriginalDocumentViewer
              pages={originalPages}
              className="h-full"
            />
          }
          cleanPanel={
            <DidacticScoreCanvas
              score={score}
              selectedNoteId={activeNote?.note.id}
              onNoteClick={(note, measureNumber, staff, clientX, clientY) => {
                setActiveNote({
                  note,
                  measureNumber,
                  staff,
                  anchorPosition: { x: clientX, y: clientY },
                });
              }}
            />
          }
        />

        {/* Upload Modal / Overlay */}
        {isUploadOpen && (
          <div
            className="absolute inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            data-testid="upload-modal-overlay"
          >
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-2xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center font-bold"
                data-testid="close-upload-modal"
              >
                ✕
              </button>
              <ScoreDropzone onScoreLoaded={handleScoreLoaded} />
            </div>
          </div>
        )}

        {/* Note Edit Popover */}
        {activeNote && (
          <NoteEditPopover
            note={activeNote.note}
            measureNumber={activeNote.measureNumber}
            staff={activeNote.staff}
            anchorPosition={activeNote.anchorPosition}
            isOpen={Boolean(activeNote)}
            onClose={() => setActiveNote(null)}
          />
        )}

        {/* PDF Export Modal */}
        <PdfExportModal
          isOpen={isPdfExportOpen}
          onClose={() => setIsPdfExportOpen(false)}
          score={score}
        />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ScoreConfigProvider>
      <ScoreHistoryProvider initialScore={INITIAL_SCORE}>
        <AppMain />
      </ScoreHistoryProvider>
    </ScoreConfigProvider>
  );
};

export default App;
