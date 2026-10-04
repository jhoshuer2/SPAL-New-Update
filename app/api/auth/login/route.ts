import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/auth/login
// Email + password only. Phone numbers in profile are for business contact,
// not sign-in (Termii integration is not yet enabled).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both { email, password } (preferred) and legacy { contact, password }
    const email    = (body.email ?? body.contact ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const capturedCookies: Array<{ name: string; value: string; options: unknown }> = [];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              capturedCookies.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    // Fetch user profile
    const admin = createAdminClient();
    const { data: userProfile } = await admin
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    const response = NextResponse.json({ success: true, data: { user: userProfile } });
    capturedCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    });

    return response;
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
