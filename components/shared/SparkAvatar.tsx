"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export function SparkAvatar() {
  const router   = useRouter();
  const pathname = usePathname();

  if (pathname.includes("/picture") || pathname === "/home") return null;

  return (
    <motion.button
      data-coachmark="spark"
      onClick={() => router.push("/ask")}
      aria-label="Ask SPAL"
      className="fixed z-40 active:scale-90"
      style={{
        bottom:       "calc(72px + env(safe-area-inset-bottom, 0px) + 12px)",
        right:        "16px",
        width:        "72px",
        height:       "72px",
        background:   "transparent",
        border:       "none",
        padding:      0,
        cursor:       "pointer",
        // No border-radius or overflow — let the PNG define its own shape.
        // Drop-shadow follows the actual pixel edges of the orb, not a disc.
        filter: "drop-shadow(0 6px 18px rgba(34,197,94,0.45)) drop-shadow(0 3px 8px rgba(0,0,0,0.22))",
      }}
      initial={{ opacity: 0, scale: 0.5, y: 16 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 0],
      }}
      transition={{
        opacity: { delay: 0.5, duration: 0.4, ease: [0.34, 1.2, 0.64, 1] },
        scale:   { delay: 0.5, duration: 0.4, ease: [0.34, 1.2, 0.64, 1] },
        y: {
          delay:      1,
          duration:   3,
          repeat:     Infinity,
          ease:       "easeInOut",
          repeatType: "mirror",
        },
      }}
      whileTap={{ scale: 0.88 }}
    >
      <Image
        src="/spal-ai.webp"
        alt="Ask SPAL"
        width={72}
        height={72}
        style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
        priority
      />
    </motion.button>
  );
}
