import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ScoreConfigProvider } from '../../context/ScoreConfigContext';
import { useScoreConfig } from '../../context/useScoreConfig';
import '../../i18n/config';
import { OrthogonalControlsBar } from './OrthogonalControlsBar';

const ConfigInspector: React.FC = () => {
  const { config } = useScoreConfig();
  return (
    <div data-testid="config-inspector">
      <span data-testid="insp-density">{config.measuresPerSystem}</span>
      <span data-testid="insp-notenames">{String(config.showNoteNames)}</span>
      <span data-testid="insp-accidentals">{String(config.showAccidentals)}</span>
      <span data-testid="insp-fingerings">{String(config.showFingerings)}</span>
      <span data-testid="insp-chords">{String(config.showChords)}</span>
      <span data-testid="insp-chord-not">{config.chordNotation}</span>
      <span data-testid="insp-scale">{config.scale}</span>
      <span data-testid="insp-trans">{config.transpositionSemitones}</span>
    </div>
  );
};

const renderWithContext = () => {
  return render(
    <ScoreConfigProvider>
      <OrthogonalControlsBar />
      <ConfigInspector />
    </ScoreConfigProvider>
  );
};

describe('OrthogonalControlsBar', () => {
  it('renders all control sections with default values', () => {
    renderWithContext();

    expect(screen.getByTestId('density-btn-2')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-note-names')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-accidentals')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-fingerings')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-chords')).toBeInTheDocument();
    expect(screen.getByTestId('select-chord-notation')).toBeInTheDocument();
    expect(screen.getByTestId('select-scale')).toBeInTheDocument();
    expect(screen.getByTestId('transposition-val')).toHaveTextContent('0 st');
  });

  it('updates measuresPerSystem on density button click without affecting other controls', () => {
    renderWithContext();

    const densityBtn3 = screen.getByTestId('density-btn-3');
    fireEvent.click(densityBtn3);

    expect(screen.getByTestId('insp-density')).toHaveTextContent('3');
    expect(screen.getByTestId('insp-notenames')).toHaveTextContent('true');
    expect(screen.getByTestId('insp-fingerings')).toHaveTextContent('true');
  });

  it('toggles note names, accidentals, and fingerings orthogonally', () => {
    renderWithContext();

    const noteNamesBtn = screen.getByTestId('toggle-note-names');
    fireEvent.click(noteNamesBtn);
    expect(screen.getByTestId('insp-notenames')).toHaveTextContent('false');

    const accidentalsBtn = screen.getByTestId('toggle-accidentals');
    fireEvent.click(accidentalsBtn);
    expect(screen.getByTestId('insp-accidentals')).toHaveTextContent('false');

    const fingeringsBtn = screen.getByTestId('toggle-fingerings');
    fireEvent.click(fingeringsBtn);
    expect(screen.getByTestId('insp-fingerings')).toHaveTextContent('false');
  });

  it('toggles chords and allows changing chord notation', () => {
    renderWithContext();

    const chordNotationSelect = screen.getByTestId('select-chord-notation');
    fireEvent.change(chordNotationSelect, { target: { value: 'american' } });
    expect(screen.getByTestId('insp-chord-not')).toHaveTextContent('american');

    const chordsToggle = screen.getByTestId('toggle-chords');
    fireEvent.click(chordsToggle);
    expect(screen.getByTestId('insp-chords')).toHaveTextContent('false');
    // Chord notation select should be hidden when chords are disabled
    expect(screen.queryByTestId('select-chord-notation')).not.toBeInTheDocument();
  });

  it('adjusts transposition semitones using increment and decrement buttons', () => {
    renderWithContext();

    const incBtn = screen.getByTestId('transposition-inc');
    fireEvent.click(incBtn);
    fireEvent.click(incBtn);
    expect(screen.getByTestId('insp-trans')).toHaveTextContent('2');

    const decBtn = screen.getByTestId('transposition-dec');
    fireEvent.click(decBtn);
    expect(screen.getByTestId('insp-trans')).toHaveTextContent('1');
  });

  it('resets all controls to default on reset button click', () => {
    renderWithContext();

    // Change several orthogonal parameters
    fireEvent.click(screen.getByTestId('density-btn-1'));
    fireEvent.click(screen.getByTestId('toggle-note-names'));
    fireEvent.click(screen.getByTestId('transposition-inc'));

    expect(screen.getByTestId('insp-density')).toHaveTextContent('1');
    expect(screen.getByTestId('insp-notenames')).toHaveTextContent('false');
    expect(screen.getByTestId('insp-trans')).toHaveTextContent('1');

    // Click reset
    fireEvent.click(screen.getByTestId('reset-config-btn'));

    expect(screen.getByTestId('insp-density')).toHaveTextContent('2');
    expect(screen.getByTestId('insp-notenames')).toHaveTextContent('true');
    expect(screen.getByTestId('insp-trans')).toHaveTextContent('0');
  });
});
