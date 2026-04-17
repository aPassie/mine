"use client";

import { useState } from "react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/";
      return;
    }
    try {
      const data = await res.json();
      setError(data.error ?? "Wrong passcode");
    } catch {
      setError("Wrong passcode");
    }
    setPasscode("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <div className="text-3xl font-semibold tracking-tight">Mine</div>
          <div className="text-sm text-[var(--text-muted)] mt-1">your second brain</div>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="input text-center"
          />
          <button type="submit" className="btn" disabled={loading || !passcode}>
            {loading ? "Unlocking..." : "Unlock"}
          </button>
          {error && (
            <div className="text-xs text-red-500 mt-2" role="alert">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
