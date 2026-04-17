"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mine.install.dismissed";

export function PWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      const d = localStorage.getItem(DISMISS_KEY);
      if (!d || Date.now() - Number(d) > 7 * 24 * 60 * 60 * 1000) {
        setVisible(true);
      }
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Mine"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-sm card-soft p-4 flex items-center gap-3 anim-in"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">Install Mine</div>
        <div className="text-xs text-[var(--text-muted)]">Keep it one tap away.</div>
      </div>
      <button onClick={dismiss} className="btn-ghost btn text-xs py-1.5 px-3">
        Later
      </button>
      <button onClick={install} className="btn text-xs py-1.5 px-3">
        Install
      </button>
    </div>
  );
}
