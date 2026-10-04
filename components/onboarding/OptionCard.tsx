"use client";

import { Tick01Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";

interface OptionCardProps {
  /** Leading visual — an icon circle or an illustration. */
  leading: React.ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  /** Tighter left padding for illustrations that bleed to the edge. */
  flushLeading?: boolean;
}

/**
 * SPAL selectable option card. Reusable across onboarding and any pick-one list.
 * Default: white card, hairline shadow, empty radio.
 * Selected: green border + soft green glow + filled radio.
 */
export function OptionCard({ leading, title, subtitle, selected, onSelect, flushLeading }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3.5 bg-white rounded-2xl text-left active:scale-[0.99] transition-all ${flushLeading ? "pr-4 pl-2 py-0" : "px-4 py-4"}`}
      style={{
        border: selected ? "1.5px solid #22C55E" : "1.5px solid transparent",
        boxShadow: selected ? "0 2px 12px rgba(34,197,94,0.18)" : "0 1px 6px rgba(0,0,0,0.05)",
        minHeight: 72,
      }}
    >
      <span className="flex-shrink-0 flex items-center">{leading}</span>

      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-bold text-spal-navy leading-tight" style={{ fontFamily: FF }}>
          {title}
        </span>
        {subtitle && (
          <span className="block text-[13px] text-neutral-500 mt-0.5" style={{ fontFamily: FF }}>
            {subtitle}
          </span>
        )}
      </span>

      {/* Radio */}
      <span
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{
          width: 24,
          height: 24,
          border: selected ? "none" : "2px solid #D1D5DB",
          background: selected ? "#22C55E" : "transparent",
        }}
      >
        {selected && <Tick01Icon size={14} color="#fff" />}
      </span>
    </button>
  );
}
