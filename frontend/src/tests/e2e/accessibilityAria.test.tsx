import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../App';
import i18n from '../../i18n/config';

describe('E2E Accessibility (ARIA) & Focus Management Suite', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('provides accessible toolbar semantics with radiogroup and aria-pressed attributes in OrthogonalControlsBar', () => {
    render(<App />);

    // Toolbar semantics
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveAttribute('aria-label', 'Barra de controles didácticos');

    // Radiogroup for density
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toBeInTheDocument();

    const density2Radio = screen.getByTestId('density-btn-2');
    const density1Radio = screen.getByTestId('density-btn-1');

    expect(density2Radio).toHaveAttribute('role', 'radio');
    expect(density2Radio).toHaveAttribute('aria-checked', 'true');
    expect(density1Radio).toHaveAttribute('aria-checked', 'false');

    // Click density 1 and verify aria-checked updates
    fireEvent.click(density1Radio);
    expect(density1Radio).toHaveAttribute('aria-checked', 'true');
    expect(density2Radio).toHaveAttribute('aria-checked', 'false');

    // Toggle buttons aria-pressed
    const toggleNoteNames = screen.getByTestId('toggle-note-names');
    const toggleAccidentals = screen.getByTestId('toggle-accidentals');
    const toggleChords = screen.getByTestId('toggle-chords');

    expect(toggleNoteNames).toHaveAttribute('aria-pressed', 'true');
    expect(toggleAccidentals).toHaveAttribute('aria-pressed', 'true');
    expect(toggleChords).toHaveAttribute('aria-pressed', 'true');

    // Toggle note names off
    fireEvent.click(toggleNoteNames);
    expect(toggleNoteNames).toHaveAttribute('aria-pressed', 'false');

    // Toggle note names back on
    fireEvent.click(toggleNoteNames);
    expect(toggleNoteNames).toHaveAttribute('aria-pressed', 'true');
  });

  it('provides accessible dialog semantics and keyboard focus trap for NoteEditPopover', () => {
    render(<App />);

    const note = screen.getAllByTestId('notehead-capsule')[0];
    fireEvent.click(note);

    const dialog = screen.getByRole('dialog', { name: /Editar Nota/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Find all focusable elements inside dialog
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(1);

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    // Focus last element and press Tab -> should wrap to first element
    lastEl.focus();
    expect(document.activeElement).toBe(lastEl);

    fireEvent.keyDown(lastEl, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(firstEl);

    // Focus first element and press Shift+Tab -> should wrap to last element
    fireEvent.keyDown(firstEl, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastEl);

    // Press Escape -> dialog closes
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByTestId('note-edit-popover')).not.toBeInTheDocument();
  });

  it('provides accessible dialog semantics, focus trap and Escape handler for PdfExportModal', () => {
    render(<App />);

    const exportBtn = screen.getByTestId('export-pdf-btn');
    fireEvent.click(exportBtn);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'pdf-export-modal-title');

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(1);

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    // Focus last element and press Tab -> wraps to first
    lastEl.focus();
    expect(document.activeElement).toBe(lastEl);

    fireEvent.keyDown(lastEl, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(firstEl);

    // Focus first element and press Shift+Tab -> wraps to last
    fireEvent.keyDown(firstEl, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastEl);

    // Press Escape -> modal closes
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
