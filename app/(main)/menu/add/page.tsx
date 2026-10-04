"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft01Icon, Image02Icon, ArrowDown01Icon, InformationCircleIcon, Cancel01Icon,
} from "hugeicons-react";
import { useBusinessMode } from "@/hooks/useBusinessMode";
import { MENU_TYPES, MENU_CATEGORIES, MENU_UNITS } from "@/lib/menu-config";
import type { MenuItem, MenuType } from "@/lib/types";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";
const MAX_IMAGES = 4;
const OTHER = "__other__";

// A locally-previewed image that uploads in the background.
type Pic = { id: string; preview: string; url?: string; uploading: boolean; failed?: boolean };

const fieldCls = "w-full rounded-2xl px-4 text-[16px] text-spal-navy outline-none placeholder:text-neutral-400 appearance-none";
const fieldStyle = { background: "#F6F8F3", height: 56, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" } as const;

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[16px] font-bold text-spal-navy mb-2">{children}</p>;
}

function Select({ value, onChange, children, placeholder, label }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; placeholder?: string; label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`${fieldCls} pr-12`}
        style={{ ...fieldStyle, color: value ? "#0F172A" : "#9CA3AF" }}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <ArrowDown01Icon size={20} color="#6B7280" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function AddMenuPage() {
  return <Suspense><AddMenuInner /></Suspense>;
}

function AddMenuInner() {
  const editId = useSearchParams().get("id");
  const isBar = useBusinessMode().type === "bar_owner";

  const [name, setName]         = useState("");
  const [menuType, setMenuType] = useState<MenuType>(isBar ? "drinks" : "food");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [unit, setUnit]         = useState((isBar ? MENU_UNITS.drinks : MENU_UNITS.food)[0]);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice]       = useState("");
  const [pics, setPics]         = useState<Pic[]>([]);
  const [tip, setTip]           = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");
  const [existingCats, setExistingCats] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploading = pics.some((p) => p.uploading);

  // Default the type once the business type is known (store hydrates after first paint).
  const typeTouched = useRef(false);
  useEffect(() => {
    if (editId || typeTouched.current) return;
    const t: MenuType = isBar ? "drinks" : "food";
    setMenuType(t);
    setUnit(MENU_UNITS[t][0]);
  }, [isBar, editId]);

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then((d) => {
      if (!d.success) return;
      const items: MenuItem[] = d.data?.items ?? [];
      setExistingCats(Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[])));
      if (!editId) return;
      const it = items.find((x) => x.id === editId);
      if (!it) return;
      typeTouched.current = true;
      setName(it.name);
      setMenuType(it.menu_type);
      setCategory(it.category ?? "");
      setUnit(it.unit);
      setQuantity(String(it.quantity));
      setPrice(String(it.price));
      const urls = it.images?.length ? it.images : it.image_url ? [it.image_url] : [];
      setPics(urls.map((u) => ({ id: crypto.randomUUID(), preview: u, url: u, uploading: false })));
    }).catch(() => {});
  }, [editId]);

  const categoryOptions = Array.from(new Set([...MENU_CATEGORIES[menuType], ...existingCats, ...(category && category !== OTHER ? [category] : [])]));
  const finalCategory = category === OTHER ? customCat.trim() : category;
  const noun = menuType === "drinks" ? "drink" : "food";
  const valid = name.trim() && finalCategory && parseFloat(price) > 0 && parseFloat(quantity) > 0 && !uploading;

  function changeType(t: MenuType) {
    typeTouched.current = true;
    setMenuType(t);
    setUnit(MENU_UNITS[t][0]);
    setCategory(""); setCustomCat("");
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    const room = MAX_IMAGES - pics.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    const newPics = chosen
      .filter((f) => {
        if (f.size > 1024 * 1024) { setError("Each image must be less than 1MB"); return false; }
        return true;
      })
      .map((f) => ({ id: crypto.randomUUID(), preview: URL.createObjectURL(f), uploading: true, file: f }));
    setPics((prev) => [...prev, ...newPics]);
    if (fileRef.current) fileRef.current.value = "";

    for (const p of newPics) {
      const fd = new FormData();
      fd.append("file", p.file);
      try {
        const d = await fetch("/api/upload", { method: "POST", body: fd }).then((r) => r.json());
        setPics((prev) => prev.map((x) => (x.id === p.id ? { ...x, uploading: false, url: d.success ? d.url : undefined, failed: !d.success } : x)));
        if (!d.success) setError(d.error || "Upload failed. The image will show but won't be saved.");
      } catch {
        setPics((prev) => prev.map((x) => (x.id === p.id ? { ...x, uploading: false, failed: true } : x)));
        setError("Upload failed. The image will show but won't be saved.");
      }
    }
  }

  function removePic(id: string) {
    setPics((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone?.preview.startsWith("blob:")) URL.revokeObjectURL(gone.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true); setError("");
    const body = {
      name: name.trim(), menu_type: menuType, category: finalCategory, unit,
      quantity, price, images: pics.filter((p) => p.url).map((p) => p.url as string),
    };
    try {
      const res = await fetch(editId ? `/api/menu/${editId}` : "/api/menu", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Couldn't save. Please try again.");
      window.location.href = "/menu";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Please try again.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!editId || deleting) return;
    if (!window.confirm(`Remove ${name || "this item"} from your menu?`)) return;
    setDeleting(true);
    try {
      const d = await fetch(`/api/menu/${editId}`, { method: "DELETE" }).then((r) => r.json());
      if (!d.success) throw new Error();
      window.location.href = "/menu";
    } catch {
      setError("Couldn't remove it. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-full pb-40" style={{ background: BG, fontFamily: FF }}>
      <div className="px-5 pt-12">
        <button onClick={() => { window.location.href = "/menu"; }} aria-label="Back to menu" className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[32px] font-black text-spal-navy mt-6">{editId ? "Edit Menu" : "Add a Menu"}</h1>
      </div>

      <div className="px-5 mt-6 space-y-5">
        <div>
          <Label>Name of Dish</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={menuType === "drinks" ? "e.g. Chapman" : "e.g. Rice and Turkey"}
            className={fieldCls}
            style={{ ...fieldStyle, background: "#fff", boxShadow: name ? "0 0 0 2px #22C55E" : fieldStyle.boxShadow }}
          />
        </div>

        <div>
          <Label>Choose a Category</Label>
          <Select value={category} onChange={setCategory} placeholder="Select Category" label="Category">
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={OTHER}>Add my own...</option>
          </Select>
          {category === OTHER && (
            <input
              value={customCat}
              onChange={(e) => setCustomCat(e.target.value)}
              placeholder="Type a category name"
              aria-label="New category name"
              className={`${fieldCls} mt-2.5`}
              style={fieldStyle}
              autoFocus
            />
          )}
        </div>

        {/* Images */}
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          {pics.length > 0 && (
            <div className="grid grid-cols-4 gap-2.5 mb-3">
              {pics.map((p) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden bg-white" style={{ aspectRatio: "1 / 1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="w-full h-full object-cover" style={{ opacity: p.uploading ? 0.5 : 1 }} />
                  {p.failed && <span className="absolute inset-x-0 bottom-0 bg-red-500 text-white text-[10px] font-bold text-center py-0.5">Not saved</span>}
                  <button onClick={() => removePic(p.id)} aria-label="Remove image" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center">
                    <Cancel01Icon size={12} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {pics.length < MAX_IMAGES && (
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Upload images"
              className="w-full rounded-3xl flex flex-col items-center justify-center text-center px-4 py-8 active:scale-[0.99] transition-transform"
              style={{ background: "#fff", border: "1.5px dashed #CBD2C4" }}
            >
              <Image02Icon size={40} color="#8A8F98" />
              <span className="text-[16px] font-bold mt-4" style={{ color: "#22C55E" }}>Click to upload Images</span>
              <span className="text-[12.5px] text-neutral-400 mt-1">JPG, JPEG, PNG less than 1MB</span>
            </button>
          )}
        </div>

        <div>
          <Label>Type of Menu</Label>
          <Select value={menuType} onChange={(v) => changeType(v as MenuType)} label="Type of menu">
            {MENU_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
        </div>

        <div>
          <Label>How is this {noun} sold or measured?</Label>
          <Select value={unit} onChange={setUnit} label="How it is sold or measured">
            {MENU_UNITS[menuType].map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>

        <div>
          <Label>Quantity of {menuType === "drinks" ? "Drinks" : "Food"} Available</Label>
          <div className="relative">
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="Add Number"
              className={`${fieldCls} pr-14`}
              style={fieldStyle}
            />
            <button onClick={() => setTip((t) => !t)} aria-label="More info" className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center">
              <InformationCircleIcon size={22} color="#6B7280" />
            </button>
            {tip && (
              <div className="absolute z-20 right-0 top-full mt-2 w-64 rounded-2xl px-4 py-3 text-white text-[13px] leading-relaxed" style={{ background: "#0F172A", boxShadow: "0 10px 30px rgba(0,0,0,0.22)" }}>
                How many you have ready to sell. Every order takes away from this number.
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Selling Price</Label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="Enter Number"
            className={fieldCls}
            style={fieldStyle}
          />
        </div>

        {error && <p role="alert" className="text-[14px] font-semibold text-red-600">{error}</p>}

        {editId && (
          <button onClick={remove} disabled={deleting} aria-label="Remove from menu" className="w-full h-12 rounded-2xl text-[15px] font-bold text-red-600 active:scale-[0.99] disabled:opacity-50">
            {deleting ? "Removing..." : "Remove from menu"}
          </button>
        )}
      </div>

      {/* Save */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pt-3 z-30" style={{ background: BG, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)", borderTop: "1px solid #DCE6D5" }}>
        <button
          onClick={save}
          disabled={!valid || saving}
          aria-label="Save menu item"
          className="w-full rounded-full font-black text-[18px] active:scale-[0.99] transition-all"
          style={{ height: 60, background: valid ? "#22C55E" : "#E4E4E7", color: valid ? "#fff" : "#8A8A93" }}
        >
          {saving ? "Saving..." : uploading ? "Uploading photo..." : editId ? "Save Changes" : "Save"}
        </button>
      </div>
    </div>
  );
}
