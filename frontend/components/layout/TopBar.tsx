import React from 'react';

interface TopBarProps {
  title?: string;
  rightNode?: React.ReactNode;
}

export function TopBar({ title, rightNode }: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-borderLight px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="font-semibold text-textPrimary text-lg">
        {title || "Overview"}
      </div>
      <div>
        {rightNode}
      </div>
    </div>
  );
}
