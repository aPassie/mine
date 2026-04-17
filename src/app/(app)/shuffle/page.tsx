"use client";

import { useEffect, useState } from "react";
import { TYPE_META, type Entry } from "@/lib/types";

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (d < 1) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
}

export default function ShufflePage() {
  const [deck, setDeck] = useState<Entry[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/shuffle");
    if (res.ok) {
      const data = await res.json();
      setDeck(data.entries);
      setIdx(0);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function next() {
    if (idx < deck.length - 1) {
      const seen = deck[idx];
      fetch(`/api/entries/${seen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
      }).catch(() => {});
      setIdx(idx + 1);
    } else {
      load();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const card = deck[idx];

  return (
    <div className="flex flex-col gap-5">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Shuffle</h1>
        <p className="text-sm text-[var(--text-muted)]">
          A little nudge from your past self.
        </p>
      </header>

      {loading && (
        <div className="card-soft p-12 text-center text-sm text-[var(--text-muted)]">
          Shuffling...
        </div>
      )}

      {!loading && deck.length === 0 && (
        <div className="card-soft p-12 text-center text-sm text-[var(--text-muted)]">
          <p className="mb-2">Nothing to shuffle yet.</p>
          <p>Add a few thoughts first.</p>
        </div>
      )}

      {card && (
        <article key={card.id} className="card-soft p-8 min-h-[280px] flex flex-col anim-in">
          <div className="flex items-center gap-2 mb-5">
            <span className={`w-2 h-2 rounded-full ${TYPE_META[card.type].dot}`} aria-hidden />
            <span className="text-xs text-[var(--text-muted)]">{TYPE_META[card.type].label}</span>
            <span className="text-xs text-[var(--text-muted)]">·</span>
            <span className="text-xs text-[var(--text-muted)]">{daysAgo(card.created_at)}</span>
            <span className="ml-auto text-xs text-[var(--text-muted)]">
              {idx + 1} / {deck.length}
            </span>
          </div>

          <p className="text-lg leading-relaxed whitespace-pre-wrap flex-1">{card.raw_text}</p>

          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6">
              {card.tags.map((t) => (
                <span key={t} className="pill">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button onClick={next} className="btn">
              {idx < deck.length - 1 ? "Next →" : "Shuffle again ↻"}
            </button>
          </div>
        </article>
      )}

      <p className="text-xs text-[var(--text-muted)] text-center">
        Tip: press Space or → for next
      </p>
    </div>
  );
}
