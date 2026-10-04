"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search01Icon, Notification03Icon, QrCode01Icon, CubeIcon, Delete02Icon,
  PlusSignIcon, MinusSignIcon, BankIcon, CreditCardIcon, Money02Icon,
  MoneyBag01Icon, Link04Icon, Books01Icon, CheckmarkCircle02Icon, PrinterIcon,
  Navigation03Icon, ShoppingCartAdd01Icon, SidebarRight01Icon, ShoppingCartCheck01Icon,
  Package01Icon, ArrowLeft01Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import { useBusinessMode } from "@/hooks/useBusinessMode";
import type { OrderType } from "@/lib/orders";
import type { InventoryItem, MenuItem } from "@/lib/types";

const BG        = "#EEF3E9";
const IMG_BG    = "#ECECF7";
const FF        = "var(--font-satoshi)";

// ── helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
const price = (it: InventoryItem) => it.selling_price ?? 0;
const isLow = (it: InventoryItem) => it.quantity > 0 && it.quantity <= it.low_stock_threshold;

/** Sold progress when a baseline exists (from the Stocks flow); otherwise falls back to remaining stock. */
function stockProgress(it: InventoryItem) {
  if (it.initial_stock && it.initial_stock > 0) {
    const sold = Math.max(0, it.initial_stock - it.quantity);
    return { label: `${sold}/${it.initial_stock} sold`, fill: Math.min(1, sold / it.initial_stock), tone: "sold" as const };
  }
  const fill = it.quantity <= 0 ? 0 : Math.min(1, Math.max(0.06, it.quantity / (it.low_stock_threshold * 5 || 20)));
  return { label: `${it.quantity} ${it.unit} left`, fill, tone: "stock" as const };
}

/** Restaurants and bars sell from the menu; shape a dish like a product so the POS flow is shared. */
function menuAsProduct(m: MenuItem): InventoryItem {
  return {
    id: m.id, user_id: m.user_id, name: m.name, unit: m.unit,
    quantity: Math.max(0, m.quantity - m.sold),
    initial_stock: m.quantity,
    low_stock_threshold: Math.max(1, Math.floor(m.quantity * 0.1)),
    selling_price: m.price, category: m.category ?? null,
    image_url: m.image_url ?? null, images: m.images ?? null,
    created_at: m.created_at, updated_at: m.updated_at,
  };
}

type PayMethod = "cash" | "bank" | "card" | "debt" | "link" | "manual";
const PAY_OPTIONS: { id: PayMethod; label: string; Icon: typeof BankIcon }[] = [
  { id: "cash",   label: "Cash",           Icon: Money02Icon },
  { id: "bank",   label: "Bank Transfer",  Icon: BankIcon },
  { id: "card",   label: "Card / POS",     Icon: CreditCardIcon },
  { id: "debt",   label: "Outstanding Debt", Icon: MoneyBag01Icon },
  { id: "link",   label: "Payment Link",   Icon: Link04Icon },
  { id: "manual", label: "Record Manually", Icon: Books01Icon },
];
const PAY_LABEL: Record<PayMethod, string> = {
  cash: "cash", bank: "bank transfer", card: "card / POS", debt: "credit", link: "payment link", manual: "manual entry",
};

type Drawer = null | "cart" | "category" | "payment" | "success";

export default function SellPage() {
  const { user, activeBusiness } = useSPALStore();
  const businessName = activeBusiness?.business_name || user?.business_name || "Your Store";
  const { ready: modeReady, perishable } = useBusinessMode();

  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCat, setActiveCat] = useState("All");
  const chipsRef = useRef<HTMLDivElement>(null);
  const [catLimit, setCatLimit] = useState(999); // how many category chips fit in two rows
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [cart, setCart]           = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [query, setQuery]         = useState("");
  // Restaurant/bar orders arrive from New Order with ?type=online|walkin|table[&table=N].
  const [flow, setFlow] = useState<{ ready: boolean; type: OrderType | null; table: number | null }>({ ready: false, type: null, table: null });

  const [drawer, setDrawer]       = useState<Drawer>(null);
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [amountMode, setAmountMode] = useState<"full" | "other">("full");
  const [otherAmount, setOtherAmount] = useState("");
  const [saving, setSaving]       = useState(false);
  const [receiptNo, setReceiptNo] = useState("");
  const [lastSaleId, setLastSaleId] = useState<string | undefined>();
  const [lastSale, setLastSale]   = useState<{ total: number; method: PayMethod; id?: string } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("type");
    const tbl = parseInt(q.get("table") ?? "", 10);
    setFlow({
      ready: true,
      type: t === "online" || t === "walkin" || t === "table" ? t : null,
      table: t === "table" && tbl > 0 ? tbl : null,
    });
  }, []);
  // A restaurant order always starts from New Order.
  useEffect(() => {
    if (perishable && flow.ready && !flow.type) window.location.replace("/orders/new");
  }, [perishable, flow]);

  const loadSeq = useRef(0);
  const fetchInventory = useCallback(async () => {
    const seq = ++loadSeq.current; // only the latest request may update the list
    try {
      const res = await fetch(perishable ? "/api/menu" : "/api/inventory");
      const d = await res.json();
      if (d.success && seq === loadSeq.current) {
        const list = d.data.items ?? [];
        setItems(perishable ? (list as MenuItem[]).map(menuAsProduct) : list);
      }
    } catch { /* silent */ } finally { if (seq === loadSeq.current) setLoading(false); }
  }, [perishable]);
  useEffect(() => { if (modeReady) fetchInventory(); }, [modeReady, fetchInventory]);

  // ── derived ────────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => { if (it.category) set.add(it.category); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = items.filter((it) =>
    (activeCat === "All" || (it.category ?? "") === activeCat) &&
    (!query.trim() || it.name.toLowerCase().includes(query.trim().toLowerCase()))
  );

  // Keep the category chips within two rows; overflow is reached via "View All".
  useEffect(() => { setCatLimit(999); }, [categories.length]);
  useEffect(() => {
    const onResize = () => setCatLimit(999);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useLayoutEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    const twoRows = perishable ? 118 : 96; // two chip rows (48px restaurant / 40px retail) + gap + tolerance
    if (el.scrollHeight > twoRows && catLimit > 0) setCatLimit((n) => Math.min(n, categories.length) - 1);
  });

  const cartLines = useMemo(
    () => Object.entries(cart)
      .map(([id, qty]) => ({ item: items.find((i) => i.id === id)!, qty }))
      .filter((l) => l.item),
    [cart, items]
  );
  const subtotal  = cartLines.reduce((s, l) => s + price(l.item) * l.qty, 0);
  const discount  = 0;
  const taxRate   = user?.tax_rate ?? 7.5;
  const vat       = Math.round(subtotal * taxRate / 100);
  const vatLabel  = `VAT (${taxRate}%)`;
  const total     = subtotal - discount + vat;
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);

  const amountPaid = amountMode === "other" ? (parseFloat(otherAmount) || 0) : total;
  const change     = amountPaid - total; // positive → give change to customer

  // ── actions ──────────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function addSelectedToCart() {
    setCart((prev) => {
      const next = { ...prev };
      selected.forEach((id) => { next[id] = (next[id] ?? 0) + 1; });
      return next;
    });
    setSelected(new Set());
  }
  function setQty(id: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id]; else next[id] = qty;
      return next;
    });
  }
  function clearCart() { setCart({}); setCustomerName(""); setInstructions(""); }

  function openPayment() {
    setPayMethod(null); setAmountMode("full"); setOtherAmount("");
    setDrawer("payment");
  }

  async function confirmPayment() {
    if (!payMethod || saving) return;
    setSaving(true);
    const paid = payMethod === "debt" ? "owed" : (amountMode === "other" && amountPaid < total ? "owed" : "paid");
    const desc = perishable && cartLines.length === 1 && cartLines[0].qty === 1
      ? cartLines[0].item.name
      : cartLines.map((l) => `${l.item.name} x${l.qty}`).join(", ");
    // Inherit the product's stock category (single category → that one, mixed → "Mixed").
    const cats = Array.from(new Set(cartLines.map((l) => l.item.category).filter(Boolean))) as string[];
    const saleCategory = cats.length === 1 ? cats[0] : cats.length > 1 ? "Mixed" : null;
    let savedId: string | undefined;
    try {
      const saveRes = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sale",
          amount: total,
          description: desc,
          category: saleCategory,
          preserve_category: true,
          input_method: "manual",
          payment_status: paid,
          customer_name: customerName || null,
          raw_input: JSON.stringify({
            payment_method: payMethod,
            amount_paid: amountPaid,
            subtotal, vat, discount,
            items: cartLines.map((l) => ({ name: l.item.name, qty: l.qty, price: price(l.item) })),
            ...(perishable && flow.type ? {
              order_type: flow.type,
              table: flow.table,
              // Walk-ins leave with their food; online and table orders are still being prepared.
              status: flow.type === "walkin" ? "delivered" : "preparing",
              instructions: instructions.trim(),
            } : {}),
          }),
        }),
      });
      savedId = (await saveRes.json().catch(() => null))?.data?.id;
      // Update stock (best-effort): a menu order adds to "sold", retail deducts from inventory.
      await Promise.all(
        cartLines.map((l) =>
          fetch(perishable ? `/api/menu/${l.item.id}` : `/api/inventory/${l.item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(perishable ? { sell: l.qty } : { quantity: Math.max(0, l.item.quantity - l.qty) }),
          })
        )
      );
    } catch { /* keep the receipt visible even if the network hiccups */ }
    setLastSaleId(savedId);
    setReceiptNo(`#BM-${Math.floor(10000 + Math.random() * 89999)}`);
    setSaving(false);
    setDrawer("success");
  }

  function finishSale() {
    setLastSale({ total, method: payMethod ?? "cash", id: lastSaleId });
    clearCart();
    setDrawer(null);
    fetchInventory();
  }

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full border-2 border-spal-green border-t-transparent animate-spin" />
      </div>
    );
  }

  const showAddBar  = selected.size > 0;
  const showViewBar = selected.size === 0 && cartCount > 0;
  const showLastBar = selected.size === 0 && cartCount === 0 && !!lastSale;

  return (
    <>
      <div className="min-h-full pb-40" style={{ background: BG, fontFamily: FF }}>
        {/* Header */}
        {perishable ? (
          <div className="px-5 pt-12 pb-4">
            <button onClick={() => { window.location.href = "/orders"; }} aria-label="Back to orders" className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <ArrowLeft01Icon size={20} color="#0F172A" />
            </button>
          </div>
        ) : (
        <div className="px-5 pt-12 pb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#D9C7B8" }}>
            {user?.avatar_url
              ? <Image src={user.avatar_url} alt="" width={44} height={44} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[16px] font-black text-white">{businessName.charAt(0)}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-neutral-500" style={{ fontFamily: FF }}>{greeting()}</p>
            <p className="text-[18px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{businessName}</p>
          </div>
          <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95 transition-transform" aria-label="Search">
            <Search01Icon size={19} color="#6B7280" />
          </button>
          <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95 transition-transform" aria-label="Notifications">
            <Notification03Icon size={19} color="#6B7280" />
          </button>
        </div>
        )}

        {/* Search + scan */}
        <div className="px-5 pt-1 pb-4 flex items-center gap-2.5">
          <div className="flex-1 flex items-center gap-2.5 bg-white/70 rounded-2xl px-4 h-13" style={{ height: 52 }}>
            <Search01Icon size={18} color="#9CA3AF" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
              placeholder={perishable ? "Search food..." : "Search products by name or SKU..."}
              className="flex-1 bg-transparent outline-none text-[14px] text-spal-navy placeholder:text-neutral-400"
              style={{ fontFamily: FF }}
            />
          </div>
          <button className="w-13 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "#22C55E", height: 52, width: 52 }} aria-label="Scan barcode">
            <QrCode01Icon size={22} color="#fff" />
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "34vh" }}>
            <CubeIcon size={54} color="#9AA3AF" strokeWidth={1.4} />
            <p className="text-[22px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>{perishable ? "No menu to order from" : "No item to sell"}</p>
            <p className="text-[15px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>{perishable ? "Add your menu item and start taking orders" : "Add your first inventory item"}</p>
            <button
              onClick={() => { window.location.href = perishable ? "/menu/add" : "/inventory"; }}
              className="mt-6 h-12 px-6 rounded-2xl text-white font-bold text-[14px] active:scale-[0.98] transition-transform"
              style={{ background: "#22C55E", fontFamily: FF }}
            >
              {perishable ? "Add Menu Item" : "Add Inventory"}
            </button>
          </div>
        ) : (
          <>
            {/* Category chips — capped to two rows, View All appears only on overflow */}
            <div ref={chipsRef} className="px-5 flex flex-wrap gap-2.5 mb-4">
              {["All", ...categories.slice(0, catLimit)].map((c) => {
                const on = activeCat === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCat(c)}
                    className={`px-4 rounded-full text-[14px] font-semibold active:scale-95 transition-all ${perishable ? "h-12" : "h-10"}`}
                    style={{
                      fontFamily: FF,
                      background: on ? "#0F172A" : "#fff",
                      color: on ? "#fff" : "#374151",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
              {catLimit < categories.length && (
                <button
                  onClick={() => setDrawer("category")}
                  className={`px-4 rounded-full text-[14px] font-bold active:scale-95 transition-all bg-white ${perishable ? "h-12" : "h-10"}`}
                  style={{ fontFamily: FF, color: "#22C55E", border: "1.5px solid #22C55E" }}
                >
                  View All
                </button>
              )}
            </div>

            {/* Product grid */}
            <div className="px-5 grid grid-cols-2 gap-3.5">
              {filtered.map((it) => {
                const sel = selected.has(it.id);
                const low = isLow(it);
                const prog = stockProgress(it);
                return (
                  <button
                    key={it.id}
                    onClick={() => toggleSelect(it.id)}
                    className="text-left bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-all"
                    style={{
                      border: sel ? "2px solid #22C55E" : "2px solid transparent",
                      boxShadow: sel ? "0 0 0 4px rgba(34,197,94,0.14)" : "0 1px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    {low && (
                      <div className="text-center py-1.5" style={{ background: "#FEE0E1" }}>
                        <span className="text-[12px] font-bold" style={{ fontFamily: FF, color: "#DC2626" }}>Stock is getting low</span>
                      </div>
                    )}
                    <div className="m-2.5 rounded-xl flex items-center justify-center" style={{ background: IMG_BG, height: 120 }}>
                      {it.image_url
                        ? <Image src={it.image_url} alt={it.name} width={120} height={120} className="h-[104px] w-auto object-contain" />
                        : <Package01Icon size={38} color="#B7B7D6" />}
                    </div>
                    <div className="px-3 pb-3.5">
                      <p className="text-[16px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{it.name}</p>
                      <p className="text-[14px] font-medium text-neutral-400 mt-0.5" style={{ fontFamily: FF }}>{formatCurrency(price(it))}</p>
                      <p className="text-[13px] font-semibold mt-2" style={{ fontFamily: FF, color: prog.tone === "sold" ? "#16A34A" : "#6B7280" }}>{prog.label}</p>
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#DCEBD6" }}>
                        <div className="h-full rounded-full" style={{ width: `${prog.fill * 100}%`, background: "#16A34A" }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating action bar (above bottom nav) */}
      <AnimatePresence>
        {(showAddBar || showViewBar || showLastBar) && (
          <motion.div
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="cta-bottom fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-3 min-[360px]:px-4 z-40"
          >
            {showLastBar ? (
              <div className="rounded-2xl bg-white flex items-center justify-between gap-3 px-4 min-[360px]:px-5 py-3" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.16)" }}>
                <span className="min-w-0 text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>View Recent Sale</span>
                <button
                  onClick={() => { window.location.href = perishable && lastSale?.id ? `/records/${lastSale.id}` : "/records"; }}
                  className={`flex items-center gap-2 px-4 rounded-xl text-white font-bold text-[14px] active:scale-95 flex-shrink-0 ${perishable ? "h-12" : "h-11"}`}
                  style={{ background: "#22C55E", fontFamily: FF }}
                >
                  <ShoppingCartCheck01Icon size={17} color="#fff" /> View
                </button>
              </div>
            ) : (
              <div className="rounded-2xl flex items-center justify-between gap-3 px-4 min-[360px]:px-5 py-3 min-[360px]:py-3.5" style={{ background: "#0F172A", boxShadow: "0 8px 30px rgba(0,0,0,0.28)" }}>
                <span className="min-w-0 text-[15px] min-[360px]:text-[16px] font-black text-white leading-tight" style={{ fontFamily: FF }}>
                  {showAddBar
                    ? `Add ${selected.size} item${selected.size !== 1 ? "s" : ""} to Cart`
                    : `View Cart • ${cartCount}`}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {showAddBar && (
                    <button onClick={addSelectedToCart}
                      className={`flex items-center gap-2 px-4 rounded-xl text-white font-bold text-[14px] active:scale-95 ${perishable ? "h-12" : "h-11"}`}
                      style={{ background: "#22C55E", fontFamily: FF }}>
                      <ShoppingCartAdd01Icon size={17} color="#fff" /> Add
                    </button>
                  )}
                  {cartCount > 0 && (
                    <button onClick={() => setDrawer("cart")}
                      className={`flex items-center gap-2 px-4 rounded-xl font-bold text-[14px] active:scale-95 bg-white ${perishable ? "h-12" : "h-11"}`}
                      style={{ color: "#16A34A", fontFamily: FF }}>
                      <ShoppingCartCheck01Icon size={17} color="#16A34A" /> View
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-side drawers */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]" style={{ background: "rgba(10,14,26,0.35)" }}
              onClick={() => setDrawer(null)}
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-[88%] max-w-[440px] flex flex-col"
              style={{ background: "#EDF3E8", fontFamily: FF }}
            >
              <div className="flex justify-end px-5 pt-12 pb-2">
                <button onClick={() => setDrawer(null)} className={`rounded-lg flex items-center justify-center active:scale-95 ${perishable ? "w-12 h-12" : "w-9 h-9"}`}
                  style={{ border: "1.5px solid #C7D2C0" }} aria-label="Close">
                  <SidebarRight01Icon size={18} color="#475467" />
                </button>
              </div>

              {drawer === "category" && (
                <CategoryPanel
                  categories={categories}
                  onPick={(c) => { setActiveCat(c); setDrawer(null); }}
                />
              )}

              {drawer === "cart" && (
                <CartPanel
                  lines={cartLines} customerName={customerName} setCustomerName={setCustomerName}
                  instructions={perishable ? instructions : undefined} setInstructions={setInstructions}
                  setQty={setQty} clearCart={clearCart}
                  subtotal={subtotal} discount={discount} vat={vat} vatLabel={vatLabel} total={total} count={cartCount}
                  onTakePayment={openPayment}
                />
              )}

              {drawer === "payment" && (
                <PaymentPanel
                  subtotal={subtotal} discount={discount} vat={vat} vatLabel={vatLabel} total={total}
                  method={payMethod} setMethod={setPayMethod}
                  amountMode={amountMode} setAmountMode={setAmountMode}
                  otherAmount={otherAmount} setOtherAmount={setOtherAmount}
                  change={change} saving={saving} onConfirm={confirmPayment}
                />
              )}

              {drawer === "success" && (
                <SuccessPanel
                  lines={cartLines} vat={vat} vatLabel={vatLabel} total={total}
                  method={payMethod ?? "cash"} receiptNo={receiptNo} onDone={finishSale}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Category drawer ──────────────────────────────────────────────────────────
function CategoryPanel({ categories, onPick }: { categories: string[]; onPick: (c: string) => void }) {
  const list = categories.length ? categories : ["All Products"];
  return (
    <div className="flex-1 overflow-y-auto px-5 pb-8">
      <h2 className="text-[26px] font-black text-spal-navy mb-5" style={{ fontFamily: FF }}>All Category</h2>
      <div className="space-y-3">
        {list.map((c) => (
          <button key={c} onClick={() => onPick(c === "All Products" ? "All" : c)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-4 active:scale-[0.99] transition-transform"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span className="grid grid-cols-2 gap-0.5 flex-shrink-0">
              {Array.from({ length: 6 }).map((_, i) => <span key={i} className="w-1 h-1 rounded-full" style={{ background: "#CBD5C0" }} />)}
            </span>
            <span className="text-[16px] font-bold text-spal-navy" style={{ fontFamily: FF }}>{c}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Cart drawer ──────────────────────────────────────────────────────────────
function CartPanel({
  lines, customerName, setCustomerName, instructions, setInstructions, setQty, clearCart, subtotal, discount, vat, vatLabel, total, count, onTakePayment,
}: {
  instructions?: string; setInstructions: (v: string) => void;
  lines: { item: InventoryItem; qty: number }[];
  customerName: string; setCustomerName: (v: string) => void;
  setQty: (id: string, qty: number) => void; clearCart: () => void;
  subtotal: number; discount: number; vat: number; vatLabel: string; total: number; count: number;
  onTakePayment: () => void;
}) {
  // Restaurant orders: 48px tap targets, so each line wraps onto two rows instead of squeezing on small phones.
  const roomy = instructions !== undefined;
  return (
    <>
      <div className="px-5">
        <button onClick={clearCart}
          className={`inline-flex items-center gap-2 px-3.5 rounded-full active:scale-95 ${roomy ? "h-12" : "h-9"}`} style={{ background: "#FEE0E1" }}>
          <Delete02Icon size={15} color="#DC2626" />
          <span className="text-[13.5px] font-bold" style={{ fontFamily: FF, color: "#DC2626" }}>Clear Cart</span>
        </button>
      </div>
      <div className="px-5 mt-5 flex items-center justify-between">
        <h2 className="text-[26px] font-black text-spal-navy" style={{ fontFamily: FF }}>{instructions !== undefined ? "Order" : "Current Sale"}</h2>
        <span className="text-[13px] font-bold" style={{ fontFamily: FF, color: "#2563EB" }}>{count} Item{count !== 1 ? "s" : ""} in total</span>
      </div>

      <div className="px-5 mt-4">
        <div className="flex items-center gap-2.5 bg-white/60 rounded-2xl px-4" style={{ height: 52 }}>
          <Search01Icon size={18} color="#9CA3AF" />
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name"
            className="flex-1 bg-transparent outline-none text-[15px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 mt-5 space-y-3">
        {lines.map(({ item, qty }) => roomy ? (
          <div key={item.id} className="bg-white rounded-2xl pl-4 pr-1 py-1.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2">
              <p className="flex-1 min-w-0 text-[15px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{item.name}</p>
              <span className="text-[15px] font-black text-spal-navy flex-shrink-0" style={{ fontFamily: FF }}>{formatCurrency(price(item) * qty)}</span>
              <button onClick={() => setQty(item.id, 0)} className="w-12 h-12 flex items-center justify-center flex-shrink-0 active:scale-90" aria-label={`Remove ${item.name}`}>
                <Delete02Icon size={18} color="#DC2626" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 pr-3">
              <p className="min-w-0 text-[13px] text-neutral-400 truncate" style={{ fontFamily: FF }}>{formatCurrency(price(item))} each</p>
              <div className="flex items-center rounded-xl flex-shrink-0" style={{ background: "#EAF3E5" }}>
                <button onClick={() => setQty(item.id, qty - 1)} className="w-12 h-12 flex items-center justify-center active:scale-90" aria-label={`Decrease ${item.name}`}>
                  <MinusSignIcon size={16} color="#374151" />
                </button>
                <span className="text-[16px] font-black text-spal-navy min-w-[28px] text-center" style={{ fontFamily: FF }}>{qty}</span>
                <button onClick={() => setQty(item.id, qty + 1)} className="w-12 h-12 flex items-center justify-center active:scale-90" aria-label={`Increase ${item.name}`}>
                  <PlusSignIcon size={16} color="#374151" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key={item.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="min-w-0" style={{ width: 96 }}>
              <p className="text-[15px] font-black text-spal-navy truncate" style={{ fontFamily: FF }}>{item.name}</p>
              <p className="text-[13px] text-neutral-400" style={{ fontFamily: FF }}>{formatCurrency(price(item))}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 flex-shrink-0" style={{ background: "#EAF3E5" }}>
              <button onClick={() => setQty(item.id, qty - 1)} className="w-7 h-7 flex items-center justify-center active:scale-90" aria-label="Decrease">
                <MinusSignIcon size={15} color="#374151" />
              </button>
              <span className="text-[15px] font-black text-spal-navy min-w-[16px] text-center" style={{ fontFamily: FF }}>{qty}</span>
              <button onClick={() => setQty(item.id, qty + 1)} className="w-7 h-7 flex items-center justify-center active:scale-90" aria-label="Increase">
                <PlusSignIcon size={15} color="#374151" />
              </button>
            </div>
            <span className="text-[15px] font-black text-spal-navy ml-auto flex-shrink-0" style={{ fontFamily: FF }}>{formatCurrency(price(item) * qty)}</span>
            <button onClick={() => setQty(item.id, 0)} className="w-7 h-7 flex items-center justify-center flex-shrink-0 active:scale-90" aria-label="Remove">
              <Delete02Icon size={17} color="#DC2626" />
            </button>
          </div>
        ))}
        {lines.length === 0 && (
          <p className="text-center text-[14px] text-neutral-400 pt-10" style={{ fontFamily: FF }}>Your cart is empty.</p>
        )}
        {instructions !== undefined && lines.length > 0 && (
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add Special instructions"
            aria-label="Special instructions"
            rows={5}
            className="w-full rounded-2xl px-4 py-4 text-[15px] text-spal-navy outline-none resize-none placeholder:text-neutral-300"
            style={{ fontFamily: FF, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          />
        )}
      </div>

      <div className="px-5 pt-3 pb-safe">
        <div className="bg-white rounded-2xl px-4 py-3.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Row label="Sub-total" value={formatCurrency(subtotal)} muted />
          <Row label="Discount" value={formatCurrency(discount)} muted />
          <Row label={vatLabel} value={formatCurrency(vat)} muted />
          <div className="h-px my-2" style={{ background: "#EEF0EC" }} />
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-black text-spal-navy" style={{ fontFamily: FF }}>Total</span>
            <span className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(total)}</span>
          </div>
        </div>
        <button onClick={onTakePayment} disabled={lines.length === 0}
          className="w-full mt-4 h-14 rounded-full text-white font-black text-[17px] active:scale-[0.98] transition-transform disabled:opacity-40"
          style={{ background: "#22C55E", fontFamily: FF }}>
          Take Payment
        </button>
      </div>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[14.5px]" style={{ fontFamily: FF, color: muted ? "#6B7280" : "#0F172A" }}>{label}</span>
      <span className="text-[14.5px] font-bold text-spal-navy" style={{ fontFamily: FF }}>{value}</span>
    </div>
  );
}

// ── Payment drawer ───────────────────────────────────────────────────────────
function PaymentPanel({
  subtotal, discount, vat, vatLabel, total, method, setMethod, amountMode, setAmountMode, otherAmount, setOtherAmount, change, saving, onConfirm,
}: {
  subtotal: number; discount: number; vat: number; vatLabel: string; total: number;
  method: PayMethod | null; setMethod: (m: PayMethod) => void;
  amountMode: "full" | "other"; setAmountMode: (m: "full" | "other") => void;
  otherAmount: string; setOtherAmount: (v: string) => void;
  change: number; saving: boolean; onConfirm: () => void;
}) {
  const showAmount = method != null && method !== "debt";
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="text-[26px] font-black text-spal-navy mb-4" style={{ fontFamily: FF }}>Choose a Payment Option</h2>

        <div className="bg-white rounded-2xl px-4 py-3.5 mb-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Row label="Sub-total" value={formatCurrency(subtotal)} muted />
          <Row label="Discount" value={formatCurrency(discount)} muted />
          <Row label={vatLabel} value={formatCurrency(vat)} muted />
          <div className="h-px my-2" style={{ background: "#EEF0EC" }} />
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-black text-spal-navy" style={{ fontFamily: FF }}>Total</span>
            <span className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PAY_OPTIONS.map(({ id, label, Icon }) => {
            const on = method === id;
            return (
              <button key={id} onClick={() => setMethod(id)}
                className="bg-white rounded-2xl px-4 py-4 flex items-center gap-2.5 active:scale-[0.98] transition-all"
                style={{ border: on ? "2px solid #22C55E" : "2px solid transparent", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <Icon size={22} color="#0F172A" />
                <span className="text-[15px] font-black text-spal-navy leading-tight flex-1 text-left" style={{ fontFamily: FF }}>{label}</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: on ? "none" : "2px solid #D1D5DB", background: on ? "#22C55E" : "transparent" }}>
                  {on && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>

        {showAmount && (
          <div className="mt-6">
            <p className="text-[13px] font-bold text-neutral-500 mb-2.5" style={{ fontFamily: FF }}>Amount Paid</p>
            <div className="flex flex-wrap items-center gap-2 min-[360px]:gap-3">
              <button onClick={() => setAmountMode("full")}
                className="px-5 h-12 rounded-full font-bold text-[15px] active:scale-95"
                style={{ fontFamily: FF, background: amountMode === "full" ? "#0F172A" : "#fff", color: amountMode === "full" ? "#fff" : "#0F172A" }}>
                {formatCurrency(total)}
              </button>
              <button onClick={() => setAmountMode("other")}
                className="px-5 h-12 rounded-full font-bold text-[15px] active:scale-95"
                style={{ fontFamily: FF, background: amountMode === "other" ? "#0F172A" : "#fff", color: amountMode === "other" ? "#fff" : "#0F172A" }}>
                Other Amount
              </button>
            </div>

            {amountMode === "other" && (
              <div className="mt-4">
                <div className="flex items-center gap-2 bg-white rounded-2xl px-4" style={{ height: 56, border: "2px solid #22C55E" }}>
                  <span className="text-[17px] font-bold text-neutral-400" style={{ fontFamily: FF }}>₦</span>
                  <input type="number" inputMode="numeric" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} placeholder="0"
                    className="flex-1 bg-transparent outline-none text-[17px] font-bold text-spal-navy" style={{ fontFamily: FF }} autoFocus />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[15px] text-neutral-500" style={{ fontFamily: FF }}>Change Due for Customer</span>
                  <span className="text-[15px] font-black" style={{ fontFamily: FF, color: change < 0 ? "#DC2626" : "#16A34A" }}>
                    {change < 0 ? "-" : ""}{formatCurrency(Math.abs(change))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pt-2 pb-safe">
        <button onClick={onConfirm} disabled={!method || saving}
          className="w-full h-14 rounded-full text-white font-black text-[17px] active:scale-[0.98] transition-transform disabled:opacity-40"
          style={{ background: method ? "#22C55E" : "#CBD5C0", fontFamily: FF }}>
          {saving ? "Saving…" : "Confirm Payment"}
        </button>
      </div>
    </>
  );
}

// ── Success drawer ───────────────────────────────────────────────────────────
function SuccessPanel({
  lines, vat, vatLabel, total, method, receiptNo, onDone,
}: {
  lines: { item: InventoryItem; qty: number }[];
  vat: number; vatLabel: string; total: number; method: PayMethod; receiptNo: string; onDone: () => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex flex-col items-center pt-6">
          <span className="rounded-full flex items-center justify-center" style={{ width: 150, height: 150, background: "#E4F3E7" }}>
            <span className="rounded-full flex items-center justify-center" style={{ width: 110, height: 110, background: "#218739" }}>
              <CheckmarkCircle02Icon size={54} color="#fff" />
            </span>
          </span>
          <p className="text-[24px] font-black text-spal-navy mt-6" style={{ fontFamily: FF }}>Payment Received</p>
          <p className="text-[14px] text-neutral-500 mt-1.5 text-center" style={{ fontFamily: FF }}>
            {formatCurrency(total)} paid by {PAY_LABEL[method]} · POS Terminal ({receiptNo})
          </p>
        </div>

        <div className="bg-white rounded-2xl px-4 py-3.5 mt-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {lines.map(({ item, qty }) => (
            <Row key={item.id} label={item.name} value={formatCurrency(price(item) * qty)} muted />
          ))}
          <Row label={vatLabel} value={formatCurrency(vat)} muted />
          <div className="h-px my-2" style={{ background: "#EEF0EC" }} />
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-black text-spal-navy" style={{ fontFamily: FF }}>Total</span>
            <span className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button className="bg-white rounded-2xl h-14 flex items-center justify-center gap-2 active:scale-[0.98]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <PrinterIcon size={19} color="#0F172A" />
            <span className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: FF }}>Print Receipt</span>
          </button>
          <button className="bg-white rounded-2xl h-14 flex items-center justify-center gap-2 active:scale-[0.98]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <Navigation03Icon size={19} color="#0F172A" />
            <span className="text-[15px] font-bold text-spal-navy" style={{ fontFamily: FF }}>Send Receipt</span>
          </button>
        </div>
      </div>

      <div className="px-5 pt-3 pb-safe">
        <button onClick={onDone}
          className="w-full h-14 rounded-full text-white font-black text-[17px] active:scale-[0.98] transition-transform"
          style={{ background: "#22C55E", fontFamily: FF }}>
          Mark as Done
        </button>
      </div>
    </>
  );
}
