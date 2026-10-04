"use client";

import { forwardRef, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: React.ReactNode;
  large?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, prefix, suffix, large = false, className = "", ...props },
    ref
  ) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-spal-navy font-[family-name:var(--font-satoshi)]">
            {label}
          </label>
        )}
        <div
          className={`
            flex items-center gap-2 bg-white rounded-2xl border transition-all duration-200
            ${large ? "h-16 px-4" : "h-12 px-4"}
            ${error
              ? "border-red-400"
              : focused
              ? "border-spal-blue shadow-sm"
              : "border-neutral-200"
            }
          `}
        >
          {prefix && (
            <span
              className={`text-spal-navy font-bold flex-shrink-0 ${
                large ? "text-2xl" : "text-base"
              }`}
            >
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={`
              flex-1 bg-transparent outline-none text-spal-navy placeholder:text-neutral-300
              font-[family-name:var(--font-inter)]
              ${large ? "text-2xl font-bold" : "text-sm"}
              ${className}
            `}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {suffix && <span className="flex-shrink-0 text-neutral-400">{suffix}</span>}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

