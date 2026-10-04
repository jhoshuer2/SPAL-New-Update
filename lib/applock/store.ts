"use client";
// Browser storage for the app lock. Everything is wrapped: private mode or blocked storage just means "no lock".
import type { StoredPin } from "./core";
const KEY = "spal_lock_v1", SESSION = "spal_unlocked", FAILS = "spal_lock_fails";

export const readPin = (): StoredPin | null => { try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as StoredPin) : null; } catch { return null; } };
export const savePin = (p: StoredPin) => { try { localStorage.setItem(KEY, JSON.stringify(p)); sessionStorage.setItem(SESSION, "1"); localStorage.removeItem(FAILS); } catch { /* ignore */ } };
export const clearPin = () => { try { localStorage.removeItem(KEY); localStorage.removeItem(FAILS); sessionStorage.removeItem(SESSION); } catch { /* ignore */ } };
export const isUnlockedThisSession = () => { try { return sessionStorage.getItem(SESSION) === "1"; } catch { return true; } };
export const markUnlocked = () => { try { sessionStorage.setItem(SESSION, "1"); localStorage.removeItem(FAILS); } catch { /* ignore */ } };
export const readFails = (): { n: number; at: number } => { try { return JSON.parse(localStorage.getItem(FAILS) ?? "") as { n: number; at: number }; } catch { return { n: 0, at: 0 }; } };
export const addFail = () => { try { const f = readFails(); localStorage.setItem(FAILS, JSON.stringify({ n: f.n + 1, at: Date.now() })); } catch { /* ignore */ } };
export const LOCK_EVENT = "spal:lock";
