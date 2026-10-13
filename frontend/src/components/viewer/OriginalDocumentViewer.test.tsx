import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import '../../i18n/config';
import { OriginalDocumentViewer } from './OriginalDocumentViewer';

describe('OriginalDocumentViewer', () => {
  it('renders empty message when no pages are supplied', () => {
    render(<OriginalDocumentViewer pages={[]} />);
    expect(screen.getByTestId('empty-viewer-message')).toBeInTheDocument();
  });

  it('renders single page score image without page switcher buttons', () => {
    render(<OriginalDocumentViewer pages={['data:image/png;base64,mockImage1']} />);

    expect(screen.getByTestId('original-score-image')).toHaveAttribute(
      'src',
      'data:image/png;base64,mockImage1'
    );
    expect(screen.queryByTestId('prev-page-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('next-page-btn')).not.toBeInTheDocument();
  });

  it('renders multipage controls and navigates between pages', () => {
    const handlePageChange = vi.fn();
    render(
      <OriginalDocumentViewer
        pages={['data:image/png;base64,mock1', 'data:image/png;base64,mock2']}
        currentPage={1}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByTestId('page-indicator')).toBeInTheDocument();
    const nextBtn = screen.getByTestId('next-page-btn');
    const prevBtn = screen.getByTestId('prev-page-btn');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('adjusts zoom level on zoom in, zoom out and reset buttons', () => {
    render(<OriginalDocumentViewer pages={['data:image/png;base64,mock1']} />);

    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    const zoomOutBtn = screen.getByTestId('zoom-out-btn');
    const zoomPercentBtn = screen.getByTestId('zoom-percent-btn');
    const fitWidthBtn = screen.getByTestId('fit-width-btn');

    // Default is auto/fit-width
    expect(zoomPercentBtn).toHaveTextContent('Auto');

    // Zoom in turns off fit width and sets scale
    fireEvent.click(zoomInBtn);
    expect(zoomPercentBtn).toHaveTextContent('115%');

    // Zoom out decreases scale
    fireEvent.click(zoomOutBtn);
    expect(zoomPercentBtn).toHaveTextContent('100%');

    // Toggle fit to width back
    fireEvent.click(fitWidthBtn);
    expect(zoomPercentBtn).toHaveTextContent('Auto');
  });
});
