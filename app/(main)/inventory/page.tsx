"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Search01Icon, Notification03Icon, QrCode01Icon, CubeIcon, Store01Icon,
  Package01Icon, PlusSignIcon, MinusSignIcon, SidebarRight01Icon, Notebook01Icon,
  PlayIcon, PauseIcon, Tick02Icon,
} from "hugeicons-react";
import { useSPALStore } from "@/store";
import { formatCurrency } from "@/lib/utils/currency";
import type { InventoryItem } from "@/lib/types";

const BG     = "#EEF3E9";
const IMG_BG = "#ECECF7";
const FF     = "var(--font-satoshi)";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
const price = (it: InventoryItem) => it.selling_price ?? it.cost_price ?? 0;
const isLow = (it: InventoryItem) => it.quantity > 0 && it.quantity <= it.low_stock_threshold;
function stockProgress(it: InventoryItem) {
  if (it.initial_stock && it.initial_stock > 0) {
    const sold = Math.max(0, it.initial_stock - it.quantity);
    return { label: `${sold}/${it.initial_stock} sold`, fill: Math.min(1, sold / it.initial_stock), tone: "sold" as const };
  }
  const fill = it.quantity <= 0 ? 0 : Math.min(1, Math.max(0.06, it.quantity / (it.low_stock_threshold * 5 || 20)));
  return { label: `${it.quantity} ${it.unit} left`, fill, tone: "stock" as const };
}

export default function StockPage() {
  const { user, activeBusiness } = useSPALStore();
  const businessName = activeBusiness?.business_name || user?.business_name || "Your Store";

  const [items, setItems]     = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<InventoryItem | null>(null);
  const [showCats, setShowCats] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const catScroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("spal-cat-order"); if (s) setOrder(JSON.parse(s)); } catch { /* ignore */ }
  }, []);
  function saveOrder(next: string[]) {
    setOrder(next);
    try { localStorage.setItem("spal-cat-order", JSON.stringify(next)); } catch { /* ignore */ }
  }

  async function adjustQty(item: InventoryItem, next: number) {
    const q = Math.max(0, next);
    setDetail((d) => d && d.id === item.id ? { ...d, quantity: q } : d);
    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, quantity: q } : it));
    await fetch(`/api/inventory/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: q }),
    }).catch(() => {});
  }

  async function setThumbnail(item: InventoryItem, url: string) {
    const rest = (item.images ?? []).filter((u) => u !== url);
    const images = [url, ...rest];
    const patch = { image_url: url, images };
    setDetail((d) => d && d.id === item.id ? { ...d, ...patch } : d);
    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, ...patch } : it));
    await fetch(`/api/inventory/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    }).catch(() => {});
  }

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const d = await res.json();
      if (d.success) setItems(d.data.items ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const countMap = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((it) => { if (it.category) counts.set(it.category, (counts.get(it.category) ?? 0) + 1); });
    return counts;
  }, [items]);

  // Apply the user's saved order; unknown/new categories fall to the end alphabetically.
  const categories = useMemo(() => {
    const names = Array.from(countMap.keys());
    const known = order.filter((n) => names.includes(n));
    const rest = names.filter((n) => !order.includes(n)).sort((a, b) => a.localeCompare(b));
    return [...known, ...rest].map((name) => ({ name, count: countMap.get(name) ?? 0 }));
  }, [countMap, order]);

  const filtered = activeCat ? items.filter((it) => it.category === activeCat) : items;

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full border-2 border-spal-green border-t-transparent animate-spin" />
      </div>
    );
  }

  const Header = (
    <>
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
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Search"><Search01Icon size={19} color="#6B7280" /></button>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Notifications"><Notification03Icon size={19} color="#6B7280" /></button>
      </div>
      <div className="px-5 pt-1 pb-4 flex items-center gap-2.5">
        <div className="flex-1 flex items-center gap-2.5 bg-white/70 rounded-2xl px-4" style={{ height: 52 }}>
          <Search01Icon size={18} color="#9CA3AF" />
          <input placeholder="Search products by name or SKU..." className="flex-1 bg-transparent outline-none text-[14px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
        </div>
        <button className="rounded-2xl flex items-center justify-center active:scale-95" style={{ background: "#22C55E", height: 52, width: 52 }} aria-label="Scan"><QrCode01Icon size={22} color="#fff" /></button>
      </div>
    </>
  );

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-full" style={{ background: BG, fontFamily: FF }}>
        {Header}
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "28vh" }}>
          <CubeIcon size={54} color="#9AA3AF" strokeWidth={1.4} />
          <p className="text-[22px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>No item in inventory</p>
          <p className="text-[15px] text-neutral-500 mt-1" style={{ fontFamily: FF }}>Add your first inventory item</p>
          <button onClick={() => { window.location.href = "/inventory/add"; }}
            className="mt-6 h-13 px-6 rounded-2xl flex items-center gap-2.5 text-white font-black text-[16px] active:scale-[0.98] transition-transform"
            style={{ background: "#22C55E", fontFamily: FF, height: 56 }}>
            <Store01Icon size={20} color="#fff" /> Add Inventory
          </button>
        </div>
      </div>
    );
  }

  // Categories carousel — chunk into pages of 3 folder cards; last page ends with "View More".
  const pageSize = 3;
  const pages = Math.max(1, Math.ceil((categories.length + 1) / pageSize));

  return (
    <>
      <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
        {Header}

        {categories.length > 0 && (
          <div className="mb-2">
            <h2 className="px-5 text-[26px] font-black text-spal-navy mb-3" style={{ fontFamily: FF }}>Categories</h2>
            <div
              ref={catScroller}
              onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden px-5"
              style={{ scrollbarWidth: "none", gap: 14 }}
            >
              {categories.map((c) => {
                const on = activeCat === c.name;
                return (
                  <button key={c.name} onClick={() => setActiveCat(on ? null : c.name)}
                    className="snap-start shrink-0 text-left active:scale-[0.98] transition-transform" style={{ width: 168 }}>
                    <div className="w-14 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: on ? "#22C55E" : "#fff" }} />
                    <div className="rounded-2xl rounded-tl-none px-4 py-5 flex flex-col justify-center" style={{ background: on ? "#22C55E" : "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", minHeight: 96 }}>
                      <p className="text-[19px] font-black leading-tight" style={{ fontFamily: FF, color: on ? "#fff" : "#0F172A" }}>{c.name}</p>
                      <p className="text-[14px] mt-1" style={{ fontFamily: FF, color: on ? "rgba(255,255,255,0.85)" : "#9CA3AF" }}>{c.count} Item{c.count !== 1 ? "s" : ""}</p>
                    </div>
                  </button>
                );
              })}
              {/* View More — only when there are more than 4 categories */}
              {categories.length > 4 && (
                <button onClick={() => setShowCats(true)}
                  className="snap-start shrink-0 text-left active:scale-[0.98] transition-transform" style={{ width: 168 }}>
                  <div className="w-14 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: "#16A34A" }} />
                  <div className="rounded-2xl rounded-tl-none px-4 py-5 flex flex-col justify-center" style={{ background: "#22C55E", minHeight: 96 }}>
                    <p className="text-[19px] font-black leading-tight text-white" style={{ fontFamily: FF }}>View More</p>
                    <p className="text-[14px] mt-1" style={{ fontFamily: FF, color: "rgba(255,255,255,0.85)" }}>Click for More</p>
                  </div>
                </button>
              )}
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: pages }).map((_, i) => (
                  <span key={i} className="rounded-full transition-all" style={{ width: i === page ? 16 : 7, height: 7, background: i === page ? "#22C55E" : "#CBD5C0" }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product grid */}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3.5">
          {filtered.map((it) => {
            const low = isLow(it);
            const prog = stockProgress(it);
            return (
              <button key={it.id} onClick={() => setDetail(it)} className="text-left bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
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
      </div>

      {/* Product detail drawer */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]" style={{ background: "rgba(10,14,26,0.35)" }} onClick={() => setDetail(null)} />
            <motion.div key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-[88%] max-w-[440px] flex flex-col overflow-y-auto"
              style={{ background: "#EDF3E8", fontFamily: FF }}>
              <ProductDetail item={detail} onClose={() => setDetail(null)} onAdjust={adjustQty} onSetThumb={setThumbnail} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* All categories — partial drawer with drag-to-reorder */}
      <AnimatePresence>
        {showCats && (
          <>
            <motion.div key="cscrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]" style={{ background: "rgba(10,14,26,0.35)" }} onClick={() => setShowCats(false)} />
            <motion.div key="cpanel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-[88%] max-w-[440px] flex flex-col overflow-y-auto"
              style={{ background: "#EDF3E8", fontFamily: FF }}>
              <div className="flex justify-end px-5 pt-12 pb-1">
                <button onClick={() => setShowCats(false)} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95"
                  style={{ border: "1.5px solid #C7D2C0" }} aria-label="Close">
                  <SidebarRight01Icon size={18} color="#475467" />
                </button>
              </div>
              <div className="px-5 pb-8">
                <h2 className="text-[26px] font-black text-spal-navy" style={{ fontFamily: FF }}>All Categories</h2>
                <p className="text-[13.5px] text-neutral-500 mt-1 mb-4" style={{ fontFamily: FF }}>Drag to reorder how they show on Inventory.</p>
                <Reorder.Group axis="y" values={categories.map((c) => c.name)} onReorder={saveOrder} className="space-y-3">
                  {categories.map((c) => (
                    <Reorder.Item key={c.name} value={c.name} whileDrag={{ scale: 1.03, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
                      className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3 cursor-grab active:cursor-grabbing"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <span className="grid grid-cols-2 gap-x-1 gap-y-1 flex-shrink-0">
                        {Array.from({ length: 6 }).map((_, i) => <span key={i} className="w-1 h-1 rounded-full" style={{ background: "#CBD5C0" }} />)}
                      </span>
                      <button onClick={() => { setActiveCat(c.name); setShowCats(false); }} className="flex-1 text-left">
                        <p className="text-[16px] font-bold text-spal-navy" style={{ fontFamily: FF }}>{c.name}</p>
                        <p className="text-[13px] text-neutral-400" style={{ fontFamily: FF }}>{c.count} Item{c.count !== 1 ? "s" : ""}</p>
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Add Inventory */}
      <AnimatePresence>
        <motion.button
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => { window.location.href = "/inventory/add"; }}
          className="fixed right-4 left-auto flex items-center gap-2.5 h-14 px-6 rounded-2xl text-white font-black text-[16px] active:scale-95 transition-transform z-40"
          style={{ background: "#22C55E", fontFamily: FF, bottom: "calc(var(--bottom-nav-h, 88px) + 8px)", boxShadow: "0 8px 24px rgba(34,197,94,0.4)" }}
        >
          <Store01Icon size={20} color="#fff" /> Add Inventory
        </motion.button>
      </AnimatePresence>
    </>
  );
}

function ProductDetail({ item, onClose, onAdjust, onSetThumb }: {
  item: InventoryItem; onClose: () => void;
  onAdjust: (item: InventoryItem, next: number) => void;
  onSetThumb: (item: InventoryItem, url: string) => void;
}) {
  const gallery = item.images && item.images.length ? item.images : item.image_url ? [item.image_url] : [];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const cover = item.image_url ?? gallery[0] ?? null;
  const activeUrl = gallery[active];
  const isCover = activeUrl != null && activeUrl === cover;

  // Auto-advance the hero carousel until the user pauses or interacts.
  useEffect(() => {
    if (paused || gallery.length <= 1) return;
    const t = setInterval(() => {
      const el = scroller.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % gallery.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(t);
  }, [paused, gallery.length]);

  return (
    <>
      {/* Hero carousel */}
      <div className="relative" style={{ background: IMG_BG }}>
        <div
          ref={scroller}
          onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          onPointerDown={() => setPaused(true)}
          className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {gallery.length === 0 ? (
            <div className="shrink-0 w-full flex items-center justify-center" style={{ minHeight: 320 }}>
              <Package01Icon size={72} color="#B7B7D6" />
            </div>
          ) : gallery.map((url, i) => (
            <div key={i} className="snap-center shrink-0 w-full flex items-center justify-center" style={{ minHeight: 320 }}>
              <Image src={url} alt="" width={320} height={320} className="h-[300px] w-auto object-contain" />
            </div>
          ))}
        </div>

        <button onClick={onClose} className="absolute top-12 right-5 w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center active:scale-95" aria-label="Close">
          <SidebarRight01Icon size={18} color="#475467" />
        </button>

        {gallery.length > 1 && (
          <button onClick={() => setPaused((p) => !p)}
            className="absolute top-12 left-5 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center active:scale-95"
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}>
            {paused ? <PlayIcon size={17} color="#0F172A" /> : <PauseIcon size={17} color="#0F172A" />}
          </button>
        )}

        <button onClick={() => { window.location.href = `/inventory/add?id=${item.id}`; }}
          className="absolute right-5 bottom-5 flex items-center gap-2 h-12 px-5 rounded-2xl text-white font-black text-[16px] active:scale-95"
          style={{ background: "#22C55E", fontFamily: FF, boxShadow: "0 8px 24px rgba(34,197,94,0.4)" }}>
          <Notebook01Icon size={19} color="#fff" /> Edit Item
        </button>
      </div>

      {/* Carousel controls: dots + cover picker */}
      {gallery.length > 0 && (
        <div className="px-5 pt-3">
          {gallery.length > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {gallery.map((_, i) => (
                <button key={i} onClick={() => { setPaused(true); scroller.current?.scrollTo({ left: i * (scroller.current?.clientWidth ?? 0), behavior: "smooth" }); }}
                  aria-label={`Image ${i + 1}`} className="rounded-full transition-all" style={{ width: i === active ? 16 : 7, height: 7, background: i === active ? "#22C55E" : "#CBD5C0" }} />
              ))}
            </div>
          )}
          {isCover ? (
            <p className="text-center text-[13px] font-bold mt-2.5 flex items-center justify-center gap-1.5" style={{ fontFamily: FF, color: "#16A34A" }}>
              <Tick02Icon size={15} color="#16A34A" /> Cover photo
            </p>
          ) : (
            <button onClick={() => activeUrl && onSetThumb(item, activeUrl)}
              className="w-full mt-3 h-11 rounded-full font-bold text-[14px] active:scale-[0.98]"
              style={{ fontFamily: FF, color: "#22C55E", border: "1.5px solid #22C55E" }}>
              Set as cover photo
            </button>
          )}
        </div>
      )}

      <div className="px-5 pt-5 pb-10">
        <h2 className="text-[28px] font-black text-spal-navy" style={{ fontFamily: FF }}>{item.name}</h2>
        <p className="text-[18px] font-medium text-neutral-400 mt-1" style={{ fontFamily: FF }}>{formatCurrency(price(item))}</p>

        {/* Category tag (only what the user entered) */}
        {item.category && (
          <div className="flex items-center gap-2 mt-3">
            <span className="px-3.5 py-1.5 rounded-full bg-white text-[13.5px] font-semibold text-spal-navy" style={{ fontFamily: FF }}>{item.category}</span>
          </div>
        )}

        {/* Quantity available */}
        <div className="bg-white rounded-2xl px-4 py-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-neutral-500" style={{ fontFamily: FF }}>Quantity Available</span>
            <span className="text-[15px] font-black text-spal-navy" style={{ fontFamily: FF }}>{item.initial_stock ?? item.quantity}</span>
          </div>
        </div>

        {/* Quantity stepper */}
        <div className="bg-white rounded-2xl px-4 py-3.5 mt-4 flex items-center justify-between">
          <span className="text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>Quantity</span>
          <div className="flex items-center gap-4 rounded-xl px-3 py-2" style={{ background: "#EAF3E5" }}>
            <button onClick={() => onAdjust(item, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center active:scale-90" aria-label="Decrease">
              <MinusSignIcon size={16} color="#374151" />
            </button>
            <span className="text-[16px] font-black text-spal-navy min-w-[28px] text-center" style={{ fontFamily: FF }}>{item.quantity}</span>
            <button onClick={() => onAdjust(item, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center active:scale-90" aria-label="Increase">
              <PlusSignIcon size={16} color="#374151" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
