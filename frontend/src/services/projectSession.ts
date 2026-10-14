import { Score } from '../types/music';
import { ScoreConfig, DEFAULT_SCORE_CONFIG } from '../types/scoreConfig';

export const PARTITURA_SCHEMA_VERSION = '1.0.0';
export const PARTITURA_FORMAT_IDENTIFIER = 'partituras02-session';
export const PARTITURA_FILE_EXTENSION = '.partitura';
export const PARTITURA_MIME_TYPE = 'application/json';

export interface ProjectSession {
  format: typeof PARTITURA_FORMAT_IDENTIFIER;
  version: string;
  timestamp: string;
  score: Score;
  config: ScoreConfig;
  originalPages?: string[];
}

/**
 * Creates a valid ProjectSession object with current score and config.
 */
export function createProjectSession(
  score: Score,
  config: ScoreConfig,
  originalPages?: string[]
): ProjectSession {
  return {
    format: PARTITURA_FORMAT_IDENTIFIER,
    version: PARTITURA_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    score,
    config,
    originalPages: originalPages && originalPages.length > 0 ? originalPages : undefined,
  };
}

/**
 * Serializes a ProjectSession into formatted JSON string.
 */
export function serializeProjectSession(session: ProjectSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Parses and strictly validates a JSON string as a ProjectSession.
 */
export function parseProjectSession(jsonContent: string): ProjectSession {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    throw new Error(`Invalid JSON format: ${err instanceof Error ? err.message : 'Syntax error'}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid project session: root must be an object');
  }

  const candidate = parsed as Record<string, unknown>;

  if (candidate.format !== PARTITURA_FORMAT_IDENTIFIER) {
    throw new Error(
      `Unsupported or unrecognized project file format: "${candidate.format}". Expected "${PARTITURA_FORMAT_IDENTIFIER}".`
    );
  }

  if (typeof candidate.version !== 'string') {
    throw new Error('Missing or invalid session version');
  }

  if (!candidate.score || typeof candidate.score !== 'object') {
    throw new Error('Missing or invalid score in project session');
  }

  const scoreObj = candidate.score as Record<string, unknown>;
  if (!Array.isArray(scoreObj.measures)) {
    throw new Error('Invalid score: measures array is missing');
  }

  // Merge config with default values to guarantee orthogonal invariance if keys are omitted
  const rawConfig = (candidate.config && typeof candidate.config === 'object') ? candidate.config : {};
  const safeConfig: ScoreConfig = {
    ...DEFAULT_SCORE_CONFIG,
    ...(rawConfig as Partial<ScoreConfig>),
  };

  const safePages = Array.isArray(candidate.originalPages)
    ? (candidate.originalPages as string[])
    : undefined;

  return {
    format: PARTITURA_FORMAT_IDENTIFIER,
    version: candidate.version,
    timestamp: typeof candidate.timestamp === 'string' ? candidate.timestamp : new Date().toISOString(),
    score: candidate.score as Score,
    config: safeConfig,
    originalPages: safePages,
  };
}

/**
 * Downloads a ProjectSession directly in the browser as a .partitura file.
 */
export function downloadProjectSession(
  score: Score,
  config: ScoreConfig,
  originalPages?: string[],
  customFilename?: string
): void {
  const session = createProjectSession(score, config, originalPages);
  const jsonString = serializeProjectSession(session);
  const blob = new Blob([jsonString], { type: PARTITURA_MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const baseTitle = customFilename || score.metadata.title || 'proyecto-partitura';
  const safeTitle = baseTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/gi, '_');

  const filename = safeTitle.endsWith(PARTITURA_FILE_EXTENSION)
    ? safeTitle
    : `${safeTitle}${PARTITURA_FILE_EXTENSION}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads a File object and parses it into a ProjectSession.
 */
export async function loadProjectSessionFromFile(file: File): Promise<ProjectSession> {
  const text = await file.text();
  return parseProjectSession(text);
}
