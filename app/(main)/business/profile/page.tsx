"use client";
// F16 Business profile: name, logo, address, CAC, TIN, bank (display only), socials.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ErrorBlock, FF, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { Primary } from "@/components/planning/shared";

type Biz = { business_name?: string; logo_url?: string | null; address?: string | null; cac_number?: string | null; tin?: string | null; bank_display?: string | null; socials?: Record<string, string> | null };
const SOCIALS = [["instagram", "Instagram"], ["facebook", "Facebook"], ["x", "X"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"], ["website", "Website"]] as const;

const Field = ({ label, value, onChange, hint, max = 120 }: { label: string; value: string; onChange: (v: string) => void; hint?: string; max?: number }) => (
  <label className="block"><span className="block mb-1.5 text-[13px] font-medium text-neutral-600">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} className="w-full min-h-[52px] rounded-2xl bg-white border border-neutral-200 px-4 text-[16px] text-spal-navy outline-none focus:border-spal-navy" />
    {hint && <span className="block mt-1 text-[12px] text-neutral-500 leading-snug">{hint}</span>}</label>
);

export default function BusinessProfile() {
  const [biz, setBiz] = useState<Biz | null | undefined>(undefined);
  const [f, setF] = useState({ name: "", address: "", cac: "", tin: "", bank: "", logo: "" });
  const [soc, setSoc] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const load = () => fetch("/api/business/profile").then((r) => r.json()).then((j) => {
    if (!j.success) return setFailed(true);
    setFailed(false); setBiz(j.data);
    if (j.data) { setF({ name: j.data.business_name ?? "", address: j.data.address ?? "", cac: j.data.cac_number ?? "", tin: j.data.tin ?? "", bank: j.data.bank_display ?? "", logo: j.data.logo_url ?? "" }); setSoc(j.data.socials ?? {}); }
  }).catch(() => setFailed(true));
  useEffect(() => { load(); }, []);

  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true); setMsg(null);
    try {
      const j = await (await fetch("/api/business/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_name: f.name, address: f.address, cac_number: f.cac, tin: f.tin, bank_display: f.bank, socials: soc, ...extra }) })).json();
      if (!j.success) throw new Error(j.error);
      setMsg({ ok: true, text: j.partial ? "Name saved. The other details will be available soon." : "Saved." });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error && e.message ? e.message : "Could not save. Please try again." }); }
    setBusy(false);
  }
  async function upload(files: FileList | null) {
    const img = files?.[0]; if (!img) return;
    if (img.size > 1024 * 1024) return setMsg({ ok: false, text: "Image must be less than 1MB." });
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", img);
      const j = await (await fetch("/api/upload", { method: "POST", body: fd })).json();
      if (!j.success) throw new Error(j.error);
      setF((x) => ({ ...x, logo: j.url })); await save({ logo_url: j.url });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error && e.message ? e.message : "Upload failed." }); setBusy(false); }
  }

  return (
    <div data-testid="screen-F16" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Business profile" />
      {failed && <ErrorBlock onRetry={load} />}
      {!failed && biz === undefined && <ScreenSkeleton />}
      {!failed && biz === null && <div className="px-5"><div className={`${cardCls} p-6 text-center text-[15px] text-spal-navy`}>Set up your business first, then you can fill in its details here.</div></div>}
      {!failed && biz && (
        <div className="px-5 space-y-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => file.current?.click()} aria-label="Change logo" className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 overflow-hidden flex items-center justify-center active:scale-95 transition-transform">
              {f.logo ? <Image src={f.logo} alt="" width={80} height={80} className="w-full h-full object-cover" /> : <span style={{ fontFamily: FF }} className="text-[28px] font-bold text-neutral-400">{(f.name || "B").charAt(0).toUpperCase()}</span>}
            </button>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files)} />
            <div><p style={{ fontFamily: FF }} className="text-[18px] font-bold text-spal-navy">{f.name || "Your business"}</p><button type="button" onClick={() => file.current?.click()} className="min-h-11 text-[13px] font-medium text-neutral-500 underline">Change logo</button></div>
          </div>

          <Field label="Business name" value={f.name} onChange={(v) => setF({ ...f, name: v })} max={80} />
          <Field label="Address" value={f.address} onChange={(v) => setF({ ...f, address: v })} max={200} />
          <Field label="CAC registration number" value={f.cac} onChange={(v) => setF({ ...f, cac: v })} max={30} hint="Only if you're registered. Check it against your certificate." />
          <Field label="TIN" value={f.tin} onChange={(v) => setF({ ...f, tin: v })} max={30} hint="Your tax identification number, if you have one." />
          <Field label="Bank details to show customers" value={f.bank} onChange={(v) => setF({ ...f, bank: v })} hint="Display only. Spal never moves money for you." />

          <Section title="Online">
            <div className="space-y-4 -mx-5 px-5">{SOCIALS.map(([k, l]) => <Field key={k} label={l} value={soc[k] ?? ""} onChange={(v) => setSoc({ ...soc, [k]: v })} max={100} />)}</div>
          </Section>

          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-[14px] ${msg.ok ? "text-spal-green-700" : "text-red-600"}`}>{msg.text}</p>}
          <Primary onClick={() => save()} loading={busy}>Save</Primary>
          <p className="text-[12px] text-neutral-500 leading-snug text-center">Registration numbers and legal steps change. Always confirm with CAC and FIRS.</p>
        </div>
      )}
    </div>
  );
}
