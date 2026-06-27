"use client";

import React, { useState } from 'react';

interface PdfViewerProps {
  pdfId: string;
}

export function PdfViewer({ pdfId }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);

  const pdfUrl = `/api/pdf/${pdfId}#view=FitH&zoom=${zoom}`;

  return (
    <div className="flex flex-col h-full bg-borderLight overflow-hidden relative">
      <div className="absolute top-4 right-4 z-10 flex bg-white rounded shadow border border-borderLight overflow-hidden">
        <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-2 hover:bg-pageBg font-medium text-textPrimary text-lg leading-none w-10 text-center">-</button>
        <div className="w-px bg-borderLight" />
        <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-2 hover:bg-pageBg font-medium text-textPrimary text-lg leading-none w-10 text-center">+</button>
      </div>
      <iframe 
        src={pdfUrl} 
        className="w-full h-full border-none flex-1" 
        title="Question Paper"
      />
    </div>
  );
}
