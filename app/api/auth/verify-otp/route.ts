import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Find an existing Supabase auth user by email (handles orphaned auth users
// that have no row in our `users` table). Paginates defensively.
async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ id: string } | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return { id: match.id };
    if (data.users.length < 1000) break;
  }
  return null;
}

// Find an existing Supabase auth user by phone.
async function findAuthUserByPhone(
  admin: ReturnType<typeof createAdminClient>,
  phone: string,
): Promise<{ id: string } | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((u) => u.phone === phone.replace(/^\+/, "") || u.phone === phone);
    if (match) return { id: match.id };
    if (data.users.length < 1000) break;
  }
  return null;
}

// POST /api/auth/verify-otp
export async function POST(req: NextRequest) {
  try {
    const { phone, email, token, onboardingData, mode } = await req.json();
    const isSignup = mode === "signup";

    if ((!phone && !email) || !token) {
      return NextResponse.json(
        { success: false, error: "Contact and verification code are required." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { success: false, error: "Enter the 6-digit code we sent you." },
        { status: 400 }
      );
    }

    // ── EMAIL PATH ────────────────────────────────────────────────────────────
    //
    //  Identical flow to phone: verify hash → find/create user → temp-password
    //  trick → signInWithPassword({ email, password }) to get session cookies.
    //  The email was stored as the `phone` value in phone_otps by send-otp.
    //
    if (email && typeof email === "string") {
      const trimmedEmail = email.trim().toLowerCase();
      const admin        = createAdminClient();
      const otpHash      = hashOTP(token);

      // 1. Find a valid, unused, unexpired OTP
      const { data: otpRecord, error: lookupError } = await admin
        .from("phone_otps")
        .select("id, used, expires_at")
        .eq("phone", trimmedEmail)
        .eq("otp_hash", otpHash)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        console.error("[verify-otp] Email lookup error:", lookupError);
        return NextResponse.json(
          { success: false, error: "Verification failed. Please try again." },
          { status: 500 }
        );
      }
      if (!otpRecord) {
        return NextResponse.json(
          { success: false, error: "Wrong code or it has expired. Please try again." },
          { status: 400 }
        );
      }

      // 2. Mark OTP as used
      await admin.from("phone_otps").update({ used: true }).eq("id", otpRecord.id);

      // 3. Find or create user profile (look up by email column)
      const { data: existingProfile } = await admin
        .from("users")
        .select("id, onboarding_completed")
        .eq("email", trimmedEmail)
        .maybeSingle();

      // Block re-signup: existing user trying to create a new account
      if (isSignup && existingProfile?.onboarding_completed) {
        return NextResponse.json(
          { success: false, error: "account_exists", message: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }

      const tempPassword = `${crypto.randomUUID()}-${crypto.randomInt(1e6, 9e6)}`;
      let userId:   string;
      let isNewUser = false;

      if (existingProfile) {
        userId = existingProfile.id;
        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
          password:      tempPassword,
          email_confirm: true,
        });
        if (updateErr) {
          console.error("[verify-otp] Email updateUserById error:", updateErr);
          return NextResponse.json(
            { success: false, error: "Could not sign you in. Please try again." },
            { status: 500 }
          );
        }
      } else {
        const { data: newAuth, error: createErr } = await admin.auth.admin.createUser({
          email:         trimmedEmail,
          email_confirm: true,
          password:      tempPassword,
        });

        if (createErr || !newAuth?.user) {
          // The auth user may already exist (orphaned — no profile row).
          // Find them and reuse instead of failing.
          const existingAuth = await findAuthUserByEmail(admin, trimmedEmail);
          if (!existingAuth) {
            console.error("[verify-otp] Email createUser error:", createErr);
            return NextResponse.json(
              { success: false, error: "Could not create your account. Please try again." },
              { status: 500 }
            );
          }
          userId    = existingAuth.id;
          isNewUser = true;
          await admin.auth.admin.updateUserById(userId, {
            password:      tempPassword,
            email_confirm: true,
          });
        } else {
          userId    = newAuth.user.id;
          isNewUser = true;
        }

        // Upsert the profile row (handles orphaned auth users with no profile)
        const { error: profileErr } = await admin.from("users").upsert({
          id:                   userId,
          email:                trimmedEmail,
          business_type:        onboardingData?.businessType ?? null,
          business_goals:       onboardingData?.goals        ?? [],
          streak_days:          0,
        }, { onConflict: "id" });
        if (profileErr) console.error("[verify-otp] Email profile upsert error:", profileErr);
      }

      // 4. Fetch full user profile
      const { data: userProfile } = await admin
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // 5. Sign in with email + temp-password to get session cookies
      const response = NextResponse.json({
        success: true,
        data: { user: userProfile, isNewUser },
      });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll:  () => req.cookies.getAll(),
            setAll:  (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    trimmedEmail,
        password: tempPassword,
      });
      if (signInError) {
        console.error("[verify-otp] Email signInWithPassword error:", signInError.message);
      }

      return response;
    }

    // ── PHONE PATH ────────────────────────────────────────────────────────────

    const otpHash = hashOTP(token);
    const admin   = createAdminClient();

    // ── 1. Find a valid, unused, unexpired OTP that matches the hash ─────────
    const { data: otpRecord, error: lookupError } = await admin
      .from("phone_otps")
      .select("id, used, expires_at")
      .eq("phone", phone)
      .eq("otp_hash", otpHash)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("[verify-otp] Lookup error:", lookupError);
      return NextResponse.json(
        { success: false, error: "Verification failed. Please try again." },
        { status: 500 }
      );
    }

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Wrong code or it has expired. Please try again." },
        { status: 400 }
      );
    }

    // ── 2. Mark OTP as used (prevents replay attacks) ────────────────────────
    await admin.from("phone_otps").update({ used: true }).eq("id", otpRecord.id);

    // ── 3. Find or create the Supabase user ──────────────────────────────────
    const { data: existingProfile } = await admin
      .from("users")
      .select("id, onboarding_completed")
      .eq("phone_number", phone)
      .maybeSingle();

    // Block re-signup: existing user trying to create a new account
    if (isSignup && existingProfile?.onboarding_completed) {
      return NextResponse.json(
        { success: false, error: "account_exists", message: "An account with this phone number already exists. Please sign in." },
        { status: 409 }
      );
    }

    // One-time password — rotates on every login.
    // Used only to get a Supabase session token; never revealed to users.
    const tempPassword = `${crypto.randomUUID()}-${crypto.randomInt(1e6, 9e6)}`;

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      // Returning user — update their password so we can sign in now
      userId = existingProfile.id;
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        password:      tempPassword,
        phone_confirm: true,
      });
      if (updateErr) {
        console.error("[verify-otp] updateUserById error:", updateErr);
        return NextResponse.json(
          { success: false, error: "Could not sign you in. Please try again." },
          { status: 500 }
        );
      }
    } else {
      // New user — create Supabase auth user + profile row
      const { data: newAuth, error: createErr } = await admin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        password:      tempPassword,
      });

      if (createErr || !newAuth?.user) {
        // Auth user may already exist (orphaned). Find and reuse.
        const existingAuth = await findAuthUserByPhone(admin, phone);
        if (!existingAuth) {
          console.error("[verify-otp] createUser error:", createErr);
          return NextResponse.json(
            { success: false, error: "Could not create your account. Please try again." },
            { status: 500 }
          );
        }
        userId    = existingAuth.id;
        isNewUser = true;
        await admin.auth.admin.updateUserById(userId, {
          password:      tempPassword,
          phone_confirm: true,
        });
      } else {
        userId    = newAuth.user.id;
        isNewUser = true;
      }

      const { error: profileErr } = await admin.from("users").upsert({
        id:                   userId,
        phone_number:         phone,
        business_type:        onboardingData?.businessType   ?? null,
        business_goals:       onboardingData?.goals          ?? [],
        streak_days:          0,
      }, { onConflict: "id" });
      if (profileErr) console.error("[verify-otp] Profile upsert error:", profileErr);
    }

    // ── 4. Fetch full user profile ────────────────────────────────────────────
    const { data: userProfile } = await admin
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // ── 5. Sign in to create a Supabase session (sets auth cookies) ──────────
    //
    //  We use signInWithPassword({ phone, password }) here.
    //  Phone + password auth does NOT require an SMS provider — Supabase just
    //  validates the password we just set above.
    //  The @supabase/ssr server client writes the session cookies to our
    //  NextResponse object, so subsequent requests are authenticated.

    const response = NextResponse.json({
      success: true,
      data: { user: userProfile, isNewUser },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll:  () => req.cookies.getAll(),
          setAll:  (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      phone,
      password: tempPassword,
    });

    if (signInError) {
      console.error("[verify-otp] signInWithPassword error:", signInError.message);
      // OTP verified + user exists — session cookie not set but user data returned.
      // Client will have the user object and can retry auth if needed.
    }

    return response;
  } catch (err) {
    console.error("[verify-otp] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
