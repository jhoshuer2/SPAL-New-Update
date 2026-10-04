import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/welcome", "/business-type", "/onboard-goals", "/demo", "/preview",
  "/signup", "/verify", "/login", "/create-password", "/reset-password",
  "/api/auth/send-otp", "/api/auth/verify-otp", "/api/auth/sign-out", "/api/auth/login",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths, static files, and API routes (except protected ones)
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/screenshots") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Root redirect: go to /welcome (onboarding) or /home (if authed)
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If visiting root, redirect based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/home" : "/welcome", req.url)
    );
  }

  // Protect /home, /records, /insights, /learn, /profile, /ask
  const protectedPaths = ["/home", "/records", "/insights", "/learn", "/profile", "/ask", "/goals", "/upgrade", "/notifications", "/billing"];
  if (protectedPaths.some(p => pathname.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
