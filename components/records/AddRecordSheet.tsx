"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PillChip } from "@/components/ui/PillChip";
import { useSPALStore } from "@/store";
import type { BusinessRecord } from "@/lib/types";
import type { Badge } from "@/lib/gamification/badges";
import { Camera01Icon, Cancel01Icon, MinusSignIcon, PlusSignIcon, ZapIcon, Clock01Icon, ChartIncreaseIcon, ChartDecreaseIcon, Tick01Icon } from "hugeicons-react";
import { SALE_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/constants/categories";

interface AddRecordSheetProps {
  type:       "sale" | "expense";
  open:       boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  /** When provided, sheet opens in edit mode pre-filled with this record */
  record?:    BusinessRecord | null;
}

interface SavedItem {
  name:          string;
  default_price: number;
  category:      string | null;
  count:         number;
  last_used:     string;
}

export function AddRecordSheet({ type, open, onClose, onSuccess, record }: AddRecordSheetProps) {
  const { setNewBadge } = useSPALStore();
  const [amount,        setAmount]        = useState("");
  const [description,   setDescription]   = useState("");
  const [category,      setCategory]      = useState("");
  const [loading,        setLoading]        = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(false);
  const [paymentStatus,  setPaymentStatus]  = useState<'paid' | 'owing'>('paid');
  const [customerName,   setCustomerName]   = useState('');
  const [scanning,      setScanning]      = useState(false);
  const [scanError,     setScanError]     = useState("");
  const [wasScanned,    setWasScanned]    = useState(false);

  // Quick-recall state
  const [savedItems,    setSavedItems]    = useState<SavedItem[]>([]);
  const [selectedItem,  setSelectedItem]  = useState<SavedItem | null>(null);
  const [quantity,      setQuantity]      = useState(1);
  const [showSuggest,   setShowSuggest]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!record;

  // Pre-fill when editing
  useEffect(() => {
    if (record && open) {
      setAmount(String(record.amount));
      setDescription(record.description ?? "");
      setCategory(record.category ?? "");
      setPaymentStatus(record.payment_status ?? 'paid');
      setCustomerName(record.customer_name ?? '');
      setDeleteConfirm(false);
    }
  }, [record, open]);

  // Fetch the user's saved items whenever the sheet opens in add mode
  useEffect(() => {
    if (!open || isEdit) return;
    fetch(`/api/records/items?type=${type}&limit=20`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSavedItems(d.data ?? []); })
      .catch(() => {});
  }, [open, isEdit, type]);

  const categories = type === "sale" ? SALE_CATEGORIES : EXPENSE_CATEGORIES;
  const isValid    = amount && parseFloat(amount) > 0;
  const label      = type === "sale" ? "Sale" : "Expense";

  // Type-ahead suggestions filtered by current description text
  const suggestions = useMemo(() => {
    if (!description.trim() || selectedItem) return [];
    const q = description.toLowerCase();
    return savedItems
      .filter((it) => it.name.toLowerCase().includes(q) && it.name.toLowerCase() !== q)
      .slice(0, 4);
  }, [description, savedItems, selectedItem]);

  // ── Item selection helpers ─────────────────────────────────────────────────

  function selectItem(item: SavedItem) {
    setSelectedItem(item);
    setQuantity(1);
    setAmount(String(item.default_price));
    setDescription(item.name);
    setCategory(item.category ?? "");
    setShowSuggest(false);
  }

  function clearSelection() {
    setSelectedItem(null);
    setQuantity(1);
  }

  function handleQuantityChange(next: number) {
    const q = Math.max(1, Math.min(999, next));
    setQuantity(q);
    if (selectedItem) {
      setAmount(String(selectedItem.default_price * q));
    }
  }

  function handleAmountChange(v: string) {
    setAmount(v);
    // Manual edit while a saved item is selected → break free of the unit-price link
    if (selectedItem) clearSelection();
  }

  function handleDescriptionChange(v: string) {
    setDescription(v);
    setShowSuggest(true);
    if (selectedItem && v.toLowerCase() !== selectedItem.name.toLowerCase()) {
      clearSelection();
    }
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);

    try {
      if (isEdit && record) {
        const res = await fetch("/api/records", {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            id:             record.id,
            amount:         parseFloat(amount),
            description:    description.trim() || undefined,
            category:       category || undefined,
            payment_status: paymentStatus,
            customer_name:  customerName.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else {
        // For quantity-based entries, include quantity hint in description
        const finalDesc = selectedItem && quantity > 1
          ? `${selectedItem.name} × ${quantity}`
          : description.trim() || undefined;

        const res = await fetch("/api/records", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            type,
            amount:         parseFloat(amount),
            description:    finalDesc,
            category:       category || undefined,
            input_method:   wasScanned ? "scan" : (selectedItem ? "quick" : "text"),
            payment_status: type === "sale" ? paymentStatus : "paid",
            customer_name:  type === "sale" && paymentStatus === "owing" ? (customerName.trim() || undefined) : undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        if (data.newBadges?.length > 0) {
          setTimeout(() => setNewBadge(data.newBadges[0] as Badge), 1200);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        reset();
        onClose();
        onSuccess?.();
      }, 1000);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!record) return;
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      await fetch(`/api/records?id=${record.id}`, { method: "DELETE" });
      reset();
      onClose();
      onSuccess?.();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  async function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    setScanError("");
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/ai/scan-receipt", { method: "POST", body: fd });
      const data = await res.json();

      if (!data.success) {
        setScanError(data.error ?? "Could not read receipt.");
        return;
      }

      const { type: detectedType, amount: detectedAmount, description: desc, category: cat } = data.data;
      if (!amount)      setAmount(String(detectedAmount));
      if (!description) setDescription(desc ?? "");
      if (!category)    setCategory(cat ?? "");
      setWasScanned(true);
      clearSelection();

      if (detectedType !== type) {
        setScanError(`Looks like a ${detectedType} receipt — fields pre-filled, but this sheet records a ${type}. Tap ✕ and use the correct button if needed.`);
      }
    } catch {
      setScanError("Scan failed. Check your connection and try again.");
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    setAmount(""); setDescription(""); setCategory("");
    setPaymentStatus('paid'); setCustomerName('');
    setSuccess(false); setDeleteConfirm(false);
    setScanError(""); setScanning(false); setWasScanned(false);
    clearSelection();
    setShowSuggest(false);
  }

  function handleClose() { reset(); onClose(); }

  // Top 5 chips for quick-add (most-used surfaces first)
  const topItems = savedItems.slice(0, 5);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 sheet-backdrop z-[55]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl z-[60] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {success ? (
              <SuccessState isEdit={isEdit} type={type} amount={amount} />
            ) : (
              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 relative"
                style={{
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
                }}
              >
                {/* Scanning overlay */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-white/92 backdrop-blur-sm rounded-t-3xl flex flex-col items-center justify-center gap-4"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.2, 0.5] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-full bg-spal-blue"
                        />
                        <div className="relative w-14 h-14 rounded-full bg-spal-blue/10 border-2 border-spal-blue flex items-center justify-center">
                          <Camera01Icon size={24} className="text-spal-blue" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-spal-navy">Reading receipt…</p>
                        <p className="text-xs text-neutral-400 mt-1">SPAL is scanning your image</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScanFile} />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-spal-navy flex items-center gap-2" style={{ fontFamily: "var(--font-satoshi)" }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: type === "sale" ? "#F0FDF4" : "#FFF7ED" }}>
                      {type === "sale"
                        ? <ChartIncreaseIcon size={16} color="#22C55E" />
                        : <ChartDecreaseIcon size={16} color="#F97316" />}
                    </span>
                    {isEdit ? `Edit ${label}` : `Add ${label}`}
                  </h2>
                  <div className="flex items-center gap-2">
                    {!isEdit && (
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => { setScanError(""); fileInputRef.current?.click(); }}
                        disabled={scanning}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-spal-blue-50 text-spal-blue text-xs font-semibold rounded-full border border-spal-blue-100 active:bg-spal-blue-100 transition-colors disabled:opacity-40"
                      >
                        <Camera01Icon size={14} />
                        Scan
                      </motion.button>
                    )}
                    <button
                      onClick={handleClose}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
                      aria-label="Close"
                    >
                      <Cancel01Icon size={16} />
                    </button>
                  </div>
                </div>

                {scanError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5"
                  >
                    <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs text-amber-700 leading-relaxed">{scanError}</p>
                  </motion.div>
                )}

                {/* ── Quick-add chips (only in ADD mode + if user has past items) ── */}
                {!isEdit && topItems.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ZapIcon size={13} className="text-spal-green" />
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide" style={{ fontFamily: "var(--font-satoshi)" }}>
                        Quick add
                      </label>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scroll-container">
                      {topItems.map((it) => {
                        const active = selectedItem?.name.toLowerCase() === it.name.toLowerCase();
                        return (
                          <motion.button
                            key={it.name}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => active ? clearSelection() : selectItem(it)}
                            className="flex-shrink-0 flex flex-col items-start px-3.5 py-2 rounded-2xl transition-all duration-150"
                            style={{
                              background: active ? (type === "sale" ? "#22C55E" : "#F35902") : "#FAFAFA",
                              border:     `1.5px solid ${active ? (type === "sale" ? "#22C55E" : "#F35902") : "#F1F5F9"}`,
                              minWidth: "fit-content",
                            }}
                          >
                            <span
                              className="text-[12px] font-semibold leading-tight"
                              style={{
                                fontFamily: "var(--font-satoshi)",
                                color: active ? "#fff" : "#0F172A",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {it.name}
                            </span>
                            <span
                              className="text-[11px] font-bold mt-0.5"
                              style={{
                                fontFamily: "var(--font-satoshi)",
                                color: active ? "rgba(255,255,255,0.85)" : (type === "sale" ? "#16A34A" : "#EA580C"),
                                whiteSpace: "nowrap",
                              }}
                            >
                              ₦{it.default_price.toLocaleString()}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Amount ── */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                    How much?
                  </label>
                  <div className="flex items-center gap-2 h-16 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus-within:border-spal-blue transition-colors">
                    <span className="text-2xl font-bold text-neutral-300">₦</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="flex-1 text-3xl font-bold text-spal-navy bg-transparent outline-none placeholder:text-neutral-200"
                    />
                  </div>

                  {/* Quantity stepper — only when a saved item is selected */}
                  {selectedItem && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center justify-between bg-spal-green-50 border border-spal-green-100 rounded-2xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>
                          Quantity
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          × ₦{selectedItem.default_price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          <MinusSignIcon size={14} className="text-spal-navy" />
                        </button>
                        <span className="w-9 text-center text-[15px] font-bold text-spal-navy tabular-nums" style={{ fontFamily: "var(--font-satoshi)" }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="w-8 h-8 rounded-full bg-spal-green text-white flex items-center justify-center active:scale-90 transition"
                          aria-label="Increase quantity"
                        >
                          <PlusSignIcon size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ── Description with type-ahead ── */}
                <div className="mb-4 relative">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                    What was this for? <span className="text-neutral-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={type === "sale" ? "e.g. Suya, Drinks, Rice..." : "e.g. Fuel, Stock, Salary..."}
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
                  />

                  {/* Suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggest && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-neutral-100 overflow-hidden z-10"
                        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                      >
                        {suggestions.map((s) => (
                          <button
                            key={s.name}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectItem(s)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50 active:bg-neutral-100 text-left transition-colors"
                          >
                            <span className="text-[13.5px] font-medium text-spal-navy truncate" style={{ fontFamily: "var(--font-satoshi)" }}>
                              {s.name}
                            </span>
                            <span className="text-[12px] font-bold flex-shrink-0" style={{ fontFamily: "var(--font-satoshi)", color: type === "sale" ? "#16A34A" : "#EA580C" }}>
                              ₦{s.default_price.toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Category pills ── */}
                <div className="mb-5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <PillChip
                        key={cat}
                        label={cat}
                        size="sm"
                        color={type === "sale" ? "green" : "orange"}
                        selected={category === cat}
                        onClick={() => setCategory(cat === category ? "" : cat)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Did they pay? (sales only) ── */}
                {type === "sale" && (
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
                      Did they pay?
                    </label>
                    <div className="flex gap-2">
                      {(['paid', 'owing'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setPaymentStatus(status)}
                          className="flex-1 h-10 rounded-full text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-1.5"
                          style={{
                            background: paymentStatus === status
                              ? (status === 'paid' ? '#22C55E' : '#F97316')
                              : '#F4F4F5',
                            color: paymentStatus === status ? '#fff' : '#71717A',
                          }}
                        >
                          {status === 'paid' ? <><Tick01Icon size={13} /> Paid now</> : <><Clock01Icon size={13} />{' '}Owes me</>}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {paymentStatus === 'owing' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="text"
                            placeholder="Customer name (optional — e.g. Mama Ngozi)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="mt-2 w-full h-11 px-4 bg-orange-50 rounded-2xl border-2 border-orange-100 focus:border-spal-orange text-sm text-spal-navy placeholder:text-neutral-400 outline-none transition-colors"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Save / Delete ── */}
                <div className="mt-5">
                  {/* Mark as Paid shortcut — only in edit mode for owing sales */}
                  {isEdit && record?.type === 'sale' && record?.payment_status === 'owing' && paymentStatus === 'owing' && (
                    <motion.button
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      onClick={async () => {
                        setLoading(true);
                        await fetch("/api/records", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: record.id, payment_status: "paid" }),
                        });
                        setPaymentStatus('paid');
                        setLoading(false);
                        setSuccess(true);
                        setTimeout(() => { setSuccess(false); reset(); onClose(); onSuccess?.(); }, 1000);
                      }}
                      className="w-full h-12 rounded-full font-bold text-[14px] text-white mb-3 flex items-center justify-center gap-2"
                      style={{ background: '#22C55E' }}
                    >
                      <Tick01Icon size={15} color="#fff" /> Mark as Paid
                    </motion.button>
                  )}

                  <Button
                    fullWidth size="lg" loading={loading} disabled={!isValid}
                    onClick={handleSave}
                  >
                    {isEdit ? `Update ${label}` : `Save ${label}`}
                  </Button>

                  {isEdit && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleDelete}
                      disabled={deleting}
                      className={`mt-3 w-full h-12 rounded-full text-sm font-semibold transition-all duration-200 ${
                        deleteConfirm ? "bg-red-500 text-white" : "bg-red-50 text-red-500"
                      }`}
                    >
                      {deleting ? "Deleting…" : deleteConfirm ? "Tap again to confirm delete" : "Delete record"}
                    </motion.button>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


function SuccessState({ isEdit, type, amount }: { isEdit: boolean; type: string; amount: string }) {
  const messages = {
    sale:    ["Nice one! 🎉", "Great sale! 💪", "Recorded! Keep it up! 🔥"],
    expense: ["Got it! Tracked. 👍", "Recorded! 📝", "Added to expenses ✓"],
  };
  const msg  = messages[type as keyof typeof messages];
  const text = isEdit ? "Updated! ✓" : msg[Math.floor(Math.random() * msg.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="w-16 h-16 bg-spal-green rounded-full flex items-center justify-center text-white text-2xl mb-4"
      >
        ✓
      </motion.div>
      <p className="text-xl font-bold text-spal-navy text-center">{text}</p>
      <p className="text-neutral-400 text-sm mt-1">₦{parseFloat(amount).toLocaleString()}</p>
    </motion.div>
  );
}
