"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSPALStore, type User } from "@/store";
import type { Business } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AchievementsSection } from "@/components/gamification/AchievementsSection";
import { enablePushNotifications, disablePushNotifications } from "@/hooks/usePushNotifications";
import {
  ArrowLeft01Icon,
  PencilEdit01Icon, Cancel01Icon, UserIcon, Mail01Icon, SmartPhone01Icon, ChatIcon, Notification01Icon, Notification02Icon,
  Store01Icon, Coins01Icon, ReceiptDollarIcon, ArrowRight01Icon, Camera01Icon, FireIcon, Tick01Icon, Alert01Icon,
  BookOpen01Icon, Message01Icon, GridViewIcon, File01Icon, Folder01Icon,
  PlusSignIcon, Archive01Icon, Building04Icon,
  Briefcase01Icon, Location01Icon, UserAdd01Icon, Invoice01Icon, HelpCircleIcon, Shield01Icon, Share08Icon, Search01Icon,
} from "hugeicons-react";
import type { TrackingMethod } from "@/store";

const GOAL_LABELS: Record<string, string> = {
  track_daily_sales:   "Track daily sales",
  know_real_profit:    "Know my real profit",
  reduce_expenses:     "Reduce expenses",
  grow_business:       "Grow my business",
  understand_spending: "Understand my spending",
};

const GOAL_SUBS: Record<string, string> = {
  track_daily_sales:   "Know exactly how much you make each day",
  know_real_profit:    "See what you actually keep after expenses",
  reduce_expenses:     "Find where money is leaking out",
  grow_business:       "Make better decisions to grow",
  understand_spending: "See patterns in how you spend money",
};

const BIZ_TYPE_COLORS: Record<string, string> = {
  food_seller:    "#22C55E",
  bar_owner:      "#F97316",
  fashion_vendor: "#8B5CF6",
  salon:          "#2563EB",
  kiosk:          "#22C55E",
  market_trader:  "#F97316",
  other:          "#A1A1AA",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  food_seller:    "Food Seller",
  bar_owner:      "Bar Owner",
  fashion_vendor: "Fashion Vendor",
  salon:          "Salon Owner",
  kiosk:          "Kiosk Owner",
  market_trader:  "Market Trader",
  other:          "Business Owner",
};

const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi",  symbol: "₵" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "USD", label: "US Dollar",      symbol: "$" },
  { code: "GBP", label: "British Pound",  symbol: "£" },
];

type SheetType = "name" | "business" | "whatsapp" | "currency" | "notifications" | "add-email" | "add-phone" | "tracking-methods" | "business-goals" | "biz-options" | null;

const TRACKING_METHOD_LABELS: Partial<Record<TrackingMethod, string>> = {
  notebook:      "Notebook",
  whatsapp:      "WhatsApp",
  excel:         "Excel",
  google_sheets: "Google Sheets",
  notes_app:     "Notes App",
  receipts:      "Receipts",
  nothing:       "Other",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, activeBusiness, setActiveBusiness, businesses, setBusinesses } = useSPALStore();
  const [signingOut,    setSigningOut]    = useState(false);
  const [comingSoon,    setComingSoon]    = useState(false);
  const [activeSheet,   setActiveSheet]   = useState<SheetType>(null);
  const soon = () => { setComingSoon(true); setTimeout(() => setComingSoon(false), 2200); };

  // Push notifications toggle — on = permission granted and not user-disabled.
  const [pushOn, setPushOn]     = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    try {
      const granted = typeof Notification !== "undefined" && Notification.permission === "granted";
      setPushOn(granted && localStorage.getItem("spal_push_enabled") !== "0");
    } catch { /* ignore */ }
  }, []);
  async function togglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePushNotifications();
        try { localStorage.setItem("spal_push_enabled", "0"); } catch { /* ignore */ }
        setPushOn(false);
      } else {
        const res = await enablePushNotifications();
        if (res === "granted") { try { localStorage.setItem("spal_push_enabled", "1"); } catch { /* ignore */ } setPushOn(true); }
        // Blocked at the browser level — the toggle can't turn itself on; show
        // how to fix it instead of just silently staying off.
        else if (res === "denied") setActiveSheet("notifications");
      }
    } finally { setPushBusy(false); }
  }
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [switchingBiz,  setSwitchingBiz]  = useState<string | null>(null);
  const [bizToManage,   setBizToManage]   = useState<Business | null>(null);
  const [switchToast,   setSwitchToast]   = useState<string | null>(null);

  // Business health (last 7 days)
  const [health, setHealth] = useState<"loading" | "profitable" | "breaking-even" | "spending-more" | "no-data">("loading");

  const fetchHealth = useCallback(async () => {
    try {
      const end   = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const res  = await fetch(`/api/records?start_date=${fmt(start)}&end_date=${fmt(end)}&limit=200`);
      const data = await res.json();
      if (!data.success || !data.data?.length) { setHealth("no-data"); return; }
      const records: Array<{ type: string; amount: number }> = data.data;
      const sales    = records.filter(r => r.type === "sale").reduce((s, r) => s + Number(r.amount), 0);
      const expenses = records.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
      const profit   = sales - expenses;
      if (profit >  sales * 0.05) setHealth("profitable");
      else if (profit < -sales * 0.05) setHealth("spending-more");
      else setHealth("breaking-even");
    } catch {
      setHealth("no-data");
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    fetch("/api/businesses")
      .then(r => r.json())
      .then(d => { if (d.success) setBusinesses(d.data ?? []); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function switchBusiness(biz: Business) {
    if (biz.id === activeBusiness?.id || switchingBiz) return;
    setSwitchingBiz(biz.id);
    try {
      await fetch("/api/user/active-business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: biz.id }),
      });
      setActiveBusiness(biz);
      setSwitchToast(biz.business_name);
      setTimeout(() => setSwitchToast(null), 2500);
    } catch { /* silent */ } finally {
      setSwitchingBiz(null);
    }
  }

  async function archiveBusiness(biz: Business) {
    try {
      await fetch(`/api/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });
      const remaining = businesses.filter(b => b.id !== biz.id);
      setBusinesses(remaining);
      setActiveSheet(null);
      setBizToManage(null);
      // If we archived the active business, switch to the first remaining one
      if (activeBusiness?.id === biz.id && remaining.length > 0) {
        switchBusiness(remaining[0]);
      }
    } catch { /* silent */ }
  }

  // Verified = name + business details + at least one contact (phone or whatsapp)
  const isVerified = !!(
    user?.full_name &&
    user?.business_name &&
    (user?.phone_number || user?.whatsapp_number)
  );

  const businessLabel = user?.business_type
    ? BUSINESS_TYPE_LABELS[user.business_type] ?? "Business"
    : "Business";

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarLoading(true);
    try {
      // Compress to 160×160 JPEG via Canvas (keeps it ~5-10 KB)
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width  = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d")!;

      // Crop to square (centre)
      const size = Math.min(bitmap.width, bitmap.height);
      const sx   = (bitmap.width  - size) / 2;
      const sy   = (bitmap.height - size) / 2;
      ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 160, 160);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const err = await saveProfile({ avatar_url: dataUrl });
      if (err) console.error("Avatar save error:", err);
    } catch (err) {
      console.error("Avatar compress error:", err);
    } finally {
      setAvatarLoading(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = "";
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch { /* continue regardless */ } finally {
      logout();
      router.push("/login");
    }
  }

  async function saveActiveBusiness(updates: Record<string, unknown>): Promise<string | null> {
    if (!activeBusiness) return "No active business.";
    try {
      const res  = await fetch(`/api/businesses/${activeBusiness.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...activeBusiness, ...updates };
        setActiveBusiness(updated as typeof activeBusiness);
        setBusinesses(businesses.map(b => b.id === activeBusiness.id ? updated as typeof activeBusiness : b));
        return null;
      }
      return data.error ?? "Something went wrong.";
    } catch {
      return "Network error. Please check your connection.";
    }
  }

  // Returns null on success, error string on failure
  async function saveProfile(updates: Record<string, unknown>): Promise<string | null> {
    try {
      const res  = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && user) {
        setUser({ ...user, ...data.data });
        return null; // success
      }
      return data.error ?? "Something went wrong. Please try again.";
    } catch (e) {
      console.error("saveProfile error:", e);
      return "Network error. Please check your connection.";
    }
  }

  return (
    <div className="min-h-full pb-28" style={{ background: "#EEF3E9", fontFamily: "var(--font-satoshi)" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-2 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#D9C7B8" }}>
          {user?.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[16px] font-black text-white">{(user?.business_name ?? user?.full_name ?? "S").charAt(0).toUpperCase()}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-neutral-500">{greeting()}</p>
          <p className="text-[18px] font-black text-spal-navy truncate">{user?.business_name ?? "Your Store"}</p>
        </div>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Search"><Search01Icon size={19} color="#6B7280" /></button>
        <button className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center active:scale-95" aria-label="Notifications"><Notification01Icon size={19} color="#6B7280" /></button>
      </div>

      {/* Big avatar + name */}
      <div className="flex flex-col items-center mt-4">
        <label className="relative cursor-pointer block w-28 h-28">
          <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={avatarLoading} />
          <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#D9C7B8" }}>
            {user?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : avatarLoading ? <span className="text-white animate-pulse">…</span>
              : <span className="text-[40px] font-black text-white">{(user?.business_name ?? user?.full_name ?? "S").charAt(0).toUpperCase()}</span>}
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            <Camera01Icon size={16} color="#8B5CF6" />
          </span>
        </label>
        <button onClick={() => setActiveSheet("name")} className="mt-4 text-[17px] font-black text-spal-navy">
          {user?.full_name ?? "Add a Name"}
        </button>
      </div>

      {/* Menu group 1 */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-3xl px-2 py-1" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <ProfileRow icon={<UserIcon size={20} color="#F97316" />} tint="#FDECDD" title="Personal Profile" sub="Set and manage your profile" onClick={() => setActiveSheet("name")} />
          <ProfileRow icon={<Briefcase01Icon size={20} color="#16A34A" />} tint="#E4F5E9" title="Business Profile" sub="Set and manage your business profile" onClick={() => setActiveSheet("business")} />
          <ProfileRow icon={<Location01Icon size={20} color="#8B5CF6" />} tint="#EEE7FB" title="Business Locations" sub="Set and manage your business locations" onClick={soon} />
          <ProfileRow icon={<UserAdd01Icon size={20} color="#2563EB" />} tint="#E4ECFB" title="Staffs & Permission" sub="Add your staffs and set their permissions" onClick={soon} last />
        </div>
      </div>

      {/* Menu group 2 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl px-2 py-1" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <ProfileRow icon={<Notification01Icon size={20} color="#F97316" />} tint="#FDECDD" title="Notification" sub="Sales, reminders, insights on your lock screen"
            trailing={<PushToggle on={pushOn} busy={pushBusy} onToggle={togglePush} />} />
          <ProfileRow icon={<ReceiptDollarIcon size={20} color="#16A34A" />} tint="#E4F5E9" title="Receipts & Tax" sub="Manage currency, receipt and tax amount" onClick={() => router.push("/profile/receipts")} />
          <ProfileRow icon={<Invoice01Icon size={20} color="#8B5CF6" />} tint="#EEE7FB" title="Billing & Plan" sub="Manage your payment plan" onClick={() => router.push("/billing")} />
          <ProfileRow icon={<ReceiptDollarIcon size={20} color="#16A34A" />} tint="#E4F5E9" title="Billing History" sub="See your past payments" onClick={() => router.push("/billing/history")} />
          <ProfileRow icon={<HelpCircleIcon size={20} color="#2563EB" />} tint="#E4ECFB" title="Help & Support" sub="Get help where necessary" onClick={soon} />
          <ProfileRow icon={<Shield01Icon size={20} color="#F97316" />} tint="#FDECDD" title="Security" sub="Add an extra layer of security to your account" onClick={soon} />
          <ProfileRow icon={<Share08Icon size={20} color="#16A34A" />} tint="#E4F5E9" title="Share/Invite Others" sub="Invite others to join the account" onClick={soon} last />
        </div>
      </div>

      {/* Log out + version */}
      <div className="flex flex-col items-center mt-8">
        <button onClick={handleSignOut} disabled={signingOut} className="text-[16px] font-black active:opacity-70" style={{ color: "#EF4444" }}>
          {signingOut ? "Logging out…" : "Log Out"}
        </button>
        <p className="text-[13px] text-neutral-400 mt-2">Ver. 1.1</p>
      </div>

      {/* Coming-soon toast */}
      <AnimatePresence>
        {comingSoon && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22 }} className="fixed left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-full"
            style={{ background: "#0F172A", bottom: "calc(var(--bottom-nav-h, 88px) + 16px)", boxShadow: "0 10px 30px rgba(0,0,0,0.28)" }}>
            <span className="text-[14px] font-bold text-white">Coming soon — we are building this for you</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Switch toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {switchToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl shadow-lg"
            style={{ background: "#0F172A" }}
          >
            <p className="text-white text-[13px] font-semibold whitespace-nowrap">
              Switched to {switchToast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Business options sheet ─────────────────────────────────── */}
      <Sheet
        open={activeSheet === "biz-options"}
        onClose={() => { setActiveSheet(null); setBizToManage(null); }}
        title={bizToManage?.business_name ?? "Business"}
      >
        {bizToManage && (
          <div className="space-y-3 pb-4">
            <p className="text-[13px] text-neutral-400">
              {BUSINESS_TYPE_LABELS[bizToManage.business_type] ?? "Business"}
            </p>
            <button
              onClick={() => {
                setActiveSheet(null);
                setBizToManage(null);
                router.push(`/add-business/rename?id=${bizToManage.id}&name=${encodeURIComponent(bizToManage.business_name)}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-4 bg-neutral-50 rounded-xl text-left active:bg-neutral-100 transition-colors"
            >
              <PencilEdit01Icon size={18} color="#0F172A" />
              <span className="text-[14px] font-semibold text-spal-navy">Rename business</span>
            </button>
            {businesses.length > 1 && (
              <button
                onClick={() => archiveBusiness(bizToManage)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left active:bg-red-50 transition-colors"
                style={{ border: "1.5px solid #FEE2E2" }}
              >
                <Archive01Icon size={18} color="#EF4444" />
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "#EF4444" }}>Archive business</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">Your data is kept — you can restore it later</p>
                </div>
              </button>
            )}
          </div>
        )}
      </Sheet>

      {/* ── Bottom Sheets ─────────────────────────────────────────── */}

      <NameSheet
        open={activeSheet === "name"}
        user={user}
        onClose={() => setActiveSheet(null)}
        onSave={async (updates) => {
          const err = await saveProfile(updates);
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <BusinessDetailsSheet
        open={activeSheet === "business"}
        user={user}
        onClose={() => setActiveSheet(null)}
        onSave={async (updates) => {
          const err = await saveProfile(updates);
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <WhatsAppSheet
        open={activeSheet === "whatsapp"}
        current={user?.whatsapp_number ?? ""}
        onClose={() => setActiveSheet(null)}
        onSave={async (number) => {
          const err = await saveProfile({ whatsapp_number: number || null });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <CurrencySheet
        open={activeSheet === "currency"}
        current={user?.currency ?? "NGN"}
        currentTax={user?.tax_rate ?? 7.5}
        onClose={() => setActiveSheet(null)}
        onSave={async (code, taxRate) => {
          const err = await saveProfile({ currency: code, tax_rate: taxRate });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <NotificationsSheet
        open={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
      />

      <AddContactSheet
        open={activeSheet === "add-email" || activeSheet === "add-phone"}
        type={activeSheet === "add-email" ? "email" : "phone"}
        onClose={() => setActiveSheet(null)}
        onSaved={(updatedUser) => { setUser(updatedUser as User); setActiveSheet(null); }}
      />

      <TrackingMethodsSheet
        open={activeSheet === "tracking-methods"}
        currentMethods={(activeBusiness?.tracking_methods ?? []).filter(m => m !== "nothing") as TrackingMethod[]}
        onClose={() => setActiveSheet(null)}
        onSave={async (methods) => {
          const err = await saveActiveBusiness({ tracking_methods: methods });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />

      <BusinessGoalsSheet
        open={activeSheet === "business-goals"}
        currentGoals={activeBusiness?.business_goals ?? []}
        onClose={() => setActiveSheet(null)}
        onSave={async (goals) => {
          const err = await saveActiveBusiness({ business_goals: goals });
          if (!err) setActiveSheet(null);
          return err;
        }}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function PushToggle({ on, busy, onToggle }: { on: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} disabled={busy} aria-label="Toggle push notifications" aria-pressed={on}
      className="relative flex-shrink-0 rounded-full transition-colors disabled:opacity-60"
      style={{ width: 48, height: 28, background: on ? "#22C55E" : "#D1D5DB" }}>
      <motion.span animate={{ x: on ? 22 : 2 }} transition={{ type: "tween", duration: 0.18 }}
        className="absolute top-[3px] rounded-full bg-white" style={{ width: 22, height: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

function ProfileRow({ icon, tint, title, sub, onClick, last, trailing }: {
  icon: React.ReactNode; tint: string; title: string; sub: string; onClick?: () => void; last?: boolean; trailing?: React.ReactNode;
}) {
  const inner = (
    <>
      <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tint }}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>{title}</span>
        <span className="block text-[13px] text-neutral-400 mt-0.5" style={{ fontFamily: "var(--font-satoshi)" }}>{sub}</span>
      </span>
      {trailing ?? <ArrowRight01Icon size={18} color="#C4CBD4" />}
    </>
  );
  // A row with a trailing control (e.g. a toggle) isn't itself tappable.
  if (trailing) {
    return (
      <div className="w-full flex items-center gap-3.5 px-3 py-4" style={{ borderBottom: last ? "none" : "1px solid #F1F3EF" }}>
        {inner}
      </div>
    );
  }
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-3 py-4 text-left active:bg-black/[0.02] transition-colors"
      style={{ borderBottom: last ? "none" : "1px solid #F1F3EF" }}>
      {inner}
    </button>
  );
}

function PencilMiniIcon() {
  return <PencilEdit01Icon size={13} color="#A1A1AA" />;
}

function StatItem({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">{value}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

const HEALTH_CONFIG = {
  "profitable":    { label: "Profitable",   color: "#22C55E", dot: "#22C55E" },
  "breaking-even": { label: "Even",         color: "#F59E0B", dot: "#F59E0B" },
  "spending-more": { label: "Overspending", color: "#EF4444", dot: "#EF4444" },
  "no-data":       { label: "No data yet",  color: "#A1A1AA", dot: "#A1A1AA" },
  "loading":       { label: "…",            color: "#D4D4D8", dot: "#D4D4D8" },
} as const;

function HealthStatItem({ health }: { health: keyof typeof HEALTH_CONFIG }) {
  const cfg = HEALTH_CONFIG[health];
  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <motion.div
          animate={health !== "loading" ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: cfg.dot }}
        />
        <p
          className="text-[15px] font-bold leading-tight font-[family-name:var(--font-satoshi)]"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </p>
      </div>
      <p className="text-xs text-neutral-400">Business health</p>
      <p className="text-[10px] text-neutral-300 mt-0.5">Last 7 days</p>
    </div>
  );
}

function VerifiedStatItem({ verified, onFix }: { verified: boolean; onFix: () => void }) {
  return (
    <div>
      {verified ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="flex justify-center mb-0.5"
        >
          <Tick01Icon size={22} color="#22C55E" />
        </motion.div>
      ) : (
        <button onClick={onFix} className="flex justify-center w-full mb-0.5" aria-label="Complete profile">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ delay: 1, duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
          >
            <Alert01Icon size={20} color="#F59E0B" />
          </motion.div>
        </button>
      )}
      <p className="text-xs text-neutral-400">Verified</p>
      {!verified && (
        <button onClick={onFix} className="text-[10px] font-semibold mt-0.5" style={{ color: "#F59E0B" }}>
          Complete profile
        </button>
      )}
    </div>
  );
}

// ── Sheet wrapper ──────────────────────────────────────────────────────────

function Sheet({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 sheet-backdrop z-[55]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl z-[60] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {/* Scroll zone fills remaining height — reliable iOS momentum scroll */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-3"
              style={{
                WebkitOverflowScrolling: "touch",
                paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-spal-navy" style={{ fontFamily: "var(--font-satoshi)" }}>{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 flex-shrink-0"
                >
                  <Cancel01Icon size={15} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Name sheet ────────────────────────────────────────────────────────────

function NameSheet({ open, user, onClose, onSave }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<string | null>;
}) {
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState<string | null>(null);

  useEffect(() => {
    if (open) { setFullName(user?.full_name ?? ""); setError(null); }
  }, [open, user?.full_name]);

  async function handleSave() {
    if (!fullName.trim()) { setError("Please enter your name."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave({ full_name: fullName.trim() });
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Your name">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            Full name
          </label>
          <input
            type="text"
            placeholder="e.g. Amaka Okonkwo"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setError(null); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            className={`w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors ${
              error ? "border-red-300 focus:border-red-400" : "border-neutral-100 focus:border-spal-blue"
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
        <Button fullWidth loading={saving} onClick={handleSave} disabled={!fullName.trim()}>
          Save name
        </Button>
      </div>
    </Sheet>
  );
}

// ── Business details sheet ─────────────────────────────────────────────────

function BusinessDetailsSheet({ open, user, onClose, onSave }: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<string | null>;
}) {
  const [fullName,     setFullName]     = useState(user?.full_name     ?? "");
  const [businessName, setBusinessName] = useState(user?.business_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFullName(user?.full_name ?? "");
      setBusinessName(user?.business_name ?? "");
      setError(null);
    }
  }, [open, user?.full_name, user?.business_name]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave({
      full_name:     fullName.trim()     || null,
      business_name: businessName.trim() || null,
    });
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Business details">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            Your name
          </label>
          <input
            type="text"
            placeholder="e.g. Amaka Okonkwo"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setError(null); }}
            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            Business name
          </label>
          <input
            type="text"
            placeholder="e.g. Amaka's Kitchen"
            value={businessName}
            onChange={e => { setBusinessName(e.target.value); setError(null); }}
            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
          />
        </div>
        {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave} disabled={!fullName.trim() && !businessName.trim()}>
          Save details ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── WhatsApp sheet ─────────────────────────────────────────────────────────

function WhatsAppSheet({ open, current, onClose, onSave }: {
  open: boolean;
  current: string;
  onClose: () => void;
  onSave: (number: string) => Promise<string | null>;
}) {
  const [number, setNumber] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (open) { setNumber(current); setError(null); }
  }, [open, current]);

  async function handleSave() {
    const trimmed = number.trim();
    if (!trimmed) { setError("Please enter a WhatsApp number."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(trimmed);
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="WhatsApp reports">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500 leading-relaxed">
          We&apos;ll send your weekly business summary to this WhatsApp number every Sunday.
        </p>
        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide block mb-2">
            WhatsApp number
          </label>
          <input
            type="tel"
            placeholder="+234 801 234 5678"
            value={number}
            onChange={e => { setNumber(e.target.value); setError(null); }}
            className={`w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors ${
              error ? "border-red-300 focus:border-red-400" : "border-neutral-100 focus:border-spal-blue"
            }`}
          />
          {error
            ? <p className="text-xs text-red-500 mt-2">{error}</p>
            : <p className="text-xs text-neutral-400 mt-2">Include country code, e.g. +234 for Nigeria</p>
          }
        </div>
        <Button fullWidth loading={saving} onClick={handleSave}>
          Save number ✓
        </Button>
        {current && (
          <button
            onClick={async () => { await onSave(""); }}
            className="w-full h-11 text-sm text-red-400 font-medium rounded-full bg-red-50"
          >
            Remove WhatsApp number
          </button>
        )}
      </div>
    </Sheet>
  );
}

// ── Currency sheet ─────────────────────────────────────────────────────────

function CurrencySheet({ open, current, currentTax, onClose, onSave }: {
  open: boolean;
  current: string;
  currentTax: number;
  onClose: () => void;
  onSave: (code: string, taxRate: number) => Promise<string | null>;
}) {
  const [selected, setSelected] = useState(current);
  const [tax, setTax]           = useState(String(currentTax));
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState<string | null>(null);

  useEffect(() => {
    if (open) { setSelected(current); setTax(String(currentTax)); setError(null); }
  }, [open, current, currentTax]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave(selected, parseFloat(tax) || 0);
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Receipts & Tax">
      <div className="space-y-4">
        <p className="text-[13px] font-bold text-spal-navy -mb-1">Currency</p>
        <div className="space-y-2">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
              className={`w-full flex items-center justify-between px-4 h-14 rounded-2xl border-2 transition-all ${
                selected === c.code
                  ? "border-spal-green bg-spal-green-50"
                  : "border-neutral-100 bg-neutral-50"
              }`}
            >
              <div className="text-left">
                <span className="text-sm font-semibold text-spal-navy">{c.code}</span>
                <span className="text-xs text-neutral-400 ml-2">{c.label}</span>
              </div>
              <span className={`text-lg font-bold ${selected === c.code ? "text-spal-green" : "text-neutral-300"}`}>
                {c.symbol}
              </span>
            </button>
          ))}
        </div>
        <div>
          <p className="text-[13px] font-bold text-spal-navy mb-2">Tax rate (VAT)</p>
          <div className="flex items-center gap-2 bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-4 h-14">
            <input
              type="number" inputMode="decimal" min="0" step="0.1"
              value={tax} onChange={(e) => setTax(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent outline-none text-[15px] font-semibold text-spal-navy"
            />
            <span className="text-[15px] font-bold text-neutral-400">%</span>
          </div>
          <p className="text-[11.5px] text-neutral-400 mt-1.5 px-1">Applied to sales at checkout. Set to 0 if you do not charge tax.</p>
        </div>
        {error && <p className="text-xs text-red-500 text-center -mt-1">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave}>
          Save ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── Add Contact sheet (link email or phone to existing account) ────────────

function AddContactSheet({ open, type, onClose, onSaved }: {
  open:     boolean;
  type:     "email" | "phone";
  onClose:  () => void;
  onSaved:  (user: unknown) => void;
}) {
  const [step,    setStep]    = useState<"enter" | "verify">("enter");
  const [contact, setContact] = useState("");
  const [otp,     setOtp]     = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (open) { setStep("enter"); setContact(""); setOtp(["","","","","",""]); setError(null); } }, [open]);

  const isEmail = type === "email";
  const title   = isEmail ? "Add email address" : "Add business phone";
  const valid   = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
    : /^\+?\d{7,15}$/.test(contact.trim().replace(/[\s\-().]/g, ""));

  async function handleSendCode() {
    setLoading(true); setError(null);

    // PHONE: no OTP — save directly to user profile as business contact info.
    if (!isEmail) {
      const cleaned = contact.trim();
      const res  = await fetch("/api/user/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone_number: cleaned }),
      });
      const data = await res.json();
      setLoading(false);
      if (!data.success) { setError(data.error ?? "Couldn't save phone number."); return; }
      onSaved(data.data);
      return;
    }

    // EMAIL: still uses OTP for verified sign-in addition.
    const body = { email: contact.trim().toLowerCase() };
    const res  = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error ?? "Failed to send code."); return; }
    setStep("verify");
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) return;
    setLoading(true); setError(null);
    const contactVal = isEmail ? contact.trim().toLowerCase() : contact.trim();
    const res  = await fetch("/api/profile/add-contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contact: contactVal, token: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error ?? "Wrong code."); setOtp(["","","","","",""]); inputRefs.current[0]?.focus(); return; }
    onSaved(data.data.user);
  }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (n.every(d => d) && v) { const joined = n.join(""); if (joined.length === 6) { const newOtp = n; setTimeout(() => { const code = newOtp.join(""); if (code.length === 6) handleVerifyDirect(code); }, 0); } }
  }

  async function handleVerifyDirect(code: string) {
    setLoading(true); setError(null);
    const contactVal = isEmail ? contact.trim().toLowerCase() : contact.trim();
    const res  = await fetch("/api/profile/add-contact", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contact: contactVal, token: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error ?? "Wrong code."); setOtp(["","","","","",""]); inputRefs.current[0]?.focus(); return; }
    onSaved(data.data.user);
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {step === "enter" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 leading-relaxed">
            {isEmail
              ? "Add your email so you can also sign in with it. We'll send a code to confirm."
              : "Save your business phone for receipts, WhatsApp reports, and contact details."}
          </p>
          <input
            type={isEmail ? "email" : "tel"}
            inputMode={isEmail ? "email" : "numeric"}
            placeholder={isEmail ? "you@example.com" : "+234 801 234 5678"}
            value={contact}
            onChange={e => { setContact(e.target.value); setError(null); }}
            className="w-full h-12 px-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100 focus:border-spal-blue text-sm text-spal-navy placeholder:text-neutral-300 outline-none transition-colors"
            autoCapitalize="none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button fullWidth loading={loading} disabled={!valid} onClick={handleSendCode}>
            {isEmail ? "Send verification code" : "Save phone number"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-neutral-500">
            Enter the 6-digit code sent to <strong className="text-spal-navy">{contact}</strong>
          </p>
          <div className="flex justify-center gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus(); }}
                className={`w-11 h-13 text-center text-xl font-bold rounded-2xl border-2 text-spal-navy outline-none transition-all ${d ? "border-spal-green bg-spal-green-50" : "border-neutral-200"} focus:border-spal-blue`}
                style={{ height: "52px" }}
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <Button fullWidth loading={loading} disabled={otp.some(d => !d)} onClick={handleVerify}>
            Confirm &amp; link {isEmail ? "email" : "phone"}
          </Button>
          <button className="w-full text-center text-sm text-neutral-400 py-1" onClick={() => setStep("enter")}>
            ← Change {isEmail ? "email" : "number"}
          </button>
        </div>
      )}
    </Sheet>
  );
}

// ── Tracking Methods sheet ────────────────────────────────────────────────

const TRACKING_METHODS_LIST: Array<{
  key:    TrackingMethod;
  label:  string;
  sub:    string;
  icon:   React.ReactNode;
  accent: string;
}> = [
  { key: "notebook",      label: "Notebook",      sub: "You write in a physical notebook",         icon: <BookOpen01Icon   size={20} />, accent: "#22C55E" },
  { key: "whatsapp",      label: "WhatsApp",      sub: "You message yourself or save notes there", icon: <ChatIcon       size={20} />, accent: "#25D366" },
  { key: "excel",         label: "Excel",         sub: "You track in a spreadsheet",               icon: <GridViewIcon   size={20} />, accent: "#217346" },
  { key: "google_sheets", label: "Google Sheets", sub: "You use Google Sheets",                    icon: <GridViewIcon   size={20} />, accent: "#2563EB" },
  { key: "notes_app",     label: "Notes App",     sub: "You use a phone notes app",                icon: <File01Icon   size={20} />, accent: "#F59E0B" },
  { key: "receipts",      label: "Receipts",      sub: "You keep paper receipts or photos",        icon: <ReceiptDollarIcon  size={20} />, accent: "#F97316" },
];

function TrackingMethodsSheet({ open, currentMethods, onClose, onSave }: {
  open:           boolean;
  currentMethods: TrackingMethod[];
  onClose:        () => void;
  onSave:         (methods: TrackingMethod[]) => Promise<string | null>;
}) {
  const [selected, setSelected] = useState<Set<TrackingMethod>>(new Set(currentMethods));
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (open) { setSelected(new Set(currentMethods)); setError(null); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(m: TrackingMethod) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

  async function handleSave() {
    if (!selected.size) { setError("Pick at least one method."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(Array.from(selected));
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="How I track records">
      <div className="space-y-3">
        <p className="text-sm text-neutral-500 leading-relaxed">
          Tell SPAL how you currently manage your records. This helps us show you the right import options.
        </p>
        {TRACKING_METHODS_LIST.map(m => {
          const isOn = selected.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className="w-full flex items-center gap-4 bg-neutral-50 rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
              style={{
                border:    isOn ? `1.5px solid ${m.accent}` : "1.5px solid transparent",
                boxShadow: isOn ? `0 0 0 3px ${m.accent}18` : "none",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${m.accent}14`, color: m.accent }}
              >
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-spal-navy">{m.label}</p>
                <p className="text-[11.5px] text-neutral-400 mt-0.5">{m.sub}</p>
              </div>
              <div
                className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                style={{
                  border:     isOn ? `2px solid ${m.accent}` : "2px solid #D4D4D8",
                  background: isOn ? m.accent : "transparent",
                }}
              >
                {isOn && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave} disabled={!selected.size}>
          Save {selected.size > 0 ? `(${selected.size} selected)` : ""} ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── Business Goals sheet ──────────────────────────────────────────────────

const GOALS_LIST = Object.keys(GOAL_LABELS) as (keyof typeof GOAL_LABELS)[];

function BusinessGoalsSheet({ open, currentGoals, onClose, onSave }: {
  open:         boolean;
  currentGoals: string[];
  onClose:      () => void;
  onSave:       (goals: string[]) => Promise<string | null>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentGoals));
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (open) { setSelected(new Set(currentGoals)); setError(null); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(g: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave(Array.from(selected));
    if (err) setError(err);
    setSaving(false);
  }

  const GOAL_COLORS: Record<string, string> = {
    track_daily_sales:   "#22C55E",
    know_real_profit:    "#2563EB",
    reduce_expenses:     "#F97316",
    grow_business:       "#8B5CF6",
    understand_spending: "#2563EB",
  };

  return (
    <Sheet open={open} onClose={onClose} title="What do you want to achieve?">
      <div className="space-y-3">
        <p className="text-sm text-neutral-500 leading-relaxed">
          SPAL uses this to make your daily insights more relevant to you.
        </p>
        {GOALS_LIST.map(g => {
          const isOn  = selected.has(g);
          const color = GOAL_COLORS[g] ?? "#22C55E";
          return (
            <button
              key={g}
              onClick={() => toggle(g)}
              className="w-full flex items-center gap-4 bg-neutral-50 rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
              style={{
                border:    isOn ? `1.5px solid ${color}` : "1.5px solid transparent",
                boxShadow: isOn ? `0 0 0 3px ${color}18` : "none",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[15px] font-bold"
                style={{ background: `${color}18`, color }}
              >
                {isOn ? <Tick01Icon size={18} /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-spal-navy">{GOAL_LABELS[g]}</p>
                <p className="text-[11.5px] text-neutral-400 mt-0.5">{GOAL_SUBS[g]}</p>
              </div>
              <div
                className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                style={{
                  border:     isOn ? `2px solid ${color}` : "2px solid #D4D4D8",
                  background: isOn ? color : "transparent",
                }}
              >
                {isOn && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <Button fullWidth loading={saving} onClick={handleSave}>
          Save goals {selected.size > 0 ? `(${selected.size})` : ""} ✓
        </Button>
      </div>
    </Sheet>
  );
}

// ── Notifications sheet ────────────────────────────────────────────────────

function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [enabled,    setEnabled]    = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      setEnabled(false);
    } else {
      const perm = Notification.permission;
      setPermission(perm);
      setEnabled(perm === "granted");
    }
  }, [open]);

  async function handleEnable() {
    setRequesting(true);
    const result = await enablePushNotifications();
    setRequesting(false);
    if (result === "granted") {
      setPermission("granted");
      setEnabled(true);
    } else if (result === "denied") {
      setPermission("denied");
    }
  }

  async function handleDisable() {
    setEnabled(false);
    await disablePushNotifications();
  }

  const isDenied    = permission === "denied";
  const unsupported = permission === "unsupported";

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      <div className="space-y-4">
        {isDenied ? (
          <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
            <Notification02Icon size={20} color="#DC2626" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600">Notifications blocked</p>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                You&apos;ve blocked SPAL notifications in your browser. To fix this,
                open your browser settings, find this site, and set notifications to &quot;Allow&quot;.
                Then come back and turn them on here.
              </p>
            </div>
          </div>
        ) : unsupported ? (
          <div className="bg-neutral-50 rounded-2xl p-4 flex items-start gap-3">
            <Notification02Icon size={20} color="#A1A1AA" className="mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              Push notifications aren&apos;t supported on this browser. Try installing
              SPAL on your home screen for the best experience.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-spal-blue mb-1">Stay on track</p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              SPAL will send your daily sales summary, a nudge on days you haven&apos;t
              logged anything, weekly insights, and the odd business tip — right to your lock screen.
            </p>
          </div>
        )}

        {!unsupported && (
          <button
            onClick={enabled ? handleDisable : handleEnable}
            disabled={requesting || isDenied}
            className="w-full flex items-center justify-between px-4 h-14 bg-neutral-50 rounded-2xl border-2 border-neutral-100 active:bg-neutral-100 transition-colors disabled:opacity-60 disabled:cursor-default"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-spal-navy">Push notifications</p>
              <p className="text-xs text-neutral-400">
                {requesting ? "Setting up…" : enabled ? "Tap to turn off" : "Tap to turn on"}
              </p>
            </div>
            {requesting ? (
              <div className="w-5 h-5 rounded-full border-2 border-spal-green border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${enabled ? "bg-spal-green" : "bg-neutral-200"}`}>
                <motion.div
                  animate={{ x: enabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"
                />
              </div>
            )}
          </button>
        )}

        <Button fullWidth variant="secondary" onClick={onClose}>
          {enabled ? "Done ✓" : "Close"}
        </Button>
      </div>
    </Sheet>
  );
}

