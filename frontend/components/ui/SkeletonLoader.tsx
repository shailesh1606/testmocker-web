import React from 'react';

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-borderLight rounded ${className}`} />
  );
}
