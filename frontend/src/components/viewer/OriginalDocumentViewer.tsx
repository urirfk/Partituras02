import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface OriginalDocumentViewerProps {
  pages: string[];
  documentTitle?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const OriginalDocumentViewer: React.FC<OriginalDocumentViewerProps> = ({
  pages,
  documentTitle,
  currentPage = 1,
  onPageChange,
  className = '',
}) => {
  const { t } = useTranslation();
  const [internalPage, setInternalPage] = useState<number>(currentPage);
  const [zoom, setZoom] = useState<number>(1.0);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [pdfFallbackUrls, setPdfFallbackUrls] = useState<Record<string, boolean>>({});

  const activePage = onPageChange ? currentPage : internalPage;
  const totalPages = pages.length;

  const handlePageSelect = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setInternalPage(newPage);
    onPageChange?.(newPage);
  };

  const handleZoomIn = () => {
    setFitToWidth(false);
    setZoom((prev) => Math.min(3.0, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    setZoom((prev) => Math.max(0.3, Number((prev - 0.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setFitToWidth(false);
    setZoom(1.0);
  };

  const toggleFitWidth = () => {
    setFitToWidth((prev) => !prev);
    if (!fitToWidth) {
      setZoom(1.0);
    }
  };

  const currentImageSrc = pages[activePage - 1];

  return (
    <div
      className={`flex flex-col h-full w-full bg-zinc-200/50 dark:bg-zinc-900 select-none ${className}`}
      data-testid="original-document-viewer"
    >
      {/* Floating Zen Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-xs text-zinc-600 dark:text-zinc-300 z-10">
        {/* Multipage controls */}
        <div className="flex items-center gap-1">
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={() => handlePageSelect(activePage - 1)}
                disabled={activePage <= 1}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                data-testid="prev-page-btn"
                aria-label="Previous Page"
              >
                ◀
              </button>
              <span className="px-1.5 font-medium tabular-nums" data-testid="page-indicator">
                {t('viewer.page')} {activePage} {t('viewer.of')} {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageSelect(activePage + 1)}
                disabled={activePage >= totalPages}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                data-testid="next-page-btn"
                aria-label="Next Page"
              >
                ▶
              </button>
            </>
          )}
          {totalPages <= 1 && (
            <span
              className="font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]"
              title={documentTitle || t('viewer.originalTitle')}
            >
              {documentTitle || t('viewer.originalTitle')}
            </span>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            data-testid="zoom-out-btn"
            title={t('viewer.zoomOut')}
          >
            －
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono text-[11px] tabular-nums"
            data-testid="zoom-percent-btn"
            title={t('viewer.resetZoom')}
          >
            {fitToWidth ? 'Auto' : `${Math.round(zoom * 100)}%`}
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            data-testid="zoom-in-btn"
            title={t('viewer.zoomIn')}
          >
            ＋
          </button>

          <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-700 mx-1" />

          <button
            type="button"
            onClick={toggleFitWidth}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              fitToWidth
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            data-testid="fit-width-btn"
          >
            {t('viewer.fitWidth')}
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {currentImageSrc ? (
          (() => {
            const isDirectPdf =
              typeof currentImageSrc === 'string' &&
              (currentImageSrc.includes('application/pdf') ||
                currentImageSrc.toLowerCase().endsWith('.pdf') ||
                currentImageSrc.startsWith('data:application/pdf'));
            const isPdf = isDirectPdf || Boolean(pdfFallbackUrls[currentImageSrc]);

            if (isPdf) {
              return (
                <div
                  className="w-full h-full flex items-center justify-center p-1"
                  data-testid="pdf-wrapper"
                >
                  <object
                    data={currentImageSrc}
                    type="application/pdf"
                    className="w-full h-full min-h-[500px] rounded-sm shadow-md"
                    data-testid="original-score-pdf"
                  >
                    <iframe
                      src={currentImageSrc}
                      title={documentTitle || t('viewer.originalTitle')}
                      className="w-full h-full border-0 min-h-[500px]"
                    />
                  </object>
                </div>
              );
            }

            return (
              <div
                className="transition-transform duration-100 flex items-center justify-center shadow-lg rounded-sm overflow-hidden bg-white"
                style={
                  fitToWidth
                    ? { width: '100%', maxWidth: '100%' }
                    : { width: `${Math.round(zoom * 100)}%`, maxWidth: 'none' }
                }
                data-testid="image-wrapper"
              >
                <img
                  src={currentImageSrc}
                  alt={`${documentTitle || t('viewer.originalTitle')} - ${t('viewer.page')} ${activePage}`}
                  className="w-full h-auto object-contain pointer-events-none"
                  data-testid="original-score-image"
                  onError={() => {
                    setPdfFallbackUrls((prev) => ({ ...prev, [currentImageSrc]: true }));
                  }}
                />
              </div>
            );
          })()
        ) : (
          <div
            className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-12"
            data-testid="empty-viewer-message"
          >
            {t('viewer.noDocument')}
          </div>
        )}
      </div>
    </div>
  );
};
