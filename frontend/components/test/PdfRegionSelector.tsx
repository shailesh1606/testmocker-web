"use client";

import React, { useState, useRef } from 'react';
import { PdfCanvasViewer, PdfCanvasViewerRef } from './PdfCanvasViewer';

interface PdfRegionSelectorProps {
  pdfId: string;
  isSelecting: boolean;
  onCancel: () => void;
  onRegionSelected: (base64Image: string) => void;
}

export function PdfRegionSelector({
  pdfId,
  isSelecting,
  onCancel,
  onRegionSelected,
}: PdfRegionSelectorProps) {
  const [zoom, setZoom] = useState(100);
  const canvasViewerRef = useRef<PdfCanvasViewerRef>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Drag state refs to avoid closure stale state
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const [renderRect, setRenderRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    dragStartRef.current = { x: startX, y: startY };
    const initialRect = { left: startX, top: startY, width: 0, height: 0 };
    dragRectRef.current = initialRect;
    setRenderRect(initialRect);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const currentX = moveEvent.clientX - rect.left;
      const currentY = moveEvent.clientY - rect.top;

      const clampedX = Math.max(0, Math.min(rect.width, currentX));
      const clampedY = Math.max(0, Math.min(rect.height, currentY));

      const nextRect = {
        left: Math.min(dragStartRef.current.x, clampedX),
        top: Math.min(dragStartRef.current.y, clampedY),
        width: Math.abs(dragStartRef.current.x - clampedX),
        height: Math.abs(dragStartRef.current.y - clampedY),
      };

      dragRectRef.current = nextRect;
      setRenderRect(nextRect);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const finalRect = dragRectRef.current;
      handleSelectionEnd(finalRect);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!overlayRef.current || e.touches.length === 0) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const startX = touch.clientX - rect.left;
    const startY = touch.clientY - rect.top;

    dragStartRef.current = { x: startX, y: startY };
    const initialRect = { left: startX, top: startY, width: 0, height: 0 };
    dragRectRef.current = initialRect;
    setRenderRect(initialRect);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!dragStartRef.current || moveEvent.touches.length === 0) return;
      const currentTouch = moveEvent.touches[0];
      const currentX = currentTouch.clientX - rect.left;
      const currentY = currentTouch.clientY - rect.top;

      const clampedX = Math.max(0, Math.min(rect.width, currentX));
      const clampedY = Math.max(0, Math.min(rect.height, currentY));

      const nextRect = {
        left: Math.min(dragStartRef.current.x, clampedX),
        top: Math.min(dragStartRef.current.y, clampedY),
        width: Math.abs(dragStartRef.current.x - clampedX),
        height: Math.abs(dragStartRef.current.y - clampedY),
      };

      dragRectRef.current = nextRect;
      setRenderRect(nextRect);
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      const finalRect = dragRectRef.current;
      handleSelectionEnd(finalRect);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleSelectionEnd = (rect: { left: number; top: number; width: number; height: number } | null) => {
    setRenderRect(null);
    dragStartRef.current = null;
    dragRectRef.current = null;

    if (!rect) return;

    // Ignore if drag distance is below minimum threshold (20x20 px)
    if (rect.width < 20 || rect.height < 20) {
      return;
    }

    if (!canvasViewerRef.current) return;

    const scrollContainer = canvasViewerRef.current.getScrollContainer();
    if (!scrollContainer) return;

    // Convert overlay-relative coords to scroll-container-content-relative coords
    const contentX = rect.left + scrollContainer.scrollLeft;
    const contentY = rect.top + scrollContainer.scrollTop;

    const result = canvasViewerRef.current.getCanvasForRegion({
      x: contentX,
      y: contentY,
      width: rect.width,
      height: rect.height,
    });

    if (!result) return;

    const { canvas: sourceCanvas, rectInPage } = result;

    const clientW = sourceCanvas.clientWidth || sourceCanvas.width || 1;
    const clientH = sourceCanvas.clientHeight || sourceCanvas.height || 1;

    // Calculate coordinate scaling from CSS pixel display size to native canvas pixels buffer
    const scaleX = sourceCanvas.width / clientW;
    const scaleY = sourceCanvas.height / clientH;

    const canvasX = rectInPage.x * scaleX;
    const canvasY = rectInPage.y * scaleY;
    const canvasWidth = rectInPage.width * scaleX;
    const canvasHeight = rectInPage.height * scaleY;

    if (canvasWidth <= 0 || canvasHeight <= 0) return;

    // Downscale if longest side is > 1200px
    const maxDimension = 1200;
    let targetWidth = canvasWidth;
    let targetHeight = canvasHeight;

    if (canvasWidth > maxDimension || canvasHeight > maxDimension) {
      if (canvasWidth >= canvasHeight) {
        targetWidth = maxDimension;
        targetHeight = (canvasHeight / canvasWidth) * maxDimension;
      } else {
        targetHeight = maxDimension;
        targetWidth = (canvasWidth / canvasHeight) * maxDimension;
      }
    }

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      sourceCanvas,
      canvasX,
      canvasY,
      canvasWidth,
      canvasHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    try {
      const base64Data = offscreenCanvas.toDataURL('image/png');
      onRegionSelected(base64Data);
    } catch (e) {
      console.error("Failed to crop canvas region:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-borderLight overflow-hidden relative w-full">
      {isSelecting && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between text-xs md:text-sm font-medium z-30 shadow-md shrink-0 transition-all duration-200">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-indigo-300 rounded-full animate-ping shrink-0" />
            <span>Drag to select the question and options, then release to capture.</span>
          </div>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors rounded text-white font-semibold shadow-sm"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <PdfCanvasViewer ref={canvasViewerRef} pdfId={pdfId} zoom={zoom} />

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-10 flex bg-white rounded shadow-md border border-borderLight overflow-hidden">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="p-2 hover:bg-pageBg font-semibold text-textPrimary text-lg leading-none w-10 text-center transition-colors active:bg-slate-100"
          >
            -
          </button>
          <div className="w-px bg-borderLight" />
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
            className="p-2 hover:bg-pageBg font-semibold text-textPrimary text-lg leading-none w-10 text-center transition-colors active:bg-slate-100"
          >
            +
          </button>
        </div>

        {/* Selection Overlay */}
        {isSelecting && (
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-slate-900/40 cursor-crosshair z-20 pointer-events-auto"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {renderRect && (
              <div
                style={{
                  left: `${renderRect.left}px`,
                  top: `${renderRect.top}px`,
                  width: `${renderRect.width}px`,
                  height: `${renderRect.height}px`,
                }}
                className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-none rounded shadow-[0_0_0_9999px_rgba(15,23,42,0.4)]"
              >
                {/* Visual tooltip */}
                <div className="absolute -top-7 left-0 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded shadow font-mono pointer-events-none whitespace-nowrap">
                  {Math.round(renderRect.width)} × {Math.round(renderRect.height)} px
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
