"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  fullWidth?: boolean;
  icon?:     React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#22C55E] text-white " +
    "shadow-[0_2px_12px_rgba(34,197,94,0.28)] " +
    "active:bg-spal-green-600 " +
    "disabled:bg-[#E4E4E7] disabled:text-[#A1A1AA] disabled:shadow-none",
  secondary:
    "bg-white text-spal-navy border border-neutral-200/80 " +
    "shadow-[0_1px_4px_rgba(0,0,0,0.06)] " +
    "active:bg-neutral-50 disabled:opacity-50",
  ghost:
    "bg-transparent text-spal-navy active:bg-neutral-100 disabled:opacity-50",
  danger:
    "bg-red-500 text-white " +
    "shadow-[0_2px_12px_rgba(239,68,68,0.25)] " +
    "active:bg-red-600 disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-10 px-4  text-sm  rounded-full",
  md: "h-12 px-6  text-sm  rounded-full",
  lg: "h-14 px-8  text-base rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = "primary",
      size      = "md",
      loading   = false,
      fullWidth  = false,
      icon,
      iconRight,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
        transition={{ duration: 0.08 }}
        className={`
          inline-flex items-center justify-center gap-2
          font-semibold font-[family-name:var(--font-satoshi)]
          tracking-tight
          transition-all duration-150 cursor-pointer select-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${disabled || loading ? "pointer-events-none" : ""}
          ${className}
        `}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
          <LoadingDots />
        ) : (
          <>
            {icon      && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

function LoadingDots() {
  return (
    <span className="flex gap-1.5 items-center py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
