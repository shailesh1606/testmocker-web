"use client";

import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  totalSeconds: number;
  startedAt: number;
  onExpire: () => void;
}

export function CountdownTimer({ totalSeconds, startedAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    const calcTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - startedAt;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        onExpire();
      }
      return remaining;
    };

    if (calcTime() <= 0) return;

    const intvl = setInterval(() => {
      if (calcTime() <= 0) clearInterval(intvl);
    }, 1000);

    return () => clearInterval(intvl);
  }, [totalSeconds, startedAt, onExpire]);

  const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
  const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  const isWarning = timeLeft < 300; // < 5 minutes

  return (
    <div className={`font-mono text-lg font-bold min-w-[100px] text-center px-4 py-2 rounded border ${isWarning ? 'bg-danger/10 text-danger border-danger/20' : 'bg-pageBg text-textPrimary border-borderLight'}`}>
      {h}:{m}:{s}
    </div>
  );
}
