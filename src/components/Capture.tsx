"use client";

import { useRef, useState } from "react";
import type { Entry } from "@/lib/types";

export function Capture({ onCreated }: { onCreated: (entry: Entry) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_text: t }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      onCreated(data.entry);
      setText("");
      ref.current?.focus();
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="card-soft p-4 flex flex-col gap-2">
      <textarea
        ref={ref}
        autoFocus
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="What's on your mind?"
        className="w-full bg-transparent outline-none px-2 py-2 text-[15px] placeholder:text-[var(--text-muted)]"
      />
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-[var(--text-muted)]">
          Enter to save · Shift+Enter for newline
        </span>
        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className="btn text-xs py-2 px-4 disabled:opacity-40"
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
