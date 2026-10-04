"use client";

import { motion } from "framer-motion";

interface InsightCardProps {
  title:       string;
  message:     string;
  variant?:    "default" | "celebration" | "warning" | "tip";
  icon?:       React.ReactNode;
  metric?:     string;
  metricLabel?: string;
  positive?:   boolean;
}

const variantStyles = {
  default:
    "bg-white border border-neutral-200/80 " +
    "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]",
  celebration:
    "bg-gradient-to-br from-spal-green to-spal-green-600 text-white " +
    "shadow-[0_4px_20px_rgba(29,185,84,0.3)]",
  warning:
    "bg-gradient-to-br from-spal-orange-50 to-[#FFF3E8] " +
    "border border-spal-orange-100",
  tip:
    "bg-gradient-to-br from-spal-blue-50 via-[#F0F4FF] to-spal-purple-50 " +
    "border border-spal-blue-100",
};

const titleColor = {
  default:     "text-spal-navy",
  celebration: "text-white",
  warning:     "text-spal-orange-600",
  tip:         "text-spal-blue-600",
};

const bodyColor = {
  default:     "text-neutral-500",
  celebration: "text-white/85",
  warning:     "text-neutral-600",
  tip:         "text-neutral-600",
};

export function InsightCard({
  title,
  message,
  variant    = "default",
  icon,
  metric,
  metricLabel,
  positive,
}: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[18px] p-4 ${variantStyles[variant]}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex-shrink-0 mt-0.5">{icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm font-[family-name:var(--font-satoshi)] ${titleColor[variant]}`}>
            {title}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${bodyColor[variant]}`}>
            {message}
          </p>
        </div>
        {metric && (
          <div className="flex-shrink-0 text-right">
            <p className={`text-xl font-bold font-[family-name:var(--font-satoshi)] ${
              variant === "celebration"
                ? "text-white"
                : positive === true
                ? "text-spal-green"
                : positive === false
                ? "text-spal-orange"
                : "text-spal-navy"
            }`}>
              {metric}
            </p>
            {metricLabel && (
              <p className={`text-xs ${bodyColor[variant]}`}>{metricLabel}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

