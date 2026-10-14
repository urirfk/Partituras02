import { Score } from '../types/music';
import { mapScoreToBackend } from './scoreMapping';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Downloads a binary Blob in the browser with an anchor tag.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calls backend to generate standard MusicXML 3.1/4.0 from Score.
 */
export async function exportMusicXml(score: Score): Promise<Blob> {
  const payload = mapScoreToBackend(score);
  const response = await fetch(`${API_BASE_URL}/export-musicxml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to export MusicXML (${response.status}): ${errorText}`);
  }

  return response.blob();
}

/**
 * Calls backend to generate standard MIDI file from Score.
 */
export async function exportMidi(score: Score): Promise<Blob> {
  const payload = mapScoreToBackend(score);
  const response = await fetch(`${API_BASE_URL}/export-midi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to export MIDI (${response.status}): ${errorText}`);
  }

  return response.blob();
}

/**
 * Exports and triggers immediate download of MusicXML file.
 */
export async function downloadMusicXml(score: Score, customFilename?: string): Promise<void> {
  const blob = await exportMusicXml(score);
  const baseTitle = customFilename || score.metadata.title || 'partitura';
  const safeFilename = baseTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/gi, '_');
  const filename = safeFilename.endsWith('.musicxml') ? safeFilename : `${safeFilename}.musicxml`;
  downloadBlob(blob, filename);
}

/**
 * Exports and triggers immediate download of MIDI file.
 */
export async function downloadMidi(score: Score, customFilename?: string): Promise<void> {
  const blob = await exportMidi(score);
  const baseTitle = customFilename || score.metadata.title || 'partitura';
  const safeFilename = baseTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/gi, '_');
  const filename = safeFilename.endsWith('.mid') ? safeFilename : `${safeFilename}.mid`;
  downloadBlob(blob, filename);
}
