import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { RegisterSW } from "@/components/shared/RegisterSW";
import "./globals.css";

// Inter Tight — secondary/body typeface (Google Fonts, self-hosted by Next.js)
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPAL — Your Business Companion",
  description:
    "Track your sales, understand your profit, and grow your business with simple AI-powered insights.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-96.png",  sizes: "96x96",  type: "image/png" },
      { url: "/icons/icon-72.png",   sizes: "72x72",  type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/icon-192.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SPAL",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "SPAL Business Assistant",
    description: "Your AI business companion for everyday entrepreneurs.",
    siteName: "SPAL",
  },
};

export const viewport: Viewport = {
  themeColor: "#22C55E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // When the on-screen keyboard opens, shrink the layout (not just the visual
  // viewport) so the app frame, its bottom bar and the focused field stay on screen.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interTight.variable} h-full`}>
      <head>
        {/* Satoshi — primary brand typeface via Fontshare CDN */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SPAL" />
      </head>
      {/*
        Desktop shell: body = full-viewport dark canvas.
        #app-root is capped at 480 px and centred.
        transform: translateZ(0) creates a new stacking context so every
        position:fixed child is contained by this element, not the viewport —
        keeping all overlays, sheets, and nav inside the mobile frame on desktop.
      */}
      {/*
        body = full-viewport dark canvas (colour set in globals.css).
        #app-root = centred mobile shell, max 480 px, min 320 px.
        translateZ(0) creates a stacking context so every position:fixed
        child stays inside the shell on desktop (nav, sheets, FAB, etc.).
      */}
      {/*
        App-shell standard: the document itself never scrolls or pans (see
        globals.css). #app-root is pinned to the viewport with top/bottom: 0, so
        its height is always exactly what is visible: no 100vh/100dvh/100svh maths
        that can leave the bottom bar below the fold in URL-bar or in-app browsers.
        The page scrolls inside <main>; the bottom bar is the last row of the
        column (in flow), so it can never be pushed off screen.
      */}
      {/* suppressHydrationWarning: some browser extensions inject attributes
          (e.g. inject_newvt_svd) onto <body> before React hydrates — this is
          not a real mismatch, just noise from the extension. */}
      <body className="antialiased" suppressHydrationWarning>
        <RegisterSW />
        <div
          id="app-root"
          className="flex flex-col overflow-hidden bg-spal-bg"
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            margin: "0 auto",
            maxWidth: "var(--shell-max-w)",
            minWidth:  "min(320px, 100vw)",
            transform: "translateZ(0)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(0,0,0,0.6)",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
