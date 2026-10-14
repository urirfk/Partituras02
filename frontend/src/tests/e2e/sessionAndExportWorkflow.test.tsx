import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import i18n from '../../i18n/config';
import * as projectSessionService from '../../services/projectSession';
import * as structuredExporterService from '../../services/structuredExporter';
import * as pdfExporterService from '../../services/pdfExporter';
import { Score } from '../../types/music';

// Polyfill SVGElement.prototype.getBBox for jsdom
if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 20,
    height: 10,
    top: 0,
    right: 20,
    bottom: 10,
    left: 0,
    toJSON: () => {},
  });
}

describe('E2E Session Lifecycle and Multi-format Export Workflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    i18n.changeLanguage('es');
  });

  it('performs complete .partitura session save and restores full score state and controls upon loading', async () => {
    // Spy on session downloader
    let capturedSessionJson = '';
    const downloadSpy = vi
      .spyOn(projectSessionService, 'downloadProjectSession')
      .mockImplementation((score, config, pages) => {
        const session = projectSessionService.createProjectSession(score, config, pages);
        capturedSessionJson = projectSessionService.serializeProjectSession(session);
      });

    render(<App />);

    // 1. Edit a note in the score: change to G ('sol') with sharp
    const firstNote = screen.getAllByTestId('notehead-capsule')[0];
    fireEvent.click(firstNote);
    fireEvent.click(screen.getByTestId('pitch-step-G'));
    fireEvent.click(screen.getByTestId('accidental-sharp'));

    expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('♯sol');

    // 2. Change didactic controls: set density to 1 measure per system and scale to extra-large
    fireEvent.click(screen.getByTestId('density-btn-1'));
    fireEvent.change(screen.getByTestId('select-scale'), { target: { value: 'extra-large' } });

    // 3. Open export menu and trigger Save .partitura
    fireEvent.click(screen.getByTestId('structured-export-btn'));
    const saveBtn = screen.getByTestId('save-partitura-option');
    fireEvent.click(saveBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(capturedSessionJson).toContain('partituras02-session');
    expect(capturedSessionJson).toContain('extra-large');
    expect(capturedSessionJson).toContain('♯sol');

    // 4. Now reset the score to default via reset button and change note
    fireEvent.click(screen.getByTestId('reset-config-btn'));
    expect(screen.getByTestId('density-btn-2')).toHaveClass('bg-zinc-900');

    // 5. Load the saved session JSON back into the application via hidden file input
    const fileInput = screen.getByTestId('load-session-input');
    const mockFile = new File([capturedSessionJson], 'my-piece.partitura', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Wait for session to load and restore state
    await waitFor(() => {
      // Density 1 restored
      expect(screen.getByTestId('density-btn-1')).toHaveClass('bg-zinc-900');
      // Scale restored
      expect(screen.getByTestId('select-scale')).toHaveValue('extra-large');
      // Edited note restored
      expect(screen.getAllByTestId('notehead-capsule')[0]).toHaveTextContent('♯sol');
    });
  });

  it('triggers MusicXML structured export with current active score payload', async () => {
    const musicXmlSpy = vi
      .spyOn(structuredExporterService, 'downloadMusicXml')
      .mockResolvedValue();

    render(<App />);

    // Open export menu
    fireEvent.click(screen.getByTestId('structured-export-btn'));
    const musicXmlOption = screen.getByTestId('export-musicxml-option');
    fireEvent.click(musicXmlOption);

    await waitFor(() => {
      expect(musicXmlSpy).toHaveBeenCalledTimes(1);
      const passedScore = musicXmlSpy.mock.calls[0][0] as Score;
      expect(passedScore.metadata.title).toBe('Edición Didáctica EZ-Play');
      expect(passedScore.measures.length).toBeGreaterThan(0);
    });
  });

  it('triggers MIDI structured export with current active score payload', async () => {
    const midiSpy = vi
      .spyOn(structuredExporterService, 'downloadMidi')
      .mockResolvedValue();

    render(<App />);

    // Open export menu
    fireEvent.click(screen.getByTestId('structured-export-btn'));
    const midiOption = screen.getByTestId('export-midi-option');
    fireEvent.click(midiOption);

    await waitFor(() => {
      expect(midiSpy).toHaveBeenCalledTimes(1);
      const passedScore = midiSpy.mock.calls[0][0] as Score;
      expect(passedScore.metadata.title).toBe('Edición Didáctica EZ-Play');
    });
  });

  it('opens PDF export modal, configures orientation/margins and executes vector PDF generation', async () => {
    const mockPdfDoc = { save: vi.fn() } as never;
    const pdfExportSpy = vi
      .spyOn(pdfExporterService, 'exportScoreToPdf')
      .mockResolvedValue(mockPdfDoc);
    const downloadPdfSpy = vi
      .spyOn(pdfExporterService, 'downloadPdf')
      .mockImplementation(() => {});

    render(<App />);

    // Click PDF export button in header
    fireEvent.click(screen.getByTestId('export-pdf-btn'));

    // Verify modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('orientation-portrait')).toBeInTheDocument();

    // Select Landscape orientation
    fireEvent.click(screen.getByTestId('orientation-landscape'));

    // Select Wide margins (20mm)
    fireEvent.click(screen.getByTestId('margin-20'));

    // Click confirm export
    fireEvent.click(screen.getByTestId('confirm-export-button'));

    await waitFor(() => {
      expect(pdfExportSpy).toHaveBeenCalledTimes(1);
      const passedOptions = pdfExportSpy.mock.calls[0][2];
      expect(passedOptions.orientation).toBe('landscape');
      expect(passedOptions.marginMm).toBe(20); // wide margin
      expect(downloadPdfSpy).toHaveBeenCalledTimes(1);
    });

    // Modal should close upon export
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
