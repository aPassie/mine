"use client";

import { useEffect, useState } from "react";
import { getSubscription, pushSupported, subscribe, unsubscribe } from "@/lib/push-client";

export function NotificationsCard() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ok = pushSupported();
      setSupported(ok);
      if (!ok) return;
      setPermission(Notification.permission);
      const sub = await getSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

  async function onSubscribe() {
    setBusy(true);
    setMsg(null);
    try {
      await subscribe();
      setPermission(Notification.permission);
      setSubscribed(true);
      setMsg("Subscribed on this device.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to subscribe");
    } finally {
      setBusy(false);
    }
  }

  async function onUnsubscribe() {
    setBusy(true);
    setMsg(null);
    try {
      await unsubscribe();
      setSubscribed(false);
      setMsg("Unsubscribed on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/push/test", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setMsg(
        data.sent > 0
          ? `Sent to ${data.sent} device${data.sent === 1 ? "" : "s"}.`
          : "No devices subscribed. Subscribe first.",
      );
    } else {
      setMsg("Test failed.");
    }
  }

  return (
    <section className="card-soft p-5">
      <h2 className="text-sm font-medium mb-1">Notifications</h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Reminders and motivating nudges from your past self.
      </p>

      {!supported && (
        <div className="text-xs text-[var(--text-muted)]">
          This browser doesn&apos;t support push notifications.
        </div>
      )}

      {supported && permission === "denied" && (
        <div className="text-xs text-[var(--text-muted)]">
          Notification permission was blocked. Enable it in your browser site settings.
        </div>
      )}

      {supported && permission !== "denied" && (
        <div className="flex flex-wrap gap-2 items-center">
          {!subscribed ? (
            <button onClick={onSubscribe} disabled={busy} className="btn text-xs py-2 px-4">
              Enable on this device
            </button>
          ) : (
            <>
              <span className="pill">on · this device</span>
              <button
                onClick={onUnsubscribe}
                disabled={busy}
                className="btn-ghost btn text-xs py-2 px-4"
              >
                Turn off here
              </button>
              <button
                onClick={onTest}
                disabled={busy}
                className="btn-ghost btn text-xs py-2 px-4"
              >
                Send test
              </button>
            </>
          )}
        </div>
      )}

      {msg && <p className="text-xs text-[var(--text-muted)] mt-3">{msg}</p>}
    </section>
  );
}
