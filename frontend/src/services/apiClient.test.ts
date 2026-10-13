import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './apiClient';
import { mapScoreFromBackend } from './scoreMapping';

describe('scoreMapping', () => {
  it('correctly maps snake_case backend ScoreSchema to frontend camelCase Score', () => {
    const backendData = {
      id: 'backend-score-1',
      metadata: {
        title: 'Sonata No. 1',
        composer: 'Mozart',
        tempo_bpm: 120,
      },
      staff_type: 'grand',
      measures: [
        {
          number: 1,
          time_signature: { beats: 4, beat_type: 4 },
          key_signature: { fifths: 0, mode: 'major', name: 'Do Mayor' },
          chords: [
            { id: 'c1', root: 'Do', quality: '', full_text: 'Do', beat: 1.0 },
          ],
          notes: [
            {
              id: 'm1-n1',
              pitch: {
                step: 'C',
                octave: 4,
                accidental: 'natural',
                solfege: 'do',
                display_badge_text: 'do',
              },
              is_rest: false,
              duration: 'quarter',
              dots: 0,
              fingering: 1,
            },
          ],
          lower_notes: [
            {
              id: 'm1-lh-n1',
              pitch: {
                step: 'C',
                octave: 3,
                accidental: 'natural',
                solfege: 'do',
                display_badge_text: 'do',
              },
              is_rest: false,
              duration: 'whole',
              dots: 0,
            },
          ],
        },
      ],
    };

    const mapped = mapScoreFromBackend(backendData);

    expect(mapped.id).toBe('backend-score-1');
    expect(mapped.metadata.title).toBe('Sonata No. 1');
    expect(mapped.metadata.tempo?.bpm).toBe(120);
    expect(mapped.staffType).toBe('grand');
    expect(mapped.measures).toHaveLength(1);

    const m1 = mapped.measures[0];
    expect(m1.timeSignature?.beatType).toBe(4);
    expect(m1.chords[0].fullText).toBe('Do');
    expect(m1.notes[0].pitch?.displayBadgeText).toBe('do');
    expect(m1.notes[0].isRest).toBe(false);
    expect(m1.lowerNotes).toBeDefined();
    expect(m1.lowerNotes?.[0].pitch?.octave).toBe(3);
  });
});

describe('ApiClient', () => {
  const client = new ApiClient('http://test-api:8000/api');

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploadDocument sends multipart file and returns UploadResult', async () => {
    const mockResponse = {
      file_id: 'file-123',
      filename: 'score.pdf',
      content_type: 'application/pdf',
      is_pdf: true,
      num_pages: 3,
      size_bytes: 4096,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const file = new File(['dummy'], 'score.pdf', { type: 'application/pdf' });
    const result = await client.uploadDocument(file);

    expect(fetch).toHaveBeenCalledWith(
      'http://test-api:8000/api/upload',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.fileId).toBe('file-123');
    expect(result.isPdf).toBe(true);
    expect(result.numPages).toBe(3);
  });

  it('processOmr sends file and options and returns mapped Score', async () => {
    const mockScoreResponse = {
      id: 'omr-score-1',
      metadata: { title: 'Nocturne', composer: 'Chopin' },
      staff_type: 'single',
      measures: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockScoreResponse,
    } as Response);

    const file = new File(['dummy'], 'nocturne.png', { type: 'image/png' });
    const score = await client.processOmr(file, { title: 'Nocturne', doDeskew: true });

    expect(fetch).toHaveBeenCalledWith(
      'http://test-api:8000/api/process-omr',
      expect.objectContaining({ method: 'POST' })
    );
    expect(score.metadata.title).toBe('Nocturne');
    expect(score.staffType).toBe('single');
  });

  it('throws descriptive error when request fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Formato no soportado' }),
    } as Response);

    const file = new File(['dummy'], 'bad.xyz');
    await expect(client.importMusicXml(file)).rejects.toThrow('Formato no soportado');
  });
});
