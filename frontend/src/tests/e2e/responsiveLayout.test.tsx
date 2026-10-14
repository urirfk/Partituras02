import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SplitScreenLayout } from '../../components/layout/SplitScreenLayout';
import { OrthogonalControlsBar } from '../../components/controls/OrthogonalControlsBar';
import { ScoreConfigProvider } from '../../context/ScoreConfigContext';
import i18n from '../../i18n/config';

describe('E2E Responsive Layout & Touch Ergonomics Suite', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('renders SplitScreenLayout with touch-friendly separator and handles mode switching', () => {
    const handleModeChange = vi.fn();

    render(
      <SplitScreenLayout
        originalPanel={<div data-testid="mock-original">Original Content</div>}
        cleanPanel={<div data-testid="mock-clean">Clean Content</div>}
        initialMode="split"
        onModeChange={handleModeChange}
      />
    );

    const originalPanel = screen.getByTestId('original-panel');
    const cleanPanel = screen.getByTestId('clean-panel');
    const splitDivider = screen.getByTestId('split-divider');

    expect(originalPanel).toBeVisible();
    expect(cleanPanel).toBeVisible();
    expect(splitDivider).toBeInTheDocument();

    // Switch to Only Clean
    fireEvent.click(screen.getByTestId('mode-clean-btn'));
    expect(handleModeChange).toHaveBeenCalledWith('clean');
    expect(originalPanel).toHaveClass('hidden');
    expect(cleanPanel).toHaveClass('block');
    expect(screen.queryByTestId('split-divider')).not.toBeInTheDocument();

    // Switch to Only Original
    fireEvent.click(screen.getByTestId('mode-original-btn'));
    expect(handleModeChange).toHaveBeenCalledWith('original');
    expect(cleanPanel).toHaveClass('hidden');
    expect(originalPanel).toHaveClass('block');

    // Switch back to Split
    fireEvent.click(screen.getByTestId('mode-split-btn'));
    expect(handleModeChange).toHaveBeenCalledWith('split');
    expect(screen.getByTestId('split-divider')).toBeInTheDocument();
  });

  it('handles touch gestures (touchStart, touchMove, touchEnd) on split divider', () => {
    render(
      <SplitScreenLayout
        originalPanel={<div>Original</div>}
        cleanPanel={<div>Clean</div>}
        initialRatio={0.5}
      />
    );

    const containerEl = screen.getByTestId('split-screen-container');
    // Mock getBoundingClientRect
    vi.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 600,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const divider = screen.getByTestId('split-divider');

    // Touch start on divider
    fireEvent.touchStart(divider);

    // Touch move to 700px (70%)
    fireEvent.touchMove(window, {
      touches: [{ clientX: 700 }],
    });

    // Divider aria-valuenow should update to ~70
    expect(divider).toHaveAttribute('aria-valuenow', '70');

    // Touch end
    fireEvent.touchEnd(window);

    // Double-click divider resets to 50%
    fireEvent.doubleClick(divider);
    expect(divider).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders OrthogonalControlsBar with responsive touch-friendly targets', () => {
    render(
      <ScoreConfigProvider>
        <OrthogonalControlsBar />
      </ScoreConfigProvider>
    );

    const controlsBar = screen.getByTestId('orthogonal-controls-bar');
    expect(controlsBar).toBeInTheDocument();
    expect(controlsBar).toHaveClass('flex', 'flex-wrap');

    // Check presence of all density buttons
    const density1 = screen.getByTestId('density-btn-1');
    const density2 = screen.getByTestId('density-btn-2');
    const density3 = screen.getByTestId('density-btn-3');
    const density4 = screen.getByTestId('density-btn-4');

    expect(density1).toBeInTheDocument();
    expect(density2).toBeInTheDocument();
    expect(density3).toBeInTheDocument();
    expect(density4).toBeInTheDocument();

    // Check touch/click toggles
    const noteNamesBtn = screen.getByTestId('toggle-note-names');
    const accidentalsBtn = screen.getByTestId('toggle-accidentals');
    const fingeringsBtn = screen.getByTestId('toggle-fingerings');
    const chordsBtn = screen.getByTestId('toggle-chords');
    const lyricsBtn = screen.getByTestId('toggle-lyrics');

    expect(noteNamesBtn).toBeInTheDocument();
    expect(accidentalsBtn).toBeInTheDocument();
    expect(fingeringsBtn).toBeInTheDocument();
    expect(chordsBtn).toBeInTheDocument();
    expect(lyricsBtn).toBeInTheDocument();
  });
});
