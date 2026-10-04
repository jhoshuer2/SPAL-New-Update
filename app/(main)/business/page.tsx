"use client";
// F01 Business overview: money in, out and profit at a glance. At Level 0 this tab opens the planning studio instead.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJourney } from "@/components/journey/useJourney";
import { ErrorBlock, FF, ScreenSkeleton, Section, TopBar, cardCls } from "@/components/journey/ui";
import { formatCurrency } from "@/lib/utils/currency";
import type { Period, Summary } from "@/lib/engine/business";

type Overview = { period: Period; range: { start: string; end: string }; summary: Summary; previous: { moneyIn: number; moneyOut: number; profit: number }; comment: string };
const PERIODS: [Period, string][] = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["custom", "Custom"]];
const SPLIT: [keyof Summary["split"], string][] = [["cash", "Cash"], ["transfer", "Transfer"], ["pos", "POS"], ["credit", "Pay later"], ["unspecified", "Not noted"]];
const today = () => new Date().toISOString().slice(0, 10);

function Trend({ data }: { data: Summary["trend"] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.in, d.out]));
  const w = 100 / Math.max(1, data.length);
  const total = data.reduce((s, d) => s + d.in, 0);
  const best = [...data].sort((a, b) => b.in - a.in)[0];
  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-32" role="img" aria-label={`Money in per day. Total ${formatCurrency(total)}${best && best.in > 0 ? `, best day ${best.date} with ${formatCurrency(best.in)}` : ""}.`}>
        {data.map((d, i) => (
          <g key={d.date}>
            <rect x={i * w + w * 0.12} y={40 - (d.in / max) * 38} width={w * 0.76} height={Math.max(0.6, (d.in / max) * 38)} rx="0.8" fill="#22C55E" opacity={d.in ? 1 : 0.25} />
            {d.out > 0 && <rect x={i * w + w * 0.12} y={40 - (d.out / max) * 38} width={w * 0.76} height="0.7" fill="#0F172A" />}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-neutral-500"><span>{data[0]?.date.slice(5)}</span><span className="flex items-center gap-3"><span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-[#22C55E]" />In</span><span className="flex items-center gap-1"><i className="w-2 h-0.5 bg-spal-navy" />Out</span></span><span>{data[data.length - 1]?.date.slice(5)}</span></div>
    </div>
  );
}

export default function BusinessOverview() {
  const router = useRouter();
  const { state: journey } = useJourney();
  const [period, setPeriod] = useState<Period>("week");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState(false);

  // Level 0 has nothing to track yet: the Business tab is the planning studio (spec §6.1).
  useEffect(() => { if (journey.status === "ready" && journey.data.level === 0 && !journey.data.hasEverRecorded) router.replace("/business/planning"); }, [journey, router]);

  const load = useCallback(() => {
    const q = new URLSearchParams({ period, ...(period === "custom" ? { start: from, end: to } : {}) });
    fetch(`/api/business/overview?${q}`).then((r) => r.json()).then((j) => { if (j.success) { setErr(false); setData(j.data); } else setErr(true); }).catch(() => setErr(true));
  }, [period, from, to]);
  useEffect(() => { load(); }, [load]);

  const s = data?.summary;
  const splitTotal = s ? Object.values(s.split).reduce((a, b) => a + b, 0) : 0;
  return (
    <div data-testid="screen-F01" className="min-h-full pb-nav bg-spal-bg">
      <TopBar back={false} title="Business" right={<Link href="/business/profile" className="h-10 px-4 rounded-full bg-white border border-neutral-200 text-[13px] font-bold text-spal-navy flex items-center active:scale-95 transition-transform">Profile</Link>} />

      <div className="px-5">
        <div className="flex bg-white rounded-full p-1 border border-neutral-200/70" role="tablist" aria-label="Period">
          {PERIODS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={period === k} onClick={() => setPeriod(k)} className={`flex-1 min-h-10 rounded-full text-[13px] font-bold transition-colors ${period === k ? "bg-[#22C55E] text-white" : "text-neutral-500"}`}>{l}</button>)}
        </div>
        {period === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-[12px] text-neutral-500">From<input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full min-h-11 rounded-xl bg-white border border-neutral-200 px-3 text-[15px] text-spal-navy" /></label>
            <label className="text-[12px] text-neutral-500">To<input type="date" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full min-h-11 rounded-xl bg-white border border-neutral-200 px-3 text-[15px] text-spal-navy" /></label>
          </div>
        )}
      </div>

      {err && <ErrorBlock onRetry={load} />}
      {!err && !data && <ScreenSkeleton />}
      {!err && data && s && (
        <>
          <div className="px-5 mt-4 grid grid-cols-2 gap-3">
            <div className={`${cardCls} p-4`}><p className="text-[12px] text-neutral-500">Money in</p><p style={{ fontFamily: FF }} className="text-[22px] font-bold text-spal-green-700 tabular-nums">+{formatCurrency(s.moneyIn)}</p></div>
            <div className={`${cardCls} p-4`}><p className="text-[12px] text-neutral-500">Money out</p><p style={{ fontFamily: FF }} className="text-[22px] font-bold text-spal-navy tabular-nums">−{formatCurrency(s.moneyOut)}</p></div>
            <div className={`${cardCls} p-4 col-span-2`}><p className="text-[12px] text-neutral-500">Profit</p><p style={{ fontFamily: FF }} className="text-[32px] leading-tight font-bold text-spal-navy tabular-nums">{s.profit < 0 ? "−" : ""}{formatCurrency(Math.abs(s.profit))}</p></div>
          </div>

          <div className="px-5 mt-3"><div className="rounded-[20px] bg-white/70 border border-neutral-200/60 p-4 flex items-start gap-3"><span aria-hidden className="mt-0.5 w-8 h-8 rounded-full bg-[#22C55E]/15 flex items-center justify-center shrink-0"><span className="w-3 h-3 rounded-full bg-[#22C55E]" /></span><p className="text-[14px] text-spal-navy leading-snug"><span className="block text-[12px] font-medium text-neutral-500 mb-0.5">Spal</span>{data.comment}</p></div></div>

          {s.recordCount === 0 ? (
            <div className="px-5 mt-5"><div className={`${cardCls} p-6 text-center`}>
              <p style={{ fontFamily: FF }} className="text-[18px] font-bold text-spal-navy">Let&apos;s record your first one</p>
              <p className="mt-1 text-[14px] text-neutral-600">It takes under five seconds. Your numbers show up here as you add them.</p>
              <Link href="/business/sales/new" className="mt-4 inline-flex h-12 px-6 items-center rounded-full bg-[#22C55E] text-white text-[15px] font-bold shadow-[var(--shadow-btn-green)]">Add a sale</Link>
            </div></div>
          ) : (
            <>
              <Section title="Money in, day by day"><div className={`${cardCls} p-4`}><Trend data={s.trend} /></div></Section>
              {s.topProducts.length > 0 && (
                <Section title="Top sellers"><ol className={`${cardCls} px-4 divide-y divide-neutral-100`}>{s.topProducts.map((p, i) => (
                  <li key={p.name} className="py-3 flex items-center gap-3"><span className="w-6 text-[13px] font-bold text-neutral-400">{i + 1}</span><span className="flex-1 min-w-0 text-[15px] text-spal-navy truncate">{p.name}</span><span className="text-[15px] font-bold text-spal-navy tabular-nums">{formatCurrency(p.amount)}</span></li>))}</ol></Section>
              )}
              {splitTotal > 0 && (
                <Section title="How people paid">
                  <div className={`${cardCls} p-4`}>
                    <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100" role="img" aria-label={SPLIT.filter(([k]) => s.split[k] > 0).map(([k, l]) => `${l} ${Math.round((s.split[k] / splitTotal) * 100)} percent`).join(", ")}>
                      {SPLIT.map(([k], i) => s.split[k] > 0 && <span key={k} style={{ width: `${(s.split[k] / splitTotal) * 100}%`, background: ["#22C55E", "#2563EB", "#8B5CF6", "#F97316", "#D4D4D8"][i] }} />)}
                    </div>
                    <ul className="mt-3 space-y-1.5">{SPLIT.filter(([k]) => s.split[k] > 0).map(([k, l]) => <li key={k} className="flex items-center justify-between text-[14px]"><span className="flex items-center gap-2 text-neutral-600"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: ["#22C55E", "#2563EB", "#8B5CF6", "#F97316", "#D4D4D8"][SPLIT.findIndex(([x]) => x === k)] }} />{l}</span><span className="tabular-nums text-spal-navy">{formatCurrency(s.split[k])}</span></li>)}</ul>
                  </div>
                </Section>
              )}
            </>
          )}

          <Section title="Go to">
            <div className="grid grid-cols-2 gap-3">
              {[["Add a sale", "/business/sales/new"], ["Add an expense", "/business/expenses/new"], ["All records", "/records"], ["Debts & credit", "/business/debts"], ["Stock", "/inventory"], ["Plan & launch", "/business/planning"]].map(([l, h]) => (
                <Link key={h} href={h} style={{ fontFamily: FF }} className={`${cardCls} min-h-14 px-4 flex items-center text-[15px] font-bold text-spal-navy active:scale-[0.98] transition-transform`}>{l}</Link>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
