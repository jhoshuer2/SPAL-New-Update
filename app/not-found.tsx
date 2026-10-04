import Link from "next/link";
import Image from "next/image";

const FF = "var(--font-satoshi), system-ui, sans-serif";
const GRADIENT = "linear-gradient(180deg, #EAA978 0%, #EFD5BA 42%, #ECEAD9 100%)";

export default function NotFound() {
  return (
    <div
      className="min-h-full flex flex-col items-center px-8"
      style={{ background: GRADIENT }}
    >
      {/* Avatar + label centred in the upper space */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <Image
          src="/spal-404.webp"
          alt="SPAL on 404 Street"
          width={320}
          height={420}
          priority
          className="w-[260px] max-w-[80%] h-auto object-contain"
        />

        <p className="text-[18px] font-medium text-spal-navy mt-6" style={{ fontFamily: FF }}>
          You Found the
        </p>
        <h1
          className="font-black text-spal-navy leading-tight mt-1"
          style={{ fontFamily: FF, fontSize: "clamp(34px, 11vw, 52px)", letterSpacing: "-0.01em" }}
        >
          404 STREET
        </h1>
      </div>

      {/* Back home */}
      <Link
        href="/home"
        className="w-full max-w-[340px] h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[16px] active:scale-[0.98] transition-transform"
        style={{
          background: "#22C55E",
          boxShadow: "0 8px 24px rgba(34,197,94,0.38)",
          fontFamily: FF,
          marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
        }}
      >
        Please Head Back Home
      </Link>
    </div>
  );
}
