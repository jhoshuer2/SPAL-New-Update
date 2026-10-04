"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home01Icon, ShoppingCartAdd01Icon, PackageIcon, Wallet01Icon, User02Icon, Hamburger01Icon, MenuRestaurantIcon } from "hugeicons-react";
import { useBusinessMode } from "@/hooks/useBusinessMode";

const FF = "var(--font-satoshi)";

const TABS = [
  { href: "/home",              label: "Home",    Icon: Home01Icon },
  { href: "/sell",              label: "Sell",    Icon: ShoppingCartAdd01Icon },
  { href: "/inventory",         label: "Inventory", Icon: PackageIcon },
  { href: "/wallet",            label: "Wallet",  Icon: Wallet01Icon },
  { href: "/profile",           label: "Profile", Icon: User02Icon },
];

// Restaurants and bars: orders come from the menu, stock is ingredients/drinks.
const PERISHABLE_TABS = [
  { href: "/home",      label: "Home",      Icon: Home01Icon },
  { href: "/orders",    label: "Orders",    Icon: Hamburger01Icon },
  { href: "/menu",      label: "Menu",      Icon: MenuRestaurantIcon },
  { href: "/inventory", label: "Ingredients", Icon: PackageIcon },
  { href: "/profile",   label: "Profile",   Icon: User02Icon },
];

// Full-screen flows where the tab bar should not show.
const HIDDEN = ["/ask", "/set-goals", "/records", "/picture", "/voice", "/confirm", "/scan", "/billing", "/inventory/add", "/menu/add", "/orders/new", "/profile/", "/insights"];

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.matches("input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select") || el.isContentEditable);

/**
 * Primary tab bar: the standard bottom app bar. It is the LAST ROW of the app
 * shell's flex column (in flow, `shrink-0`), not a floating `position: fixed`
 * layer, so the page scrolls in the row above it and the bar is always fully on
 * screen, on every screen size, browser and keyboard state.
 *
 * It also publishes its real height as `--bottom-nav-h` on <html> (0 whenever it
 * is not on screen). Things that float above it (FABs, CTA bars) read that
 * variable instead of guessing a pixel value.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { ready, perishable } = useBusinessMode();
  const tabs = perishable ? PERISHABLE_TABS : TABS;
  const ref = useRef<HTMLElement>(null);
  const [typing, setTyping] = useState(false);

  const hiddenRoute = HIDDEN.some((p) => pathname.includes(p)) || (perishable && pathname.startsWith("/sell"));
  const visible = ready && !hiddenRoute && !typing;

  // While a text field is focused the on-screen keyboard takes the bottom of the
  // screen; the bar steps aside so it never floats over the field being typed in.
  useEffect(() => {
    const on = (e: FocusEvent) => { if (isTextField(e.target)) setTyping(true); };
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => { document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!visible || !el) { root.style.setProperty("--bottom-nav-h", "0px"); return; }
    const publish = () => root.style.setProperty("--bottom-nav-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.setProperty("--bottom-nav-h", "0px"); };
  }, [visible]);

  if (!visible) return null;

  return (
    <nav
      ref={ref}
      className="relative shrink-0 w-full px-3 min-[360px]:px-4 pt-1.5 z-40"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      aria-label="Primary"
    >
      <div
        className="flex items-stretch justify-between rounded-[26px] p-1.5"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "saturate(180%) blur(20px)", boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/home" ? pathname === "/home" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-setup-target={`tab-${href.slice(1)}`}
              className="flex-1 min-w-0 min-h-[52px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-2xl active:scale-95 transition-transform"
              style={{ background: active ? "#EEF3E9" : "transparent" }}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <Icon size={22} color={active ? "#0F172A" : "#9CA3AF"} />
              {/* Scales down on 320px phones so five labels always fit on one line */}
              <span
                className="max-w-full truncate font-semibold leading-tight"
                style={{ fontFamily: FF, fontSize: "clamp(9px, 2.9vw, 11px)", color: active ? "#0F172A" : "#9CA3AF" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
