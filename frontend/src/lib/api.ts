// Repo Chat backend client.
// Override with VITE_API_URL in .env if your Codespace port URL changes.
const API =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://legendary-bassoon-4jw7r9q6vjgrc76j6-8000.app.github.dev";

export interface IngestResponse {
  status?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  file_count?: number;
  chunk_count?: number;
  message?: string;
  [k: string]: unknown;
}

export interface ChatResponse {
  answer: unknown;
  [k: string]: unknown;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`,
    );
  }
  return (await res.json()) as T;
}

export const ingestRepo = (repo_url: string) =>
  postJSON<IngestResponse>("/api/ingest", { repo_url });

export const askQuestion = (repo_url: string, question: string) =>
  postJSON<ChatResponse>("/api/chat", { repo_url, question });

/**
 * Backend usually returns answer as a plain string. LangChain occasionally
 * leaks a list-of-parts shape like [{'type':'text','text':'...'}] or a dict
 * like {'content':'...'} serialized with single quotes. Normalize all of it
 * to clean markdown text.
 */
export function cleanAnswer(raw: unknown): string {
  if (raw == null) return "";

  // Already structured
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const p = part as Record<string, unknown>;
          if (typeof p.text === "string") return p.text;
          if (typeof p.content === "string") return p.content;
        }
        return "";
      })
      .join("")
      .trim();
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.content === "string") return o.content;
    return JSON.stringify(raw);
  }

  let text = String(raw).trim();

  // Strip leading "content=" wrapper from repr-style strings
  text = text.replace(/^content=/, "");

  // If it looks like a python-repr list/dict, try JSON-ifying single quotes
  const looksLikeRepr =
    (text.startsWith("[{") && text.endsWith("}]")) ||
    (text.startsWith("{'") && text.endsWith("}"));
  if (looksLikeRepr) {
    try {
      const jsonish = text.replace(/'/g, '"');
      const parsed = JSON.parse(jsonish);
      return cleanAnswer(parsed);
    } catch {
      /* fall through and return as-is */
    }
  }
  return text;
}

export const API_BASE_URL = API;
