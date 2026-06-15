# Repo Chat — Frontend Build Plan

Premium dark-mode, glassmorphic chat UI for your FastAPI repo-chat backend running in a GitHub Codespace.

## API wiring

`src/lib/api.ts`:
```ts
const API = import.meta.env.VITE_API_URL
  ?? "https://legendary-bassoon-4jw7r9q6vjgrc76j6-8000.app.github.dev";
```
- `ingestRepo(repo_url)` → `POST {API}/api/ingest` body `{ repo_url }`
- `askQuestion(repo_url, question)` → `POST {API}/api/chat` body `{ repo_url, question }`
- `cleanAnswer(raw)` — pulls `answer` field, and if it's a stringified `[{'type':'text','text':'...'}]` or `{'content':'...'}` blob (LangChain edge cases), parses and extracts plain text; otherwise returns the string as-is.

Requirements on your side (one-time):
1. Codespaces → Ports → port 8000 → Port Visibility = **Public**
2. Add CORS middleware to your FastAPI `main.py` (`allow_origins=["*"]`)

If those aren't done, all calls 401 / get blocked by CORS — that's not a frontend bug.

## UI layout (single page, `src/routes/index.tsx`)

```text
┌───────────────────────────────────────────────────────┐
│  [logo]  Repo Chat                    [status pill]   │
│  ┌──────────────────────────────┬──────────────────┐  │
│  │ https://github.com/owner/r…  │  Ingest Repo →   │  │
│  └──────────────────────────────┴──────────────────┘  │
├───────────────────────────────────────────────────────┤
│                                                       │
│   empty state: "Paste a repo URL to begin" +          │
│   3 suggested questions (as chips)                    │
│                                                       │
│   …or message transcript scrolls here…                │
│                                                       │
├───────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┬─────────┐  │
│  │ Ask about the repo…                   │   ↑     │  │
│  └───────────────────────────────────────┴─────────┘  │
└───────────────────────────────────────────────────────┘
```

- **Header**: glass card; URL input + gradient "Ingest Repo" button with spinner; status pill (idle / ingesting / ready / error) with color transitions; once ingested, shows `owner/repo · N files · M chunks`.
- **Transcript**: user bubbles right-aligned (primary gradient bg, primary-foreground text); assistant messages left-aligned, no bubble background (per chat-UI rules), rendered via `MessageResponse` from AI Elements so markdown + code blocks look right.
- **Loading state**: AI Elements `Shimmer` "Thinking…" while awaiting `/api/chat`.
- **Composer**: AI Elements `PromptInput` + `PromptInputTextarea` + `PromptInputFooter` (right-aligned submit). Disabled until repo ingested. Enter sends, Shift+Enter newline.
- **Background**: deep-space — layered radial gradients (indigo→near-black) + faint grid + two slow-drifting violet/cyan blobs (framer-motion).

## Visual system

All tokens in `src/styles.css` (`oklch`, mapped via `@theme inline`):
- `--background`: near-black indigo
- `--primary`: electric violet, `--primary-glow`: cyan
- `--gradient-primary`, `--gradient-bg`, `--shadow-glow`
- `.glass` utility: `bg-white/5 backdrop-blur-xl border border-white/10`
- Fonts loaded via `<link>` in `__root.tsx`: **Space Grotesk** (display) + **Inter** (body); registered as `--font-display` / `--font-sans` in `@theme`.
- App defaults to `.dark` class on `<html>`.

No `Sparkles` mascot — I'll generate a small abstract repo/code-orb logo for the header + empty state.

## AI Elements

Install: `bun x ai-elements@latest add conversation message prompt-input shimmer`
Use: `Conversation`, `ConversationContent`, `ConversationScrollButton`, `Message`, `MessageContent`, `MessageResponse`, `PromptInput`, `PromptInputTextarea`, `PromptInputFooter`, `PromptInputSubmit`, `Shimmer`.

Other deps: `framer-motion` (already may be present), `sonner` for toasts on ingest errors.

## State

Local component state only (no DB, no auth):
- `repoUrl: string`
- `ingest: { status: 'idle'|'loading'|'ready'|'error', info?: {owner,repo,file_count,chunk_count}, error?: string }`
- `messages: { id, role: 'user'|'assistant', content: string }[]`
- `sending: boolean`

Conversation lives for the session; refresh = blank slate (matches the in-memory backend).

## Files

- `src/lib/api.ts` — fetch helpers + `cleanAnswer`
- `src/routes/index.tsx` — full page
- `src/routes/__root.tsx` — add font `<link>`s, set `lang="en" class="dark"`, update title/meta to "Repo Chat — Chat with any GitHub repository"
- `src/styles.css` — add deep-space tokens, gradient/shadow tokens, `.glass`, register font families
- `src/components/chat/BackgroundFX.tsx` — gradient blobs + grid
- `src/components/chat/RepoHeader.tsx` — URL input + ingest button + status
- `src/components/chat/EmptyState.tsx` — logo + suggested prompts
- `src/assets/logo.png` — generated abstract orb logo

## Out of scope (say the word and I'll add)

- Persisted history across reloads
- Multiple repos / thread switcher
- Streaming responses (your backend returns whole answer in one shot)

Ready to build on approval.
