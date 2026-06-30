"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure the pdfjs worker using unpkg CDN with the correct .mjs extension
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfCanvasViewerProps {
  pdfId: string;
  zoom: number;
}

export interface PdfCanvasViewerRef {
  getCanvasForRegion: (rect: { x: number; y: number; width: number; height: number }) => {
    canvas: HTMLCanvasElement;
    rectInPage: { x: number; y: number; width: number; height: number };
  } | null;
  getScrollContainer: () => HTMLDivElement | null;
}

export const PdfCanvasViewer = forwardRef<PdfCanvasViewerRef, PdfCanvasViewerProps>(
  ({ pdfId, zoom }, ref) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    };

    useImperativeHandle(ref, () => ({
      getScrollContainer: () => scrollContainerRef.current,
      getCanvasForRegion: (rect) => {
        if (!scrollContainerRef.current) return null;
        
        // Find all page containers
        const pageElements = Array.from(
          scrollContainerRef.current.querySelectorAll('.pdf-page-container')
        ) as HTMLDivElement[];

        if (pageElements.length === 0) return null;

        // Find the page container that matches the region's vertical midpoint
        const centerY = rect.y + rect.height / 2;
        let selectedPageElement = pageElements.find(
          (el) => el.offsetTop <= centerY && el.offsetTop + el.offsetHeight >= centerY
        );

        // Fallback to the closest overlapping page if none matches the midpoint exactly
        if (!selectedPageElement) {
          selectedPageElement = pageElements[0];
        }

        const canvas = selectedPageElement.querySelector('canvas');
        if (!canvas) return null;

        // Coordinates of the rect relative to the page element
        const x = rect.x - selectedPageElement.offsetLeft;
        const y = rect.y - selectedPageElement.offsetTop;

        return {
          canvas,
          rectInPage: { x, y, width: rect.width, height: rect.height },
        };
      },
    }));

    return (
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-auto bg-slate-100 flex flex-col items-center py-6 gap-6 relative"
      >
        <Document
          file={`/api/pdf/${pdfId}`}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center gap-6"
          loading={
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Loading document pages...</p>
            </div>
          }
          error={
            <div className="text-center py-20 text-red-500 font-semibold">
              Failed to load PDF document.
            </div>
          }
        >
          {numPages !== null &&
            Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                className="pdf-page-container shadow-md border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-lg rounded"
                data-page-number={index + 1}
              >
                <Page
                  pageNumber={index + 1}
                  scale={zoom / 100}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div
                      style={{
                        width: `${595 * (zoom / 100)}px`,
                        height: `${842 * (zoom / 100)}px`,
                      }}
                      className="flex items-center justify-center bg-white"
                    >
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }
                />
              </div>
            ))}
        </Document>
      </div>
    );
  }
);

PdfCanvasViewer.displayName = "PdfCanvasViewer";
