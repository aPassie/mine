export type EntryType = "idea" | "wishlist" | "reminder" | "quote" | "note" | "other";

export const ENTRY_TYPES: EntryType[] = ["idea", "wishlist", "reminder", "quote", "note", "other"];

export const TYPE_META: Record<EntryType, { label: string; color: string; dot: string }> = {
  idea: { label: "Idea", color: "bg-amber-100 text-amber-900", dot: "bg-amber-400" },
  wishlist: { label: "Wishlist", color: "bg-pink-100 text-pink-900", dot: "bg-pink-400" },
  reminder: { label: "Reminder", color: "bg-sky-100 text-sky-900", dot: "bg-sky-400" },
  quote: { label: "Quote", color: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-400" },
  note: { label: "Note", color: "bg-neutral-100 text-neutral-900", dot: "bg-neutral-400" },
  other: { label: "Other", color: "bg-violet-100 text-violet-900", dot: "bg-violet-400" },
};

export type Entry = {
  id: string;
  raw_text: string;
  summary: string | null;
  type: EntryType;
  tags: string[];
  entities: { people?: string[]; products?: string[]; sources?: string[] } | null;
  mood: string | null;
  pinned: boolean;
  created_at: string;
  last_seen_at: string | null;
};
