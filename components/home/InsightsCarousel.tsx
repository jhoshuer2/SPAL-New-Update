"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert01Icon, Idea01Icon, ArrowRight01Icon, ChartIncreaseIcon } from "hugeicons-react";

const FF = "var(--font-satoshi)";

export type InsightTone = "warning" | "info" | "success";

export interface InsightItem {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const TONES: Record<InsightTone, { bg: string; iconBg: string; iconColor: string; Icon: typeof Alert01Icon }> = {
  warning: { bg: "#FEE0E1", iconBg: "#FDCED0", iconColor: "#DC2626", Icon: Alert01Icon },
  info:    { bg: "#EAF0FC", iconBg: "#D7E4FA", iconColor: "#2563EB", Icon: Idea01Icon },
  success: { bg: "#E7F6EC", iconBg: "#CDEDD8", iconColor: "#16A34A", Icon: ChartIncreaseIcon },
};

/**
 * Home insights + news carousel. Fed a dynamic list of insight cards
 * (computed from the business's own data or a news feed) and swiped with dots.
 */
export function InsightsCarousel({ items }: { items: InsightItem[] }) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (items.length === 0) return null;

  function onScroll() {
    const el = scrollerRef.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden -mx-5 px-5"
        style={{ scrollbarWidth: "none", gap: 12 }}
      >
        {items.map((it) => {
          const t = TONES[it.tone];
          return (
            <div key={it.id} className="snap-center shrink-0" style={{ width: "calc(100% - 0px)" }}>
              <div className="rounded-2xl px-4 py-4" style={{ background: t.bg }}>
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.iconBg }}>
                    <t.Icon size={18} color={t.iconColor} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15.5px] font-black text-spal-navy leading-snug" style={{ fontFamily: FF }}>{it.title}</p>
                    <p className="text-[13px] text-neutral-600 mt-1 leading-relaxed" style={{ fontFamily: FF }}>{it.body}</p>
                    {it.ctaLabel && (
                      <button
                        onClick={() => it.ctaHref && router.push(it.ctaHref)}
                        className="mt-3 inline-flex items-center gap-2 bg-white rounded-xl px-4 min-h-12 active:scale-[0.98] transition-transform"
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                      >
                        <span className="text-[13.5px] font-bold" style={{ fontFamily: FF, color: "#16A34A" }}>{it.ctaLabel}</span>
                        <ArrowRight01Icon size={15} color="#16A34A" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {items.map((_, i) => (
            <span key={i} className="rounded-full transition-all" style={{ width: i === active ? 18 : 7, height: 7, background: i === active ? "#22C55E" : "#CBD5C0" }} />
          ))}
        </div>
      )}
    </div>
  );
}
