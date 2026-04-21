"use client";

import { useEffect, useMemo, useState } from "react";

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  invert?: boolean;
}

export default function ScoreBar({ label, value, max = 1, invert = false }: ScoreBarProps) {
  const [progress, setProgress] = useState(0);

  const ratio = useMemo(() => {
    if (max <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, value / max));
  }, [value, max]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setProgress(ratio), 80);
    return () => window.clearTimeout(timeout);
  }, [ratio]);

  const normalized = invert ? 1 - ratio : ratio;
  const barColor =
    normalized >= 0.7 ? "bg-grade-A" : normalized >= 0.4 ? "bg-grade-B" : "bg-grade-REJECT";

  const displayValue = max === 100 ? `${value.toFixed(1)}%` : `${Math.round(value * 100)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-stone-700">{label}</span>
        <span className="text-stone-500">{displayValue}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
