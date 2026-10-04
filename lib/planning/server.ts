// Shared helpers for the planning routes: auth, tolerant "tables not live yet" handling, money bounds.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const missingTable = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "42P01" || e.code === "PGRST205" || /schema cache|does not exist/i.test(e.message ?? ""));

export async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
export const notReady = () => NextResponse.json({ success: false, error: "This part of Spal is being set up. Please try again soon.", pending: true }, { status: 503 });
export const bad = (error: string) => NextResponse.json({ success: false, error }, { status: 400 });
export const saveFailed = () => NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });

/** Kobo guard: whole, non-negative, under ₦1bn. */
export const okKobo = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 100_000_000_000;
export const cleanText = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
