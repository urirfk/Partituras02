import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SCORE_CONFIG } from '../types/scoreConfig';
import { ScoreConfigProvider } from './ScoreConfigContext';
import { useScoreConfig } from './useScoreConfig';

describe('ScoreConfigContext (Invarianza Ortogonal)', () => {
  it('throws error when useScoreConfig is called outside ScoreConfigProvider', () => {
    expect(() => {
      renderHook(() => useScoreConfig());
    }).toThrow('useScoreConfig must be used within a ScoreConfigProvider');
  });

  it('provides DEFAULT_SCORE_CONFIG initially', () => {
    const { result } = renderHook(() => useScoreConfig(), {
      wrapper: ({ children }) => <ScoreConfigProvider>{children}</ScoreConfigProvider>,
    });

    expect(result.current.config).toEqual(DEFAULT_SCORE_CONFIG);
  });

  it('preserves strict orthogonal invariance when changing measuresPerSystem', () => {
    const { result } = renderHook(() => useScoreConfig(), {
      wrapper: ({ children }) => <ScoreConfigProvider>{children}</ScoreConfigProvider>,
    });

    act(() => {
      result.current.setMeasuresPerSystem(3);
    });

    expect(result.current.config.measuresPerSystem).toBe(3);
    // Invariance: All other 8 orthogonal fields must match DEFAULT_SCORE_CONFIG
    expect(result.current.config.showNoteNames).toBe(DEFAULT_SCORE_CONFIG.showNoteNames);
    expect(result.current.config.showAccidentals).toBe(DEFAULT_SCORE_CONFIG.showAccidentals);
    expect(result.current.config.showFingerings).toBe(DEFAULT_SCORE_CONFIG.showFingerings);
    expect(result.current.config.showChords).toBe(DEFAULT_SCORE_CONFIG.showChords);
    expect(result.current.config.showLyrics).toBe(DEFAULT_SCORE_CONFIG.showLyrics);
    expect(result.current.config.scale).toBe(DEFAULT_SCORE_CONFIG.scale);
    expect(result.current.config.transpositionSemitones).toBe(DEFAULT_SCORE_CONFIG.transpositionSemitones);
    expect(result.current.config.chordNotation).toBe(DEFAULT_SCORE_CONFIG.chordNotation);
  });

  it('preserves strict orthogonal invariance when toggling individual didactic switches', () => {
    const { result } = renderHook(() => useScoreConfig(), {
      wrapper: ({ children }) => <ScoreConfigProvider>{children}</ScoreConfigProvider>,
    });

    act(() => {
      result.current.toggleNoteNames();
    });

    expect(result.current.config.showNoteNames).toBe(!DEFAULT_SCORE_CONFIG.showNoteNames);
    expect(result.current.config.showFingerings).toBe(DEFAULT_SCORE_CONFIG.showFingerings);
    expect(result.current.config.showChords).toBe(DEFAULT_SCORE_CONFIG.showChords);
    expect(result.current.config.measuresPerSystem).toBe(DEFAULT_SCORE_CONFIG.measuresPerSystem);

    act(() => {
      result.current.toggleFingerings();
    });

    expect(result.current.config.showFingerings).toBe(!DEFAULT_SCORE_CONFIG.showFingerings);
    expect(result.current.config.showNoteNames).toBe(!DEFAULT_SCORE_CONFIG.showNoteNames);
    expect(result.current.config.showChords).toBe(DEFAULT_SCORE_CONFIG.showChords);

    act(() => {
      result.current.setTransposition(3);
    });
    expect(result.current.config.transpositionSemitones).toBe(3);
    expect(result.current.config.showFingerings).toBe(!DEFAULT_SCORE_CONFIG.showFingerings);
  });

  it('restores exact default config on resetConfig', () => {
    const { result } = renderHook(() => useScoreConfig(), {
      wrapper: ({ children }) => <ScoreConfigProvider>{children}</ScoreConfigProvider>,
    });

    act(() => {
      result.current.setMeasuresPerSystem(1);
      result.current.toggleNoteNames();
      result.current.toggleChords();
      result.current.setTransposition(-4);
      result.current.setChordNotation('american');
    });

    expect(result.current.config.measuresPerSystem).toBe(1);
    expect(result.current.config.chordNotation).toBe('american');

    act(() => {
      result.current.resetConfig();
    });

    expect(result.current.config).toEqual(DEFAULT_SCORE_CONFIG);
  });
});
