"use client";

import { ArrowLeft01Icon } from "hugeicons-react";

interface OnboardingProgressProps {
  step: number;   // 1-indexed current step
  total: number;
  onBack: () => void;
}

/**
 * Onboarding header: back button + segmented progress bar.
 * Completed segments are green, the current one is white, the rest are muted.
 */
export function OnboardingProgress({ step, total, onBack }: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4">
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
      >
        <ArrowLeft01Icon size={18} color="#0F172A" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < step - 1;
          const current = i === step - 1;
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-colors duration-300"
              style={{ height: 6, background: done ? "#22C55E" : current ? "#FFFFFF" : "#D6DDCE" }}
            />
          );
        })}
      </div>
    </div>
  );
}
