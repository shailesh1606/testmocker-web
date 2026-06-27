import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string; // Tailwind class like bg-primaryAccent
  height?: string;
}

export function ProgressBar({ progress, color = "bg-primaryAccent", height = "h-2" }: ProgressBarProps) {
  return (
    <div className={`w-full bg-borderLight rounded-full overflow-hidden ${height}`}>
      <div 
        className={`${height} ${color} transition-all duration-500 ease-out`} 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} 
      />
    </div>
  );
}
