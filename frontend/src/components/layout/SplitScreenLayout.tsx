import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type SplitViewMode = 'split' | 'original' | 'clean';

export interface SplitScreenLayoutProps {
  originalPanel: React.ReactNode;
  cleanPanel: React.ReactNode;
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  initialMode?: SplitViewMode;
  onModeChange?: (mode: SplitViewMode) => void;
  className?: string;
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({
  originalPanel,
  cleanPanel,
  initialRatio = 0.5,
  minRatio = 0.15,
  maxRatio = 0.85,
  initialMode = 'split',
  onModeChange,
  className = '',
}) => {
  const { t } = useTranslation();
  const [ratio, setRatio] = useState<number>(initialRatio);
  const [mode, setMode] = useState<SplitViewMode>(initialMode);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleModeSelect = (newMode: SplitViewMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const currentX = clientX - rect.left;
      const rawRatio = currentX / rect.width;
      const clamped = Math.max(minRatio, Math.min(maxRatio, rawRatio));
      setRatio(clamped);
      if (mode !== 'split') {
        setMode('split');
        onModeChange?.('split');
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX);
      }
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', stopDragging);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, minRatio, maxRatio, mode, onModeChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode !== 'split') return;
    const step = 0.05;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setRatio((prev) => Math.max(minRatio, prev - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setRatio((prev) => Math.min(maxRatio, prev + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setRatio(0.5);
    }
  };

  // Determine effective widths
  let leftPercent = ratio * 100;
  let rightPercent = (1 - ratio) * 100;

  if (mode === 'original') {
    leftPercent = 100;
    rightPercent = 0;
  } else if (mode === 'clean') {
    leftPercent = 0;
    rightPercent = 100;
  }

  return (
    <div className={`flex flex-col h-full w-full select-none ${className}`}>
      {/* Top mode switch bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-sm text-sm">
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            onClick={() => handleModeSelect('original')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'original'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
            data-testid="mode-original-btn"
          >
            {t('splitScreen.onlyOriginal')}
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('split')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'split'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
            data-testid="mode-split-btn"
          >
            {t('splitScreen.split')}
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('clean')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === 'clean'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
            data-testid="mode-clean-btn"
          >
            {t('splitScreen.onlyClean')}
          </button>
        </div>

        {mode === 'split' && (
          <button
            type="button"
            onClick={() => setRatio(0.5)}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            data-testid="reset-split-btn"
            title={t('splitScreen.resetSplit')}
          >
            {t('splitScreen.resetSplit')}
          </button>
        )}
      </div>

      {/* Split view workspace */}
      <div
        ref={containerRef}
        className="relative flex-1 flex overflow-hidden bg-zinc-100 dark:bg-zinc-950"
        data-testid="split-screen-container"
      >
        {/* Left Panel: Original Document */}
        <div
          style={{ width: `${leftPercent}%` }}
          className={`h-full overflow-auto transition-all ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mode === 'clean' ? 'hidden' : 'block'}`}
          data-testid="original-panel"
        >
          {originalPanel}
        </div>

        {/* Separator / Divider */}
        {mode === 'split' && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={Math.round(minRatio * 100)}
            aria-valuemax={Math.round(maxRatio * 100)}
            aria-label={t('splitScreen.dragHandleAria')}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onKeyDown={handleKeyDown}
            onDoubleClick={() => setRatio(0.5)}
            data-testid="split-divider"
            className="group relative w-2 hover:w-2.5 -mx-1 z-20 cursor-col-resize flex items-center justify-center transition-all bg-transparent focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <div
              className={`w-1 h-full transition-colors rounded-full ${
                isDragging
                  ? 'bg-zinc-500 dark:bg-zinc-400 shadow-md'
                  : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500'
              }`}
            />
          </div>
        )}

        {/* Right Panel: Clean Didactic SVG Score */}
        <div
          style={{ width: `${rightPercent}%` }}
          className={`h-full overflow-auto transition-all ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mode === 'original' ? 'hidden' : 'block'}`}
          data-testid="clean-panel"
        >
          {cleanPanel}
        </div>
      </div>
    </div>
  );
};
