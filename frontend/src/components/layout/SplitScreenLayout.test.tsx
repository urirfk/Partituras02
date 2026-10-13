import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import '../../i18n/config';
import { SplitScreenLayout } from './SplitScreenLayout';

describe('SplitScreenLayout', () => {
  it('renders both original and clean panels in split mode by default', () => {
    render(
      <SplitScreenLayout
        originalPanel={<div data-testid="test-original">Original Content</div>}
        cleanPanel={<div data-testid="test-clean">Clean Content</div>}
      />
    );

    expect(screen.getByTestId('test-original')).toBeInTheDocument();
    expect(screen.getByTestId('test-clean')).toBeInTheDocument();
    expect(screen.getByTestId('split-divider')).toBeInTheDocument();
  });

  it('switches to original only mode when mode button is clicked', () => {
    const handleModeChange = vi.fn();
    render(
      <SplitScreenLayout
        originalPanel={<div>Original Content</div>}
        cleanPanel={<div>Clean Content</div>}
        onModeChange={handleModeChange}
      />
    );

    const originalBtn = screen.getByTestId('mode-original-btn');
    fireEvent.click(originalBtn);

    expect(handleModeChange).toHaveBeenCalledWith('original');
    const originalPanel = screen.getByTestId('original-panel');
    const cleanPanel = screen.getByTestId('clean-panel');

    expect(originalPanel).toHaveStyle({ width: '100%' });
    expect(cleanPanel).toHaveClass('hidden');
    expect(screen.queryByTestId('split-divider')).not.toBeInTheDocument();
  });

  it('switches to clean only mode when mode button is clicked', () => {
    render(
      <SplitScreenLayout
        originalPanel={<div>Original Content</div>}
        cleanPanel={<div>Clean Content</div>}
      />
    );

    const cleanBtn = screen.getByTestId('mode-clean-btn');
    fireEvent.click(cleanBtn);

    const originalPanel = screen.getByTestId('original-panel');
    const cleanPanel = screen.getByTestId('clean-panel');

    expect(originalPanel).toHaveClass('hidden');
    expect(cleanPanel).toHaveStyle({ width: '100%' });
  });

  it('supports keyboard navigation on divider using Arrow keys and Home', () => {
    render(
      <SplitScreenLayout
        initialRatio={0.5}
        originalPanel={<div>Original Content</div>}
        cleanPanel={<div>Clean Content</div>}
      />
    );

    const divider = screen.getByTestId('split-divider');

    // ArrowLeft decreases ratio
    fireEvent.keyDown(divider, { key: 'ArrowLeft' });
    expect(divider).toHaveAttribute('aria-valuenow', '45');

    // ArrowRight increases ratio
    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(divider).toHaveAttribute('aria-valuenow', '50');

    // Home resets to 50
    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(divider).toHaveAttribute('aria-valuenow', '55');
    fireEvent.keyDown(divider, { key: 'Home' });
    expect(divider).toHaveAttribute('aria-valuenow', '50');
  });

  it('resets ratio on double click on divider or clicking reset button', () => {
    render(
      <SplitScreenLayout
        initialRatio={0.3}
        originalPanel={<div>Original Content</div>}
        cleanPanel={<div>Clean Content</div>}
      />
    );

    const divider = screen.getByTestId('split-divider');
    expect(divider).toHaveAttribute('aria-valuenow', '30');

    const resetBtn = screen.getByTestId('reset-split-btn');
    fireEvent.click(resetBtn);
    expect(divider).toHaveAttribute('aria-valuenow', '50');

    // Trigger keyboard move then double click
    fireEvent.keyDown(divider, { key: 'ArrowLeft' });
    expect(divider).toHaveAttribute('aria-valuenow', '45');
    fireEvent.doubleClick(divider);
    expect(divider).toHaveAttribute('aria-valuenow', '50');
  });
});
