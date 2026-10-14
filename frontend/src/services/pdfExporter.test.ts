import { describe, it, expect, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import {
  exportScoreToPdf,
  exportSvgElementsToPdf,
  createSvgElementForSystem,
  downloadPdf,
  A4_PORTRAIT_WIDTH_MM,
  A4_LANDSCAPE_WIDTH_MM,
} from './pdfExporter';
import { INITIAL_SCORE } from '../data/initialScore';
import { DEFAULT_SCORE_CONFIG } from '../types/scoreConfig';
import { partitionMeasuresIntoSystems } from '../renderer/layout/systemPartitioning';

// Polyfill getBBox for jsdom test environment
if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = function () {
    return { x: 0, y: 0, width: 20, height: 10 } as DOMRect;
  };
}

describe('pdfExporter Service', () => {
  it('creates an SVGElement for a system layout correctly', () => {
    const systems = partitionMeasuresIntoSystems(INITIAL_SCORE.measures.slice(0, 2), {
      measuresPerSystem: 2,
      systemWidth: 780,
    });
    expect(systems.length).toBeGreaterThan(0);

    const svgEl = createSvgElementForSystem(
      systems[0],
      INITIAL_SCORE,
      DEFAULT_SCORE_CONFIG,
      10,
      55,
      230
    );

    expect(svgEl).toBeInstanceOf(SVGElement);
    expect(svgEl.getAttribute('viewBox')).toBe('0 0 780 230');
    expect(svgEl.querySelector('.svg-system')).not.toBeNull();
  });

  it('exports SVG elements to a 1-page PDF in portrait orientation', async () => {
    const systems = partitionMeasuresIntoSystems(INITIAL_SCORE.measures.slice(0, 2), {
      measuresPerSystem: 2,
      systemWidth: 780,
    });
    const svgEl = createSvgElementForSystem(
      systems[0],
      INITIAL_SCORE,
      DEFAULT_SCORE_CONFIG,
      10,
      55,
      230
    );

    const doc = await exportSvgElementsToPdf([svgEl], {
      orientation: 'portrait',
      includeHeader: true,
      title: 'Test Score Title',
      composer: 'Test Composer',
      tempo: 'Andante',
    });

    expect(doc).toBeDefined();
    expect(typeof doc.output).toBe('function');
    expect(doc.getNumberOfPages()).toBe(1);

    const blob = doc.output('blob');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('handles multi-page pagination when many systems are exported', async () => {
    const systems = partitionMeasuresIntoSystems(INITIAL_SCORE.measures, {
      measuresPerSystem: 1, // Many systems to trigger page breaks
      systemWidth: 780,
    });

    const svgElements = systems.map((sys) =>
      createSvgElementForSystem(sys, INITIAL_SCORE, DEFAULT_SCORE_CONFIG, 10, 55, 230)
    );

    const doc = await exportSvgElementsToPdf(svgElements, {
      orientation: 'portrait',
      includeHeader: true,
      includePageNumbers: true,
      pageNumberPosition: 'bottom-right',
    });

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('exports in landscape orientation and without header when configured', async () => {
    const systems = partitionMeasuresIntoSystems(INITIAL_SCORE.measures.slice(0, 2), {
      measuresPerSystem: 2,
      systemWidth: 780,
    });
    const svgEl = createSvgElementForSystem(
      systems[0],
      INITIAL_SCORE,
      DEFAULT_SCORE_CONFIG,
      10,
      55,
      230
    );

    const doc = await exportSvgElementsToPdf([svgEl], {
      orientation: 'landscape',
      includeHeader: false,
      includePageNumbers: false,
    });

    expect(doc.getNumberOfPages()).toBe(1);
    const internalPageWidth = doc.internal.pageSize.getWidth();
    expect(internalPageWidth).toBeCloseTo(A4_LANDSCAPE_WIDTH_MM, 1);
  });

  it('exports full Score and ScoreConfig seamlessly via exportScoreToPdf', async () => {
    const doc = await exportScoreToPdf(INITIAL_SCORE, DEFAULT_SCORE_CONFIG, {
      orientation: 'portrait',
      marginMm: 12,
    });

    expect(doc).toBeDefined();
    expect(typeof doc.save).toBe('function');
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    const internalPageWidth = doc.internal.pageSize.getWidth();
    expect(internalPageWidth).toBeCloseTo(A4_PORTRAIT_WIDTH_MM, 1);
  });

  it('downloadPdf saves document with sanitized filename', () => {
    const doc = new jsPDF();
    const saveSpy = vi.spyOn(doc, 'save').mockImplementation(() => doc);

    downloadPdf(doc, 'mi-partitura');
    expect(saveSpy).toHaveBeenCalledWith('mi-partitura.pdf');

    downloadPdf(doc, 'obra.pdf');
    expect(saveSpy).toHaveBeenCalledWith('obra.pdf');
  });
});
