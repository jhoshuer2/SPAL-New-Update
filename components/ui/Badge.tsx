type BadgeColor = "green" | "orange" | "blue" | "purple" | "gray" | "red";

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  dot?: boolean;
  size?: "sm" | "md";
}

const colorStyles: Record<BadgeColor, string> = {
  green:  "bg-spal-green-100 text-spal-green-700",
  orange: "bg-spal-orange-100 text-spal-orange-600",
  blue:   "bg-spal-blue-100 text-spal-blue-600",
  purple: "bg-spal-purple-100 text-spal-purple-600",
  gray:   "bg-neutral-100 text-neutral-600",
  red:    "bg-red-100 text-red-700",
};

const dotColors: Record<BadgeColor, string> = {
  green:  "bg-spal-green",
  orange: "bg-spal-orange",
  blue:   "bg-spal-blue",
  purple: "bg-spal-purple",
  gray:   "bg-neutral-400",
  red:    "bg-red-500",
};

export function Badge({ label, color = "gray", dot = false, size = "sm" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}
        ${colorStyles[color]}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[color]}`} />
      )}
      {label}
    </span>
  );
}
