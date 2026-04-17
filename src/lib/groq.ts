import Groq from "groq-sdk";
import { ENTRY_TYPES, type EntryType } from "./types";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const MODEL = "llama-3.3-70b-versatile";

export type Enrichment = {
  summary: string;
  type: EntryType;
  tags: string[];
  mood: string | null;
  entities: { people: string[]; products: string[]; sources: string[] };
};

const SYSTEM = `You categorize personal notes for a second-brain app called Mine.
Given the user's raw note, return strict JSON with these fields only:
- summary: one short sentence (max 12 words), no trailing period needed
- type: one of ${ENTRY_TYPES.join(", ")}
- tags: 1-5 short lowercase kebab-case tags, no '#'
- mood: one of motivating, curious, practical, playful, reflective, or null
- entities: { people: string[], products: string[], sources: string[] }

Only return JSON. No commentary.`;

export async function enrich(rawText: string): Promise<Enrichment> {
  if (!process.env.GROQ_API_KEY) {
    return fallback(rawText);
  }

  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: rawText },
      ],
    });

    const content = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return normalize(parsed, rawText);
  } catch {
    return fallback(rawText);
  }
}

function normalize(raw: unknown, text: string): Enrichment {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const type = ENTRY_TYPES.includes(obj.type as EntryType) ? (obj.type as EntryType) : "note";
  const tagsRaw = Array.isArray(obj.tags) ? obj.tags : [];
  const tags = tagsRaw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""))
    .filter(Boolean)
    .slice(0, 5);
  const summary =
    typeof obj.summary === "string" && obj.summary.trim()
      ? obj.summary.trim().slice(0, 120)
      : text.slice(0, 80);
  const mood =
    typeof obj.mood === "string" && obj.mood.trim() && obj.mood !== "null"
      ? obj.mood.trim().toLowerCase()
      : null;
  const ents = (obj.entities ?? {}) as Record<string, unknown>;
  const toStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    summary,
    type,
    tags,
    mood,
    entities: {
      people: toStrArr(ents.people),
      products: toStrArr(ents.products),
      sources: toStrArr(ents.sources),
    },
  };
}

function fallback(text: string): Enrichment {
  return {
    summary: text.slice(0, 80),
    type: "note",
    tags: [],
    mood: null,
    entities: { people: [], products: [], sources: [] },
  };
}
