import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';
import { ScoreConfigProvider } from '../../context/ScoreConfigContext';
import { MusicStandMode } from './MusicStandMode';
import { INITIAL_SCORE } from '../../data/initialScore';
import { Score } from '../../types/music';

const MULTI_PAGE_SCORE: Score = {
  ...INITIAL_SCORE,
  measures: [
    ...INITIAL_SCORE.measures,
    ...INITIAL_SCORE.measures.map((m, idx) => ({ ...m, number: m.number + 4 + idx })),
  ],
};

const renderStandMode = (onExit = vi.fn()) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ScoreConfigProvider>
        <MusicStandMode score={MULTI_PAGE_SCORE} onExit={onExit} />
      </ScoreConfigProvider>
    </I18nextProvider>
  );
};

describe('MusicStandMode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Stand Mode view with score title, measure info and svg canvas', () => {
    renderStandMode();

    expect(screen.getByTestId('music-stand-mode')).toBeInTheDocument();
    expect(screen.getByText(INITIAL_SCORE.metadata.title)).toBeInTheDocument();
    expect(screen.getByTestId('stand-score-svg')).toBeInTheDocument();
    expect(screen.getByTestId('stand-btn-prev')).toBeInTheDocument();
    expect(screen.getByTestId('stand-btn-next')).toBeInTheDocument();
  });

  it('navigates with buttons and updates page indicator', () => {
    renderStandMode();

    const nextBtn = screen.getByTestId('stand-btn-next');
    const prevBtn = screen.getByTestId('stand-btn-prev');
    const indicator = screen.getByTestId('stand-page-indicator');

    expect(prevBtn).toBeDisabled();

    fireEvent.click(nextBtn);
    expect(indicator).toHaveTextContent(/2/);
    expect(prevBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    expect(prevBtn).toBeDisabled();
  });

  it('navigates using touch tap zones', () => {
    renderStandMode();

    const indicator = screen.getByTestId('stand-page-indicator');
    const tapNext = screen.getByTestId('stand-tap-next');
    fireEvent.click(tapNext);
    expect(indicator).toHaveTextContent(/2/);

    const tapPrev = screen.getByTestId('stand-tap-prev');
    fireEvent.click(tapPrev);
    expect(screen.getByTestId('stand-btn-prev')).toBeDisabled();
  });

  it('navigates using keyboard and Bluetooth pedal shortcuts', () => {
    const onExit = vi.fn();
    renderStandMode(onExit);

    const indicator = screen.getByTestId('stand-page-indicator');

    // ArrowRight / PageDown
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(indicator).toHaveTextContent(/2/);

    fireEvent.keyDown(window, { key: 'PageDown' });
    // Still on next or moves forward

    // ArrowLeft / PageUp
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('stand-btn-prev')).toBeDisabled();

    // Escape triggers onExit
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalled();
  });

  it('changes systems per page when selecting density buttons', () => {
    renderStandMode();

    const btn1 = screen.getByTestId('systems-per-page-1');
    fireEvent.click(btn1);
    expect(btn1).toHaveClass('font-bold');

    const btn3 = screen.getByTestId('systems-per-page-3');
    fireEvent.click(btn3);
    expect(btn3).toHaveClass('font-bold');
  });

  it('toggles dark and warm contrast themes', () => {
    renderStandMode();

    const themeBtn = screen.getByTestId('theme-toggle-btn');
    const container = screen.getByTestId('music-stand-mode');

    expect(container).toHaveClass('bg-[#09090b]');

    fireEvent.click(themeBtn);
    expect(container).toHaveClass('bg-[#faf9f6]');

    fireEvent.click(themeBtn);
    expect(container).toHaveClass('bg-[#09090b]');
  });

  it('calls onExit when exit button is clicked', () => {
    const onExit = vi.fn();
    renderStandMode(onExit);

    const exitBtn = screen.getByTestId('exit-stand-btn');
    fireEvent.click(exitBtn);
    expect(onExit).toHaveBeenCalled();
  });
});
