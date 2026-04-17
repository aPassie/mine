const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const DIM = 384;

export async function embed(text: string): Promise<number[]> {
  const token = process.env.HF_TOKEN;
  if (token) {
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as number[] | number[][];
        const vec = Array.isArray(data[0]) ? (data[0] as number[]) : (data as number[]);
        if (vec.length === DIM) return vec;
      }
    } catch {
      /* */
    }
  }
  return localHashVector(text);
}

function localHashVector(text: string): number[] {
  const vec = new Array<number>(DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  for (const tok of tokens) {
    const h = hash(tok);
    vec[h % DIM] += 1;
    vec[(h * 31) % DIM] += 0.5;
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < DIM; i++) vec[i] = vec[i] / norm;
  return vec;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
