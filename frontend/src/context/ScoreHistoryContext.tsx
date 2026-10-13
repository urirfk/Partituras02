import React, { useCallback, useMemo, useState } from 'react';
import { Note, Score } from '../types/music';
import {
  ScoreHistoryContext,
  ScoreHistoryContextValue,
} from './ScoreHistoryContextInstance';

export interface ScoreHistoryProviderProps {
  initialScore: Score;
  children: React.ReactNode;
}

const MAX_HISTORY_LENGTH = 50;

export const ScoreHistoryProvider: React.FC<ScoreHistoryProviderProps> = ({
  initialScore,
  children,
}) => {
  const [past, setPast] = useState<Score[]>([]);
  const [present, setPresent] = useState<Score>(initialScore);
  const [future, setFuture] = useState<Score[]>([]);

  const setScore = useCallback((newScore: Score) => {
    setPast([]);
    setPresent(newScore);
    setFuture([]);
  }, []);

  const updateScore = useCallback((updater: (prev: Score) => Score) => {
    setPresent((current) => {
      const next = updater(current);
      setPast((prevPast) => [...prevPast.slice(-MAX_HISTORY_LENGTH + 1), current]);
      setFuture([]);
      return next;
    });
  }, []);

  const updateNote = useCallback(
    (
      measureNumber: number,
      noteId: string,
      updatedFields: Partial<Note>,
      staff: 'upper' | 'lower' = 'upper'
    ) => {
      updateScore((prevScore) => {
        const updatedMeasures = prevScore.measures.map((m) => {
          if (m.number !== measureNumber) return m;

          if (staff === 'upper') {
            const nextNotes = m.notes.map((n) =>
              n.id === noteId ? { ...n, ...updatedFields } : n
            );
            return { ...m, notes: nextNotes };
          } else {
            const lowerList = m.lowerNotes || [];
            const nextLower = lowerList.map((n) =>
              n.id === noteId ? { ...n, ...updatedFields } : n
            );
            return { ...m, lowerNotes: nextLower };
          }
        });

        return {
          ...prevScore,
          measures: updatedMeasures,
        };
      });
    },
    [updateScore]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
    setPast(newPast);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [future, present]);

  const value = useMemo<ScoreHistoryContextValue>(
    () => ({
      score: present,
      setScore,
      updateScore,
      updateNote,
      undo,
      redo,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
    }),
    [present, setScore, updateScore, updateNote, undo, redo, past.length, future.length]
  );

  return (
    <ScoreHistoryContext.Provider value={value}>
      {children}
    </ScoreHistoryContext.Provider>
  );
};
