"use client";

import { useEffect, useState } from "react";
import { EntryCard } from "@/components/EntryCard";
import type { Entry } from "@/lib/types";

type Tag = { name: string; count: number };

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/tags");
      if (res.ok) setTags((await res.json()).tags);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!active) {
      setEntries([]);
      return;
    }
    (async () => {
      const res = await fetch(`/api/entries?tag=${encodeURIComponent(active)}`);
      if (res.ok) setEntries((await res.json()).entries);
    })();
  }, [active]);

  return (
    <div className="flex flex-col gap-5">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-sm text-[var(--text-muted)]">Browse by theme.</p>
      </header>

      {loading && <div className="text-sm text-[var(--text-muted)] px-2">Loading...</div>}

      {!loading && tags.length === 0 && (
        <div className="card-soft p-8 text-center text-sm text-[var(--text-muted)]">
          No tags yet. Add some entries first.
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t.name}
              onClick={() => setActive(active === t.name ? null : t.name)}
              className={`pill ${
                active === t.name ? "!bg-[var(--accent)] !text-[var(--accent-ink)]" : ""
              }`}
            >
              {t.name}
              <span className="opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <section className="flex flex-col gap-3 mt-2">
          <div className="text-xs text-[var(--text-muted)] px-2">
            Showing entries tagged <span className="font-medium">#{active}</span>
          </div>
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onChange={(u) =>
                setEntries((prev) => prev.map((x) => (x.id === u.id ? u : x)))
              }
              onDelete={(id) => setEntries((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </section>
      )}
    </div>
  );
}
