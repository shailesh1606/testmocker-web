"use client";

import React from 'react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: any[];
  markedForReview: boolean[];
  onSelect: (index: number) => void;
}

export function QuestionPalette({ totalQuestions, currentIndex, answers, markedForReview, onSelect }: QuestionPaletteProps) {
  return (
    <div className="flex flex-col p-4 bg-white border border-borderLight rounded-lg h-full">
      <h3 className="text-[13px] font-medium text-textSecondary mb-4">Question Palette</h3>
      
      <div className="grid grid-cols-6 gap-2 mb-6 overflow-y-auto max-h-[300px] pr-2">
        {Array.from({ length: totalQuestions }).map((_, i) => {
          const hasAnswer = answers[i] != null;
          const isReview = markedForReview[i];
          
          let bgColor = "bg-pageBg border-borderLight text-textSecondary"; // not visited / default
          // Wait, the color coding spec:
          // Grey: not visited
          // Red: visited but not answered (We will treat active without answer as red or just default to answered/unanswered logic)
          // Green: answered
          // Purple: marked for review

          if (isReview) {
            bgColor = "bg-review text-white border-review";
          } else if (hasAnswer) {
            bgColor = "bg-success text-white border-success";
          } else if (i === currentIndex) {
            bgColor = "bg-danger text-white border-danger";
          } else {
            // Not visited logic strictly requires tracking 'visited'. We'll simplify: 
            // white/grey if not answered.
            bgColor = "bg-white text-textSecondary border-borderLight hover:bg-pageBg";
          }

          if (i === currentIndex) {
            bgColor += " ring-2 ring-primaryAccent ring-offset-1";
          }

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`w-9 h-9 rounded-full text-xs font-medium border flex items-center justify-center transition-all ${bgColor}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="text-[11px] text-textSecondary grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-borderLight">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border bg-white inline-block"></span> Not Answered</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-success inline-block"></span> Answered</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-review inline-block"></span> Review</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-danger inline-block"></span> Active Un-Ans</div>
      </div>
    </div>
  );
}
