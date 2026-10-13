import { createContext } from 'react';
import { Note, Score } from '../types/music';

export interface ScoreHistoryContextValue {
  score: Score;
  setScore: (score: Score) => void;
  updateScore: (updater: (prev: Score) => Score) => void;
  updateNote: (
    measureNumber: number,
    noteId: string,
    updatedNote: Partial<Note>,
    staff?: 'upper' | 'lower'
  ) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ScoreHistoryContext = createContext<ScoreHistoryContextValue | undefined>(
  undefined
);
