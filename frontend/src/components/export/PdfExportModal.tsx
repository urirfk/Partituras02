import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileDown, Loader2, Check } from 'lucide-react';
import { Score } from '../../types/music';
import { useScoreConfig } from '../../context/useScoreConfig';
import { exportScoreToPdf, downloadPdf } from '../../services/pdfExporter';

export interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: Score;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  score,
}) => {
  const { t } = useTranslation();
  const { config } = useScoreConfig();

  const [title, setTitle] = useState(score.metadata.title);
  const [composer, setComposer] = useState(score.metadata.composer || '');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginMm, setMarginMm] = useState<number>(15);
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const doc = await exportScoreToPdf(score, config, {
        title: title.trim() || score.metadata.title,
        composer: composer.trim() || score.metadata.composer,
        orientation,
        marginMm,
        includeHeader,
        includePageNumbers,
      });

      const sanitizedFilename = (title.trim() || 'partitura-didactica')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/gi, '_');

      downloadPdf(doc, sanitizedFilename);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-export-modal-title"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 id="pdf-export-modal-title" className="text-lg font-semibold tracking-tight">
              {t('exportModal.title')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={t('exportModal.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('exportModal.description')}
          </p>

          {/* Title and Composer fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor="export-title-input" className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                {t('exportModal.documentTitle')}
              </label>
              <input
                id="export-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="export-composer-input" className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                {t('exportModal.composer')}
              </label>
              <input
                id="export-composer-input"
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
              {t('exportModal.orientation')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  orientation === 'portrait'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
                data-testid="orientation-portrait"
              >
                {t('exportModal.portrait')}
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  orientation === 'landscape'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
                data-testid="orientation-landscape"
              >
                {t('exportModal.landscape')}
              </button>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
              {t('exportModal.margins')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mm: 10, labelKey: 'exportModal.marginNarrow' },
                { mm: 15, labelKey: 'exportModal.marginNormal' },
                { mm: 20, labelKey: 'exportModal.marginWide' },
              ].map(({ mm, labelKey }) => (
                <button
                  key={mm}
                  type="button"
                  onClick={() => setMarginMm(mm)}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center transition-all ${
                    marginMm === mm
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                  data-testid={`margin-${mm}`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox Toggles */}
          <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700"
                data-testid="include-header-checkbox"
              />
              <span>{t('exportModal.includeHeader')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={includePageNumbers}
                onChange={(e) => setIncludePageNumbers(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700"
                data-testid="include-page-numbers-checkbox"
              />
              <span>{t('exportModal.includePageNumbers')}</span>
            </label>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('exportModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
            data-testid="confirm-export-button"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('exportModal.downloading')}</span>
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{t('exportModal.success')}</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>{t('exportModal.download')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
