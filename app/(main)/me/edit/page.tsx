"use client";
// L02 Edit profile: photo, name, bio, business type, location, with a preview of what the public sees.
import { useRef, useState } from "react";
import { Avatar } from "@/components/community/ui";
import { ErrorBlock, FF, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { inputCls, Notice, patchMe, primaryCls, useMe, type MeData } from "@/components/me/ui";
import { BUSINESS_TYPE_LABEL, LEGACY_BUSINESS_TYPES } from "@/lib/engine/me";
import { NG_STATES } from "@/lib/constants/ng-states";
import { LEVELS } from "@/lib/engine/levels";
import { preparePhoto } from "@/lib/media/prepare";
import type { Level } from "@/lib/engine/placement";

function Form({ me }: { me: MeData }) {
  const [f, setF] = useState({ name: me.display_name ?? me.full_name?.split(" ")[0] ?? "", bio: me.bio ?? "", type: me.business_type ?? "other", state: me.state ?? "", city: me.city ?? "", avatar: me.avatar_url ?? "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function photo(files: FileList | null) {
    const img = files?.[0]; if (!img) return;
    setBusy(true); setMsg(null);
    try {
      const small = await preparePhoto(img); // location data removed, max 1600px
      const fd = new FormData(); fd.append("file", small);
      const j = await (await fetch("/api/upload", { method: "POST", body: fd })).json();
      if (!j.success) throw new Error(j.error);
      setF((x) => ({ ...x, avatar: j.url }));
    } catch (e) { setMsg({ ok: false, t: e instanceof Error && e.message ? e.message : "Couldn't add that photo." }); }
    setBusy(false);
  }
  async function save() {
    setBusy(true); setMsg(null);
    const e = await patchMe({ display_name: f.name, bio: f.bio, business_type: f.type, state: f.state, city: f.city, avatar_url: f.avatar || null });
    setMsg(e ? { ok: false, t: e } : { ok: true, t: "Saved." }); setBusy(false);
  }
  return (
    <div className="px-5 space-y-5">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => file.current?.click()} aria-label="Change photo" className="active:scale-95 transition-transform"><Avatar name={f.name} src={f.avatar} size={80} /></button>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => photo(e.target.files)} />
        <button type="button" onClick={() => file.current?.click()} className="min-h-11 text-[14px] font-medium text-neutral-600 underline">Change photo</button>
      </div>
      <label className="block text-[13px] font-medium text-neutral-600">Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={40} className={`${inputCls} mt-1.5`} /></label>
      <label className="block text-[13px] font-medium text-neutral-600">About you<textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={3} maxLength={200} placeholder="A line or two about you and your business" className={`${inputCls} mt-1.5 py-3`} /><span className="block mt-1 text-right text-[12px] text-neutral-400 tabular-nums">{f.bio.length}/200</span></label>
      <label className="block text-[13px] font-medium text-neutral-600">Business type<select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={`${inputCls} mt-1.5`}>{LEGACY_BUSINESS_TYPES.map((t) => <option key={t} value={t}>{BUSINESS_TYPE_LABEL[t]}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-[13px] font-medium text-neutral-600">State<select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} className={`${inputCls} mt-1.5`}><option value="">Select</option>{NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <label className="block text-[13px] font-medium text-neutral-600">City<input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={60} className={`${inputCls} mt-1.5`} /></label>
      </div>

      <Section title="What others see">
        <div className={`${cardCls} p-4 flex items-center gap-3`}>
          <Avatar name={f.name} src={f.avatar} size={48} />
          <div className="min-w-0"><p style={{ fontFamily: FF }} className="text-[16px] font-bold text-spal-navy truncate">{f.name || "Your name"}</p><p className="text-[13px] text-neutral-500">Level {me.current_level} · {LEVELS[me.current_level as Level].name} · {BUSINESS_TYPE_LABEL[f.type]}{f.state ? ` · ${f.state}` : ""}</p>{f.bio && <p className="mt-1 text-[14px] text-spal-navy leading-snug">{f.bio}</p>}</div>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500 leading-snug">{me.profile_visibility === "public" ? "Your profile is visible to the community." : "Your profile is hidden right now, so no one sees this. You can change that in the Privacy centre."} Your phone, email and money records are never shown.</p>
      </Section>
      {msg && <Notice ok={msg.ok}>{msg.t}</Notice>}
      <button type="button" onClick={save} disabled={busy || !f.name.trim()} style={{ fontFamily: FF }} className={primaryCls}>{busy ? "Saving…" : "Save"}</button>
    </div>
  );
}

export default function EditProfile() {
  const { state, reload } = useMe();
  return (
    <div data-testid="screen-L02" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Edit profile" />
      {state.status === "loading" && <ScreenSkeleton />}
      {state.status === "error" && <ErrorBlock onRetry={reload} />}
      {state.status === "ready" && <Form me={state.me} />}
    </div>
  );
}
