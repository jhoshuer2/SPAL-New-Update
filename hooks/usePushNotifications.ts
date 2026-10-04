"use client";

import { useEffect, useRef } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

// Silently registers the push subscription if the user has already granted
// permission. Does NOT prompt — prompting is done explicitly in the
// Notifications sheet so the user is in control.
export function usePushNotifications(userId: string | undefined) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!userId || attempted.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return; // only act on already-granted

    attempted.current = true;

    navigator.serviceWorker.ready.then(async (reg) => {
      try {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch {
        // Push is an enhancement — silent fail is fine
      }
    });
  }, [userId]);
}

// Call this when the user explicitly enables notifications (e.g. from the
// Notifications sheet). Requests permission, subscribes, saves to server.
// Returns "granted" | "denied" | "default" | "error"
export async function enablePushNotifications(): Promise<string> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "error";

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return permission;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });

    return "granted";
  } catch {
    return "error";
  }
}

// Unsubscribes from push and removes the subscription from the server.
export async function disablePushNotifications(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Silent
  }
}
