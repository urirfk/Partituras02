import { createContext } from 'react';
import {
  ChordNotation,
  MeasuresPerSystem,
  ScoreDisplayConfig,
  StaffScale,
} from '../types/scoreConfig';

export interface ScoreConfigContextValue {
  config: ScoreDisplayConfig;
  updateConfig: (partial: Partial<ScoreDisplayConfig>) => void;
  setMeasuresPerSystem: (count: MeasuresPerSystem) => void;
  toggleNoteNames: () => void;
  toggleAccidentals: () => void;
  toggleFingerings: () => void;
  toggleChords: () => void;
  toggleLyrics: () => void;
  setScale: (scale: StaffScale) => void;
  setTransposition: (semitones: number) => void;
  setChordNotation: (notation: ChordNotation) => void;
  resetConfig: () => void;
}

export const ScoreConfigContext = createContext<ScoreConfigContextValue | undefined>(undefined);
