"use client";

import { useEffect, useState } from "react";
import { NotificationsCard } from "@/components/NotificationsCard";

type AuditRow = {
  id: number;
  ts: string;
  event: string;
  ip: string | null;
  ua: string | null;
  entry_id: string | null;
  meta: Record<string, unknown> | null;
};

const EVENT_LABEL: Record<string, string> = {
  login_success: "Login",
  login_fail: "Login failed",
  login_lockout: "Login lockout",
  logout: "Logout",
  logout_all: "Logout everywhere",
  entry_create: "Entry created",
  entry_update: "Entry updated",
  entry_delete: "Entry deleted",
  entry_read_list: "List viewed",
  entry_read_search: "Search",
  entry_read_shuffle: "Shuffle",
  tags_read: "Tags viewed",
};

const EVENT_COLOR: Record<string, string> = {
  login_success: "bg-emerald-400",
  login_fail: "bg-red-400",
  login_lockout: "bg-red-500",
  logout: "bg-neutral-400",
  logout_all: "bg-amber-400",
  entry_create: "bg-sky-400",
  entry_update: "bg-sky-300",
  entry_delete: "bg-red-400",
  entry_read_list: "bg-neutral-300",
  entry_read_search: "bg-violet-400",
  entry_read_shuffle: "bg-pink-400",
  tags_read: "bg-neutral-300",
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function shortUA(ua: string | null): string {
  if (!ua) return "unknown";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return ua.split(" ")[0] ?? "browser";
}

export default function SettingsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const url = filter ? `/api/audit?event=${encodeURIComponent(filter)}` : "/api/audit";
    const res = await fetch(url);
    if (res.ok) setRows((await res.json()).events);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function logoutEverywhere() {
    if (
      !confirm(
        "Sign out of all devices? You'll need to re-enter your passcode on every device.",
      )
    ) {
      return;
    }
    setBusy(true);
    await fetch("/api/auth/logout-all", { method: "POST" });
    window.location.href = "/login";
  }

  async function logoutThis() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const eventTypes = Array.from(new Set(rows.map((r) => r.event)));

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Your account, your activity.</p>
      </header>

      <NotificationsCard />

      <section className="card-soft p-5">
        <h2 className="text-sm font-medium mb-3">Sessions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={logoutThis}
            disabled={busy}
            className="btn-ghost btn text-xs py-2 px-4"
          >
            Sign out this device
          </button>
          <button
            onClick={logoutEverywhere}
            disabled={busy}
            className="btn text-xs py-2 px-4 !bg-red-500"
          >
            Sign out everywhere
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Signing out everywhere invalidates all existing sessions on all devices.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Activity log</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {rows.length} event{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setFilter("")}
            className={`pill ${filter === "" ? "!bg-[var(--accent)] !text-[var(--accent-ink)]" : ""}`}
          >
            all
          </button>
          {eventTypes.map((e) => (
            <button
              key={e}
              onClick={() => setFilter(e)}
              className={`pill ${filter === e ? "!bg-[var(--accent)] !text-[var(--accent-ink)]" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${EVENT_COLOR[e] ?? "bg-neutral-400"}`} />
              {EVENT_LABEL[e] ?? e}
            </button>
          ))}
        </div>

        {loading && (
          <div className="card-soft p-8 text-center text-sm text-[var(--text-muted)]">
            Loading…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="card-soft p-8 text-center text-sm text-[var(--text-muted)]">
            No activity yet.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="card-soft p-3 flex items-center gap-3 text-sm"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${EVENT_COLOR[r.event] ?? "bg-neutral-400"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {EVENT_LABEL[r.event] ?? r.event}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {shortUA(r.ua)} · {r.ip ?? "—"}
                  {r.meta && Object.keys(r.meta).length > 0 && (
                    <>
                      {" · "}
                      <span className="font-mono">
                        {Object.entries(r.meta)
                          .filter(([k]) => k !== "ua")
                          .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
                          .join(" ")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">
                {relTime(r.ts)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
