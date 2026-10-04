"use client";

import { Suspense, useEffect } from "react";
import { useSPALStore } from "@/store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { RetailHome } from "@/components/home/RetailHome";
import { PerishableHome } from "@/components/home/PerishableHome";
import { useBusinessMode } from "@/hooks/useBusinessMode";

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
  if (!ready) return null;

  return perishable ? <PerishableHome /> : <RetailHome />;
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
