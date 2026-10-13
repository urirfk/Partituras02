import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useScoreHistory } from '../../context/useScoreHistory';
import {
  Accidental,
  DurationType,
  Fingering,
  Note,
  Pitch,
  SolfeggioNote,
  Step,
} from '../../types/music';

const STEP_TO_SOLFEGE: Record<Step, SolfeggioNote> = {
  C: 'do',
  D: 're',
  E: 'mi',
  F: 'fa',
  G: 'sol',
  A: 'la',
  B: 'si',
};

const getBadgeText = (solfege: SolfeggioNote, accidental: Accidental): string => {
  if (accidental === 'sharp') return `♯${solfege}`;
  if (accidental === 'flat') return `♭${solfege}`;
  return solfege;
};

export interface NoteEditPopoverProps {
  note: Note;
  measureNumber: number;
  staff?: 'upper' | 'lower';
  anchorPosition: { x: number; y: number };
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedNote: Partial<Note>) => void;
  className?: string;
}

export const NoteEditPopover: React.FC<NoteEditPopoverProps> = ({
  note,
  measureNumber,
  staff = 'upper',
  anchorPosition,
  isOpen,
  onClose,
  onSave,
  className = '',
}) => {
  const { t } = useTranslation();
  const { updateNote } = useScoreHistory();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPitch: Pitch = note.pitch || {
    step: 'C',
    octave: 4,
    accidental: 'natural',
    solfege: 'do',
    displayBadgeText: 'do',
  };

  const handleStepChange = (newStep: Step) => {
    const solfege = STEP_TO_SOLFEGE[newStep];
    const displayBadgeText = getBadgeText(solfege, currentPitch.accidental);
    const updatedPitch: Pitch = {
      ...currentPitch,
      step: newStep,
      solfege,
      displayBadgeText,
    };
    updateNote(measureNumber, note.id, { pitch: updatedPitch, isRest: false }, staff);
    onSave?.({ pitch: updatedPitch, isRest: false });
  };

  const handleOctaveChange = (delta: number) => {
    const newOctave = Math.max(1, Math.min(7, currentPitch.octave + delta));
    const updatedPitch: Pitch = {
      ...currentPitch,
      octave: newOctave,
    };
    updateNote(measureNumber, note.id, { pitch: updatedPitch }, staff);
    onSave?.({ pitch: updatedPitch });
  };

  const handleAccidentalChange = (newAcc: Accidental) => {
    const displayBadgeText = getBadgeText(currentPitch.solfege, newAcc);
    const updatedPitch: Pitch = {
      ...currentPitch,
      accidental: newAcc,
      displayBadgeText,
    };
    updateNote(measureNumber, note.id, { pitch: updatedPitch }, staff);
    onSave?.({ pitch: updatedPitch });
  };

  const handleFingeringChange = (newFingering: Fingering | undefined) => {
    updateNote(measureNumber, note.id, { fingering: newFingering }, staff);
    onSave?.({ fingering: newFingering });
  };

  const handleDurationChange = (newDuration: DurationType) => {
    updateNote(measureNumber, note.id, { duration: newDuration }, staff);
    onSave?.({ duration: newDuration });
  };

  const handleToggleRest = () => {
    const nextRest = !note.isRest;
    updateNote(measureNumber, note.id, { isRest: nextRest }, staff);
    onSave?.({ isRest: nextRest });
  };

  // Safe positioning clamping within viewport
  const leftPos = Math.max(10, Math.min(window.innerWidth - 300, anchorPosition.x - 140));
  const topPos = Math.max(10, anchorPosition.y + 20);

  return (
    <div
      ref={popoverRef}
      style={{ left: `${leftPos}px`, top: `${topPos}px` }}
      className={`fixed z-50 w-72 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 text-xs text-zinc-700 dark:text-zinc-200 backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-100 ${className}`}
      data-testid="note-edit-popover"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
          <span>✏️</span>
          <span>
            {t('editor.editNote')} — {t('editor.measure')} {measureNumber}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          data-testid="popover-close-btn"
          aria-label={t('editor.close')}
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Rest toggle */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            {t('editor.isRest')}
          </span>
          <button
            type="button"
            onClick={handleToggleRest}
            className={`px-2.5 py-0.5 rounded-md font-medium text-xs transition-colors ${
              note.isRest
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
            data-testid="toggle-rest-btn"
          >
            {note.isRest ? '✓ ' + t('editor.isRest') : t('editor.isRest')}
          </button>
        </div>

        {!note.isRest && (
          <>
            {/* Step selector */}
            <div>
              <span className="block mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                {t('editor.pitch')}
              </span>
              <div className="grid grid-cols-7 gap-1">
                {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as Step[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStepChange(st)}
                    className={`py-1 text-center font-bold rounded transition-colors ${
                      currentPitch.step === st
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                    data-testid={`pitch-step-${st}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Octave & Accidental Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Octave Stepper */}
              <div>
                <span className="block mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                  {t('editor.octave')}
                </span>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleOctaveChange(-1)}
                    disabled={currentPitch.octave <= 1}
                    className="px-1.5 py-0.5 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30"
                    data-testid="octave-dec"
                  >
                    －
                  </button>
                  <span
                    className="font-mono font-bold px-1 tabular-nums"
                    data-testid="octave-val"
                  >
                    {currentPitch.octave}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOctaveChange(1)}
                    disabled={currentPitch.octave >= 7}
                    className="px-1.5 py-0.5 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30"
                    data-testid="octave-inc"
                  >
                    ＋
                  </button>
                </div>
              </div>

              {/* Accidental Segmented */}
              <div>
                <span className="block mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                  {t('editor.accidental')}
                </span>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleAccidentalChange('flat')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      currentPitch.accidental === 'flat'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    data-testid="accidental-flat"
                    title={t('editor.flat')}
                  >
                    ♭
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccidentalChange('natural')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      currentPitch.accidental === 'natural'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    data-testid="accidental-natural"
                    title={t('editor.natural')}
                  >
                    ♮
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccidentalChange('sharp')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      currentPitch.accidental === 'sharp'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    data-testid="accidental-sharp"
                    title={t('editor.sharp')}
                  >
                    ♯
                  </button>
                </div>
              </div>
            </div>

            {/* Fingering Buttons (None, 1, 2, 3, 4, 5) */}
            <div>
              <span className="block mb-1 font-medium text-zinc-600 dark:text-zinc-400">
                {t('editor.fingering')}
              </span>
              <div className="grid grid-cols-6 gap-1">
                <button
                  type="button"
                  onClick={() => handleFingeringChange(undefined)}
                  className={`py-1 text-center font-medium rounded ${
                    note.fingering === undefined
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  data-testid="fingering-none"
                  title={t('editor.noFingering')}
                >
                  ✕
                </button>
                {([1, 2, 3, 4, 5] as Fingering[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFingeringChange(f)}
                    className={`py-1 text-center font-bold rounded ${
                      note.fingering === f
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    data-testid={`fingering-${f}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Duration selector */}
        <div>
          <span className="block mb-1 font-medium text-zinc-600 dark:text-zinc-400">
            {t('editor.duration')}
          </span>
          <select
            value={note.duration}
            onChange={(e) => handleDurationChange(e.target.value as DurationType)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg p-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
            data-testid="select-duration"
          >
            <option value="whole">Redonda (Whole)</option>
            <option value="half">Blanca (Half)</option>
            <option value="quarter">Negra (Quarter)</option>
            <option value="eighth">Corchea (Eighth)</option>
            <option value="16th">Semicorchea (16th)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
