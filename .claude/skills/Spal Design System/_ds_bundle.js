/* @ds-bundle: {"format":4,"namespace":"SpalDesignSystem_6a1cb4","components":[{"name":"SpalSymbol","sourcePath":"components/brand/SpalSymbol.jsx"},{"name":"SparkAvatar","sourcePath":"components/brand/SparkAvatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"PillChip","sourcePath":"components/core/PillChip.jsx"},{"name":"InsightCard","sourcePath":"components/feedback/InsightCard.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"SkeletonRow","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"UndoToast","sourcePath":"components/feedback/UndoToast.jsx"},{"name":"WeeklyChallengeCard","sourcePath":"components/gamification/WeeklyChallengeCard.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"QuickMenuFab","sourcePath":"components/navigation/QuickMenuFab.jsx"},{"name":"TopNavPills","sourcePath":"components/navigation/TopNavPills.jsx"}],"sourceHashes":{"components/brand/SpalSymbol.jsx":"7f8f5a7ac02c","components/brand/SparkAvatar.jsx":"8378f99344ac","components/core/Badge.jsx":"1b946db4dac4","components/core/Button.jsx":"456843fa6b45","components/core/Card.jsx":"011008aa9d8f","components/core/Input.jsx":"2c08764dabd2","components/core/PillChip.jsx":"2be18852d027","components/feedback/InsightCard.jsx":"3c8f62463e08","components/feedback/Skeleton.jsx":"4741f932b829","components/feedback/UndoToast.jsx":"d6cb05979d78","components/gamification/WeeklyChallengeCard.jsx":"4641f3690d4c","components/navigation/BottomNav.jsx":"abedcd055db5","components/navigation/QuickMenuFab.jsx":"9f0e8c3e7101","components/navigation/TopNavPills.jsx":"94ae7ba4d582","ui_kits/mobile-app/AddRecordSheet.jsx":"c77d8a4a8940","ui_kits/mobile-app/AppShell.jsx":"4b00127a9d3a","ui_kits/mobile-app/HomeScreen.jsx":"1663c44015cd","ui_kits/mobile-app/RecordsScreen.jsx":"54f3b25d515f","ui_kits/mobile-app/WelcomeScreen.jsx":"eed356220825"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SpalDesignSystem_6a1cb4 = window.SpalDesignSystem_6a1cb4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/SpalSymbol.jsx
try { (() => {
/**
 * The SPAL geometric symbol system — a proprietary set of abstract marks (never icons, mascots
 * or stock illustration) used across empty states, loading states, onboarding and section dividers.
 * This is the core of SPAL's recognizable visual signature.
 */
const paths = {
  profit: c => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "spal-sym-g"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: c,
    stopOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: c,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "26",
    fill: "url(#spal-sym-g)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "17",
    fill: "none",
    stroke: c,
    strokeWidth: "1.5",
    opacity: "0.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "8",
    fill: c
  })),
  flow: c => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "24",
    fill: "none",
    stroke: c,
    strokeWidth: "1.5",
    opacity: "0.3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "16",
    fill: "none",
    stroke: c,
    strokeWidth: "1.5",
    opacity: "0.55"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "6",
    r: "4",
    fill: c
  })),
  growth: c => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "34",
    width: "10",
    height: "14",
    rx: "2",
    fill: c,
    opacity: "0.45"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "23",
    y: "24",
    width: "10",
    height: "24",
    rx: "2",
    fill: c,
    opacity: "0.7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "38",
    y: "10",
    width: "10",
    height: "38",
    rx: "2",
    fill: c
  })),
  focus: c => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "6",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "14",
    fill: "none",
    stroke: c,
    strokeWidth: "1.5",
    opacity: "0.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "22",
    fill: "none",
    stroke: c,
    strokeWidth: "1.5",
    opacity: "0.25"
  })),
  consistency: c => /*#__PURE__*/React.createElement("g", {
    fill: c,
    opacity: "0.7"
  }, [10, 28, 46].map(x => [10, 28, 46].map(y => /*#__PURE__*/React.createElement("circle", {
    key: `${x}-${y}`,
    cx: x,
    cy: y,
    r: "3"
  })))),
  momentum: c => /*#__PURE__*/React.createElement("path", {
    d: "M6 40 L20 40 L28 16 L36 40 L50 40",
    fill: "none",
    stroke: c,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }),
  insight: c => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("g", {
    stroke: c,
    strokeWidth: "1.5",
    strokeLinecap: "round",
    opacity: "0.7"
  }, [[28, 6], [46, 14], [50, 28], [46, 42], [28, 50], [10, 42], [6, 28], [10, 14]].map(([x, y]) => /*#__PURE__*/React.createElement("line", {
    key: `${x}-${y}`,
    x1: "28",
    y1: "28",
    x2: x,
    y2: y
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "28",
    cy: "28",
    r: "5",
    fill: c
  })),
  cashflow: c => /*#__PURE__*/React.createElement("path", {
    d: "M4 30 Q 12 14 20 30 T 36 30 T 52 30",
    fill: "none",
    stroke: c,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  })
};
function SpalSymbol({
  symbol = "profit",
  color = "var(--spal-green)",
  size = 56,
  spin = false
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 56 56",
    style: spin ? {
      animation: "spal-sym-spin 8s linear infinite"
    } : undefined
  }, paths[symbol]?.(color), spin && /*#__PURE__*/React.createElement("style", null, `@keyframes spal-sym-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { SpalSymbol });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SpalSymbol.jsx", error: String((e && e.message) || e) }); }

// components/brand/SparkAvatar.jsx
try { (() => {
const {
  useState,
  useEffect
} = React;
/** Floating "Ask SPAL" orb — the mascot's only appearance in-product; a gentle continuous bob, no spring bounce. */
function SparkAvatar({
  onClick,
  src = "../../assets/brand/spal-ai-orb.webp"
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(t);
  }, []);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-label": "Ask SPAL",
    className: "spal-spark",
    style: {
      position: "fixed",
      zIndex: 40,
      right: 16,
      bottom: "calc(72px + env(safe-area-inset-bottom,0px) + 12px)",
      width: 72,
      height: 72,
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      filter: "drop-shadow(0 6px 18px rgba(34,197,94,0.45)) drop-shadow(0 3px 8px rgba(0,0,0,0.22))",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "scale(1)" : "scale(0.5)",
      transition: `opacity var(--duration-slow) var(--ease-delight), transform var(--duration-slow) var(--ease-delight)`
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "Ask SPAL",
    style: {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "contain"
    }
  }), /*#__PURE__*/React.createElement("style", null, `
        .spal-spark{animation:spal-spark-bob 3s ease-in-out 1s infinite}
        .spal-spark:active{transform:scale(0.88) !important}
        @keyframes spal-spark-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `));
}
Object.assign(__ds_scope, { SparkAvatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SparkAvatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const colors = {
  green: ["var(--green-100)", "var(--green-700)", "var(--spal-green)"],
  orange: ["var(--orange-100)", "var(--orange-700)", "var(--spal-orange)"],
  blue: ["var(--blue-100)", "var(--blue-600)", "var(--spal-blue)"],
  purple: ["var(--purple-100)", "var(--purple-600)", "var(--spal-purple)"],
  gray: ["var(--neutral-100)", "var(--neutral-600)", "var(--neutral-400)"],
  red: ["#FEE2E2", "#B91C1C", "#EF4444"]
};

/** Small status pill — category tags, states ("Owing", "Paid"), counts. */
function Badge({
  label,
  color = "gray",
  dot = false,
  size = "sm"
}) {
  const [bg, fg, dotColor] = colors[color];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: "var(--radius-full)",
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      padding: size === "sm" ? "3px 10px" : "5px 12px",
      fontSize: size === "sm" ? 11 : 13,
      background: bg,
      color: fg
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: dotColor,
      flexShrink: 0
    }
  }), label);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** SPAL primary button — solid fills only (no gradients), full pill radius, tactile 0.96 press. */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  disabled,
  children,
  style,
  className = "",
  ...props
}) {
  const variants = {
    primary: {
      background: "var(--spal-green)",
      color: "#fff",
      boxShadow: "var(--shadow-btn-primary)"
    },
    secondary: {
      background: "#fff",
      color: "var(--spal-navy)",
      border: "1px solid var(--neutral-200)",
      boxShadow: "var(--shadow-card)"
    },
    ghost: {
      background: "transparent",
      color: "var(--spal-navy)"
    },
    danger: {
      background: "#EF4444",
      color: "#fff",
      boxShadow: "0 2px 12px rgba(239,68,68,0.25)"
    }
  };
  const sizes = {
    sm: {
      height: 40,
      padding: "0 16px",
      fontSize: 13
    },
    md: {
      height: 48,
      padding: "0 24px",
      fontSize: 14
    },
    lg: {
      height: 56,
      padding: "0 32px",
      fontSize: 15
    }
  };
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `spal-btn ${className}`,
    disabled: isDisabled,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      borderRadius: "var(--radius-full)",
      border: "none",
      cursor: isDisabled ? "default" : "pointer",
      width: fullWidth ? "100%" : "auto",
      opacity: isDisabled ? 0.5 : 1,
      transition: `transform var(--duration-fast) var(--ease-flow)`,
      ...variants[variant],
      ...sizes[size],
      ...style
    }
  }, props), loading ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 6
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "spal-btn-dot",
    style: {
      animationDelay: `${i * 0.15}s`,
      background: "currentColor"
    }
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexShrink: 0
    }
  }, icon), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexShrink: 0
    }
  }, iconRight)), /*#__PURE__*/React.createElement("style", null, `
        .spal-btn:active:not(:disabled){transform:scale(var(--press-scale-btn))}
        .spal-btn-dot{width:6px;height:6px;border-radius:999px;display:inline-block;animation:spal-btn-pulse 1.1s infinite}
        @keyframes spal-btn-pulse{0%,100%{opacity:0.3}50%{opacity:1}}
      `));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Standard SPAL card — sparing use per DESIGN.md; prefer borderless sections when possible. */
function Card({
  accent = "none",
  padding = "md",
  elevated = false,
  children,
  style,
  className = "",
  ...props
}) {
  const accents = {
    green: "var(--spal-green)",
    blue: "var(--spal-blue)",
    orange: "var(--spal-orange)",
    purple: "var(--spal-purple)",
    none: "transparent"
  };
  const paddings = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      background: "var(--surface-card)",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--neutral-200)",
      borderTop: accent !== "none" ? `2px solid ${accents[accent]}` : "1px solid var(--neutral-200)",
      boxShadow: elevated ? "var(--shadow-card-elevated)" : "var(--shadow-card)",
      padding: paddings[padding],
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Text field — label, hint/error, prefix (currency symbol), suffix slot, `large` mode for hero numeric entry. */
function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  large = false,
  style,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontFamily: "var(--font-body)"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#fff",
      borderRadius: "var(--radius-sm)",
      border: `1.5px solid ${error ? "#F87171" : focused ? "var(--spal-blue)" : "var(--neutral-200)"}`,
      height: large ? 64 : 48,
      padding: "0 16px",
      boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
      transition: `border-color var(--duration-base) var(--ease-flow), box-shadow var(--duration-base) var(--ease-flow)`,
      ...style
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--spal-navy)",
      fontSize: large ? 24 : 16,
      flexShrink: 0
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    style: {
      flex: 1,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--spal-navy)",
      fontSize: large ? 24 : 14,
      fontWeight: large ? 700 : 400
    },
    onFocus: e => {
      setFocused(true);
      props.onFocus?.(e);
    },
    onBlur: e => {
      setFocused(false);
      props.onBlur?.(e);
    }
  }, props)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      color: "var(--neutral-400)"
    }
  }, suffix)), error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: 500,
      margin: 0
    }
  }, error), hint && !error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--neutral-400)",
      margin: 0
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/PillChip.jsx
try { (() => {
const colors = {
  green: {
    base: ["var(--green-50)", "var(--green-700)", "var(--green-200)"],
    selected: "var(--spal-green)"
  },
  blue: {
    base: ["var(--blue-50)", "var(--blue-600)", "var(--blue-100)"],
    selected: "var(--spal-blue)"
  },
  orange: {
    base: ["var(--orange-50)", "var(--orange-600)", "var(--orange-100)"],
    selected: "var(--spal-orange)"
  },
  purple: {
    base: ["var(--purple-50)", "var(--purple-600)", "var(--purple-100)"],
    selected: "var(--spal-purple)"
  },
  gray: {
    base: ["var(--neutral-100)", "var(--neutral-600)", "var(--neutral-200)"],
    selected: "var(--neutral-700)"
  }
};

/** Pill toggle — category filters, segmented choices. */
function PillChip({
  label,
  icon,
  color = "gray",
  selected = false,
  size = "md",
  onClick
}) {
  const c = colors[color];
  const [bg, fg, border] = c.base;
  return /*#__PURE__*/React.createElement("button", {
    className: "spal-pillchip",
    onClick: onClick,
    "aria-pressed": selected,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: size === "sm" ? 6 : 8,
      borderRadius: "var(--radius-full)",
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      cursor: "pointer",
      border: `1px solid ${selected ? c.selected : border}`,
      background: selected ? c.selected : bg,
      color: selected ? "#fff" : fg,
      height: size === "sm" ? 36 : 48,
      padding: size === "sm" ? "0 12px" : "0 16px",
      fontSize: size === "sm" ? 12 : 14,
      transition: `transform var(--duration-fast) var(--ease-flow), background var(--duration-base) var(--ease-flow)`
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex"
    }
  }, icon), label, /*#__PURE__*/React.createElement("style", null, `.spal-pillchip:active{transform:scale(var(--press-scale-btn))}`));
}
Object.assign(__ds_scope, { PillChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PillChip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/InsightCard.jsx
try { (() => {
const variants = {
  default: {
    bg: "#fff",
    border: "1px solid var(--neutral-200)",
    titleColor: "var(--spal-navy)",
    bodyColor: "var(--neutral-500)"
  },
  celebration: {
    bg: "linear-gradient(135deg, var(--spal-green), var(--green-600))",
    border: "none",
    titleColor: "#fff",
    bodyColor: "rgba(255,255,255,0.85)"
  },
  warning: {
    bg: "linear-gradient(135deg, var(--orange-50), #FFF3E8)",
    border: "1px solid var(--orange-100)",
    titleColor: "var(--orange-600)",
    bodyColor: "var(--neutral-600)"
  },
  tip: {
    bg: "linear-gradient(135deg, var(--blue-50), var(--purple-50))",
    border: "1px solid var(--blue-100)",
    titleColor: "var(--blue-600)",
    bodyColor: "var(--neutral-600)"
  }
};

/** Inline insight banner — daily nudges, tips, celebrations. Optional trailing metric. */
function InsightCard({
  title,
  message,
  variant = "default",
  icon,
  metric,
  metricLabel,
  positive
}) {
  const v = variants[variant];
  const metricColor = variant === "celebration" ? "#fff" : positive === true ? "var(--spal-green)" : positive === false ? "var(--spal-orange)" : "var(--spal-navy)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      padding: 16,
      background: v.bg,
      border: v.border
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 2
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 14,
      color: v.titleColor
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      fontSize: 12,
      lineHeight: 1.5,
      color: v.bodyColor
    }
  }, message)), metric && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 20,
      color: metricColor
    }
  }, metric), metricLabel && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 11,
      color: v.bodyColor
    }
  }, metricLabel))));
}
Object.assign(__ds_scope, { InsightCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/InsightCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
/** Shimmering placeholder — SPAL's loading state is always skeleton screens matching the real content shape, never spinners. */
function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg,var(--neutral-100) 25%,#ECECED 50%,var(--neutral-100) 75%)",
      backgroundSize: "200% auto",
      animation: "spal-shimmer 1.4s linear infinite",
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes spal-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`));
}
function SkeletonRow() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#fff",
      borderRadius: "var(--radius-md)",
      padding: "14px",
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    width: 44,
    height: 44,
    radius: 999
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    width: "60%",
    height: 12
  }), /*#__PURE__*/React.createElement(Skeleton, {
    width: "30%",
    height: 10
  })), /*#__PURE__*/React.createElement(Skeleton, {
    width: 48,
    height: 12
  }));
}
Object.assign(__ds_scope, { Skeleton, SkeletonRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/UndoToast.jsx
try { (() => {
const {
  useEffect,
  useRef
} = React;
/** Bottom-anchored undo toast with a live countdown bar — the only "destructive action" feedback pattern in SPAL. */
function UndoToast({
  message,
  onUndo,
  onExpire,
  duration = 10000
}) {
  const expiredRef = useRef(false);
  useEffect(() => {
    expiredRef.current = false;
    const t = setTimeout(() => {
      expiredRef.current = true;
      onExpire?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onExpire]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: 16,
      right: 16,
      bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
      zIndex: 150
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 16px",
      borderRadius: "var(--radius-md)",
      background: "#1E293B",
      boxShadow: "var(--shadow-toast)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 999,
      background: "rgba(239,68,68,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: "#F87171",
      fontSize: 14
    }
  }, "\u2715"), /*#__PURE__*/React.createElement("p", {
    style: {
      flex: 1,
      margin: 0,
      fontSize: 13,
      fontWeight: 500,
      color: "#fff",
      fontFamily: "var(--font-display)"
    }
  }, message), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!expiredRef.current) onUndo?.();
    },
    style: {
      background: "none",
      border: "none",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--spal-green)",
      fontFamily: "var(--font-display)",
      cursor: "pointer"
    }
  }, "Undo")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      height: 3,
      borderRadius: 999,
      background: "var(--spal-green)",
      opacity: 0.6,
      transformOrigin: "left",
      animation: `spal-undo-shrink ${duration}ms linear forwards`
    }
  }), /*#__PURE__*/React.createElement("style", null, `@keyframes spal-undo-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}`));
}
Object.assign(__ds_scope, { UndoToast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/UndoToast.jsx", error: String((e && e.message) || e) }); }

// components/gamification/WeeklyChallengeCard.jsx
try { (() => {
const {
  useEffect,
  useState
} = React;
/** Weekly challenge progress card — gamification nudge shown on Home. */
function WeeklyChallengeCard({
  label,
  current,
  target,
  completed = false
}) {
  const pct = Math.min(Math.round(current / target * 100), 100);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      padding: 16,
      background: completed ? "var(--green-50)" : "#fff",
      border: `1px solid ${completed ? "var(--green-100)" : "var(--neutral-100)"}`,
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--spal-purple)",
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    }
  }, "Weekly Challenge")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 600,
      color: "var(--spal-navy)",
      lineHeight: 1.35
    }
  }, label)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      color: completed ? "var(--spal-green)" : "var(--spal-navy)",
      flexShrink: 0
    }
  }, current, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 400,
      color: "var(--neutral-400)"
    }
  }, "/", target))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      height: 8,
      borderRadius: 999,
      background: "var(--neutral-100)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct}%`,
      borderRadius: 999,
      background: completed ? "var(--spal-green)" : "var(--spal-purple)",
      transition: `width var(--duration-slow) var(--ease-flow)`
    }
  })), completed && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--green-700)"
    }
  }, "You completed this week's challenge!"));
}
Object.assign(__ds_scope, { WeeklyChallengeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/gamification/WeeklyChallengeCard.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
const tabs = [{
  key: "home",
  label: "Home"
}, {
  key: "records",
  label: "Records"
}, {
  key: "insights",
  label: "Insights"
}, {
  key: "profile",
  label: "Profile"
}];

/** Frosted-glass bottom tab bar — used on inner/detail screens (Home/Records/Insights use TopNavPills instead). */
function BottomNav({
  active = "home",
  onChange
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: "var(--shell-max-w)",
      background: "rgba(255,255,255,0.88)",
      borderTop: "1px solid rgba(228,228,231,0.5)",
      backdropFilter: "saturate(180%) blur(20px)",
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "8px 8px calc(env(safe-area-inset-bottom,0px) + 8px)"
    }
  }, tabs.map(t => {
    const isActive = t.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      onClick: () => onChange?.(t.key),
      style: {
        background: "none",
        border: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        minWidth: 52,
        minHeight: 48,
        justifyContent: "center",
        position: "relative",
        cursor: "pointer"
      }
    }, isActive && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 20,
        height: 2,
        borderRadius: 999,
        background: "var(--spal-green)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 21,
        height: 21,
        borderRadius: 6,
        background: isActive ? "var(--spal-navy)" : "var(--neutral-300)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 600,
        fontFamily: "var(--font-display)",
        color: isActive ? "var(--spal-navy)" : "var(--neutral-400)"
      }
    }, t.label));
  })));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/QuickMenuFab.jsx
try { (() => {
const {
  useState,
  useRef,
  useEffect
} = React;
const items = [{
  key: "sale",
  label: "Record Sale",
  bg: "var(--green-50)",
  fg: "var(--green-600)"
}, {
  key: "expense",
  label: "Record Expense",
  bg: "var(--orange-50)",
  fg: "var(--orange-600)"
}, {
  key: "ask",
  label: "Chat with SPAL",
  bg: "var(--purple-50)",
  fg: "var(--spal-purple)"
}, {
  key: "goals",
  label: "Set your goals",
  bg: "var(--green-100)",
  fg: "var(--green-600)"
}, {
  key: "inventory",
  label: "Manage inventory",
  bg: "var(--blue-50)",
  fg: "var(--spal-blue)"
}];

/** Floating quick-action menu — the app's primary entry point (bottom nav was removed in favor of this). */
function QuickMenuFab({
  onSelect
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: "fixed",
      zIndex: 50,
      right: 16,
      bottom: "calc(env(safe-area-inset-bottom,0px) + 24px)"
    }
  }, open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 60,
      right: 0,
      background: "#fff",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      boxShadow: "var(--shadow-menu)",
      minWidth: 190
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("button", {
    key: it.key,
    onClick: () => {
      setOpen(false);
      onSelect?.(it.key);
    },
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 16px",
      background: "none",
      border: "none",
      borderBottom: i < items.length - 1 ? "1px solid var(--neutral-50)" : "none",
      textAlign: "left",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      background: it.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: it.fg
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)"
    }
  }, it.label)))), /*#__PURE__*/React.createElement("button", {
    className: "spal-fab",
    onClick: () => setOpen(o => !o),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 48,
      padding: "0 20px",
      borderRadius: "var(--radius-full)",
      border: "none",
      cursor: "pointer",
      background: "var(--spal-green)",
      color: "#fff",
      fontWeight: 700,
      fontSize: 13,
      fontFamily: "var(--font-display)",
      boxShadow: "var(--shadow-fab)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      lineHeight: 1
    }
  }, "\u2630"), " Quick Menu"), /*#__PURE__*/React.createElement("style", null, `.spal-fab:active{transform:scale(0.95)}`));
}
Object.assign(__ds_scope, { QuickMenuFab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/QuickMenuFab.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNavPills.jsx
try { (() => {
const tabs = [{
  key: "home",
  label: "Home"
}, {
  key: "records",
  label: "Records"
}, {
  key: "insights",
  label: "Insights"
}];

/** Top segmented pill row — the primary navigation on Home/Records/Insights (intentional addition: factored from a pattern repeated inline on 3 screens). */
function TopNavPills({
  active = "home",
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, tabs.map(t => {
    const isActive = t.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      onClick: () => onChange?.(t.key),
      style: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 40,
        borderRadius: "var(--radius-full)",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: 13,
        background: isActive ? "var(--spal-green)" : "#fff",
        color: isActive ? "#fff" : "var(--neutral-500)",
        boxShadow: isActive ? "var(--shadow-btn-primary)" : "var(--shadow-card)",
        transition: `transform var(--duration-fast) var(--ease-flow)`
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { TopNavPills });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNavPills.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/AddRecordSheet.jsx
try { (() => {
const {
  useState,
  useEffect
} = React;
const SALE_CATS = ["Food", "Drinks", "Breakfast", "Lunch", "Dinner"];
const EXPENSE_CATS = ["Transport", "Groceries", "Utilities", "Rent", "Marketing"];

/** Add Sale / Add Expense bottom sheet — the app's core data-entry surface. Drag handle, big amount field, category pills, paid/owing toggle. */
function AddRecordSheet({
  type,
  open,
  onClose
}) {
  const {
    Button,
    PillChip
  } = window.SpalDesignSystem_6a1cb4;
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("paid");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (open) {
      setAmount("");
      setDesc("");
      setCat("");
      setStatus("paid");
      setSaved(false);
    }
  }, [open, type]);
  if (!open) return null;
  const cats = type === "sale" ? SALE_CATS : EXPENSE_CATS;
  const accent = type === "sale" ? "var(--spal-green)" : "var(--spal-orange)";
  function save() {
    setSaved(true);
    setTimeout(onClose, 900);
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--backdrop-sheet)",
      zIndex: 55,
      animation: "spal-fade 0.2s ease"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 60,
      background: "#fff",
      borderRadius: "var(--radius-2xl) var(--radius-2xl) 0 0",
      boxShadow: "var(--shadow-sheet)",
      maxHeight: "88%",
      display: "flex",
      flexDirection: "column",
      animation: "spal-sheet-up 0.32s var(--ease-out-soft)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      padding: "12px 0 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 999,
      background: "var(--neutral-200)"
    }
  })), saved ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "48px 20px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 999,
      background: "var(--spal-green)",
      color: "#fff",
      fontSize: 26,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 16px"
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 700,
      fontSize: 18,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)"
    }
  }, "Nice one!")) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 20px 32px",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 17,
      fontWeight: 700,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)",
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 999,
      background: type === "sale" ? "var(--green-50)" : "var(--orange-50)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: accent,
      fontSize: 13
    }
  }, type === "sale" ? "↑" : "↓"), "Add ", type === "sale" ? "Sale" : "Expense"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      background: "var(--neutral-100)",
      border: "none",
      color: "var(--neutral-500)",
      cursor: "pointer"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--neutral-400)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 8
    }
  }, "How much?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 64,
      padding: "0 16px",
      background: "var(--neutral-50)",
      borderRadius: "var(--radius-md)",
      border: "2px solid var(--neutral-100)",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: "var(--neutral-300)"
    }
  }, "\u20A6"), /*#__PURE__*/React.createElement("input", {
    value: amount,
    onChange: e => setAmount(e.target.value),
    placeholder: "0",
    inputMode: "decimal",
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontSize: 28,
      fontWeight: 700,
      color: "var(--spal-navy)"
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--neutral-400)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 8
    }
  }, "What was this for? ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--neutral-300)"
    }
  }, "(optional)")), /*#__PURE__*/React.createElement("input", {
    value: desc,
    onChange: e => setDesc(e.target.value),
    placeholder: type === "sale" ? "e.g. Suya, Drinks, Rice…" : "e.g. Fuel, Stock, Salary…",
    style: {
      width: "100%",
      height: 48,
      padding: "0 16px",
      background: "var(--neutral-50)",
      borderRadius: "var(--radius-md)",
      border: "2px solid var(--neutral-100)",
      fontSize: 14,
      color: "var(--spal-navy)",
      marginBottom: 18,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--neutral-400)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 8
    }
  }, "Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 18
    }
  }, cats.map(c => /*#__PURE__*/React.createElement(PillChip, {
    key: c,
    label: c,
    size: "sm",
    color: type === "sale" ? "green" : "orange",
    selected: cat === c,
    onClick: () => setCat(cat === c ? "" : c)
  }))), type === "sale" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--neutral-400)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: 8
    }
  }, "Did they pay?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 20
    }
  }, ["paid", "owing"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setStatus(s),
    style: {
      flex: 1,
      height: 40,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
      background: status === s ? s === "paid" ? "var(--spal-green)" : "var(--spal-orange)" : "var(--neutral-100)",
      color: status === s ? "#fff" : "var(--neutral-500)"
    }
  }, s === "paid" ? "Paid now" : "Owes me")))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    disabled: !amount,
    onClick: save
  }, "Save ", type === "sale" ? "Sale" : "Expense"))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes spal-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spal-fade{from{opacity:0}to{opacity:1}}
      `));
}
window.AddRecordSheet = AddRecordSheet;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/AddRecordSheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/AppShell.jsx
try { (() => {
const {
  useState
} = React;

/** Composes the full click-through app: onboarding → home → records, with the Add Sale/Expense sheet and quick menu wired up. */
function AppShell() {
  const {
    QuickMenuFab
  } = window.SpalDesignSystem_6a1cb4;
  const [screen, setScreen] = useState("welcome");
  const [sheet, setSheet] = useState(null);
  const Welcome = window.WelcomeScreen,
    Home = window.HomeScreen,
    Records = window.RecordsScreen,
    Sheet = window.AddRecordSheet;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--surface-canvas-dark)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 390,
      height: 780,
      maxHeight: "94vh",
      borderRadius: 36,
      overflow: "hidden",
      boxShadow: "var(--shadow-shell)",
      background: "var(--spal-bg)"
    }
  }, screen === "welcome" && /*#__PURE__*/React.createElement(Welcome, {
    onGetStarted: () => setScreen("home"),
    onLogin: () => setScreen("home")
  }), screen === "home" && /*#__PURE__*/React.createElement(Home, {
    onNavigate: setScreen,
    onOpenSheet: setSheet
  }), screen === "records" && /*#__PURE__*/React.createElement(Records, {
    onNavigate: setScreen,
    onOpenSheet: setSheet
  }), screen !== "welcome" && /*#__PURE__*/React.createElement(QuickMenuFab, {
    onSelect: k => {
      if (k === "sale" || k === "expense") setSheet(k);
    }
  }), /*#__PURE__*/React.createElement(Sheet, {
    type: sheet,
    open: !!sheet,
    onClose: () => setSheet(null)
  })));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(AppShell, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/HomeScreen.jsx
try { (() => {
const RECORDS = [{
  id: 1,
  type: "sale",
  desc: "Suya, Drinks",
  cat: "Food",
  time: "2:45 PM",
  amount: 4500
}, {
  id: 2,
  type: "expense",
  desc: "Fuel",
  cat: "Transport",
  time: "1:10 PM",
  amount: 3000
}, {
  id: 3,
  type: "sale",
  desc: "Rice & Stew",
  cat: "Lunch",
  time: "12:30 PM",
  amount: 8200
}];
function RecordRow({
  r
}) {
  const {
    Badge
  } = window.SpalDesignSystem_6a1cb4;
  const isSale = r.type === "sale";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#fff",
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      flexShrink: 0,
      background: isSale ? "var(--green-50)" : "var(--orange-50)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: isSale ? "var(--green-600)" : "var(--orange-600)",
      fontWeight: 700
    }
  }, isSale ? "↑" : "↓"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, r.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    label: r.cat,
    color: isSale ? "green" : "orange"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--neutral-400)"
    }
  }, r.time))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      fontWeight: 700,
      color: isSale ? "var(--green-600)" : "var(--orange-600)",
      flexShrink: 0,
      fontFamily: "var(--font-display)"
    }
  }, isSale ? "+" : "–", "\u20A6", r.amount.toLocaleString()));
}

/** Home — the personalized daily dashboard: profit hero, sale/expense split, owed banner, recent activity. */
function HomeScreen({
  onNavigate,
  onOpenSheet
}) {
  const {
    TopNavPills
  } = window.SpalDesignSystem_6a1cb4;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      overflowY: "auto",
      background: "var(--spal-bg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "48px 20px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--neutral-400)",
      fontFamily: "var(--font-display)"
    }
  }, "Good afternoon"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "2px 0 0",
      fontSize: 24,
      fontWeight: 700,
      color: "var(--spal-navy)",
      letterSpacing: "-0.02em"
    }
  }, "Ada's Kitchen")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      background: "#fff",
      border: "none",
      boxShadow: "var(--shadow-avatar)",
      cursor: "pointer"
    }
  }, "\uD83D\uDD14"), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      background: "var(--spal-green)",
      border: "none",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "A"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(TopNavPills, {
    active: "home",
    onChange: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 20px 0"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 12px",
      fontSize: 16,
      fontWeight: 700,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)"
    }
  }, "Your Sales Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-lg)",
      padding: 20,
      marginBottom: 10,
      background: "var(--vivid-profit)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 13,
      fontFamily: "var(--font-display)"
    }
  }, "Profit"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(255,255,255,0.22)",
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      padding: "4px 9px",
      borderRadius: 999
    }
  }, "\u2191 18%")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "#fff",
      fontWeight: 800,
      fontSize: "clamp(32px,9vw,42px)",
      letterSpacing: "-0.02em",
      fontFamily: "var(--font-display)"
    }
  }, "\u20A648,200")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenSheet("sale"),
    style: {
      textAlign: "left",
      border: "none",
      cursor: "pointer",
      borderRadius: "var(--radius-lg)",
      padding: 16,
      background: "var(--vivid-sale)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 12,
      fontFamily: "var(--font-display)"
    }
  }, "Sale"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(255,255,255,0.22)",
      color: "#fff",
      fontSize: 10,
      fontWeight: 700,
      padding: "3px 7px",
      borderRadius: 999
    }
  }, "\u2191 9%")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "#fff",
      fontWeight: 800,
      fontSize: "clamp(16px,5.5vw,22px)",
      fontFamily: "var(--font-display)"
    }
  }, "\u20A662,000")), /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenSheet("expense"),
    style: {
      textAlign: "left",
      border: "none",
      cursor: "pointer",
      borderRadius: "var(--radius-lg)",
      padding: 16,
      background: "var(--vivid-expense)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 12,
      fontFamily: "var(--font-display)"
    }
  }, "Expense"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(255,80,80,0.28)",
      color: "#FFBBBB",
      fontSize: 10,
      fontWeight: 700,
      padding: "3px 7px",
      borderRadius: 999
    }
  }, "\u2193 4%")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "#fff",
      fontWeight: 800,
      fontSize: "clamp(16px,5.5vw,22px)",
      fontFamily: "var(--font-display)"
    }
  }, "\u20A613,800"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      borderRadius: "var(--radius-lg)",
      padding: 16,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "var(--surface-owed-bg)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12,
      fontWeight: 600,
      color: "var(--surface-owed-text-2)"
    }
  }, "Owed to you"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--surface-owed-text)",
      fontFamily: "var(--font-display)"
    }
  }, "\u20A66,500")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      padding: "5px 10px",
      borderRadius: 999,
      background: "rgba(46,61,34,0.12)",
      color: "var(--surface-owed-text)"
    }
  }, "Not yet paid"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "28px 20px 120px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 700,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)"
    }
  }, "Recent Sales"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate("records"),
    style: {
      background: "none",
      border: "none",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--neutral-400)",
      cursor: "pointer"
    }
  }, "View all")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, RECORDS.map(r => /*#__PURE__*/React.createElement(RecordRow, {
    key: r.id,
    r: r
  })))));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/RecordsScreen.jsx
try { (() => {
const {
  useState
} = React;
const TODAY = [{
  id: 1,
  type: "sale",
  desc: "Suya, Drinks",
  cat: "Food",
  time: "2:45 PM",
  amount: 4500,
  owing: false
}, {
  id: 2,
  type: "expense",
  desc: "Fuel",
  cat: "Transport",
  time: "1:10 PM",
  amount: 3000,
  owing: false
}, {
  id: 3,
  type: "sale",
  desc: "Rice & Stew",
  cat: "Lunch",
  time: "12:30 PM",
  amount: 8200,
  owing: true,
  customer: "Mama Ngozi"
}];
const YESTERDAY = [{
  id: 4,
  type: "sale",
  desc: "Drinks",
  cat: "Drinks",
  time: "6:20 PM",
  amount: 2200,
  owing: false
}, {
  id: 5,
  type: "expense",
  desc: "Stock",
  cat: "Groceries",
  time: "9:00 AM",
  amount: 12000,
  owing: false
}];
function Row({
  r
}) {
  const {
    Badge
  } = window.SpalDesignSystem_6a1cb4;
  const isSale = r.type === "sale";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#fff",
      borderRadius: "var(--radius-md)",
      padding: "14px",
      boxShadow: "var(--shadow-card)",
      border: r.owing ? "1px solid #FED7AA" : "1px solid transparent"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      flexShrink: 0,
      background: isSale ? "var(--green-50)" : "var(--orange-50)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: isSale ? "var(--green-600)" : "var(--orange-600)",
      fontWeight: 700
    }
  }, isSale ? "↑" : "↓"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--spal-navy)",
      fontFamily: "var(--font-display)"
    }
  }, r.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      flexWrap: "wrap"
    }
  }, r.owing && /*#__PURE__*/React.createElement(Badge, {
    label: "Owing",
    color: "orange"
  }), /*#__PURE__*/React.createElement(Badge, {
    label: r.cat,
    color: isSale ? "green" : "orange"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--neutral-400)"
    }
  }, r.time))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      fontWeight: 700,
      color: isSale ? "var(--green-600)" : "var(--orange-600)",
      fontFamily: "var(--font-display)"
    }
  }, isSale ? "+" : "–", "\u20A6", r.amount.toLocaleString()), r.customer && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: 10,
      color: "var(--neutral-400)"
    }
  }, r.customer)));
}

/** Records — filterable, date-grouped ledger with an owing banner and per-line payment status. */
function RecordsScreen({
  onNavigate,
  onOpenSheet
}) {
  const {
    TopNavPills
  } = window.SpalDesignSystem_6a1cb4;
  const [filter, setFilter] = useState("all");
  const filterFn = r => filter === "all" || (filter === "owing" ? r.owing : r.type === filter);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      overflowY: "auto",
      background: "var(--spal-bg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "48px 20px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--neutral-400)",
      fontFamily: "var(--font-display)"
    }
  }, "Good afternoon"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "2px 0 0",
      fontSize: 24,
      fontWeight: 700,
      color: "var(--spal-navy)",
      letterSpacing: "-0.02em"
    }
  }, "Ada's Kitchen")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      background: "#fff",
      border: "none",
      boxShadow: "var(--shadow-avatar)",
      cursor: "pointer"
    }
  }, "\uD83D\uDD14"), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      background: "var(--spal-green)",
      border: "none",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "A"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(TopNavPills, {
    active: "records",
    onChange: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 20px 0",
      display: "flex",
      gap: 8
    }
  }, ["all", "sale", "expense", "owing"].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setFilter(f),
    style: {
      height: 36,
      padding: "0 14px",
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 12.5,
      background: filter === f ? "var(--spal-navy)" : "#fff",
      color: filter === f ? "#fff" : "var(--neutral-600)",
      boxShadow: "var(--shadow-card)",
      textTransform: "capitalize"
    }
  }, f))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilter("owing"),
    style: {
      margin: "16px 20px 0",
      display: "block",
      width: "calc(100% - 40px)",
      textAlign: "left",
      border: "1px solid var(--surface-owed-border)",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-owed-bg)",
      padding: "12px 16px",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      fontWeight: 700,
      color: "var(--surface-owed-text)"
    }
  }, "\u20A68,200 owed to you"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: 11,
      color: "var(--surface-owed-text-2)"
    }
  }, "Mama Ngozi hasn't paid yet")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 20px 120px",
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, [["Today", TODAY], ["Yesterday", YESTERDAY]].map(([label, list]) => {
    const rows = list.filter(filterFn);
    if (!rows.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: label
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "0 0 12px",
        fontSize: 15,
        fontWeight: 700,
        color: "var(--spal-navy)",
        fontFamily: "var(--font-display)"
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, rows.map(r => /*#__PURE__*/React.createElement(Row, {
      key: r.id,
      r: r
    }))));
  })));
}
window.RecordsScreen = RecordsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/RecordsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/WelcomeScreen.jsx
try { (() => {
const {
  useEffect,
  useState
} = React;

/** Onboarding splash — cinematic, dark canvas, wordmark, floating preview cards, single CTA. */
function WelcomeScreen({
  onGetStarted,
  onLogin
}) {
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1400);
    return () => clearTimeout(t);
  }, []);
  const {
    SpalSymbol
  } = window.SpalDesignSystem_6a1cb4;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      position: "relative",
      overflow: "hidden",
      background: "var(--spal-navy)",
      backgroundImage: "url(../../assets/backgrounds/splash-background.webp)",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }
  }, splash ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--spal-navy)",
      transition: "opacity 0.5s ease"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/spal-wordmark.webp",
    alt: "SPAL",
    style: {
      width: 170,
      height: "auto",
      opacity: 0.96
    }
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      opacity: splash ? 0 : 1,
      transition: "opacity 0.4s var(--ease-out-soft)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 48,
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/spal-wordmark.webp",
    alt: "SPAL",
    style: {
      width: 100,
      height: "auto"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      maxWidth: 300,
      aspectRatio: "4/3.6"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "4%",
      left: "2%",
      width: "66%",
      filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.32))"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/addsales-getstarted.webp",
    alt: "",
    style: {
      width: "100%",
      display: "block",
      borderRadius: 18
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: "68%",
      filter: "drop-shadow(0 20px 44px rgba(0,0,0,0.36))"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/illustrations/addexpense-getstarted.webp",
    alt: "",
    style: {
      width: "100%",
      display: "block",
      borderRadius: 18
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 24px 40px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: "#fff",
      textAlign: "center",
      fontSize: "clamp(24px,6.5vw,30px)",
      letterSpacing: "-0.02em",
      marginBottom: 8,
      fontFamily: "var(--font-display)",
      fontWeight: 700
    }
  }, "Your Business Finance", /*#__PURE__*/React.createElement("br", null), "Made Easy"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      color: "rgba(255,255,255,0.55)",
      fontSize: 14,
      lineHeight: 1.55,
      marginBottom: 28
    }
  }, "Track your sales, know your profit and grow.", /*#__PURE__*/React.createElement("br", null), "No accounting knowledge needed"), /*#__PURE__*/React.createElement("button", {
    onClick: onGetStarted,
    className: "spal-cta",
    style: {
      width: "100%",
      height: 58,
      borderRadius: 999,
      display: "flex",
      alignItems: "center",
      background: "var(--spal-green)",
      boxShadow: "var(--shadow-fab)",
      border: "none",
      cursor: "pointer",
      paddingLeft: 6,
      paddingRight: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 999,
      background: "rgba(255,255,255,0.22)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: "#fff",
      fontSize: 18
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "center",
      color: "#fff",
      fontWeight: 700,
      fontSize: 15,
      fontFamily: "var(--font-display)"
    }
  }, "Get Started")), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    style: {
      width: "100%",
      marginTop: 16,
      background: "none",
      border: "none",
      textAlign: "center",
      fontSize: 13,
      color: "rgba(255,255,255,0.55)",
      cursor: "pointer"
    }
  }, "Already have an account? ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontWeight: 700
    }
  }, "Login"))), /*#__PURE__*/React.createElement("style", null, `.spal-cta:active{transform:scale(0.98)}`)));
}
window.WelcomeScreen = WelcomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/WelcomeScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.SpalSymbol = __ds_scope.SpalSymbol;

__ds_ns.SparkAvatar = __ds_scope.SparkAvatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.PillChip = __ds_scope.PillChip;

__ds_ns.InsightCard = __ds_scope.InsightCard;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.SkeletonRow = __ds_scope.SkeletonRow;

__ds_ns.UndoToast = __ds_scope.UndoToast;

__ds_ns.WeeklyChallengeCard = __ds_scope.WeeklyChallengeCard;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.QuickMenuFab = __ds_scope.QuickMenuFab;

__ds_ns.TopNavPills = __ds_scope.TopNavPills;

})();
