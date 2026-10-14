import React from 'react';
import { useTranslation } from 'react-i18next';
import { useScoreConfig } from '../../context/useScoreConfig';
import { ChordNotation, MeasuresPerSystem, StaffScale } from '../../types/scoreConfig';

export interface OrthogonalControlsBarProps {
  className?: string;
}

export const OrthogonalControlsBar: React.FC<OrthogonalControlsBarProps> = ({
  className = '',
}) => {
  const { t } = useTranslation();
  const {
    config,
    setMeasuresPerSystem,
    toggleNoteNames,
    toggleAccidentals,
    toggleFingerings,
    toggleChords,
    toggleLyrics,
    setScale,
    setTransposition,
    setChordNotation,
    resetConfig,
  } = useScoreConfig();

  const handleTranspositionDec = () => {
    setTransposition(config.transpositionSemitones - 1);
  };

  const handleTranspositionInc = () => {
    setTransposition(config.transpositionSemitones + 1);
  };

  return (
    <div
      role="toolbar"
      aria-label={t('controls.toolbarAria')}
      className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 select-none ${className}`}
      data-testid="orthogonal-controls-bar"
    >
      {/* Left section: Density & Didactic Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Measures per System Segmented Control */}
        <div
          role="radiogroup"
          aria-label={t('controls.measuresPerSystem')}
          className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg"
        >
          <span className="px-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {t('controls.measuresPerSystem')}:
          </span>
          {([1, 2, 3, 4] as MeasuresPerSystem[]).map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={config.measuresPerSystem === count}
              onClick={() => setMeasuresPerSystem(count)}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                config.measuresPerSystem === count
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              data-testid={`density-btn-${count}`}
            >
              {count}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-zinc-200 dark:border-zinc-800 hidden sm:block" />

        {/* Note names (Solfege badge) toggle */}
        <button
          type="button"
          aria-pressed={config.showNoteNames}
          onClick={toggleNoteNames}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            config.showNoteNames
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          data-testid="toggle-note-names"
          title={t('controls.noteNames')}
        >
          <span>🎵</span>
          <span>{t('controls.noteNames')}</span>
        </button>

        {/* Accidentals toggle */}
        <button
          type="button"
          aria-pressed={config.showAccidentals}
          onClick={toggleAccidentals}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            config.showAccidentals
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          data-testid="toggle-accidentals"
          title={t('controls.accidentals')}
        >
          <span>♯/♭</span>
          <span>{t('controls.accidentals')}</span>
        </button>

        {/* Fingerings toggle */}
        <button
          type="button"
          aria-pressed={config.showFingerings}
          onClick={toggleFingerings}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            config.showFingerings
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          data-testid="toggle-fingerings"
          title={t('controls.fingerings')}
        >
          <span>🖐️</span>
          <span>{t('controls.fingerings')}</span>
        </button>

        {/* Chords toggle & format */}
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg">
          <button
            type="button"
            aria-pressed={config.showChords}
            onClick={toggleChords}
            className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
              config.showChords
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            data-testid="toggle-chords"
            title={t('controls.chords')}
          >
            {t('controls.chords')}
          </button>
          {config.showChords && (
            <select
              value={config.chordNotation}
              onChange={(e) => setChordNotation(e.target.value as ChordNotation)}
              className="bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-300 font-medium py-0.5 px-1 focus:outline-none cursor-pointer"
              data-testid="select-chord-notation"
            >
              <option value="latin">{t('controls.chordLatin')}</option>
              <option value="american">{t('controls.chordAmerican')}</option>
            </select>
          )}
        </div>

        {/* Lyrics toggle */}
        <button
          type="button"
          aria-pressed={config.showLyrics}
          onClick={toggleLyrics}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            config.showLyrics
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          data-testid="toggle-lyrics"
          title={t('controls.lyrics')}
        >
          <span>💬</span>
          <span>{t('controls.lyrics')}</span>
        </button>
      </div>

      {/* Right section: Scale, Transposition & Reset */}
      <div className="flex items-center gap-2">
        {/* Scale Selector */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-lg">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {t('controls.scale')}:
          </span>
          <select
            value={config.scale}
            onChange={(e) => setScale(e.target.value as StaffScale)}
            className="bg-transparent border-none text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            data-testid="select-scale"
          >
            <option value="normal">{t('controls.scaleNormal')}</option>
            <option value="large">{t('controls.scaleLarge')}</option>
            <option value="extra-large">{t('controls.scaleExtraLarge')}</option>
          </select>
        </div>

        {/* Transposition stepper */}
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg">
          <span className="px-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {t('controls.transposition')}:
          </span>
          <button
            type="button"
            onClick={handleTranspositionDec}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold"
            data-testid="transposition-dec"
            title="-1 st"
          >
            －
          </button>
          <span
            className="px-1 font-mono text-xs font-semibold tabular-nums min-w-[2.2rem] text-center"
            data-testid="transposition-val"
          >
            {config.transpositionSemitones > 0 ? `+${config.transpositionSemitones}` : config.transpositionSemitones} {t('controls.semitones')}
          </span>
          <button
            type="button"
            onClick={handleTranspositionInc}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold"
            data-testid="transposition-inc"
            title="+1 st"
          >
            ＋
          </button>
        </div>

        {/* Reset Defaults button */}
        <button
          type="button"
          onClick={resetConfig}
          className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          data-testid="reset-config-btn"
          title={t('controls.resetDefaults')}
          aria-label={t('controls.resetDefaults')}
        >
          ↺
        </button>
      </div>
    </div>
  );
};
