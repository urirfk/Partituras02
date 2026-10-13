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
});
