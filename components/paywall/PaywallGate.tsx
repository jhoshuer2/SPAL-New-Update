"use client";

import { motion } from "framer-motion";
import { useSPALStore } from "@/store";
import { useRouter } from "next/navigation";
import { LockIcon } from "hugeicons-react";

interface PaywallGateProps {
  children: React.ReactNode;
  feature?: string;
  title?: string;
  description?: string;
}

export function PaywallGate({
  children,
  title = "SPAL Pro Feature",
  description = "Upgrade to Pro to unlock all AI Financial Advisors and advanced features.",
}: PaywallGateProps) {
  const { isPro } = useSPALStore();
  const router = useRouter();

  if (isPro) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center px-6 py-12"
    >
      <div className="w-16 h-16 bg-spal-purple-50 rounded-2xl flex items-center justify-center mb-4 border border-spal-purple-100">
        <LockIcon size={28} color="#8B5CF6" />
      </div>
      <h3 className="text-lg font-bold text-spal-navy font-[family-name:var(--font-satoshi)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 leading-relaxed mb-6 max-w-xs">
        {description}
      </p>
      <button
        onClick={() => router.push("/upgrade")}
        className="w-full max-w-xs h-14 bg-spal-purple rounded-2xl text-white font-bold text-sm font-[family-name:var(--font-satoshi)] active:scale-95 transition-transform"
      >
        Unlock with SPAL Pro →
      </button>
      <p className="mt-3 text-xs text-neutral-400">
        From ₦2,000/month · Cancel anytime
      </p>
    </motion.div>
  );
}

