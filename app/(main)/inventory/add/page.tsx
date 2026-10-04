"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft01Icon, QrCode01Icon, Image02Icon, InformationCircleIcon,
  PlusSignIcon, ArrowDown01Icon, ArrowUp01Icon, MinusSignCircleIcon, Cancel01Icon, Tick01Icon,
} from "hugeicons-react";
import type { InventoryItem, InventoryVariation } from "@/lib/types";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

// A locally-previewed image that uploads in the background.
type Pic = { id: string; preview: string; url?: string; uploading: boolean; failed?: boolean };

const inputCls = "w-full rounded-2xl px-4 text-[15px] text-spal-navy outline-none placeholder:text-neutral-400";
const inputStyle = { fontFamily: FF, background: "#fff", border: "1.5px solid #E5E7EB", height: 56 } as const;

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] font-bold text-spal-navy mb-2" style={{ fontFamily: FF }}>{children}</p>;
}

const TIP_SKU  = "SKU is your own product code for tracking stock, like BC-50CL. You make it up yourself, and it's optional.";
const TIP_GTIN = "GTIN is the barcode number printed on the product (UPC, EAN or ISBN). Type or scan the digits under the barcode.";
const TIP_DISCOUNT = "An amount taken off the selling price at checkout. It must be less than the selling price.";
const TIP_LOWSTOCK = "We'll warn you when the stock drops to this number, so you can restock in time.";

function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative flex items-center">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} aria-label="More info" className="flex items-center justify-center active:scale-90">
        <InformationCircleIcon size={18} color="#9CA3AF" />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span className="absolute z-40 right-0 bottom-full mb-2.5 w-56 rounded-2xl px-3.5 py-2.5 text-white text-[12.5px] leading-relaxed"
            style={{ fontFamily: FF, background: "#0F172A", boxShadow: "0 10px 30px rgba(0,0,0,0.22)" }}>
            {text}
            <span className="absolute right-3 top-full w-3 h-3 rotate-45 -translate-y-1.5" style={{ background: "#0F172A" }} />
          </span>
        </>
      )}
    </span>
  );
}

export default function AddInventoryPage() {
  return <Suspense><AddInventoryInner /></Suspense>;
}

function AddInventoryInner() {
  const editId = useSearchParams().get("id");
  const [name, setName]           = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity]   = useState("");
  const [pics, setPics]           = useState<Pic[]>([]);
  const uploading = pics.some((p) => p.uploading);
  const [lowStock, setLowStock]   = useState("");
  const [boughtFor, setBoughtFor] = useState("");
  const [sku, setSku]             = useState("");
  const [category, setCategory]   = useState("");
  const [gtin, setGtin]           = useState("");

  const [extraOpen, setExtraOpen] = useState(false);
  const [discountOn, setDiscountOn] = useState(false);
  const [discount, setDiscount]   = useState("");
  const [variations, setVariations] = useState<InventoryVariation[]>([]);

  const [catOptions, setCatOptions] = useState<string[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => {
      if (!d.success) return;
      const items: InventoryItem[] = d.data.items ?? [];
      const cats = new Set<string>();
      items.forEach((it) => { if (it.category) cats.add(it.category); });
      setCatOptions(Array.from(cats).sort());

      // Edit mode: prefill from the existing item.
      if (editId) {
        const it = items.find((x) => x.id === editId);
        if (it) {
          setName(it.name);
          setUnitPrice(it.selling_price != null ? String(it.selling_price) : "");
          setQuantity(String(it.quantity));
          setLowStock(it.low_stock_threshold != null ? String(it.low_stock_threshold) : "");
          setBoughtFor(it.cost_price != null ? String(it.cost_price) : "");
          setSku(it.sku ?? "");
          setCategory(it.category ?? "");
          setGtin(it.gtin ?? "");
          const urls = it.images && it.images.length ? it.images : it.image_url ? [it.image_url] : [];
          setPics(urls.map((u) => ({ id: crypto.randomUUID(), preview: u, url: u, uploading: false })));
          if (it.discount != null || it.discount_eligible) { setDiscountOn(true); setExtraOpen(true); if (it.discount != null) setDiscount(String(it.discount)); }
          if (it.variations && it.variations.length) { setVariations(it.variations); setExtraOpen(true); }
        }
      }
    }).catch(() => {});
  }, [editId]);

  const valid = name.trim() && unitPrice && quantity;

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    const chosen = Array.from(files);
    // Show a preview immediately, then upload each in the background.
    const newPics: Pic[] = chosen
      .filter((f) => {
        if (f.size > 1024 * 1024) { setError("Each image must be less than 1MB"); return false; }
        return true;
      })
      .map((f) => ({ id: crypto.randomUUID(), preview: URL.createObjectURL(f), uploading: true, file: f } as Pic & { file: File }));
    setPics((prev) => [...prev, ...newPics]);
    if (fileRef.current) fileRef.current.value = "";

    for (const p of newPics as (Pic & { file: File })[]) {
      const fd = new FormData();
      fd.append("file", p.file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json();
        setPics((prev) => prev.map((x) => x.id === p.id
          ? { ...x, uploading: false, url: d.success ? d.url : undefined, failed: !d.success }
          : x));
        if (!d.success) setError(d.error || "Upload failed — the image will show but won't be saved");
      } catch {
        setPics((prev) => prev.map((x) => x.id === p.id ? { ...x, uploading: false, failed: true } : x));
        setError("Upload failed — the image will show but won't be saved");
      }
    }
  }

  function commitNewCat() {
    const c = newCat.trim();
    if (!c) { setAddingCat(false); return; }
    setCategory(c);
    setCatOptions((p) => [...new Set([...p, c])]);
    setNewCat(""); setAddingCat(false); setCatOpen(false);
  }

  function removePic(id: string) {
    setPics((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone?.preview.startsWith("blob:")) URL.revokeObjectURL(gone.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function addVariation() {
    setVariations((v) => [...v, { size_or_flavour: "" }]);
  }
  function updateVariation(i: number, patch: Partial<InventoryVariation>) {
    setVariations((v) => v.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }
  function removeVariation(i: number) {
    setVariations((v) => v.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true); setError("");
    const urls = pics.filter((p) => p.url).map((p) => p.url as string);
    // Fall back to a category typed but not explicitly confirmed.
    const effectiveCategory = category || newCat.trim();
    try {
      const res = await fetch(editId ? `/api/inventory/${editId}` : "/api/inventory", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          selling_price: unitPrice,
          quantity,
          low_stock_threshold: lowStock,
          cost_price: boughtFor,
          sku,
          category: effectiveCategory,
          gtin,
          image_url: urls[0] || null,
          images: urls,
          discount_eligible: discountOn,
          discount: discountOn ? discount : null,
          variations: variations.filter((v) => v.size_or_flavour.trim()),
        }),
      });
      const d = await res.json();
      if (d.success) { window.location.href = "/inventory"; return; }
      setError(d.error || "Could not save"); setSaving(false);
    } catch { setError("Could not save"); setSaving(false); }
  }

  return (
    <div className="min-h-full pb-32" style={{ background: BG, fontFamily: FF }}>
      <div className="px-5 pt-10">
        <button onClick={() => { window.location.href = "/inventory"; }}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[30px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>{editId ? "Edit an Inventory" : "Add an Inventory"}</h1>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Name + scan */}
        <div>
          <Label>Name of Inventory</Label>
          <div className="flex items-center gap-2.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Big Cola"
              className="flex-1 rounded-2xl px-4 text-[15px] text-spal-navy outline-none bg-white"
              style={{ fontFamily: FF, height: 56, border: `1.5px solid ${name ? "#22C55E" : "#E5E7EB"}` }} autoFocus />
            <button className="rounded-2xl flex items-center justify-center active:scale-95 flex-shrink-0"
              style={{ background: "#22C55E", width: 56, height: 56 }} aria-label="Scan barcode">
              <QrCode01Icon size={24} color="#fff" />
            </button>
          </div>
        </div>

        {/* Unit price */}
        <div>
          <Label>Unit Price</Label>
          <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} type="number" inputMode="decimal"
            placeholder="Enter Amount" className={`${inputCls} bg-transparent`} style={inputStyle} />
        </div>

        {/* Quantity */}
        <div>
          <Label>Number of Items Available</Label>
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" inputMode="numeric"
            placeholder="Enter Number" className={`${inputCls} bg-transparent`} style={inputStyle} />
        </div>

        {/* Image upload */}
        <div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple hidden
            onChange={(e) => onFiles(e.target.files)} />
          {pics.length === 0 ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl bg-white flex flex-col items-center justify-center py-8 active:scale-[0.99] transition-transform"
              style={{ border: "1.5px dashed #C7D2C0" }}>
              <Image02Icon size={34} color="#9CA3AF" />
              <p className="mt-3 text-[15px]" style={{ fontFamily: FF }}>
                <span className="font-bold" style={{ color: "#22C55E" }}>Click to upload Images</span>
                <span className="font-bold text-spal-navy"> or Add from Library</span>
              </p>
              <p className="text-[12.5px] text-neutral-400 mt-1" style={{ fontFamily: FF }}>JPG, JPEG, PNG less than 1MB</p>
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-white p-3 flex flex-wrap gap-3" style={{ border: "1.5px dashed #C7D2C0" }}>
              {pics.map((p) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden" style={{ width: 96, height: 96 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  {p.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.55)" }}>
                      <div className="w-5 h-5 rounded-full border-2 border-spal-green border-t-transparent animate-spin" />
                    </div>
                  )}
                  {p.failed && (
                    <div className="absolute bottom-0 inset-x-0 text-center py-0.5" style={{ background: "rgba(220,38,38,0.85)" }}>
                      <span className="text-[9px] font-bold text-white" style={{ fontFamily: FF }}>not saved</span>
                    </div>
                  )}
                  <button onClick={() => removePic(p.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center" aria-label="Remove image">
                    <Cancel01Icon size={13} color="#fff" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                className="rounded-xl flex items-center justify-center active:scale-95" style={{ width: 96, height: 96, border: "1.5px solid #22C55E" }}>
                <PlusSignIcon size={26} color="#22C55E" />
              </button>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div>
          <Label>Low Stock Alert</Label>
          <input value={lowStock} onChange={(e) => setLowStock(e.target.value)} type="number" inputMode="numeric"
            placeholder="Enter Number" className={`${inputCls} bg-transparent`} style={inputStyle} />
        </div>

        {/* Bought for */}
        <div>
          <Label>How much you bought it for</Label>
          <input value={boughtFor} onChange={(e) => setBoughtFor(e.target.value)} type="number" inputMode="decimal"
            placeholder="Enter Number" className={`${inputCls} bg-transparent`} style={inputStyle} />
        </div>

        {/* SKU */}
        <div>
          <Label>SKU</Label>
          <div className="flex items-center gap-2 rounded-2xl px-4" style={{ background: "#fff", border: "1.5px solid #E5E7EB", height: 56 }}>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Enter Number"
              className="flex-1 bg-transparent outline-none text-[15px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
            <InfoTip text={TIP_SKU} />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label>Choose a Category</Label>
          <button onClick={() => { setCatOpen((o) => !o); setAddingCat(false); }}
            className="w-full flex items-center justify-between rounded-2xl px-4" style={{ background: "#fff", border: "1.5px solid #E5E7EB", height: 56 }}>
            <span className="text-[15px]" style={{ fontFamily: FF, color: category ? "#0F172A" : "#9CA3AF" }}>{category || "Select Category"}</span>
            {catOpen ? <ArrowUp01Icon size={18} color="#9CA3AF" /> : <ArrowDown01Icon size={18} color="#9CA3AF" />}
          </button>

          {catOpen && (
            <div className="mt-2 rounded-2xl p-2 space-y-2" style={{ background: "#F1F4EE" }}>
              {addingCat ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitNewCat(); }}
                    onBlur={commitNewCat}
                    placeholder="Add a Category"
                    className="flex-1 rounded-2xl px-4 bg-white text-[15px] text-spal-navy outline-none placeholder:text-neutral-400"
                    style={{ fontFamily: FF, height: 56, border: "1.5px solid #22C55E" }}
                  />
                  <button onMouseDown={(e) => e.preventDefault()} onClick={commitNewCat} disabled={!newCat.trim()}
                    className="rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-40"
                    style={{ background: "#22C55E", width: 56, height: 56 }} aria-label="Add category">
                    <Tick01Icon size={22} color="#fff" />
                  </button>
                </div>
              ) : (
                <>
                  {catOptions.map((c) => (
                    <button key={c} onClick={() => { setCategory(c); setCatOpen(false); }}
                      className="w-full rounded-2xl bg-white px-4 py-4 text-left flex items-center justify-between active:scale-[0.99] transition-transform"
                      style={{ fontFamily: FF }}>
                      <span className="text-[15px]" style={{ color: c === category ? "#0F172A" : "#4B5563" }}>{c}</span>
                      {c === category && <Tick01Icon size={16} color="#22C55E" />}
                    </button>
                  ))}
                  <button onClick={() => setAddingCat(true)}
                    className="w-full rounded-2xl px-4 py-4 text-center active:scale-[0.99] transition-transform">
                    <span className="text-[15px] font-black" style={{ fontFamily: FF, color: "#22C55E" }}>+ Add a New Category</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* GTIN */}
        <div>
          <Label>GTIN</Label>
          <div className="flex items-center gap-2 rounded-2xl px-4" style={{ background: "#fff", border: "1.5px solid #E5E7EB", height: 56 }}>
            <input value={gtin} onChange={(e) => setGtin(e.target.value)} placeholder="UPC, EAN or ISBN"
              className="flex-1 bg-transparent outline-none text-[15px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
            <InfoTip text={TIP_GTIN} />
          </div>
        </div>

        {/* Discount field (when enabled) */}
        {discountOn && (
          <div>
            <Label>Discount</Label>
            <div className="flex items-center gap-2 rounded-2xl px-4" style={{ background: "#fff", border: "1.5px solid #E5E7EB", height: 56 }}>
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" inputMode="decimal"
                placeholder="Enter Number  less than selling price"
                className="flex-1 bg-transparent outline-none text-[15px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
              <InfoTip text={TIP_DISCOUNT} />
            </div>
          </div>
        )}

        {/* Variation cards */}
        {variations.map((v, i) => (
          <div key={i} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>Add Variation</p>
              <button onClick={() => removeVariation(i)} className="flex items-center gap-1.5 active:scale-95">
                <MinusSignCircleIcon size={18} color="#DC2626" />
                <span className="text-[14px] font-bold" style={{ color: "#DC2626", fontFamily: FF }}>Remove</span>
              </button>
            </div>
            <div className="space-y-3">
              <VField label="Size or Flavour" value={v.size_or_flavour} onChange={(x) => updateVariation(i, { size_or_flavour: x })} placeholder="Enter Size or Flavour" />
              <VField label="Unit Price" value={v.unit_price ?? ""} onChange={(x) => updateVariation(i, { unit_price: x === "" ? null : parseFloat(x) })} placeholder="Enter Amount" num />
              <VField label="Number of Items Available" value={v.quantity ?? ""} onChange={(x) => updateVariation(i, { quantity: x === "" ? null : parseFloat(x) })} placeholder="Enter Amount" num />
              <VField label="SKU" value={v.sku ?? ""} onChange={(x) => updateVariation(i, { sku: x })} placeholder="Enter Number" infoText={TIP_SKU} />
              <VField label="GTIN" value={v.gtin ?? ""} onChange={(x) => updateVariation(i, { gtin: x })} placeholder="UPC, EAN or ISBN" infoText={TIP_GTIN} />
              <VField label="How much you bought it for" value={v.cost_price ?? ""} onChange={(x) => updateVariation(i, { cost_price: x === "" ? null : parseFloat(x) })} placeholder="Enter Amount" num />
              <VField label="Discount" value={v.discount ?? ""} onChange={(x) => updateVariation(i, { discount: x === "" ? null : parseFloat(x) })} placeholder="Add discount" num />
              <VField label="Low Stock Alert" value={v.low_stock_threshold ?? ""} onChange={(x) => updateVariation(i, { low_stock_threshold: x === "" ? null : parseFloat(x) })} placeholder="Enter Number" infoText={TIP_LOWSTOCK} num />
            </div>
          </div>
        ))}

        {/* Extra fields */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <button onClick={() => setExtraOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-4">
            <span className="text-[16px] font-black text-spal-navy" style={{ fontFamily: FF }}>Add Extra Fields</span>
            {extraOpen ? <ArrowUp01Icon size={18} color="#6B7280" /> : <ArrowDown01Icon size={18} color="#6B7280" />}
          </button>
          {extraOpen && (
            <div className="px-4 pb-4 space-y-4">
              <ExtraRow title="Discount Eligible" sub="Allow discounts to be applied to this item at checkout"
                added={discountOn} onAdd={() => setDiscountOn(true)} />
              <ExtraRow title="Variations" sub="Add options like sizes or flavors, then set prices, SKUs, and inventory"
                added={false} onAdd={addVariation} addLabel="+ Add" />
            </div>
          )}
        </div>

        {error && <p className="text-[13px] text-center" style={{ color: "#DC2626", fontFamily: FF }}>{error}</p>}
      </div>

      {/* Save */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 pb-safe"
        style={{ bottom: 0, background: "linear-gradient(to top, #EDF3E8 78%, transparent)" }}>
        <button onClick={save} disabled={!valid || saving || uploading}
          className="w-full h-14 rounded-full font-black text-[17px] active:scale-[0.98] transition-transform"
          style={{ fontFamily: FF, background: valid ? "#22C55E" : "#CBD5C0", color: valid ? "#fff" : "#8A9585" }}>
          {saving ? "Saving…" : editId ? "Save Changes" : "Save"}
        </button>
      </div>
    </div>
  );
}

function ExtraRow({ title, sub, added, onAdd, addLabel = "+ Add" }: { title: string; sub: string; added: boolean; onAdd: () => void; addLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <p className="text-[15px] font-black text-spal-navy" style={{ fontFamily: FF }}>{title}</p>
        <p className="text-[13px] text-neutral-500 mt-0.5 leading-relaxed" style={{ fontFamily: FF }}>{sub}</p>
      </div>
      <button onClick={onAdd} disabled={added}
        className="flex-shrink-0 h-9 px-4 rounded-full text-[14px] font-bold active:scale-95 disabled:opacity-40"
        style={{ fontFamily: FF, color: "#22C55E", border: "1.5px solid #22C55E" }}>
        {added ? "Added" : addLabel}
      </button>
    </div>
  );
}

function VField({ label, value, onChange, placeholder, num, infoText }: {
  label: string; value: string | number; onChange: (v: string) => void; placeholder: string; num?: boolean; infoText?: string;
}) {
  return (
    <div>
      <p className="text-[13.5px] font-bold text-spal-navy mb-1.5" style={{ fontFamily: FF }}>{label}</p>
      <div className="flex items-center gap-2 rounded-2xl px-4" style={{ background: "#fff", border: "1.5px solid #E5E7EB", height: 52 }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          type={num ? "number" : "text"} inputMode={num ? "decimal" : "text"}
          className="flex-1 bg-transparent outline-none text-[14.5px] text-spal-navy placeholder:text-neutral-400" style={{ fontFamily: FF }} />
        {infoText && <InfoTip text={infoText} />}
      </div>
    </div>
  );
}
