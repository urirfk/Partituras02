import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js/dist/svg2pdf.es.min.js';
import { Score } from '../types/music';
import { ScoreConfig } from '../types/scoreConfig';
import { partitionMeasuresIntoSystems, SystemLayout } from '../renderer/layout/systemPartitioning';
import { SvgSystem } from '../renderer/svg/SvgSystem';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  includeHeader?: boolean;
  title?: string;
  composer?: string;
  subtitle?: string;
  tempo?: string;
  includePageNumbers?: boolean;
  pageNumberPosition?: 'bottom-center' | 'bottom-right';
  systemGapMm?: number;
}

export const A4_PORTRAIT_WIDTH_MM = 210;
export const A4_PORTRAIT_HEIGHT_MM = 297;
export const A4_LANDSCAPE_WIDTH_MM = 297;
export const A4_LANDSCAPE_HEIGHT_MM = 210;

/**
 * Creates an SVG Element from a SystemLayout using React renderToStaticMarkup.
 */
export function createSvgElementForSystem(
  system: SystemLayout,
  score: Score,
  config: ScoreConfig,
  lineSpacing: number,
  staffGap: number,
  systemHeight: number
): SVGElement {
  const isGrandStaff = score.staffType === 'grand';

  const markup = renderToStaticMarkup(
    React.createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: '780',
        height: String(systemHeight),
        viewBox: `0 0 780 ${systemHeight}`,
      },
      React.createElement(SvgSystem, {
        system,
        baseY: 40,
        lineSpacing,
        staffType: isGrandStaff ? 'grand' : 'single',
        staffGap,
        showNoteNames: config.showNoteNames,
        showAccidentals: config.showAccidentals,
        showFingerings: config.showFingerings,
        showChords: config.showChords,
        chordNotation: config.chordNotation,
        showLyrics: config.showLyrics,
        showMeasureNumbers: true,
      })
    )
  );

  const parser = new DOMParser();
  const doc = parser.parseFromString(markup, 'image/svg+xml');
  return doc.documentElement as unknown as SVGElement;
}

/**
 * Exports an array of SVG elements representing musical systems to a paginated A4 jsPDF document.
 */
export async function exportSvgElementsToPdf(
  svgElements: SVGElement[],
  options: PdfExportOptions = {}
): Promise<jsPDF> {
  const orientation = options.orientation || 'portrait';
  const marginMm = options.marginMm ?? 15;
  const pageWidth = orientation === 'portrait' ? A4_PORTRAIT_WIDTH_MM : A4_LANDSCAPE_WIDTH_MM;
  const pageHeight = orientation === 'portrait' ? A4_PORTRAIT_HEIGHT_MM : A4_LANDSCAPE_HEIGHT_MM;
  const usableWidth = pageWidth - 2 * marginMm;
  const systemGapMm = options.systemGapMm ?? 8;
  const includeHeader = options.includeHeader ?? true;
  const includePageNumbers = options.includePageNumbers ?? true;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Calculate starting Y for page 1
  let currentY = marginMm;

  if (includeHeader) {
    const title = options.title || 'Partitura Didáctica';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27);
    doc.text(title, pageWidth / 2, marginMm + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(82, 82, 91);

    if (options.tempo) {
      doc.text(options.tempo, marginMm, marginMm + 16, { align: 'left' });
    }
    if (options.composer) {
      doc.text(options.composer, pageWidth - marginMm, marginMm + 16, { align: 'right' });
    }

    currentY = marginMm + 24;
  }

  // Hidden container for DOM attachment during svg2pdf conversion
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.position = 'fixed';
  hiddenContainer.style.left = '-9999px';
  hiddenContainer.style.top = '-9999px';
  hiddenContainer.style.opacity = '0';
  hiddenContainer.style.pointerEvents = 'none';
  document.body.appendChild(hiddenContainer);

  const pageBottomReserved = marginMm + (includePageNumbers ? 10 : 0);

  try {
    for (let i = 0; i < svgElements.length; i++) {
      const svg = svgElements[i];
      hiddenContainer.appendChild(svg);

      const viewBox = svg.getAttribute('viewBox');
      let svgWidth = 780;
      let svgHeight = 200;

      if (viewBox) {
        const parts = viewBox.trim().split(/\s+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          svgWidth = parts[2];
          svgHeight = parts[3];
        }
      } else {
        const wAttr = parseFloat(svg.getAttribute('width') || '780');
        const hAttr = parseFloat(svg.getAttribute('height') || '200');
        if (wAttr > 0) svgWidth = wAttr;
        if (hAttr > 0) svgHeight = hAttr;
      }

      const renderedHeightMm = (usableWidth * svgHeight) / svgWidth;

      // Check if system fits on current page (unless it's the very first element on the page)
      const isFirstOnPage = (doc.getNumberOfPages() === 1 && currentY === (includeHeader ? marginMm + 24 : marginMm)) ||
        (doc.getNumberOfPages() > 1 && currentY === marginMm);

      if (!isFirstOnPage && currentY + renderedHeightMm > pageHeight - pageBottomReserved) {
        doc.addPage('a4', orientation);
        currentY = marginMm;
      }

      await svg2pdf(svg, doc, {
        x: marginMm,
        y: currentY,
        width: usableWidth,
        height: renderedHeightMm,
      });

      hiddenContainer.removeChild(svg);
      currentY += renderedHeightMm + systemGapMm;
    }
  } finally {
    if (hiddenContainer.parentNode) {
      hiddenContainer.parentNode.removeChild(hiddenContainer);
    }
  }

  // Draw page numbers across all pages
  if (includePageNumbers) {
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      const pageText = totalPages > 1 ? `${p} / ${totalPages}` : `${p}`;

      if (options.pageNumberPosition === 'bottom-right') {
        doc.text(pageText, pageWidth - marginMm, pageHeight - marginMm / 2, { align: 'right' });
      } else {
        doc.text(pageText, pageWidth / 2, pageHeight - marginMm / 2, { align: 'center' });
      }
    }
  }

  return doc;
}

/**
 * High-level exporter: receives Score and ScoreConfig and generates vector PDF document.
 */
export async function exportScoreToPdf(
  score: Score,
  config: ScoreConfig,
  options: PdfExportOptions = {}
): Promise<jsPDF> {
  const scaleMultiplier =
    config.scale === 'normal' ? 0.85 : config.scale === 'extra-large' ? 1.15 : 1.0;
  const lineSpacing = 10 * scaleMultiplier;
  const isGrandStaff = score.staffType === 'grand';
  const staffGap = isGrandStaff ? 55 * scaleMultiplier : 0;
  const systemHeight = isGrandStaff ? 230 * scaleMultiplier : 150 * scaleMultiplier;

  // Partition measures dynamically according to measuresPerSystem (orthogonal invariant)
  const systems = partitionMeasuresIntoSystems(score.measures, {
    measuresPerSystem: config.measuresPerSystem,
    systemWidth: 780,
    minNoteDistance: 45 * scaleMultiplier,
  });

  const svgElements: SVGElement[] = systems.map((system) =>
    createSvgElementForSystem(system, score, config, lineSpacing, staffGap, systemHeight)
  );

  const tempoText =
    score.metadata.tempo?.text ||
    (score.metadata.tempo?.bpm ? `♩ = ${score.metadata.tempo.bpm}` : undefined);

  const mergedOptions: PdfExportOptions = {
    title: options.title || score.metadata.title,
    composer: options.composer || score.metadata.composer,
    subtitle: options.subtitle || score.metadata.subtitle,
    tempo: options.tempo || tempoText,
    orientation: options.orientation || 'portrait',
    marginMm: options.marginMm ?? 15,
    includeHeader: options.includeHeader ?? true,
    includePageNumbers: options.includePageNumbers ?? true,
    pageNumberPosition: options.pageNumberPosition ?? 'bottom-center',
    systemGapMm: options.systemGapMm ?? 8,
  };

  return exportSvgElementsToPdf(svgElements, mergedOptions);
}

/**
 * Triggers a browser download of the generated PDF document.
 */
export function downloadPdf(doc: jsPDF, filename = 'partitura-didactica.pdf'): void {
  const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(safeFilename);
}
