import { FileUp, Loader2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClient, apiClient as defaultApiClient } from '../../services/apiClient';
import { Score } from '../../types/music';

export interface ScoreDropzoneProps {
  onScoreLoaded: (score: Score, originalPages: string[]) => void;
  client?: ApiClient;
  className?: string;
}

export const ScoreDropzone: React.FC<ScoreDropzoneProps> = ({
  onScoreLoaded,
  client = defaultApiClient,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [processingFilename, setProcessingFilename] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setProcessingFilename(file.name);
    setLoadingText(t('dropzone.processing'));

    try {
      const filename = file.name.toLowerCase();
      let score: Score;
      const pages: string[] = [];

      if (filename.endsWith('.xml') || filename.endsWith('.musicxml')) {
        score = await client.importMusicXml(file);
      } else if (filename.endsWith('.mid') || filename.endsWith('.midi')) {
        score = await client.importMidi(file);
      } else {
        // PDF or Image file
        setLoadingText(t('dropzone.omrRunning'));
        score = await client.processOmr(file);
        if (score.pages && score.pages.length > 0) {
          pages.push(...score.pages);
        } else {
          const fileUrl = URL.createObjectURL(file);
          pages.push(fileUrl);
        }
      }

      onScoreLoaded(score, pages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`${t('dropzone.errorPrefix')}${msg}`);
    } finally {
      setIsLoading(false);
      setLoadingText('');
      setProcessingFilename(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-2xl border-2 border-dashed rounded-3xl p-10 flex flex-col items-center text-center transition-all ${
        isDragOver
          ? 'border-zinc-900 bg-zinc-100/80 dark:border-zinc-100 dark:bg-zinc-800/80 scale-[1.01]'
          : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/30'
      } shadow-sm ${className}`}
      data-testid="score-dropzone"
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-4 shadow-xs">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
        ) : (
          <FileUp className="w-8 h-8" />
        )}
      </div>

      <h2 className="text-xl font-medium tracking-tight mb-2 text-zinc-900 dark:text-white">
        {t('dropzone.title')}
      </h2>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
        {t('dropzone.description')}
      </p>

      {errorMessage && (
        <div
          className="mb-4 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium"
          data-testid="dropzone-error"
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          {processingFilename && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 max-w-xs truncate"
              data-testid="dropzone-processing-filename"
            >
              📄 {processingFilename}
            </span>
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <span data-testid="dropzone-loading-text">{loadingText}</span>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition shadow-sm">
          {t('dropzone.selectFile')}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.musicxml,.mid,.midi"
            onChange={handleFileChange}
            data-testid="dropzone-file-input"
          />
        </label>
      )}
    </div>
  );
};
