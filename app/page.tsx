import { redirect } from "next/navigation";

/**
 * Root redirect — send to welcome onboarding.
 * In production: check Supabase session and redirect to /home if authenticated.
 */
export default function RootPage() {
  redirect("/welcome");
}
