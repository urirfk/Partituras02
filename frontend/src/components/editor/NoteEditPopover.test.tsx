import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ScoreHistoryProvider } from '../../context/ScoreHistoryContext';
import '../../i18n/config';
import { Note, Score } from '../../types/music';
import { NoteEditPopover } from './NoteEditPopover';

const testNote: Note = {
  id: 'test-n1',
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
};

const initialScore: Score = {
  id: 'score-1',
  metadata: { title: 'Test Score', composer: 'Test' },
  staffType: 'single',
  measures: [
    {
      number: 1,
      chords: [],
      notes: [testNote],
    },
  ],
};

const renderWithHistory = (ui: React.ReactElement) => {
  return render(
    <ScoreHistoryProvider initialScore={initialScore}>
      {ui}
    </ScoreHistoryProvider>
  );
};

describe('NoteEditPopover', () => {
  it('does not render when isOpen is false', () => {
    renderWithHistory(
      <NoteEditPopover
        note={testNote}
        measureNumber={1}
        anchorPosition={{ x: 100, y: 100 }}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('note-edit-popover')).not.toBeInTheDocument();
  });

  it('renders popover fields when isOpen is true', () => {
    renderWithHistory(
      <NoteEditPopover
        note={testNote}
        measureNumber={1}
        anchorPosition={{ x: 200, y: 150 }}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('note-edit-popover')).toBeInTheDocument();
    expect(screen.getByTestId('pitch-step-C')).toBeInTheDocument();
    expect(screen.getByTestId('octave-val')).toHaveTextContent('4');
    expect(screen.getByTestId('accidental-natural')).toBeInTheDocument();
  });

  it('updates note pitch step and emits onSave', () => {
    const handleSave = vi.fn();
    renderWithHistory(
      <NoteEditPopover
        note={testNote}
        measureNumber={1}
        anchorPosition={{ x: 200, y: 150 }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const stepG = screen.getByTestId('pitch-step-G');
    fireEvent.click(stepG);

    expect(handleSave).toHaveBeenCalledWith({
      pitch: expect.objectContaining({
        step: 'G',
        solfege: 'sol',
        displayBadgeText: 'sol',
      }),
      isRest: false,
    });
  });

  it('updates octave with stepper buttons', () => {
    const handleSave = vi.fn();
    renderWithHistory(
      <NoteEditPopover
        note={testNote}
        measureNumber={1}
        anchorPosition={{ x: 200, y: 150 }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const incBtn = screen.getByTestId('octave-inc');
    fireEvent.click(incBtn);

    expect(handleSave).toHaveBeenCalledWith({
      pitch: expect.objectContaining({
        octave: 5,
      }),
    });
  });

  it('updates accidental and fingering', () => {
    const handleSave = vi.fn();
    renderWithHistory(
      <NoteEditPopover
        note={testNote}
        measureNumber={1}
        anchorPosition={{ x: 200, y: 150 }}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const sharpBtn = screen.getByTestId('accidental-sharp');
    fireEvent.click(sharpBtn);
    expect(handleSave).toHaveBeenCalledWith({
      pitch: expect.objectContaining({
        accidental: 'sharp',
        displayBadgeText: '♯do',
      }),
    });

    const fingering3 = screen.getByTestId('fingering-3');
    fireEvent.click(fingering3);
    expect(handleSave).toHaveBeenCalledWith({
      fingering: 3,
    });
  });

  it('closes popover on close button click or Escape key', () => {
    const handleClose = vi.fn();
    renderWithHistory(
      <NoteEditPopover
        note={testNote}
        measureNumber={1}
        anchorPosition={{ x: 200, y: 150 }}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTestId('popover-close-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
