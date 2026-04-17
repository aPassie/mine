"use client";

import { useEffect, useMemo, useState } from "react";
import { EntryCard } from "@/components/EntryCard";
import { ENTRY_TYPES, TYPE_META, type Entry, type EntryType } from "@/lib/types";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryType | "all">("all");
  const [results, setResults] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        const res = await fetch("/api/entries?limit=100");
        if (res.ok) setResults((await res.json()).entries);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults((await res.json()).entries);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? results : results.filter((r) => r.type === typeFilter)),
    [results, typeFilter],
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-[var(--text-muted)]">Meaning-aware, not just keywords.</p>
      </header>

      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="What are you looking for?"
        className="input"
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setTypeFilter("all")}
          className={`pill ${typeFilter === "all" ? "!bg-[var(--accent)] !text-[var(--accent-ink)]" : ""}`}
        >
          all
        </button>
        {ENTRY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`pill ${typeFilter === t ? "!bg-[var(--accent)] !text-[var(--accent-ink)]" : ""}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${TYPE_META[t].dot}`} aria-hidden />
            {t}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        {loading && <div className="text-sm text-[var(--text-muted)] px-2">Thinking...</div>}
        {!loading && filtered.length === 0 && (
          <div className="card-soft p-8 text-center text-sm text-[var(--text-muted)]">
            Nothing matches yet.
          </div>
        )}
        {filtered.map((e) => (
          <EntryCard
            key={e.id}
            entry={e}
            onChange={(updated) =>
              setResults((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
            onDelete={(id) => setResults((prev) => prev.filter((x) => x.id !== id))}
          />
        ))}
      </section>
    </div>
  );
}
