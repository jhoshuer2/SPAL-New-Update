"use client";

import { Calendar03Icon, Clock01Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";

interface Props {
  date: string;
  onDateChange: (v: string) => void;
  time?: string;
  onTimeChange?: (v: string) => void;
  /** Tailwind classes for the outer grid wrapper */
  className?: string;
  /** Light (default) or dark background variant */
  variant?: "light" | "dark";
}

export function DateTimePicker({
  date, onDateChange,
  time, onTimeChange,
  className = "",
  variant = "light",
}: Props) {
  const showTime = time !== undefined && !!onTimeChange;
  const bg      = variant === "dark" ? "rgba(255,255,255,0.10)" : "#fff";
  const shadow  = variant === "dark" ? "none" : "0 1px 4px rgba(0,0,0,0.05)";
  const color   = variant === "dark" ? "#fff" : "var(--color-spal-navy, #0F172A)";

  return (
    <div className={`grid gap-3 ${showTime ? "grid-cols-2" : "grid-cols-1"} ${className}`}>
      {/* Date */}
      <div
        className="rounded-2xl px-3.5 py-3 flex items-center gap-2.5"
        style={{ background: bg, boxShadow: shadow }}
      >
        <Calendar03Icon size={17} color={variant === "dark" ? "#fff" : "#6B7280"} className="flex-shrink-0" />
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onDateChange(e.target.value)}
          className="text-[12.5px] font-medium bg-transparent outline-none w-full"
          style={{ fontFamily: FF, color }}
        />
      </div>

      {/* Time (optional) */}
      {showTime && (
        <div
          className="rounded-2xl px-3.5 py-3 flex items-center gap-2.5"
          style={{ background: bg, boxShadow: shadow }}
        >
          <Clock01Icon size={17} color={variant === "dark" ? "#fff" : "#6B7280"} className="flex-shrink-0" />
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange!(e.target.value)}
            className="text-[12.5px] font-medium bg-transparent outline-none w-full"
            style={{ fontFamily: FF, color }}
          />
        </div>
      )}
    </div>
  );
}
