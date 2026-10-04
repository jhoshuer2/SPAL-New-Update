import { UserHydration } from "@/components/UserHydration";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { BadgeCelebration } from "@/components/gamification/BadgeCelebration";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { BottomNav } from "@/components/ui/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <UserHydration />
      {/*
        flex-1 + overflow-y-auto = scrollable content area.
        pb-shell = home-indicator inset, only when the bottom bar is hidden.
        The bottom bar (BottomNav) is the next flex row: in flow, never floating.
        max-w matches --shell-max-w so inner content never exceeds the shell.
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-container pb-shell">
        <div className="w-full min-h-full relative">
          {children}
        </div>
      </main>
      {/* Primary bottom navigation — Home / Sell / Stock / Wallet / Profile */}
      <BottomNav />
      {/* Voice recorder overlay — triggered from anywhere via store */}
      <VoiceRecorder />
      {/* Badge celebration — rendered above everything */}
      <BadgeCelebration />
      {/* PWA install prompt — Android Chrome only, 7-day cooldown */}
      <PWAInstallPrompt />
    </div>
  );
}
