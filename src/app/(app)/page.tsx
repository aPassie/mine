"use client";

import { useEffect, useState } from "react";
import { Capture } from "@/components/Capture";
import { EntryCard } from "@/components/EntryCard";
import type { Entry } from "@/lib/types";

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/entries?limit=50");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-2 pb-1">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {greeting()} — capture whatever's on your mind.
        </p>
      </header>

      <Capture onCreated={(e) => setEntries((prev) => [e, ...prev])} />

      <section className="flex flex-col gap-3">
        {loading && (
          <div className="text-sm text-[var(--text-muted)] px-2">Loading...</div>
        )}
        {!loading && entries.length === 0 && (
          <div className="card-soft p-8 text-center text-sm text-[var(--text-muted)]">
            <p className="mb-1">Nothing here yet.</p>
            <p>Drop your first thought above.</p>
          </div>
        )}
        {entries.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onChange={(updated) =>
              setEntries((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
            onDelete={(id) => setEntries((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night thoughts";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Night mode";
}
