"use client";

import { motion } from "framer-motion";

type Color = "green" | "blue" | "orange" | "purple" | "gray";

interface PillChipProps {
  label: string;
  icon?: React.ReactNode;
  color?: Color;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const colorStyles: Record<Color, { base: string; selected: string }> = {
  green: {
    base:     "bg-spal-green-50 text-spal-green-700 border border-spal-green-200",
    selected: "bg-spal-green text-white border border-spal-green",
  },
  blue: {
    base:     "bg-spal-blue-50 text-spal-blue-600 border border-spal-blue-100",
    selected: "bg-spal-blue text-white border border-spal-blue",
  },
  orange: {
    base:     "bg-spal-orange-50 text-spal-orange-600 border border-spal-orange-100",
    selected: "bg-spal-orange text-white border border-spal-orange",
  },
  purple: {
    base:     "bg-spal-purple-50 text-spal-purple-600 border border-spal-purple-100",
    selected: "bg-spal-purple text-white border border-spal-purple",
  },
  gray: {
    base:     "bg-neutral-100 text-neutral-600 border border-neutral-200",
    selected: "bg-neutral-700 text-white border border-neutral-700",
  },
};

const sizeStyles = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-12 px-4 text-sm gap-2",
};

export function PillChip({
  label,
  icon,
  color = "gray",
  selected = false,
  onClick,
  size = "md",
}: PillChipProps) {
  const styles = colorStyles[color];

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-full font-medium
        font-[family-name:var(--font-satoshi)] cursor-pointer
        transition-all duration-200 select-none
        ${sizeStyles[size]}
        ${selected ? styles.selected : styles.base}
      `}
      aria-pressed={selected}
    >
      {icon && <span className="flex-shrink-0 text-base">{icon}</span>}
      {label}
    </motion.button>
  );
}

