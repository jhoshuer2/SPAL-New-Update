"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search01Icon, Notification03Icon } from "hugeicons-react";
import { useSPALStore } from "@/store";
import { getGreeting } from "@/lib/utils/dates";
import { markSetupSeen } from "@/lib/setup-progress";

const CIRCLE = { boxShadow: "0 1px 4px rgba(0,0,0,0.06)" } as const;

/**
 * Greeting header shared by the restaurant/bar tab screens (Home, Orders, Menu).
 * Built to stay on one line from 320px up: the name shrinks and truncates
 * instead of pushing the search and bell buttons off screen.
 */
export function AppHeader() {
  const router = useRouter();
  const { user, activeBusiness } = useSPALStore();
  const name = activeBusiness?.business_name ?? user?.business_name ?? user?.full_name ?? "there";
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json())
      .then((d) => { if (d.success) setUnread((d.data as { read_at: string | null }[]).filter((n) => !n.read_at).length); })
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 min-[360px]:px-5 pt-12 flex items-center justify-between gap-2">
      <button onClick={() => { markSetupSeen("profile"); router.push("/profile"); }} aria-label="Open profile" className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-12 active:opacity-80">
        <span className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "#D9C7B8" }}>
          {user?.avatar_url
            ? <Image src={user.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-[18px]">{name.charAt(0).toUpperCase()}</span>}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] text-neutral-500 truncate">{getGreeting()}</span>
          <span className="block font-black text-spal-navy leading-tight truncate" style={{ fontFamily: "var(--font-satoshi)", fontSize: "clamp(17px, 5.2vw, 20px)" }}>{name}</span>
        </span>
      </button>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => router.push("/records")} aria-label="Search orders" className="w-12 h-12 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" style={CIRCLE}>
          <Search01Icon size={19} color="#0F172A" />
        </button>
        <button onClick={() => { setUnread(0); router.push("/notifications"); }} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} className="w-12 h-12 rounded-full bg-white flex items-center justify-center relative active:scale-95 transition-transform" style={CIRCLE}>
          <Notification03Icon size={19} color="#0F172A" />
          {unread > 0 && <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </div>
    </div>
  );
}
