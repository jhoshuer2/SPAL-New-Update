"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, ReceiptDollarIcon } from "hugeicons-react";

const BG = "#EDF3E8";
const FF = "var(--font-satoshi)";

export default function BillingHistoryPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col" style={{ background: BG, fontFamily: FF, minHeight: "100dvh" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft01Icon size={20} color="#0F172A" />
        </button>
        <h1 className="text-[22px] font-black text-spal-navy" style={{ fontFamily: FF }}>Billing History</h1>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ paddingBottom: "18vh" }}>
        <ReceiptDollarIcon size={54} color="#9AA3AF" strokeWidth={1.4} />
        <p className="text-[22px] font-black text-spal-navy mt-4" style={{ fontFamily: FF }}>No billing history yet</p>
        <p className="text-[15px] text-neutral-500 mt-1 max-w-[280px]" style={{ fontFamily: FF }}>
          Your payments and receipts will show up here once you subscribe to a plan.
        </p>
        <button onClick={() => { window.location.href = "/billing"; }}
          className="mt-6 h-13 px-6 rounded-full text-white font-black text-[15px] active:scale-[0.98] transition-transform"
          style={{ background: "#22C55E", fontFamily: FF, height: 52 }}>
          View Plans
        </button>
      </div>
    </div>
  );
}
