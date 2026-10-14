import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../../i18n/config';
import { ApiClient } from '../../services/apiClient';
import { Score } from '../../types/music';
import { ScoreDropzone } from './ScoreDropzone';

const dummyScore: Score = {
  id: 'loaded-score',
  metadata: { title: 'Test Piece', composer: 'Tester' },
  staffType: 'single',
  measures: [],
};

describe('ScoreDropzone', () => {
  let mockClient: ApiClient;

  beforeEach(() => {
    mockClient = new ApiClient('http://test/api');
    mockClient.importMusicXml = vi.fn().mockResolvedValue(dummyScore);
    mockClient.importMidi = vi.fn().mockResolvedValue(dummyScore);
    mockClient.processOmr = vi.fn().mockResolvedValue(dummyScore);
  });

  it('renders title, description and file selection button', () => {
    render(<ScoreDropzone onScoreLoaded={vi.fn()} client={mockClient} />);

    expect(screen.getByTestId('score-dropzone')).toBeInTheDocument();
    expect(screen.getByText('Arrastra tu partitura aquí')).toBeInTheDocument();
    expect(screen.getByText('Seleccionar archivo')).toBeInTheDocument();
  });

  it('handles dragover and dragleave styles', () => {
    render(<ScoreDropzone onScoreLoaded={vi.fn()} client={mockClient} />);

    const dropzone = screen.getByTestId('score-dropzone');
    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('border-zinc-900');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).toHaveClass('border-zinc-300');
  });

  it('imports MusicXML file when dropped', async () => {
    const handleLoaded = vi.fn();
    render(<ScoreDropzone onScoreLoaded={handleLoaded} client={mockClient} />);

    const file = new File(['<xml></xml>'], 'piece.musicxml', { type: 'application/xml' });
    const input = screen.getByTestId('dropzone-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockClient.importMusicXml).toHaveBeenCalledWith(file);
      expect(handleLoaded).toHaveBeenCalledWith(dummyScore, []);
    });
  });

  it('imports MIDI file when dropped', async () => {
    const handleLoaded = vi.fn();
    render(<ScoreDropzone onScoreLoaded={handleLoaded} client={mockClient} />);

    const file = new File(['mididata'], 'song.mid', { type: 'audio/midi' });
    const input = screen.getByTestId('dropzone-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockClient.importMidi).toHaveBeenCalledWith(file);
      expect(handleLoaded).toHaveBeenCalledWith(dummyScore, []);
    });
  });

  it('displays error message when ingestion fails', async () => {
    mockClient.importMusicXml = vi.fn().mockRejectedValue(new Error('Archivo corrupto'));
    render(<ScoreDropzone onScoreLoaded={vi.fn()} client={mockClient} />);

    const file = new File(['bad'], 'corrupt.xml');
    const input = screen.getByTestId('dropzone-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('dropzone-error')).toBeInTheDocument();
      expect(screen.getByTestId('dropzone-error')).toHaveTextContent('Archivo corrupto');
    });
  });

  it('processes OMR PDF file and propagates score.pages', async () => {
    const scoreWithPages: Score = {
      ...dummyScore,
      pages: ['data:image/png;base64,pageOne', 'data:image/png;base64,pageTwo'],
    };
    mockClient.processOmr = vi.fn().mockResolvedValue(scoreWithPages);

    const handleLoaded = vi.fn();
    render(<ScoreDropzone onScoreLoaded={handleLoaded} client={mockClient} />);

    const file = new File(['%PDF-1.4'], 'prelude.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('dropzone-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockClient.processOmr).toHaveBeenCalledWith(file);
      expect(handleLoaded).toHaveBeenCalledWith(scoreWithPages, [
        'data:image/png;base64,pageOne',
        'data:image/png;base64,pageTwo',
      ]);
    });
  });
});
