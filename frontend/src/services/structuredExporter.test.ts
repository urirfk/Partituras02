import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportMusicXml,
  exportMidi,
  downloadBlob,
  downloadMusicXml,
  downloadMidi,
} from './structuredExporter';
import { INITIAL_SCORE } from '../data/initialScore';

describe('structuredExporter Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exportMusicXml sends POST request to backend and returns blob', async () => {
    const mockBlob = new Blob(['<score-partwise></score-partwise>'], {
      type: 'application/vnd.recordare.musicxml+xml',
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    const result = await exportMusicXml(INITIAL_SCORE);
    expect(result).toBe(mockBlob);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/export-musicxml'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('exportMidi sends POST request to backend and returns blob', async () => {
    const mockBlob = new Blob([new Uint8Array([77, 84, 104, 100])], {
      type: 'audio/midi',
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    const result = await exportMidi(INITIAL_SCORE);
    expect(result).toBe(mockBlob);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/export-midi'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('throws descriptive error when export request fails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    await expect(exportMusicXml(INITIAL_SCORE)).rejects.toThrow(
      /Failed to export MusicXML \(500\)/
    );
  });

  it('downloadBlob creates anchor link and triggers download', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    const testBlob = new Blob(['test']);
    downloadBlob(testBlob, 'partitura.musicxml');

    expect(createObjectURLMock).toHaveBeenCalledWith(testBlob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });

  it('downloadMusicXml and downloadMidi execute full download sequence with proper extension', async () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = vi.fn();

    const mockXmlBlob = new Blob(['xml']);
    const mockMidiBlob = new Blob(['midi']);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => mockXmlBlob,
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => mockMidiBlob,
      });

    await downloadMusicXml(INITIAL_SCORE, 'sonata');
    await downloadMidi(INITIAL_SCORE, 'sonata');

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
