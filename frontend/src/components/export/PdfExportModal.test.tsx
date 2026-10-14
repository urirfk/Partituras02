import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';
import { ScoreConfigProvider } from '../../context/ScoreConfigContext';
import { PdfExportModal } from './PdfExportModal';
import { INITIAL_SCORE } from '../../data/initialScore';
import * as pdfExporter from '../../services/pdfExporter';
import { jsPDF } from 'jspdf';

// Mock exportScoreToPdf and downloadPdf
vi.mock('../../services/pdfExporter', async (importOriginal) => {
  const actual = await importOriginal<typeof pdfExporter>();
  return {
    ...actual,
    exportScoreToPdf: vi.fn(),
    downloadPdf: vi.fn(),
  };
});

const renderModal = (props: { isOpen: boolean; onClose: () => void }) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ScoreConfigProvider>
        <PdfExportModal
          isOpen={props.isOpen}
          onClose={props.onClose}
          score={INITIAL_SCORE}
        />
      </ScoreConfigProvider>
    </I18nextProvider>
  );
};

describe('PdfExportModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const onClose = vi.fn();
    renderModal({ isOpen: false, onClose });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders correctly when isOpen is true with prefilled title and options', () => {
    const onClose = vi.fn();
    renderModal({ isOpen: true, onClose });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue(INITIAL_SCORE.metadata.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(INITIAL_SCORE.metadata.composer || '')).toBeInTheDocument();

    expect(screen.getByTestId('orientation-portrait')).toBeInTheDocument();
    expect(screen.getByTestId('orientation-landscape')).toBeInTheDocument();
    expect(screen.getByTestId('margin-10')).toBeInTheDocument();
    expect(screen.getByTestId('margin-15')).toBeInTheDocument();
    expect(screen.getByTestId('margin-20')).toBeInTheDocument();
    expect(screen.getByTestId('include-header-checkbox')).toBeChecked();
    expect(screen.getByTestId('include-page-numbers-checkbox')).toBeChecked();
  });

  it('allows switching orientation and margins', () => {
    const onClose = vi.fn();
    renderModal({ isOpen: true, onClose });

    const landscapeBtn = screen.getByTestId('orientation-landscape');
    fireEvent.click(landscapeBtn);
    expect(landscapeBtn).toHaveClass('font-semibold');

    const margin10Btn = screen.getByTestId('margin-10');
    fireEvent.click(margin10Btn);
    expect(margin10Btn).toHaveClass('font-semibold');
  });

  it('calls onClose when clicking cancel or close button', () => {
    const onClose = vi.fn();
    renderModal({ isOpen: true, onClose });

    const cancelBtn = screen.getByText(i18n.t('exportModal.cancel'));
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers exportScoreToPdf and downloadPdf on submit', async () => {
    const onClose = vi.fn();
    const mockDoc = new jsPDF();
    vi.mocked(pdfExporter.exportScoreToPdf).mockResolvedValueOnce(mockDoc);

    renderModal({ isOpen: true, onClose });

    const downloadBtn = screen.getByTestId('confirm-export-button');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(pdfExporter.exportScoreToPdf).toHaveBeenCalledWith(
        INITIAL_SCORE,
        expect.anything(),
        expect.objectContaining({
          orientation: 'portrait',
          marginMm: 15,
          includeHeader: true,
          includePageNumbers: true,
        })
      );
      expect(pdfExporter.downloadPdf).toHaveBeenCalledWith(mockDoc, expect.any(String));
    });
  });
});
