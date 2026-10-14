import { describe, it, expect, vi } from 'vitest';
import {
  createProjectSession,
  serializeProjectSession,
  parseProjectSession,
  downloadProjectSession,
  loadProjectSessionFromFile,
  PARTITURA_SCHEMA_VERSION,
  PARTITURA_FORMAT_IDENTIFIER,
} from './projectSession';
import { INITIAL_SCORE } from '../data/initialScore';
import { DEFAULT_SCORE_CONFIG } from '../types/scoreConfig';

describe('projectSession Service', () => {
  it('creates a project session object with metadata and timestamps', () => {
    const session = createProjectSession(INITIAL_SCORE, DEFAULT_SCORE_CONFIG, ['page1.png']);

    expect(session.format).toBe(PARTITURA_FORMAT_IDENTIFIER);
    expect(session.version).toBe(PARTITURA_SCHEMA_VERSION);
    expect(session.score).toEqual(INITIAL_SCORE);
    expect(session.config).toEqual(DEFAULT_SCORE_CONFIG);
    expect(session.originalPages).toEqual(['page1.png']);
    expect(new Date(session.timestamp).getTime()).not.toBeNaN();
  });

  it('serializes and parses project sessions symmetrically without loss', () => {
    const originalSession = createProjectSession(INITIAL_SCORE, {
      ...DEFAULT_SCORE_CONFIG,
      measuresPerSystem: 3,
      chordNotation: 'american',
      showFingerings: false,
    });

    const json = serializeProjectSession(originalSession);
    expect(typeof json).toBe('string');

    const restoredSession = parseProjectSession(json);
    expect(restoredSession.format).toBe(PARTITURA_FORMAT_IDENTIFIER);
    expect(restoredSession.version).toBe(PARTITURA_SCHEMA_VERSION);
    expect(restoredSession.score).toEqual(INITIAL_SCORE);
    expect(restoredSession.config.measuresPerSystem).toBe(3);
    expect(restoredSession.config.chordNotation).toBe('american');
    expect(restoredSession.config.showFingerings).toBe(false);
  });

  it('rejects invalid JSON string', () => {
    expect(() => parseProjectSession('INVALID_JSON')).toThrow(/Invalid JSON/);
  });

  it('rejects incompatible format identifier', () => {
    const badFormat = JSON.stringify({
      format: 'unknown-format',
      version: '1.0.0',
      score: INITIAL_SCORE,
    });

    expect(() => parseProjectSession(badFormat)).toThrow(/Unsupported or unrecognized/);
  });

  it('rejects missing score or measures', () => {
    const missingMeasures = JSON.stringify({
      format: PARTITURA_FORMAT_IDENTIFIER,
      version: '1.0.0',
      score: { id: 'test' },
    });

    expect(() => parseProjectSession(missingMeasures)).toThrow(/measures array is missing/);
  });

  it('falls back to default config values if config is omitted or incomplete', () => {
    const partialConfigSession = JSON.stringify({
      format: PARTITURA_FORMAT_IDENTIFIER,
      version: '1.0.0',
      score: INITIAL_SCORE,
      config: {
        measuresPerSystem: 4,
      },
    });

    const parsed = parseProjectSession(partialConfigSession);
    expect(parsed.config.measuresPerSystem).toBe(4);
    expect(parsed.config.showNoteNames).toBe(DEFAULT_SCORE_CONFIG.showNoteNames);
    expect(parsed.config.chordNotation).toBe(DEFAULT_SCORE_CONFIG.chordNotation);
  });

  it('downloadProjectSession creates anchor link and triggers download', () => {
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

    downloadProjectSession(INITIAL_SCORE, DEFAULT_SCORE_CONFIG, undefined, 'mi-obra');

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });

  it('loadProjectSessionFromFile reads and parses File object', async () => {
    const session = createProjectSession(INITIAL_SCORE, DEFAULT_SCORE_CONFIG);
    const json = serializeProjectSession(session);
    const file = new File([json], 'obra.partitura', { type: 'application/json' });

    const loaded = await loadProjectSessionFromFile(file);
    expect(loaded.score.id).toBe(INITIAL_SCORE.id);
    expect(loaded.config).toEqual(DEFAULT_SCORE_CONFIG);
  });
});
