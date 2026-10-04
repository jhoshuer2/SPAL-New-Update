"use client";
// C03 Quick add: capture anything in two taps. A bottom sheet of the things people add most.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const ITEMS = [
  { label: "Sale", hint: "Record money in", href: "/business/sales/new" },
  { label: "Expense", hint: "Record money out", href: "/business/expenses/new" },
  { label: "Moment", hint: "A win, lesson or hard day", href: "/journey/moment/new" },
  { label: "Milestone done", hint: "Tick something off", href: "/journey" },
  { label: "Goal", hint: "Set or check a goal", href: "/goals" },
  { label: "Ask Spal", hint: "Get a quick answer", href: "/ask" },
] as const;

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div data-testid="screen-C03" className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Quick add">
          <motion.div className="absolute inset-0 bg-spal-navy/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(var(--sab)+20px)]"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" aria-hidden />
            <h2 style={{ fontFamily: "var(--font-satoshi)" }} className="text-[20px] font-bold text-spal-navy">Add something</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {ITEMS.map((i) => (
                <button key={i.label} type="button" onClick={() => { onClose(); router.push(i.href); }}
                  className="text-left min-h-[76px] rounded-2xl bg-spal-bg px-4 py-3 active:scale-[0.97] transition-transform">
                  <span style={{ fontFamily: "var(--font-satoshi)" }} className="block text-[16px] font-bold text-spal-navy">{i.label}</span>
                  <span className="block text-[12px] text-neutral-500 leading-snug">{i.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
