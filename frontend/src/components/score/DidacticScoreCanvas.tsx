import React from 'react';
import { useTranslation } from 'react-i18next';
import { useScoreConfig } from '../../context/useScoreConfig';
import { partitionMeasuresIntoSystems } from '../../renderer/layout/systemPartitioning';
import { SvgSystem } from '../../renderer/svg/SvgSystem';
import { Note, Score } from '../../types/music';

export interface DidacticScoreCanvasProps {
  score: Score;
  onNoteClick?: (
    note: Note,
    measureNumber: number,
    staff: 'upper' | 'lower',
    clientX: number,
    clientY: number
  ) => void;
  selectedNoteId?: string;
  className?: string;
}

export const DidacticScoreCanvas: React.FC<DidacticScoreCanvasProps> = ({
  score,
  onNoteClick,
  selectedNoteId,
  className = '',
}) => {
  const { t } = useTranslation();
  const { config } = useScoreConfig();

  // Scale multipliers
  const scaleMultiplier =
    config.scale === 'normal' ? 0.85 : config.scale === 'extra-large' ? 1.15 : 1.0;
  const lineSpacing = 10 * scaleMultiplier;
  const isGrandStaff = score.staffType === 'grand';
  const staffGap = isGrandStaff ? 55 * scaleMultiplier : 0;
  const systemHeight = isGrandStaff ? 230 * scaleMultiplier : 150 * scaleMultiplier;

  // Partition measures dynamically according to measuresPerSystem (strictly orthogonal)
  const systems = partitionMeasuresIntoSystems(score.measures, {
    measuresPerSystem: config.measuresPerSystem,
    systemWidth: 780,
    minNoteDistance: 45 * scaleMultiplier,
  });

  const totalSvgHeight = Math.max(300, systems.length * systemHeight + 60);

  return (
    <div
      className={`w-full h-full overflow-auto flex justify-center p-4 sm:p-8 bg-zinc-100/60 dark:bg-zinc-950 ${className}`}
      data-testid="didactic-score-canvas"
    >
      <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-md p-6 sm:p-10 w-full max-w-[850px] min-h-[600px] border border-zinc-200 dark:border-zinc-800 transition-all">
        {/* Editorial Header */}
        <div className="text-center mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            data-testid="canvas-score-title"
          >
            {score.metadata.title}
          </h2>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            <span>{score.metadata.tempo?.text || (score.metadata.tempo?.bpm ? `♩ = ${score.metadata.tempo.bpm}` : '')}</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {score.metadata.composer}
            </span>
          </div>
        </div>

        {/* SVG Systems View or Empty State */}
        {systems.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 text-zinc-400 dark:text-zinc-500"
            data-testid="empty-score-measures"
          >
            <p className="text-sm font-medium">{t('canvas.noMeasures')}</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 800 ${totalSvgHeight}`}
            width="100%"
            height={totalSvgHeight}
            className="overflow-visible select-none"
            data-testid="score-svg-root"
          >
            {systems.map((system, sysIdx) => {
              const systemY = 30 + sysIdx * systemHeight;
              return (
                <g
                  key={`sys-${system.systemIndex}`}
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
                    selectedNoteId={selectedNoteId}
                    onNoteClick={(note) => {
                      // Find which measure and staff contains this note
                      let foundMeasureNumber = 1;
                      let foundStaff: 'upper' | 'lower' = 'upper';
                      for (const m of score.measures) {
                        if (m.notes.some((n) => n.id === note.id)) {
                          foundMeasureNumber = m.number;
                          foundStaff = 'upper';
                          break;
                        }
                        if (m.lowerNotes && m.lowerNotes.some((n) => n.id === note.id)) {
                          foundMeasureNumber = m.number;
                          foundStaff = 'lower';
                          break;
                        }
                      }
                      onNoteClick?.(
                        note,
                        foundMeasureNumber,
                        foundStaff,
                        window.innerWidth / 2,
                        window.innerHeight / 3
                      );
                    }}
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};
