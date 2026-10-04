"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";

const fontFamily = "var(--font-satoshi)";
const BG = "#EEF3E9";

function RenameContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { activeBusiness, setActiveBusiness, businesses, setBusinesses } = useSPALStore();

  const bizId      = params.get("id") ?? "";
  const currentName = params.get("name") ?? "";
  const [name,  setName]  = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const canSave = name.trim().length >= 2 && name.trim() !== currentName;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/businesses/${bizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Update store
      const updated = businesses.map(b => b.id === bizId ? { ...b, business_name: name.trim() } : b);
      setBusinesses(updated);
      if (activeBusiness?.id === bizId) {
        setActiveBusiness({ ...activeBusiness, business_name: name.trim() });
      }
      router.push("/profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(15,23,42,0.06)" }}
          aria-label="Back"
        >
          <ArrowLeft01Icon size={18} />
        </button>
        <span className="text-[16px] font-semibold text-spal-navy">Rename Business</span>
      </div>

      <div className="px-5 mt-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Business name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="w-full h-14 px-4 rounded-2xl text-[15px] font-medium text-spal-navy bg-white outline-none"
            style={{
              border: name.trim() ? "1.5px solid #22C55E" : "1.5px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              fontFamily,
            }}
          />
        </motion.div>
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-10 pt-10"
        style={{ background: `linear-gradient(to top, ${BG} 70%, transparent)` }}
      >
        {error && <p className="text-[12px] text-red-500 text-center mb-2">{error}</p>}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full h-14 rounded-full font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "#22C55E", fontFamily }}
        >
          {saving ? "Saving…" : "Save name"}
        </button>
      </div>
    </div>
  );
}

export default function RenamePage() {
  return (
    <Suspense>
      <RenameContent />
    </Suspense>
  );
}
