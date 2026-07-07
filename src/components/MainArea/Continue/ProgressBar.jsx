import React from 'react';

export default function ProgressBar({ label = 'Progres', procentaj = 60 }) {
  const normalizedProcentaj = Math.min(100, Math.max(0, procentaj));

  return (
    <div className="bg-ink mt-3 rounded-xl flex flex-col gap-1 hover:border-muted transition-all">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-light text-muted">{label}</span>
        <span className="text-sm font-light text-text-main">{normalizedProcentaj}%</span>
      </div>
      <div className="w-full bg-background rounded-full h-2 overflow-hidden">
        <div
          className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${normalizedProcentaj}%` }}
        />
      </div>
    </div>
  );
}