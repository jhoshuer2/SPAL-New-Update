/**
 * Onboarding layout — full screen, no bottom nav
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-spal-bg">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-container w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
