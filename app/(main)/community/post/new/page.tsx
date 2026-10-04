"use client";
// I03 Create post: share part of the journey safely. Spal warns before private numbers go public.
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FF, TopBar, cardCls } from "@/components/journey/ui";
import { useJourney } from "@/components/journey/useJourney";
import { POST_TYPES, MAX_PHOTOS, MAX_POST, type PostType } from "@/lib/engine/community";
import { describeFindings, redact, scanPrivate } from "@/lib/engine/privacy";
import { LEVELS } from "@/lib/engine/levels";
import { BUSINESS_TYPE_LABEL } from "@/lib/engine/me";
import { preparePhoto } from "@/lib/media/prepare";

type Me = { display_name: string | null; full_name: string | null; current_level: number; business_type: string | null; state: string | null; profile_visibility: string; anonymous_default: boolean };

export default function CreatePost() {
  const router = useRouter();
  const { state: journey } = useJourney();
  const [me, setMe] = useState<Me | null>(null);
  const [type, setType] = useState<Exclude<PostType, "milestone"> | null>(null);
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attach, setAttach] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [askVisible, setAskVisible] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch("/api/me").then((r) => r.json()).then((j) => j.success && setMe(j.data)).catch(() => {}); }, []);
  const isAnon = anon ?? me?.anonymous_default ?? false;
  const findings = useMemo(() => scanPrivate(body), [body]);
  const done = journey.status === "ready" ? journey.data.milestones.filter((m) => m.status === "done" && m.completion_type !== "none" && journey.data.reached && m.level >= 0) : [];

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setErr("");
    try {
      for (const f of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
        const small = await preparePhoto(f); // re-drawn: no location data, max 1600px
        const fd = new FormData(); fd.append("file", small);
        const j = await (await fetch("/api/upload", { method: "POST", body: fd })).json();
        if (!j.success) throw new Error(j.error);
        setPhotos((p) => [...p, j.url]);
      }
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Couldn't add that photo."); }
    setUploading(false);
  }

  async function submit(forceNamed = false) {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/community/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, body, anonymous: forceNamed ? false : isAnon, media_urls: photos, attach: attach ? { kind: "milestone", id: attach } : undefined, acknowledged: ack }) });
      const j = await res.json();
      if (j.code === "needs_visibility") { setAskVisible(true); setBusy(false); return; }
      if (!j.success) throw new Error(j.error);
      router.replace(`/community/post/${j.data.id}`);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not post. Please try again."); setBusy(false); }
  }
  async function makeVisible() {
    setBusy(true);
    const j = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_visibility: "public" }) }).then((r) => r.json()).catch(() => ({ success: false }));
    setAskVisible(false);
    if (j.success) { setMe((m) => (m ? { ...m, profile_visibility: "public" } : m)); await submit(); } else { setErr("Couldn't update your profile. Please try again."); setBusy(false); }
  }

  const blocked = !type || !body.trim() || (findings.length > 0 && !ack) || uploading;
  const name = me?.display_name || me?.full_name?.split(" ")[0] || "You";
  return (
    <div data-testid="screen-I03" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="New post" />
      <div className="px-5 space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-medium text-neutral-600">What kind of post is it?</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Post type">
            {POST_TYPES.map((t) => <button key={t.key} type="button" role="radio" aria-checked={type === t.key} onClick={() => setType(t.key)} className={`text-left min-h-14 rounded-2xl border px-3 py-2 transition-colors active:scale-[0.98] ${type === t.key ? "bg-spal-navy text-white border-spal-navy" : "bg-white text-spal-navy border-neutral-200"}`}><span style={{ fontFamily: FF }} className="block text-[15px] font-bold">{t.label}</span><span className={`block text-[12px] leading-snug ${type === t.key ? "text-white/70" : "text-neutral-500"}`}>{t.hint}</span></button>)}
          </div>
        </div>

        <div>
          <textarea value={body} onChange={(e) => { setBody(e.target.value); setAck(false); }} rows={6} maxLength={MAX_POST} aria-label="Your post" placeholder="What do you want to share?" className="w-full rounded-2xl bg-white border border-neutral-200 px-4 py-3 text-[16px] text-spal-navy placeholder:text-neutral-400 outline-none focus:border-spal-navy" />
          <p className="mt-1 text-right text-[12px] text-neutral-400 tabular-nums">{body.length}/{MAX_POST}</p>
        </div>

        {findings.length > 0 && (
          <div role="alert" className="rounded-2xl bg-amber-50 border border-amber-200 p-4" data-testid="privacy-warning">
            <p style={{ fontFamily: FF }} className="text-[15px] font-bold text-amber-900">Hold on, this looks private</p>
            <p className="mt-1 text-[14px] text-amber-900 leading-snug">Your post mentions {describeFindings(findings)}. Posts are public, so anyone can see this. Your sales and costs stay private unless you choose to share them.</p>
            <p className="mt-2 text-[13px] text-amber-900/80">Spotted: {findings.map((f) => `“${f.text}”`).join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setBody(redact(body, findings)); setAck(false); }} className="h-11 px-4 rounded-full bg-amber-900 text-white text-[14px] font-bold active:scale-95 transition-transform">Hide the details for me</button>
              <button type="button" aria-pressed={ack} onClick={() => setAck(!ack)} className={`h-11 px-4 rounded-full border text-[14px] font-bold active:scale-95 transition-transform ${ack ? "bg-white text-amber-900 border-amber-900" : "bg-transparent text-amber-900 border-amber-300"}`}>{ack ? "OK, I'll share it ✓" : "Share it anyway"}</button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-[13px] font-medium text-neutral-600">Photos (up to {MAX_PHOTOS})</p>
          <div className="flex gap-2 flex-wrap">
            {photos.map((u) => (
              <span key={u} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100"><Image src={u} alt="Photo to share" width={80} height={80} className="w-full h-full object-cover" unoptimized /><button type="button" aria-label="Remove photo" onClick={() => setPhotos(photos.filter((p) => p !== u))} className="absolute top-0.5 right-0.5 w-7 h-7 rounded-full bg-spal-navy/80 text-white text-[13px]">✕</button></span>
            ))}
            {photos.length < MAX_PHOTOS && <button type="button" onClick={() => file.current?.click()} disabled={uploading} className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-300 text-[13px] text-neutral-500 active:bg-white disabled:opacity-50">{uploading ? "Adding…" : "+ Add"}</button>}
          </div>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <p className="mt-1.5 text-[12px] text-neutral-500">Photos are resized and location details are removed before they&apos;re shared.</p>
        </div>

        {done.length > 0 && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-neutral-600">Attach a milestone you&apos;ve completed (optional)</p>
            <div className="space-y-2" role="radiogroup" aria-label="Attach a milestone">
              <button type="button" role="radio" aria-checked={attach === null} onClick={() => setAttach(null)} className={`w-full min-h-11 text-left rounded-2xl border px-4 text-[14px] ${attach === null ? "bg-spal-navy text-white border-spal-navy" : "bg-white border-neutral-200 text-spal-navy"}`}>None</button>
              {done.slice(0, 8).map((m) => <button key={m.key} type="button" role="radio" aria-checked={attach === m.key} onClick={() => setAttach(m.key)} className={`w-full min-h-11 text-left rounded-2xl border px-4 py-2 text-[14px] ${attach === m.key ? "bg-spal-navy text-white border-spal-navy" : "bg-white border-neutral-200 text-spal-navy"}`}>{m.title}</button>)}
            </div>
          </div>
        )}

        <div className={`${cardCls} p-4 space-y-3`}>
          <div className="flex items-center justify-between"><span style={{ fontFamily: FF }} className="text-[15px] font-bold text-spal-navy">Who can see it</span><span className="text-[14px] text-neutral-700">Everyone in Spal</span></div>
          <p className="text-[12px] text-neutral-500 -mt-1">Connections-only and circles arrive soon.</p>
          <button type="button" role="switch" aria-checked={isAnon} onClick={() => setAnon(!isAnon)} className="w-full min-h-12 flex items-center justify-between text-left">
            <span><span style={{ fontFamily: FF }} className="block text-[15px] font-bold text-spal-navy">Post anonymously</span><span className="block text-[12px] text-neutral-500 leading-snug">{isAnon ? "Your name, photo and business won't show." : `Shown as ${name}${me?.current_level !== undefined ? `, Level ${me.current_level}` : ""}.`}</span></span>
            <span aria-hidden className={`ml-3 w-12 h-7 rounded-full p-0.5 shrink-0 transition-colors ${isAnon ? "bg-spal-navy" : "bg-neutral-300"}`}><span className={`block w-6 h-6 rounded-full bg-white transition-transform ${isAnon ? "translate-x-5" : ""}`} /></span>
          </button>
        </div>

        {err && <p role="alert" className="text-[14px] text-red-600">{err}</p>}
        <button type="button" onClick={() => submit()} disabled={blocked || busy} style={{ fontFamily: FF }} className="w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold shadow-[var(--shadow-btn-green)] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none active:scale-[0.98] transition-transform">{busy ? "Posting…" : "Post"}</button>
      </div>

      {askVisible && me && (
        <div className="fixed inset-0 z-[70] flex items-end" role="dialog" aria-modal="true" aria-label="Make your profile visible">
          <div className="absolute inset-0 bg-spal-navy/40" onClick={() => setAskVisible(false)} />
          <div className="relative w-full max-w-[480px] mx-auto rounded-t-[28px] bg-white px-5 pt-5 pb-[calc(var(--sab)+20px)]">
            <h2 style={{ fontFamily: FF }} className="text-[20px] font-bold text-spal-navy">Post under your name?</h2>
            <p className="mt-1 text-[14px] text-neutral-600 leading-snug">People will be able to see this about you. Your sales, costs, phone number and email stay private.</p>
            <ul className="mt-3 rounded-2xl bg-spal-bg px-4 py-3 text-[14px] text-spal-navy space-y-1">
              <li>Name: <b>{name}</b></li><li>Level: <b>{me.current_level} · {LEVELS[me.current_level as 0].name}</b></li>
              {me.business_type && <li>Business: <b>{BUSINESS_TYPE_LABEL[me.business_type] ?? "Business"}</b></li>}{me.state && <li>State: <b>{me.state}</b></li>}
            </ul>
            <button type="button" onClick={makeVisible} disabled={busy} style={{ fontFamily: FF }} className="mt-4 w-full h-14 rounded-full bg-[#22C55E] text-white text-[16px] font-bold disabled:opacity-50">Yes, make my profile visible</button>
            <button type="button" onClick={() => { setAskVisible(false); setAnon(true); }} className="mt-1 w-full min-h-12 text-[15px] font-medium text-spal-navy">Post anonymously instead</button>
          </div>
        </div>
      )}
    </div>
  );
}
