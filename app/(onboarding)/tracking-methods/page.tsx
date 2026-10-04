"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useSPALStore, type TrackingMethod } from "@/store";

const METHODS: {
  method: TrackingMethod;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  exclusive?: boolean;
}[] = [
  {
    method: "notebook",
    label: "Notebook",
    sub: "You write records in a physical notebook",
    icon: <NotebookIcon />,
    accent: "#22C55E",
  },
  {
    method: "whatsapp",
    label: "WhatsApp",
    sub: "You message yourself or save notes on WhatsApp",
    icon: <WhatsAppIcon />,
    accent: "#F97316",
  },
  {
    method: "excel",
    label: "Microsoft Excel",
    sub: "You track your records in a spreadsheet",
    icon: <ExcelIcon />,
    accent: "#8B5CF6",
  },
  {
    method: "google_sheets",
    label: "Google Sheets",
    sub: "You use Google Sheets to track your business",
    icon: <SheetsIcon />,
    accent: "#2563EB",
  },
  {
    method: "notes_app",
    label: "Notes App",
    sub: "You use a notes app on your phone",
    icon: <NotesAppIcon />,
    accent: "#22C55E",
  },
  {
    method: "receipts",
    label: "Receipts",
    sub: "You keep paper receipts or photos of them",
    icon: <ReceiptsIcon />,
    accent: "#F97316",
  },
  {
    method: "nothing",
    label: "I don't track anything",
    sub: "No system yet. SPAL will help you start.",
    icon: <NothingIcon />,
    accent: "#A1A1AA",
    exclusive: true,
  },
];

export default function TrackingMethodsPage() {
  const router = useRouter();
  const { setOnboardingData } = useSPALStore();
  const [selected, setSelected] = useState<Set<TrackingMethod>>(new Set());

  function toggle(method: TrackingMethod, exclusive?: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
      } else {
        if (exclusive) {
          // "I don't track anything" clears everything else
          return new Set([method]);
        }
        // Deselect exclusive option if another is chosen
        next.delete("nothing");
        next.add(method);
      }
      return next;
    });
  }

  function handleContinue() {
    setOnboardingData({ trackingMethods: Array.from(selected) });
    router.push("/onboard-goals");
  }

  const nothingSelected = selected.has("nothing");

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#EEF3E9" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "rgba(15,23,42,0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft01Icon size={18} />
          </button>
          <div className="flex-1"><OnboardProgress step={2} total={7} /></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mt-7"
        >
          <p
            className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2"
            style={{ fontFamily: "var(--font-satoshi)" }}
          >
            Step 2 of 7
          </p>
          <h1
            className="text-spal-navy font-bold leading-[1.1]"
            style={{ fontSize: "clamp(28px, 8vw, 34px)", fontFamily: "var(--font-satoshi)", letterSpacing: "-0.025em" }}
          >
            How do you currently<br />track your business?
          </h1>
          <p className="mt-2 text-neutral-400 text-[13px]" style={{ fontFamily: "var(--font-satoshi)" }}>
            You can select multiple options
          </p>
        </motion.div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-container px-5 pt-6 pb-44">
        <div className="space-y-2.5">
          {METHODS.map((item, i) => {
            const isSelected = selected.has(item.method);
            const isDisabled = nothingSelected && !item.exclusive;
            return (
              <motion.button
                key={item.method}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 + 0.12, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => !isDisabled && toggle(item.method, item.exclusive)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
                style={{
                  border: isSelected ? `1.5px solid ${item.accent}` : "1.5px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${item.accent}18, 0 2px 8px rgba(0,0,0,0.06)`
                    : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
                  opacity: isDisabled ? 0.38 : 1,
                  transform: "scale(1)",
                  ...(isDisabled ? {} : { cursor: "pointer" }),
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.accent}12`, color: item.accent }}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {item.label}
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>
                    {item.sub}
                  </p>
                </div>

                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150"
                  style={{
                    border: isSelected ? `2px solid ${item.accent}` : "2px solid #D4D4D8",
                    background: isSelected ? item.accent : "transparent",
                  }}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-16"
        style={{ background: "linear-gradient(to top, #EEF3E9 60%, transparent)" }}
      >
        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="w-full h-14 rounded-full font-bold text-[15px] transition-all duration-200"
          style={{
            fontFamily: "var(--font-satoshi)",
            background: selected.size > 0 ? "#22C55E" : "#E4E4E7",
            color: selected.size > 0 ? "#fff" : "#A1A1AA",
          }}
        >
          Continue{selected.size > 0 && !nothingSelected ? ` (${selected.size} selected)` : ""}
        </button>
        <button
          onClick={() => { setOnboardingData({ trackingMethods: [] }); router.push("/onboard-goals"); }}
          className="w-full mt-3 text-center text-[13px] text-neutral-400 py-1"
          style={{ fontFamily: "var(--font-satoshi)" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function OnboardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-400"
          style={{ background: i < step ? "#22C55E" : "#E4E4E7" }}
        />
      ))}
    </div>
  );
}

function NotebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="15" y2="7" />
      <line x1="8" y1="11" x2="15" y2="11" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ExcelIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}

function SheetsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}

function NotesAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function ReceiptsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function NothingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
