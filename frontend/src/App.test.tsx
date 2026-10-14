import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import i18n from './i18n/config';

describe('App Component i18n and UI', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('renders application with Spanish text catalog by default and shows score canvas', () => {
    render(<App />);
    expect(screen.getByText('Partituras02')).toBeInTheDocument();
    expect(screen.getByText('Edición Didáctica EZ-Play para Piano')).toBeInTheDocument();
    expect(screen.getByTestId('orthogonal-controls-bar')).toBeInTheDocument();
    expect(screen.getByTestId('split-screen-container')).toBeInTheDocument();
    expect(screen.getByTestId('didactic-score-canvas')).toBeInTheDocument();
    expect(screen.getByText('Modo Atril')).toBeInTheDocument();
  });

  it('switches seamlessly between Spanish and English using language button', () => {
    render(<App />);
    const langBtn = screen.getByTestId('lang-switch-btn');
    expect(langBtn).toHaveTextContent('ES');

    // Switch to English
    fireEvent.click(langBtn);
    expect(screen.getByText('Pedagogical EZ-Play Piano Edition')).toBeInTheDocument();
    expect(screen.getByText('Music Stand Mode')).toBeInTheDocument();
    expect(langBtn).toHaveTextContent('EN');

    // Switch back to Spanish
    fireEvent.click(langBtn);
    expect(screen.getByText('Edición Didáctica EZ-Play para Piano')).toBeInTheDocument();
    expect(langBtn).toHaveTextContent('ES');
  });

  it('opens and closes upload modal on button clicks', () => {
    render(<App />);
    const uploadBtn = screen.getByTestId('toggle-upload-btn');
    fireEvent.click(uploadBtn);

    expect(screen.getByTestId('score-dropzone')).toBeInTheDocument();
    expect(screen.getByText('Arrastra tu partitura aquí')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-upload-modal');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('score-dropzone')).not.toBeInTheDocument();
  });

  it('opens NoteEditPopover when a note in the score canvas is clicked', () => {
    render(<App />);
    const notes = screen.getAllByTestId('svg-note');
    expect(notes.length).toBeGreaterThan(0);

    fireEvent.click(notes[0]);
    expect(screen.getByTestId('note-edit-popover')).toBeInTheDocument();
  });

  it('opens and closes PdfExportModal when export button is clicked', () => {
    render(<App />);
    const exportBtn = screen.getByTestId('export-pdf-btn');
    fireEvent.click(exportBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('exportModal.title'))).toBeInTheDocument();

    const cancelBtn = screen.getByText(i18n.t('exportModal.cancel'));
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders StructuredExportMenu and displays export options when clicked', () => {
    render(<App />);
    const menuBtn = screen.getByTestId('structured-export-btn');
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(screen.getByTestId('structured-export-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('save-partitura-option')).toBeInTheDocument();
    expect(screen.getByTestId('load-partitura-option')).toBeInTheDocument();
    expect(screen.getByTestId('export-musicxml-option')).toBeInTheDocument();
    expect(screen.getByTestId('export-midi-option')).toBeInTheDocument();
  });

  it('enters and exits Stand Mode when button is clicked', () => {
    render(<App />);
    const standBtn = screen.getByTestId('stand-mode-btn');
    fireEvent.click(standBtn);

    expect(screen.getByTestId('music-stand-mode')).toBeInTheDocument();

    const exitBtn = screen.getByTestId('exit-stand-btn');
    fireEvent.click(exitBtn);

    expect(screen.queryByTestId('music-stand-mode')).not.toBeInTheDocument();
  });

  it('enters Stand Mode via "m" key shortcut and exits with Escape', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'm' });

    expect(screen.getByTestId('music-stand-mode')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('music-stand-mode')).not.toBeInTheDocument();
  });
});
