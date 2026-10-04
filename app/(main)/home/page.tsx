"use client";

import { Suspense, useEffect, useState } from "react";
import { useSPALStore } from "@/store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { RetailHome } from "@/components/home/RetailHome";
import { PerishableHome } from "@/components/home/PerishableHome";
import { useBusinessMode } from "@/hooks/useBusinessMode";
import { useJourney } from "@/components/journey/useJourney";
import { JourneyStrip } from "@/components/home/JourneyStrip";
import { StarterHome } from "@/components/home/StarterHome";
import { QuickAddSheet } from "@/components/home/QuickAddSheet";

/**
 * Home is dynamic by business type via lib/business-mode:
 *  - perishable (restaurant/bar) -> PerishableHome (built separately)
 *  - non-perishable (kiosk, supermarket, clothing, salon, ...) -> RetailHome
 */
function HomeInner() {
  const { user, activeBusiness, setActiveBusiness, setBusinesses } = useSPALStore();
  usePushNotifications(user?.id);

  // Bootstrap businesses so the active one (and its type) is known.
  useEffect(() => {
    if (!user) return;
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.length) {
          setBusinesses(d.data);
          const active = d.data.find((b: { id: string }) => b.id === user.active_business_id) ?? d.data[0];
          if (active && (!activeBusiness || activeBusiness.id !== active.id)) setActiveBusiness(active);
        }
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { ready, perishable } = useBusinessMode();
  const { state } = useJourney();
  const [addOpen, setAddOpen] = useState(false);
  if (!ready) return null;

  // Level 0 (nothing sold yet): the starter path. Everyone else keeps their money home, with the
  // level card, today's focus and Spal's line on top. If the new tables are not live yet, nothing changes.
  const journey = state.status === "ready" ? state.data : null;
  if (journey && journey.onboardingDone && journey.level === 0 && !journey.hasEverRecorded) {
    return (<><StarterHome data={journey} /><AddButton onClick={() => setAddOpen(true)} /><QuickAddSheet open={addOpen} onClose={() => setAddOpen(false)} /></>);
  }
  const slot = journey ? <JourneyStrip data={journey} /> : undefined;
  return (
    <>
      {perishable ? <PerishableHome slot={slot} /> : <RetailHome slot={slot} />}
      {journey && <AddButton onClick={() => setAddOpen(true)} />}
      <QuickAddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

/** Floating quick-add button (C03), sitting just above the bottom bar. */
function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Quick add" onClick={onClick}
      className="fixed right-4 z-40 w-14 h-14 rounded-full bg-[#22C55E] text-white text-[28px] leading-none shadow-[var(--shadow-btn-green)] flex items-center justify-center active:scale-95 transition-transform"
      style={{ bottom: "calc(var(--bottom-nav-h, 84px) + 16px)" }}>
      +
    </button>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
