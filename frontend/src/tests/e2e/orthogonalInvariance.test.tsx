import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../App';
import i18n from '../../i18n/config';

describe('E2E Orthogonal Invariance Integration Suite', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('guarantees that notehead capsule toggle (showNoteNames) transforms noteheads without affecting other layers', () => {
    render(<App />);

    // Initially notehead capsules are rendered
    expect(screen.getAllByTestId('notehead-capsule').length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId('classic-notehead').length).toBe(0);

    // Initial chords and fingerings are present
    const initialChordsCount = screen.getAllByTestId('svg-chord').length;
    expect(initialChordsCount).toBeGreaterThan(0);

    // Toggle note names OFF
    const toggleNoteNamesBtn = screen.getByTestId('toggle-note-names');
    fireEvent.click(toggleNoteNamesBtn);

    // Now capsules are gone, classic noteheads are rendered
    expect(screen.queryAllByTestId('notehead-capsule').length).toBe(0);
    expect(screen.getAllByTestId('classic-notehead').length).toBeGreaterThan(0);

    // Chords and measures per system remain 100% invariant
    expect(screen.getAllByTestId('svg-chord').length).toBe(initialChordsCount);
    expect(screen.getByTestId('density-btn-2')).toHaveClass('bg-zinc-900');

    // Toggle note names back ON
    fireEvent.click(toggleNoteNamesBtn);
    expect(screen.getAllByTestId('notehead-capsule').length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId('classic-notehead').length).toBe(0);
  });

  it('guarantees that chords toggle (showChords) operates orthogonally without altering note names or density', () => {
    render(<App />);

    const toggleChordsBtn = screen.getByTestId('toggle-chords');
    const initialCapsulesCount = screen.getAllByTestId('notehead-capsule').length;
    expect(screen.getAllByTestId('svg-chord').length).toBeGreaterThan(0);

    // Toggle chords OFF
    fireEvent.click(toggleChordsBtn);
    expect(screen.queryAllByTestId('svg-chord').length).toBe(0);

    // Note capsules and density remain untouched
    expect(screen.getAllByTestId('notehead-capsule').length).toBe(initialCapsulesCount);
    expect(screen.getByTestId('density-btn-2')).toHaveClass('bg-zinc-900');

    // Toggle chords ON
    fireEvent.click(toggleChordsBtn);
    expect(screen.getAllByTestId('svg-chord').length).toBeGreaterThan(0);
  });

  it('guarantees that density selector (measuresPerSystem) re-partitions systems strictly without resetting note edits', () => {
    render(<App />);

    // 1. Edit the first note: change step to A ('la')
    const firstNote = screen.getAllByTestId('notehead-capsule')[0];
    fireEvent.click(firstNote);
    fireEvent.click(screen.getByTestId('pitch-step-A'));

    // Verify first note is now 'la'
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('la');

    // 2. Change density from 2 to 1 measure per system
    const density1Btn = screen.getByTestId('density-btn-1');
    fireEvent.click(density1Btn);

    // First note must STILL be 'la' (note edit invariant preserved)
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('la');
    expect(density1Btn).toHaveClass('bg-zinc-900');

    // 3. Change density to 4 measures per system
    const density4Btn = screen.getByTestId('density-btn-4');
    fireEvent.click(density4Btn);

    // First note must STILL be 'la'
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('la');
    expect(density4Btn).toHaveClass('bg-zinc-900');
  });

  it('guarantees that transposition and scale controls operate orthogonally without side effects', () => {
    render(<App />);

    const transVal = screen.getByTestId('transposition-val');
    expect(transVal).toHaveTextContent('0 st');

    // Transpose +2 semitones
    const incBtn = screen.getByTestId('transposition-inc');
    fireEvent.click(incBtn);
    fireEvent.click(incBtn);
    expect(screen.getByTestId('transposition-val')).toHaveTextContent('+2 st');

    // Change scale selector
    const scaleSelect = screen.getByTestId('select-scale');
    fireEvent.change(scaleSelect, { target: { value: 'extra-large' } });
    expect(scaleSelect).toHaveValue('extra-large');

    // Transposition remains +2 semitones
    expect(screen.getByTestId('transposition-val')).toHaveTextContent('+2 st');

    // Transpose -3 semitones -> -1
    const decBtn = screen.getByTestId('transposition-dec');
    fireEvent.click(decBtn);
    fireEvent.click(decBtn);
    fireEvent.click(decBtn);
    expect(screen.getByTestId('transposition-val')).toHaveTextContent('-1 st');

    // Scale remains 'extra-large'
    expect(screen.getByTestId('select-scale')).toHaveValue('extra-large');
  });

  it('guarantees that resetting config restores default didactic options without losing note edits', () => {
    render(<App />);

    // 1. Edit a note: step to B ('si')
    const firstNote = screen.getAllByTestId('notehead-capsule')[0];
    fireEvent.click(firstNote);
    fireEvent.click(screen.getByTestId('pitch-step-B'));
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('si');

    // 2. Change multiple orthogonal controls
    fireEvent.click(screen.getByTestId('density-btn-3'));
    fireEvent.click(screen.getByTestId('toggle-chords'));
    fireEvent.click(screen.getByTestId('transposition-inc'));

    expect(screen.getByTestId('transposition-val')).toHaveTextContent('+1 st');
    expect(screen.queryAllByTestId('svg-chord').length).toBe(0);

    // 3. Click Reset Defaults button
    const resetBtn = screen.getByTestId('reset-config-btn');
    fireEvent.click(resetBtn);

    // Controls are back to default: density 2, chords visible, transposition 0
    expect(screen.getByTestId('density-btn-2')).toHaveClass('bg-zinc-900');
    expect(screen.getAllByTestId('svg-chord').length).toBeGreaterThan(0);
    expect(screen.getByTestId('transposition-val')).toHaveTextContent('0 st');

    // CRITICAL INVARIANT: The edited note ('si') is preserved!
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('si');
  });
});
