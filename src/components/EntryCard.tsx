"use client";

import { useEffect, useRef, useState } from "react";
import { TYPE_META, type Entry } from "@/lib/types";
import { IconBell, IconStar, IconX } from "./icons";

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "overdue";
  const m = Math.round(diff / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `in ${d}d`;
  const mo = Math.round(d / 30);
  return `in ${mo}mo`;
}

type Reminder = {
  id: string;
  entry_id: string;
  fire_at: string;
  title: string | null;
  body: string | null;
};

type Props = {
  entry: Entry;
  onChange?: (entry: Entry) => void;
  onDelete?: (id: string) => void;
};

const PRESETS: { label: string; mins: number }[] = [
  { label: "in 1 hour", mins: 60 },
  { label: "tonight (8pm)", mins: computeMinsUntilHour(20) },
  { label: "tomorrow 9am", mins: computeMinsUntilHour(9, 1) },
  { label: "in 3 days", mins: 60 * 24 * 3 },
  { label: "next week", mins: 60 * 24 * 7 },
  { label: "next month", mins: 60 * 24 * 30 },
];

function computeMinsUntilHour(hour: number, dayOffset = 0): number {
  const target = new Date();
  target.setDate(target.getDate() + dayOffset);
  target.setHours(hour, 0, 0, 0);
  let diff = Math.round((target.getTime() - Date.now()) / 60000);
  if (diff <= 0) diff += 60 * 24; // next day
  return diff;
}

export function EntryCard({ entry, onChange, onDelete }: Props) {
  const [busy, setBusy] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = TYPE_META[entry.type];

  async function loadReminders() {
    const res = await fetch(`/api/reminders?entry_id=${entry.id}`);
    if (res.ok) setReminders((await res.json()).reminders);
  }

  useEffect(() => {
    loadReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showReminderMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowReminderMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showReminderMenu]);

  async function togglePin() {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !entry.pinned }),
    });
    setBusy(false);
    if (res.ok) onChange?.((await res.json()).entry);
  }

  async function remove() {
    if (!confirm("Delete this?")) return;
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDelete?.(entry.id);
  }

  async function setReminder(mins: number) {
    setBusy(true);
    const fireAt = new Date(Date.now() + mins * 60000).toISOString();
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entry_id: entry.id,
        fire_at: fireAt,
        title: "Remember this?",
        body: entry.raw_text.slice(0, 120),
      }),
    });
    setBusy(false);
    setShowReminderMenu(false);
    if (res.ok) loadReminders();
  }

  async function cancelReminder(id: string) {
    setBusy(true);
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) loadReminders();
  }

  return (
    <article className="card-soft p-5 anim-in">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden />
        <span className="text-xs text-[var(--text-muted)]">{meta.label}</span>
        <span className="text-xs text-[var(--text-muted)]">·</span>
        <span className="text-xs text-[var(--text-muted)]">{timeAgo(entry.created_at)}</span>
        <div className="ml-auto flex items-center gap-1 relative">
          <button
            aria-label="Set reminder"
            onClick={() => setShowReminderMenu((v) => !v)}
            disabled={busy}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              reminders.length > 0
                ? "bg-[var(--surface-2)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <IconBell width={14} height={14} />
          </button>
          <button
            aria-label={entry.pinned ? "Unpin" : "Pin"}
            onClick={togglePin}
            disabled={busy}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              entry.pinned
                ? "bg-[var(--surface-2)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <IconStar width={14} height={14} />
          </button>
          <button
            aria-label="Delete"
            onClick={remove}
            disabled={busy}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            <IconX width={14} height={14} />
          </button>

          {showReminderMenu && (
            <div
              ref={menuRef}
              className="absolute top-9 right-0 z-10 card-soft p-2 w-[220px] flex flex-col gap-0.5"
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] px-3 py-2">
                Remind me…
              </div>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setReminder(p.mins)}
                  className="text-left text-xs px-3 py-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text)]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{entry.raw_text}</p>

      {entry.summary && entry.summary !== entry.raw_text.slice(0, 80) && (
        <p className="text-xs text-[var(--text-muted)] mt-2 italic">{entry.summary}</p>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {entry.tags.map((t) => (
            <span key={t} className="pill">
              {t}
            </span>
          ))}
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5">
          {reminders.map((r) => (
            <button
              key={r.id}
              onClick={() => cancelReminder(r.id)}
              className="pill flex items-center gap-1.5"
              title="Click to cancel"
            >
              <IconBell width={10} height={10} />
              {timeUntil(r.fire_at)}
              <IconX width={10} height={10} className="opacity-60" />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
