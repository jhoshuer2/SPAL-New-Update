"use client";
// L10 Delete account: what goes, confirm with your password, 30 days to change your mind.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FF, Section, TopBar, cardCls } from "@/components/journey/ui";
import { inputCls, Notice } from "@/components/me/ui";

const GOES = ["Your profile, posts, replies and cheers", "Your sales, expenses, debts and stock", "Your plans, journey and goals", "Everything Spal learned about you", "Your sign-in"];

export default function DeleteAccount() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true); setErr("");
    try {
      const j = await (await fetch("/api/me/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) })).json();
      if (!j.success) throw new Error(j.error);
      router.replace("/login");
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Could not delete your account. Please try again."); setBusy(false); }
  }
  return (
    <div data-testid="screen-L10" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="Delete account" />
      <div className="px-5 space-y-5">
        <h1 style={{ fontFamily: FF }} className="text-[26px] leading-tight font-bold text-spal-navy tracking-tight">We&apos;re sorry to see you go</h1>
        <div className={`${cardCls} p-4`}>
          <p className="text-[14px] font-bold text-spal-navy">This will delete:</p>
          <ul className="mt-2 space-y-1.5">{GOES.map((g) => <li key={g} className="text-[14px] text-neutral-700 leading-snug">• {g}</li>)}</ul>
        </div>
        <Section title="30 days to change your mind">
          <p className="-mt-1 text-[14px] text-neutral-700 leading-relaxed">Your profile and posts are hidden straight away and you&apos;re logged out everywhere. Everything is permanently deleted after 30 days. Log in any time before then and you can cancel, and your records and journey will still be there.</p>
        </Section>
        <label className="block text-[13px] font-medium text-neutral-600">Your password, to confirm<input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${inputCls} mt-1.5`} /></label>
        <button type="button" role="checkbox" aria-checked={sure} onClick={() => setSure(!sure)} className="w-full min-h-12 flex items-start gap-3 text-left">
          <span aria-hidden className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-[13px] ${sure ? "bg-red-600 border-red-600 text-white" : "border-neutral-300"}`}>{sure ? "✓" : ""}</span>
          <span className="text-[14px] text-spal-navy leading-snug">I understand my account and data will be permanently deleted after 30 days.</span>
        </button>
        {err && <Notice ok={false}>{err}</Notice>}
        <button type="button" onClick={go} disabled={busy || !pw || !sure} style={{ fontFamily: FF }} className="w-full h-14 rounded-full bg-red-600 text-white text-[16px] font-bold disabled:bg-neutral-200 disabled:text-neutral-400 active:scale-[0.98] transition-transform">{busy ? "Deleting…" : "Delete my account"}</button>
        <button type="button" onClick={() => router.back()} className="w-full min-h-12 text-[15px] font-medium text-spal-navy">Keep my account</button>
      </div>
    </div>
  );
}
