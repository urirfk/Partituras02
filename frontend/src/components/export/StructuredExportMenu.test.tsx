import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';
import { ScoreConfigProvider } from '../../context/ScoreConfigContext';
import { StructuredExportMenu } from './StructuredExportMenu';
import { INITIAL_SCORE } from '../../data/initialScore';
import * as projectSession from '../../services/projectSession';
import * as structuredExporter from '../../services/structuredExporter';

vi.mock('../../services/projectSession', async (importOriginal) => {
  const actual = await importOriginal<typeof projectSession>();
  return {
    ...actual,
    downloadProjectSession: vi.fn(),
    loadProjectSessionFromFile: vi.fn(),
  };
});

vi.mock('../../services/structuredExporter', async (importOriginal) => {
  const actual = await importOriginal<typeof structuredExporter>();
  return {
    ...actual,
    downloadMusicXml: vi.fn(),
    downloadMidi: vi.fn(),
  };
});

const renderMenu = (onSessionLoaded = vi.fn()) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ScoreConfigProvider>
        <StructuredExportMenu
          score={INITIAL_SCORE}
          onSessionLoaded={onSessionLoaded}
        />
      </ScoreConfigProvider>
    </I18nextProvider>
  );
};

describe('StructuredExportMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and toggles dropdown menu on click', () => {
    renderMenu();
    const btn = screen.getByTestId('structured-export-btn');
    expect(btn).toBeInTheDocument();

    expect(screen.queryByTestId('structured-export-dropdown')).toBeNull();

    fireEvent.click(btn);
    expect(screen.getByTestId('structured-export-dropdown')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByTestId('structured-export-dropdown')).toBeNull();
  });

  it('calls downloadProjectSession when saving .partitura', () => {
    renderMenu();
    fireEvent.click(screen.getByTestId('structured-export-btn'));

    const saveOption = screen.getByTestId('save-partitura-option');
    fireEvent.click(saveOption);

    expect(projectSession.downloadProjectSession).toHaveBeenCalledWith(
      INITIAL_SCORE,
      expect.anything(),
      undefined
    );
  });

  it('calls downloadMusicXml when exporting MusicXML', async () => {
    vi.mocked(structuredExporter.downloadMusicXml).mockResolvedValueOnce();

    renderMenu();
    fireEvent.click(screen.getByTestId('structured-export-btn'));

    const xmlOption = screen.getByTestId('export-musicxml-option');
    fireEvent.click(xmlOption);

    await waitFor(() => {
      expect(structuredExporter.downloadMusicXml).toHaveBeenCalledWith(INITIAL_SCORE);
    });
  });

  it('calls downloadMidi when exporting MIDI', async () => {
    vi.mocked(structuredExporter.downloadMidi).mockResolvedValueOnce();

    renderMenu();
    fireEvent.click(screen.getByTestId('structured-export-btn'));

    const midiOption = screen.getByTestId('export-midi-option');
    fireEvent.click(midiOption);

    await waitFor(() => {
      expect(structuredExporter.downloadMidi).toHaveBeenCalledWith(INITIAL_SCORE);
    });
  });

  it('loads .partitura file via hidden input and calls onSessionLoaded', async () => {
    const onSessionLoaded = vi.fn();
    const mockSession = projectSession.createProjectSession(
      INITIAL_SCORE,
      {
        measuresPerSystem: 3,
        showNoteNames: false,
        showAccidentals: false,
        showFingerings: false,
        showChords: false,
        chordNotation: 'latin',
        showLyrics: false,
        scale: 'normal',
        transposition: 0,
      }
    );

    vi.mocked(projectSession.loadProjectSessionFromFile).mockResolvedValueOnce(mockSession);

    renderMenu(onSessionLoaded);

    const input = screen.getByTestId('load-session-input');
    const dummyFile = new File(['{}'], 'test.partitura', { type: 'application/json' });

    fireEvent.change(input, { target: { files: [dummyFile] } });

    await waitFor(() => {
      expect(projectSession.loadProjectSessionFromFile).toHaveBeenCalledWith(dummyFile);
      expect(onSessionLoaded).toHaveBeenCalledWith(mockSession);
    });
  });
});
