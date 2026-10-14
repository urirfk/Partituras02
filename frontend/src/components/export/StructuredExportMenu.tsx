import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Save,
  FolderOpen,
  FileCode,
  Music2,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Score } from '../../types/music';
import { useScoreConfig } from '../../context/useScoreConfig';
import {
  downloadProjectSession,
  loadProjectSessionFromFile,
  ProjectSession,
} from '../../services/projectSession';
import {
  downloadMusicXml,
  downloadMidi,
} from '../../services/structuredExporter';

export interface StructuredExportMenuProps {
  score: Score;
  originalPages?: string[];
  onSessionLoaded: (session: ProjectSession) => void;
  className?: string;
}

export const StructuredExportMenu: React.FC<StructuredExportMenuProps> = ({
  score,
  originalPages,
  onSessionLoaded,
  className = '',
}) => {
  const { t } = useTranslation();
  const { config, updateConfig } = useScoreConfig();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSaveSession = () => {
    downloadProjectSession(score, config, originalPages);
    setIsOpen(false);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    try {
      const loaded = await loadProjectSessionFromFile(files[0]);
      updateConfig(loaded.config);
      onSessionLoaded(loaded);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to load project session:', err);
      setError(t('exportMenu.loadError'));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportMusicXml = async () => {
    setLoadingAction('musicxml');
    setError(null);
    try {
      await downloadMusicXml(score);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to export MusicXML:', err);
      setError(err instanceof Error ? err.message : 'Error exporting MusicXML');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportMidi = async () => {
    setLoadingAction('midi');
    setError(null);
    try {
      await downloadMidi(score);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to export MIDI:', err);
      setError(err instanceof Error ? err.message : 'Error exporting MIDI');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Hidden File Input for Loading .partitura */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".partitura,application/json"
        className="hidden"
        data-testid="load-session-input"
        onChange={handleFileInputChange}
      />

      {/* Menu Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
        data-testid="structured-export-btn"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{t('exportMenu.button')}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100"
          data-testid="structured-export-dropdown"
        >
          {/* Option: Save .partitura */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSaveSession}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            data-testid="save-partitura-option"
          >
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {t('exportMenu.saveSession')}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t('exportMenu.saveSessionDesc')}
              </p>
            </div>
          </button>

          {/* Option: Load .partitura */}
          <button
            type="button"
            role="menuitem"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            data-testid="load-partitura-option"
          >
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {t('exportMenu.loadSession')}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t('exportMenu.loadSessionDesc')}
              </p>
            </div>
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          {/* Option: Export MusicXML */}
          <button
            type="button"
            role="menuitem"
            disabled={loadingAction !== null}
            onClick={handleExportMusicXml}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
            data-testid="export-musicxml-option"
          >
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              {loadingAction === 'musicxml' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCode className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {t('exportMenu.exportMusicXml')}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t('exportMenu.exportMusicXmlDesc')}
              </p>
            </div>
          </button>

          {/* Option: Export MIDI */}
          <button
            type="button"
            role="menuitem"
            disabled={loadingAction !== null}
            onClick={handleExportMidi}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
            data-testid="export-midi-option"
          >
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
              {loadingAction === 'midi' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Music2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {t('exportMenu.exportMidi')}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t('exportMenu.exportMidiDesc')}
              </p>
            </div>
          </button>

          {error && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
