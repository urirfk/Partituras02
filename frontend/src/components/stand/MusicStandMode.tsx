import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Moon,
  Sun,
} from 'lucide-react';
import { Score } from '../../types/music';
import { useScoreConfig } from '../../context/useScoreConfig';
import { partitionMeasuresIntoSystems, SystemLayout } from '../../renderer/layout/systemPartitioning';
import { SvgSystem } from '../../renderer/svg/SvgSystem';

export interface MusicStandModeProps {
  score: Score;
  onExit: () => void;
  className?: string;
}

export const MusicStandMode: React.FC<MusicStandModeProps> = ({
  score,
  onExit,
  className = '',
}) => {
  const { t } = useTranslation();
  const { config } = useScoreConfig();

  const isGrandStaff = score.staffType === 'grand';
  const defaultSystemsPerPage = isGrandStaff ? 2 : 3;

  const [systemsPerPage, setSystemsPerPage] = useState<number>(defaultSystemsPerPage);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const hudTimeoutRef = useRef<number | null>(null);

  // Auto-hide HUD after 3.5 seconds of inactivity
  const resetHudTimer = useCallback(() => {
    setIsHudVisible(true);
    if (hudTimeoutRef.current) {
      window.clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = window.setTimeout(() => {
      setIsHudVisible(false);
    }, 3500);
  }, []);

  useEffect(() => {
    resetHudTimer();
    return () => {
      if (hudTimeoutRef.current) {
        window.clearTimeout(hudTimeoutRef.current);
      }
    };
  }, [resetHudTimer]);

  // Scale multipliers
  const scaleMultiplier =
    config.scale === 'normal' ? 0.85 : config.scale === 'extra-large' ? 1.15 : 1.0;
  const lineSpacing = 10 * scaleMultiplier;
  const staffGap = isGrandStaff ? 55 * scaleMultiplier : 0;
  const systemHeight = isGrandStaff ? 230 * scaleMultiplier : 150 * scaleMultiplier;

  // Partition measures into systems
  const allSystems = partitionMeasuresIntoSystems(score.measures, {
    measuresPerSystem: config.measuresPerSystem,
    systemWidth: 800,
    minNoteDistance: 45 * scaleMultiplier,
  });

  // Group systems into pages
  const pages: SystemLayout[][] = [];
  for (let i = 0; i < allSystems.length; i += systemsPerPage) {
    pages.push(allSystems.slice(i, i + systemsPerPage));
  }

  const totalPages = Math.max(1, pages.length);
  const validCurrentPage = Math.min(currentPage, totalPages - 1);
  const currentSystems = pages[validCurrentPage] || [];

  const firstMeasure = currentSystems[0]?.startMeasureNumber || 1;
  const lastSystem = currentSystems[currentSystems.length - 1];
  const lastMeasure = lastSystem
    ? lastSystem.measures[lastSystem.measures.length - 1]?.measure.number || firstMeasure
    : firstMeasure;

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
    resetHudTimer();
  }, [totalPages, resetHudTimer]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
    resetHudTimer();
  }, [resetHudTimer]);

  // Keyboard and Bluetooth pedal navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      } else {
        resetHudTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextPage, goToPrevPage, onExit, resetHudTimer]);

  const totalSvgHeight = Math.max(300, currentSystems.length * systemHeight + 60);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden transition-colors select-none ${
        isDarkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-[#faf9f6] text-zinc-900'
      } ${className}`}
      onMouseMove={resetHudTimer}
      onClick={resetHudTimer}
      data-testid="music-stand-mode"
    >
      {/* Top Floating HUD */}
      <header
        className={`w-full max-w-5xl px-6 py-3 flex items-center justify-between transition-opacity duration-300 z-30 ${
          isHudVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        data-testid="stand-header-hud"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {t('nav.standMode')}
          </span>
          <h2 className="text-sm font-semibold tracking-tight truncate max-w-xs sm:max-w-md">
            {score.metadata.title}
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            • {t('editor.measure')} {firstMeasure} - {lastMeasure}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark / Warm Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
            title="Cambiar Contraste"
            data-testid="theme-toggle-btn"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Exit Fullscreen Button */}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
            data-testid="exit-stand-btn"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Esc</span>
          </button>
        </div>
      </header>

      {/* Main Score Area with Touch Tap Navigation Zones */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Left Touch / Pedal Tap Zone (Previous Page) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-w-resize flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevPage();
          }}
          data-testid="stand-tap-prev"
        >
          {validCurrentPage > 0 && (
            <div className="p-3 rounded-full bg-black/40 text-white backdrop-blur-md">
              <ChevronLeft className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Right Touch / Pedal Tap Zone (Next Page) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-e-resize flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            goToNextPage();
          }}
          data-testid="stand-tap-next"
        >
          {validCurrentPage < totalPages - 1 && (
            <div className="p-3 rounded-full bg-black/40 text-white backdrop-blur-md">
              <ChevronRight className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Crisp Vector Score Canvas */}
        <div className="w-full max-w-4xl max-h-full flex items-center justify-center">
          <svg
            viewBox={`0 0 800 ${totalSvgHeight}`}
            width="100%"
            height="100%"
            className="overflow-visible select-none max-h-[82vh]"
            data-testid="stand-score-svg"
          >
            {currentSystems.map((system, sysIdx) => {
              const systemY = 30 + sysIdx * systemHeight;
              return (
                <g
                  key={`stand-sys-${system.systemIndex}`}
                  transform={`translate(0, ${systemY})`}
                >
                  <SvgSystem
                    system={system}
                    baseY={40}
                    lineSpacing={lineSpacing}
                    staffType={score.staffType}
                    staffGap={staffGap}
                    showNoteNames={config.showNoteNames}
                    showAccidentals={config.showAccidentals}
                    showFingerings={config.showFingerings}
                    showChords={config.showChords}
                    chordNotation={config.chordNotation}
                    showLyrics={config.showLyrics}
                    showMeasureNumbers={true}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Floating HUD */}
      <footer
        className={`w-full max-w-md px-6 py-3 mb-2 flex items-center justify-between rounded-2xl bg-zinc-900/90 dark:bg-zinc-900/90 text-zinc-100 border border-zinc-800 shadow-2xl backdrop-blur-md transition-opacity duration-300 z-30 ${
          isHudVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        data-testid="stand-footer-hud"
      >
        <button
          type="button"
          onClick={goToPrevPage}
          disabled={validCurrentPage === 0}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
          data-testid="stand-btn-prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold tabular-nums tracking-wide"
            data-testid="stand-page-indicator"
          >
            {t('viewer.page')} {validCurrentPage + 1} {t('viewer.of')} {totalPages}
          </span>

          {/* Systems Per Page Selector */}
          <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg text-[10px] font-medium">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSystemsPerPage(num)}
                className={`px-2 py-0.5 rounded transition ${
                  systemsPerPage === num ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                data-testid={`systems-per-page-${num}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goToNextPage}
          disabled={validCurrentPage >= totalPages - 1}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
          data-testid="stand-btn-next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
};
