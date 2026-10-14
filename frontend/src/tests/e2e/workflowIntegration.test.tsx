import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../App';
import i18n from '../../i18n/config';

describe('E2E Workflow Integration: Score Ingestion, Interactive Editing and Undo/Redo', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('renders initial score and allows opening note edit popover by clicking notehead', () => {
    render(<App />);

    // Check title and canvas are present
    expect(screen.getByTestId('didactic-score-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-score-title')).toHaveTextContent('Edición Didáctica EZ-Play');

    // Notes should be present
    const noteheads = screen.getAllByTestId('notehead-capsule');
    expect(noteheads.length).toBeGreaterThan(0);

    // Initial first note in upper staff should be 'mi'
    expect(noteheads[0]).toHaveTextContent('mi');

    // Click notehead to open popover
    fireEvent.click(noteheads[0]);

    const popover = screen.getByTestId('note-edit-popover');
    expect(popover).toBeInTheDocument();
    expect(screen.getByTestId('pitch-step-E')).toBeInTheDocument();
  });

  it('modifies note pitch step, accidental and fingering, reflecting changes in SVG notehead capsules', () => {
    render(<App />);

    const noteheads = screen.getAllByTestId('notehead-capsule');
    const firstNote = noteheads[0];
    expect(firstNote).toHaveTextContent('mi');

    // Open popover
    fireEvent.click(firstNote);

    // Change step to G ('sol')
    const stepGButton = screen.getByTestId('pitch-step-G');
    fireEvent.click(stepGButton);

    // Capsule should now display 'sol'
    const updatedNoteheads = screen.getAllByTestId('notehead-capsule');
    expect(updatedNoteheads[0]).toHaveTextContent('sol');

    // Add sharp accidental
    const sharpBtn = screen.getByTestId('accidental-sharp');
    fireEvent.click(sharpBtn);

    // Capsule should now display '♯sol'
    const noteheadsWithSharp = screen.getAllByTestId('notehead-capsule');
    expect(noteheadsWithSharp[0]).toHaveTextContent('♯sol');

    // Update fingering to 5
    const fingering5Btn = screen.getByTestId('fingering-5');
    fireEvent.click(fingering5Btn);

    // Verify undo button is enabled
    const undoBtn = screen.getByTestId('undo-btn');
    expect(undoBtn).not.toBeDisabled();
  });

  it('executes Undo and Redo via UI buttons and verifies faithful state reversal and restoration', () => {
    render(<App />);

    const undoBtn = screen.getByTestId('undo-btn');
    const redoBtn = screen.getByTestId('redo-btn');

    // Initially undo and redo are disabled
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Click first note and edit step to D ('re')
    const noteheads = screen.getAllByTestId('notehead-capsule');
    expect(noteheads[0]).toHaveTextContent('mi');
    fireEvent.click(noteheads[0]);

    const stepDButton = screen.getByTestId('pitch-step-D');
    fireEvent.click(stepDButton);

    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('re');
    expect(undoBtn).not.toBeDisabled();
    expect(redoBtn).toBeDisabled();

    // Now click Undo button
    fireEvent.click(undoBtn);

    // Should revert back to 'mi'
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('mi');
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).not.toBeDisabled();

    // Now click Redo button
    fireEvent.click(redoBtn);

    // Should return to 're'
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('re');
    expect(undoBtn).not.toBeDisabled();
    expect(redoBtn).toBeDisabled();
  });

  it('supports keyboard shortcuts Ctrl+Z for Undo and Ctrl+Y / Ctrl+Shift+Z for Redo', () => {
    render(<App />);

    const noteheads = screen.getAllByTestId('notehead-capsule');
    fireEvent.click(noteheads[0]);

    // Change step to C ('do')
    const stepCButton = screen.getByTestId('pitch-step-C');
    fireEvent.click(stepCButton);
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('do');

    // Press Ctrl+Z
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('mi');

    // Press Ctrl+Y
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('do');

    // Press Ctrl+Z again
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('mi');

    // Press Ctrl+Shift+Z (mac/linux standard redo)
    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('do');
  });

  it('toggles rest mode on note and preserves rhythmic continuity through undo/redo', () => {
    render(<App />);

    const initialCapsulesCount = screen.getAllByTestId('notehead-capsule').length;
    const firstNote = screen.getAllByTestId('notehead-capsule')[0];
    fireEvent.click(firstNote);

    // Click toggle rest
    const toggleRestBtn = screen.getByTestId('toggle-rest-btn');
    fireEvent.click(toggleRestBtn);

    // A rest has no capsule notehead, so count of capsules should decrease by 1
    const capsulesAfterRest = screen.getAllByTestId('notehead-capsule');
    expect(capsulesAfterRest.length).toBe(initialCapsulesCount - 1);

    // Undo should restore the notehead capsule
    const undoBtn = screen.getByTestId('undo-btn');
    fireEvent.click(undoBtn);

    expect(screen.getAllByTestId('notehead-capsule').length).toBe(initialCapsulesCount);
    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('mi');
  });

  it('allows closing the edit popover using the close button or Escape key', () => {
    render(<App />);

    const firstNote = screen.getAllByTestId('notehead-capsule')[0];
    fireEvent.click(firstNote);
    expect(screen.getByTestId('note-edit-popover')).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByTestId('popover-close-btn');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('note-edit-popover')).not.toBeInTheDocument();

    // Reopen and close via Escape
    fireEvent.click(firstNote);
    expect(screen.getByTestId('note-edit-popover')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('note-edit-popover')).not.toBeInTheDocument();
  });
});
