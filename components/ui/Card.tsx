import { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?:  "green" | "blue" | "orange" | "purple" | "none";
  padding?: "sm" | "md" | "lg" | "none";
  elevated?: boolean;
}

// Refined top-gradient accents — a slim 2px strip at the top
// More subtle than border-l-4, closer to Resend/Linear style
const accentStyles: Record<string, string> = {
  green:  "border-t-2 border-spal-green",
  blue:   "border-t-2 border-spal-blue",
  orange: "border-t-2 border-spal-orange",
  purple: "border-t-2 border-spal-purple",
  none:   "",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-5",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ accent = "none", padding = "md", elevated = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-[18px]
          border border-neutral-200/80
          ${elevated
            ? "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.08)]"
            : "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]"
          }
          ${accentStyles[accent]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
