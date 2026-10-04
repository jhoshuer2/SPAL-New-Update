"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight01Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";
const DOME = "#3F0B8C"; // dark purple shape (illustration circle + bottom dome)

interface Slide {
  bg: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
}

const SLIDES: Slide[] = [
  {
    bg: "#B75512",
    title: "Know Every Sale That Makes Your Business Grow",
    subtitle: "Record your sales in seconds, keep track of your income, and stay on top of every transaction",
    image: "/onboard-sales.webp",
    alt: "A hand holding a sales report",
  },
  {
    bg: "#117D39",
    title: "Know Your Stock Before It Runs Out",
    subtitle: "Track your inventory, manage your products, and always know what's available in your business",
    image: "/onboard-stock.webp",
    alt: "A stack of stock boxes",
  },
  {
    bg: "#966CF7",
    title: "Turn Your Records Into Business Insights",
    subtitle: "See your profit, understand your performance, and make smarter decisions with insights that matter",
    image: "/onboard-insights.webp",
    alt: "A rising bar and line chart",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full relative overflow-hidden" style={{ background: "#0F172A" }}>
      {/* ── Splash overlay ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ background: "#3F0B8C" }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.2, 0.64, 1] }}
            >
              <Image
                src="/spal-wordmark.webp"
                alt="SPAL"
                width={210}
                height={75}
                priority
                style={{ width: "200px", height: "auto" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingCarousel router={router} ready={!showSplash} />
    </div>
  );
}

function OnboardingCarousel({
  router,
  ready,
}: {
  router: ReturnType<typeof useRouter>;
  ready: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const userTouchedRef = useRef(false);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  // Auto-advance through the slides so all three are seen; stop once the user swipes.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el || userTouchedRef.current) { clearInterval(id); return; }
      const cur = Math.round(el.scrollLeft / el.clientWidth);
      if (cur >= SLIDES.length - 1) { clearInterval(id); return; } // rest on the last slide
      el.scrollTo({ left: (cur + 1) * el.clientWidth, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(id);
  }, [ready]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={ready ? { opacity: 1 } : {}}
      transition={{ duration: 0.4 }}
      className="absolute inset-0"
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={() => { userTouchedRef.current = true; }}
        onTouchStart={() => { userTouchedRef.current = true; }}
        onWheel={() => { userTouchedRef.current = true; }}
        className="h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 snap-start snap-always">
            <SlideView slide={slide} index={i} active={active} onGetStarted={() => router.push("/onboarding")} onLogin={() => router.push("/login")} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SlideView({
  slide,
  index,
  active,
  onGetStarted,
  onLogin,
}: {
  slide: Slide;
  index: number;
  active: number;
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="relative h-full flex flex-col overflow-hidden" style={{ background: slide.bg }}>
      {/* Bottom dome — the dark-purple hill the circle sits on */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 z-0"
        style={{
          width: "176%",
          height: "46%",
          background: DOME,
          borderTopLeftRadius: "50% 58%",
          borderTopRightRadius: "50% 58%",
        }}
      />

      {/* Header */}
      <div className="relative z-20 px-6 pt-14">
        <h1
          className="text-white font-black leading-[1.08]"
          style={{ fontFamily: FF, fontSize: "clamp(28px, 8.5vw, 38px)", letterSpacing: "-0.02em" }}
        >
          {slide.title}
        </h1>
        <p
          className="mt-4 leading-relaxed"
          style={{ fontFamily: FF, fontSize: "clamp(15px, 4.4vw, 18px)", color: "rgba(255,255,255,0.72)" }}
        >
          {slide.subtitle}
        </p>
      </div>

      {/* Illustration circle — sits on the dome */}
      <div className="relative z-10 flex-1 flex items-end justify-center pb-[7%]">
        <Image
          src={slide.image}
          alt={slide.alt}
          width={660}
          height={660}
          priority={index === 0}
          className="w-[80%] max-w-[330px] h-auto"
        />
      </div>

      {/* Controls over the dome */}
      <div
        className="relative z-20 px-5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 26px)" }}
      >
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: 8,
                height: 8,
                background: i === active ? "#22C55E" : "rgba(255,255,255,0.9)",
              }}
            />
          ))}
        </div>

        {/* Get Started */}
        <button
          onClick={onGetStarted}
          className="w-full h-[58px] rounded-full flex items-center active:scale-[0.97] transition-transform"
          style={{
            fontFamily: FF,
            background: "#22C55E",
            boxShadow: "0 8px 24px rgba(34,197,94,0.38)",
            paddingLeft: "6px",
            paddingRight: "20px",
          }}
          aria-label="Get Started"
        >
          <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.9)" }}>
            <ArrowRight01Icon size={20} color="#16A34A" />
          </div>
          <span className="flex-1 text-center font-bold text-white text-[15px]">🚀 Get Started</span>
          <AnimatedChevrons />
        </button>

        {/* Login */}
        <button
          onClick={onLogin}
          className="w-full mt-4 text-center text-[13.5px] active:opacity-60 transition-opacity"
          style={{ fontFamily: FF, color: "rgba(255,255,255,0.72)" }}
        >
          Already have an account? <span style={{ color: "#fff", fontWeight: 700 }}>Login</span>
        </button>
      </div>
    </div>
  );
}

function AnimatedChevrons() {
  return (
    <motion.div
      className="flex items-center gap-0.5 flex-shrink-0"
      animate={{ x: [0, 4, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
    >
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", fontWeight: 700 }}>›</span>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", fontWeight: 700 }}>›</span>
    </motion.div>
  );
}
