import { Score } from '../types/music';
import { mapScoreFromBackend } from './scoreMapping';

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:8000/api';

export interface UploadResult {
  fileId: string;
  filename: string;
  contentType: string;
  isPdf: boolean;
  numPages: number;
  sizeBytes: number;
}

export interface ProcessOmrOptions {
  title?: string;
  composer?: string;
  doDeskew?: boolean;
  runHarmonics?: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async uploadDocument(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Error al subir documento (${response.status})`);
    }

    const data = await response.json();
    return {
      fileId: data.file_id,
      filename: data.filename,
      contentType: data.content_type,
      isPdf: data.is_pdf,
      numPages: data.num_pages,
      sizeBytes: data.size_bytes,
    };
  }

  async processOmr(file: File, options?: ProcessOmrOptions): Promise<Score> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.title) formData.append('title', options.title);
    if (options?.composer) formData.append('composer', options.composer);
    if (options?.doDeskew !== undefined) {
      formData.append('do_deskew', String(options.doDeskew));
    }
    if (options?.runHarmonics !== undefined) {
      formData.append('run_harmonics', String(options.runHarmonics));
    }

    const response = await fetch(`${this.baseUrl}/process-omr`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Error en procesamiento OMR (${response.status})`);
    }

    const data = await response.json();
    return mapScoreFromBackend(data);
  }

  async importMusicXml(file: File): Promise<Score> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/import-musicxml`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Error al importar MusicXML (${response.status})`);
    }

    const data = await response.json();
    return mapScoreFromBackend(data);
  }

  async importMidi(file: File, splitByPitch: boolean = false): Promise<Score> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('split_by_pitch', String(splitByPitch));

    const response = await fetch(`${this.baseUrl}/import-midi`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Error al importar MIDI (${response.status})`);
    }

    const data = await response.json();
    return mapScoreFromBackend(data);
  }

  async analyzeHarmony(score: Score, override: boolean = false): Promise<Score> {
    const response = await fetch(`${this.baseUrl}/analyze-harmony?override=${override}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(score),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Error al analizar armonía (${response.status})`);
    }

    const data = await response.json();
    return mapScoreFromBackend(data);
  }
}

export const apiClient = new ApiClient();
