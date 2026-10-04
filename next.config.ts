import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is disabled via --no-turbopack in the dev script.
  // Do NOT add a `turbopack` key here — its presence enables Turbopack
  // even without the --turbopack flag in Next.js 16 on Windows.

  // Allow product/photo images served from the Supabase storage bucket.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  async headers() {
    return [
      {
        // Security headers on every route
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
      {
        // Cache icons aggressively — they never change between releases
        source: "/icons/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Service worker must NEVER be cached — browser must always fetch latest
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",          value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
