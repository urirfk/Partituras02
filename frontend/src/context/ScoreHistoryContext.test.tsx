import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Score } from '../types/music';
import { ScoreHistoryProvider } from './ScoreHistoryContext';
import { useScoreHistory } from './useScoreHistory';

const mockScore: Score = {
  id: 'test-score',
  metadata: {
    title: 'Estudio 1',
    composer: 'Czerny',
  },
  staffType: 'grand',
  measures: [
    {
      number: 1,
      chords: [],
      notes: [
        {
          id: 'm1-n1',
          pitch: {
            step: 'C',
            octave: 4,
            accidental: 'natural',
            solfege: 'do',
            displayBadgeText: 'do',
          },
          isRest: false,
          duration: 'quarter',
          dots: 0,
          fingering: 1,
        },
      ],
      lowerNotes: [
        {
          id: 'm1-lh-n1',
          pitch: {
            step: 'C',
            octave: 3,
            accidental: 'natural',
            solfege: 'do',
            displayBadgeText: 'do',
          },
          isRest: false,
          duration: 'half',
          dots: 0,
          fingering: 5,
        },
      ],
    },
  ],
};

describe('ScoreHistoryContext (Undo / Redo)', () => {
  it('throws error when useScoreHistory is used outside provider', () => {
    expect(() => {
      renderHook(() => useScoreHistory());
    }).toThrow('useScoreHistory must be used within a ScoreHistoryProvider');
  });

  it('initializes with the given score and empty history', () => {
    const { result } = renderHook(() => useScoreHistory(), {
      wrapper: ({ children }) => (
        <ScoreHistoryProvider initialScore={mockScore}>{children}</ScoreHistoryProvider>
      ),
    });

    expect(result.current.score.metadata.title).toBe('Estudio 1');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('updates an upper staff note and supports undo and redo', () => {
    const { result } = renderHook(() => useScoreHistory(), {
      wrapper: ({ children }) => (
        <ScoreHistoryProvider initialScore={mockScore}>{children}</ScoreHistoryProvider>
      ),
    });

    // Update fingering from 1 to 3
    act(() => {
      result.current.updateNote(1, 'm1-n1', { fingering: 3 });
    });

    expect(result.current.score.measures[0].notes[0].fingering).toBe(3);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    // Undo change
    act(() => {
      result.current.undo();
    });

    expect(result.current.score.measures[0].notes[0].fingering).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo change
    act(() => {
      result.current.redo();
    });

    expect(result.current.score.measures[0].notes[0].fingering).toBe(3);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('updates a lower staff note correctly', () => {
    const { result } = renderHook(() => useScoreHistory(), {
      wrapper: ({ children }) => (
        <ScoreHistoryProvider initialScore={mockScore}>{children}</ScoreHistoryProvider>
      ),
    });

    act(() => {
      result.current.updateNote(
        1,
        'm1-lh-n1',
        { fingering: 4 },
        'lower'
      );
    });

    expect(result.current.score.measures[0].lowerNotes?.[0].fingering).toBe(4);

    act(() => {
      result.current.undo();
    });

    expect(result.current.score.measures[0].lowerNotes?.[0].fingering).toBe(5);
  });

  it('resets history when setScore is called', () => {
    const { result } = renderHook(() => useScoreHistory(), {
      wrapper: ({ children }) => (
        <ScoreHistoryProvider initialScore={mockScore}>{children}</ScoreHistoryProvider>
      ),
    });

    act(() => {
      result.current.updateNote(1, 'm1-n1', { fingering: 2 });
    });
    expect(result.current.canUndo).toBe(true);

    const newScore: Score = {
      ...mockScore,
      id: 'brand-new-score',
      metadata: { ...mockScore.metadata, title: 'Nueva Obra' },
    };

    act(() => {
      result.current.setScore(newScore);
    });

    expect(result.current.score.metadata.title).toBe('Nueva Obra');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
