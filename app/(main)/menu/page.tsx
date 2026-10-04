"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search01Icon, Dish01Icon, Image02Icon, PlusSignIcon, MinusSignIcon,
  SidebarRight01Icon, Notebook01Icon, MenuRestaurantIcon, Alert02Icon,
} from "hugeicons-react";
import { AppHeader } from "@/components/home/AppHeader";
import { useBusinessMode } from "@/hooks/useBusinessMode";
import { formatCurrency } from "@/lib/utils/currency";
import { typeNoun } from "@/lib/menu-config";
import { markSetupSeen } from "@/lib/setup-progress";
import type { MenuItem } from "@/lib/types";

const BG     = "#EDF3E8";
const IMG_BG = "#ECEFFB";
const FF     = "var(--font-satoshi)";
const SHADOW = "0 1px 4px rgba(0,0,0,0.05)";

const soldLabel = (it: MenuItem) => `${it.sold}/${it.quantity} ${it.unit.toLowerCase()} sold`;
const soldFill  = (it: MenuItem) => (it.quantity > 0 ? Math.min(1, it.sold / it.quantity) : 0);

/** "8 Food Items", or "4 Packs, 3 Bottles" when a category is all drinks. */
function categorySummary(list: MenuItem[]) {
  if (list.every((it) => it.menu_type === "drinks")) {
    const byUnit = new Map<string, number>();
    list.forEach((it) => byUnit.set(it.unit, (byUnit.get(it.unit) ?? 0) + 1));
    return [...byUnit.entries()].map(([u, n]) => `${n} ${u}`).join(", ");
  }
  return `${list.length} Food Item${list.length !== 1 ? "s" : ""}`;
}

export default function MenuPage() {
  const router = useRouter();
  const isBar = useBusinessMode().type === "bar_owner";

  const [items, setItems]     = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [query, setQuery]     = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [page, setPage]       = useState(0);
  const [detail, setDetail]   = useState<MenuItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const catScroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await fetch("/api/menu").then((r) => r.json());
      if (d.success) setItems(d.data?.items ?? []); else setError(true);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    items.forEach((it) => { if (it.category) map.set(it.category, [...(map.get(it.category) ?? []), it]); });
    return [...map.entries()].map(([name, list]) => ({ name, summary: categorySummary(list) }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => (!activeCat || it.category === activeCat) && (!q || it.name.toLowerCase().includes(q)));
  }, [items, activeCat, query]);

  async function adjustQty(item: MenuItem, next: number) {
    const q = Math.max(0, next);
    setDetail((d) => (d && d.id === item.id ? { ...d, quantity: q } : d));
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quantity: q } : it)));
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: q }),
    }).catch(() => {});
  }

  function openDetail(it: MenuItem) { setSelectedId(it.id); setDetail(it); }
  function closeDetail() { setDetail(null); }

  const Header = <AppHeader />;

  // Floating "New Menu" button, sitting above the tab bar.
  const Fab = (
    <div className="cta-bottom fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 min-[360px]:px-5 z-30 flex justify-end pointer-events-none">
      <button
        onClick={() => router.push("/menu/add")}
        aria-label="Add a new menu item"
        className="pointer-events-auto h-14 px-6 rounded-2xl flex items-center gap-2.5 text-white font-black text-[17px] active:scale-95 transition-transform"
        style={{ background: "#22C55E", fontFamily: FF, boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
      >
        <MenuRestaurantIcon size={21} color="#fff" /> New Menu
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-full" style={{ background: BG, fontFamily: FF }}>
        {Header}
        <div className="flex items-center justify-center" style={{ paddingTop: "30vh" }}>
          <div className="w-6 h-6 rounded-full border-2 border-spal-green border-t-transparent animate-spin" role="status" aria-label="Loading menu" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full" style={{ background: BG, fontFamily: FF }}>
        {Header}
        <div className="px-5 mt-8">
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: "#FEE0E1" }}>
            <Alert02Icon size={20} color="#DC2626" />
            <p className="flex-1 text-[13px] font-semibold text-red-700">Couldn&apos;t load your menu. Check your connection.</p>
            <button onClick={load} aria-label="Try again" className="h-12 px-4 rounded-xl bg-white text-[13px] font-bold text-red-600 active:scale-95">Try again</button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-full pb-nav-fab" style={{ background: BG, fontFamily: FF }}>
        {Header}
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: "24vh" }}>
          <Dish01Icon size={56} color="#6B7280" strokeWidth={1.4} />
          <p className="text-[24px] font-black text-spal-navy mt-4">No menu available</p>
          <p className="text-[15px] text-neutral-500 mt-1">Add your menu item and start taking orders</p>
        </div>
        {Fab}
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(categories.length / 3));

  return (
    <>
      <div className="min-h-full pb-nav-fab" style={{ background: BG, fontFamily: FF }}>
        {Header}

        {/* Search */}
        <div className="px-5 mt-5">
          <div className="flex items-center gap-2.5 bg-white rounded-2xl px-4" style={{ height: 52, boxShadow: SHADOW }}>
            <Search01Icon size={18} color="#9CA3AF" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isBar ? "Search drinks..." : "Search food..."}
              aria-label="Search menu"
              className="flex-1 bg-transparent outline-none text-[15px] text-spal-navy placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-5">
            <h2 className="px-5 text-[24px] font-black text-spal-navy mb-3">Categories</h2>
            <div
              ref={catScroller}
              onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden px-5"
              style={{ scrollbarWidth: "none", gap: 14 }}
            >
              {categories.map((c) => {
                const on = activeCat === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => { if (!on) markSetupSeen("category"); setActiveCat(on ? null : c.name); }}
                    aria-label={`${c.name}, ${c.summary}`}
                    aria-pressed={on}
                    className="snap-start shrink-0 text-left active:scale-[0.98] transition-transform"
                    style={{ width: 168 }}
                  >
                    <div className="w-14 h-3 rounded-t-xl -mb-1 ml-1" style={{ background: on ? "#22C55E" : "#fff" }} />
                    <div className="rounded-2xl rounded-tl-none px-4 py-5 flex flex-col justify-center" style={{ background: on ? "#22C55E" : "#fff", boxShadow: SHADOW, minHeight: 96 }}>
                      <p className="text-[19px] font-black leading-tight truncate" style={{ color: on ? "#fff" : "#0F172A" }}>{c.name}</p>
                      <p className="text-[14px] mt-1 truncate" style={{ color: on ? "rgba(255,255,255,0.85)" : "#9CA3AF" }}>{c.summary}</p>
                    </div>
                  </button>
                );
              })}
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

        {/* Menu grid */}
        {filtered.length === 0 ? (
          <div className="px-5 mt-8 text-center">
            <p className="text-[16px] font-black text-spal-navy">Nothing found</p>
            <p className="text-[14px] text-neutral-500 mt-1">Try another name or category.</p>
          </div>
        ) : (
          <div className="px-5 mt-5 grid grid-cols-2 gap-3.5">
            {filtered.map((it) => {
              const on = selectedId === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => openDetail(it)}
                  aria-label={`${it.name}, ${formatCurrency(it.price)}`}
                  className="text-left bg-white rounded-2xl overflow-hidden active:scale-[0.98] transition-transform min-w-0"
                  style={{ boxShadow: SHADOW, border: on ? "2px solid #22C55E" : "2px solid transparent" }}
                >
                  <div className="m-2 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: IMG_BG, height: 120 }}>
                    {it.image_url
                      ? <Image src={it.image_url} alt="" width={160} height={120} className="h-full w-full object-cover" />
                      : <Image02Icon size={38} color="#8A8FA3" />}
                  </div>
                  <div className="px-3 pb-3.5">
                    <p className="text-[16px] font-black text-spal-navy truncate">{it.name}</p>
                    <p className="text-[14px] font-medium text-neutral-400 mt-0.5">{formatCurrency(it.price)}</p>
                    <p className="text-[13px] font-semibold mt-2 truncate" style={{ color: it.sold > 0 ? "#16A34A" : "#6B7280" }}>{soldLabel(it)}</p>
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#DCEBD6" }}>
                      <div className="h-full rounded-full" style={{ width: `${soldFill(it) * 100}%`, background: "#16A34A" }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {Fab}

      {/* Item detail drawer */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]" style={{ background: "rgba(10,14,26,0.35)" }} onClick={closeDetail}
            />
            <motion.div
              key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-[88%] max-w-[440px] flex flex-col overflow-y-auto"
              style={{ background: BG, fontFamily: FF }}
            >
              <ItemDetail item={detail} onClose={closeDetail} onAdjust={adjustQty} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ItemDetail({ item, onClose, onAdjust }: { item: MenuItem; onClose: () => void; onAdjust: (it: MenuItem, next: number) => void }) {
  const gallery = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
  // Two photos per white card, as in the design.
  const rows: string[][] = [];
  for (let i = 0; i < gallery.length; i += 2) rows.push(gallery.slice(i, i + 2));

  return (
    <>
      <div className="relative flex items-center justify-center" style={{ background: IMG_BG, minHeight: 300 }}>
        {gallery[0]
          ? <Image src={gallery[0]} alt={item.name} width={320} height={320} className="h-[280px] w-auto object-contain" />
          : <Image02Icon size={72} color="#8A8FA3" />}
        <button onClick={onClose} aria-label="Close" className="absolute top-10 right-4 w-12 h-12 rounded-xl flex items-center justify-center active:scale-95">
          <SidebarRight01Icon size={22} color="#475467" />
        </button>
        <button
          onClick={() => { window.location.href = `/menu/add?id=${item.id}`; }}
          aria-label={`Edit ${item.name}`}
          className="absolute right-5 bottom-5 flex items-center gap-2 h-12 px-5 rounded-2xl text-white font-black text-[16px] active:scale-95"
          style={{ background: "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.4)" }}
        >
          <Notebook01Icon size={19} color="#fff" /> Edit Item
        </button>
      </div>

      <div className="px-5 pt-5 pb-10">
        <h2 className="text-[28px] font-black text-spal-navy">{item.name}</h2>
        <p className="text-[18px] font-medium text-neutral-400 mt-1">{formatCurrency(item.price)}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="px-3.5 py-1.5 rounded-full bg-white text-[13.5px] font-semibold text-spal-navy">{typeNoun(item.menu_type)}</span>
          {item.category && (
            <>
              <span className="text-neutral-400" aria-hidden>*</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white text-[13.5px] font-semibold text-spal-navy">{item.category}</span>
            </>
          )}
        </div>

        {rows.map((row, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 mt-4 grid grid-cols-2 gap-3">
            {row.map((url, j) => (
              <div key={j} className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: IMG_BG, aspectRatio: "1 / 1" }}>
                <Image src={url} alt="" width={200} height={200} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ))}

        <div className="bg-white rounded-2xl px-4 py-4 mt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-neutral-500">Measured by</span>
            <span className="text-[15px] font-black text-spal-navy">{item.unit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-neutral-500">Quantity Available</span>
            <span className="text-[15px] font-black text-spal-navy">{item.quantity}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-4 py-3.5 mt-4 flex items-center justify-between">
          <span className="text-[16px] font-black text-spal-navy">Quantity</span>
          <div className="flex items-center gap-2 rounded-xl px-1 py-1" style={{ background: "#EAF3E5" }}>
            <button onClick={() => onAdjust(item, item.quantity - 1)} aria-label="Decrease quantity" className="w-12 h-12 flex items-center justify-center active:scale-90">
              <MinusSignIcon size={16} color="#374151" />
            </button>
            <span className="text-[17px] font-black text-spal-navy min-w-[36px] text-center">{item.quantity}</span>
            <button onClick={() => onAdjust(item, item.quantity + 1)} aria-label="Increase quantity" className="w-12 h-12 flex items-center justify-center active:scale-90">
              <PlusSignIcon size={16} color="#374151" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
