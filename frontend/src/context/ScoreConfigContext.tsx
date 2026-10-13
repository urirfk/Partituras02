import React, { useCallback, useMemo, useState } from 'react';
import {
  ChordNotation,
  DEFAULT_SCORE_CONFIG,
  MeasuresPerSystem,
  ScoreDisplayConfig,
  StaffScale,
} from '../types/scoreConfig';
import {
  ScoreConfigContext,
  ScoreConfigContextValue,
} from './ScoreConfigContextInstance';

export interface ScoreConfigProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<ScoreDisplayConfig>;
}

export const ScoreConfigProvider: React.FC<ScoreConfigProviderProps> = ({
  children,
  initialConfig,
}) => {
  const [config, setConfig] = useState<ScoreDisplayConfig>({
    ...DEFAULT_SCORE_CONFIG,
    ...initialConfig,
  });

  const updateConfig = useCallback((partial: Partial<ScoreDisplayConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  const setMeasuresPerSystem = useCallback((count: MeasuresPerSystem) => {
    setConfig((prev) => ({ ...prev, measuresPerSystem: count }));
  }, []);

  const toggleNoteNames = useCallback(() => {
    setConfig((prev) => ({ ...prev, showNoteNames: !prev.showNoteNames }));
  }, []);

  const toggleAccidentals = useCallback(() => {
    setConfig((prev) => ({ ...prev, showAccidentals: !prev.showAccidentals }));
  }, []);

  const toggleFingerings = useCallback(() => {
    setConfig((prev) => ({ ...prev, showFingerings: !prev.showFingerings }));
  }, []);

  const toggleChords = useCallback(() => {
    setConfig((prev) => ({ ...prev, showChords: !prev.showChords }));
  }, []);

  const toggleLyrics = useCallback(() => {
    setConfig((prev) => ({ ...prev, showLyrics: !prev.showLyrics }));
  }, []);

  const setScale = useCallback((scale: StaffScale) => {
    setConfig((prev) => ({ ...prev, scale }));
  }, []);

  const setTransposition = useCallback((semitones: number) => {
    const clamped = Math.max(-12, Math.min(12, semitones));
    setConfig((prev) => ({ ...prev, transpositionSemitones: clamped }));
  }, []);

  const setChordNotation = useCallback((notation: ChordNotation) => {
    setConfig((prev) => ({ ...prev, chordNotation: notation }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_SCORE_CONFIG });
  }, []);

  const value = useMemo<ScoreConfigContextValue>(
    () => ({
      config,
      updateConfig,
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
    }),
    [
      config,
      updateConfig,
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
    ]
  );

  return (
    <ScoreConfigContext.Provider value={value}>
      {children}
    </ScoreConfigContext.Provider>
  );
};
