import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/sign-out
export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear the auth cookies in the response
  const response = NextResponse.json({ success: true });

  // Supabase SSR sets the cookies on the cookieStore; the above
  // signOut() call removes them. Return a clean response.
  return response;
}
