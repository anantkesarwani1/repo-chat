import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { nanoid } from "nanoid";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

import { BackgroundFX } from "@/components/chat/BackgroundFX";
import {
  RepoHeader,
  type IngestStatus,
  type RepoInfo,
} from "@/components/chat/RepoHeader";
import { EmptyState } from "@/components/chat/EmptyState";

import { askQuestion, cleanAnswer, ingestRepo } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Repo Chat — Chat with any GitHub repository" },
      {
        name: "description",
        content:
          "Paste a public GitHub repo and chat with its code. Ask about files, structure, dependencies, and more.",
      },
    ],
  }),
  component: Index,
});

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function Index() {
  const [repoUrl, setRepoUrl] = useState("");
  const [ingestedUrl, setIngestedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<IngestStatus>("idle");
  const [info, setInfo] = useState<RepoInfo | undefined>();
  const [error, setError] = useState<string | undefined>();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);

  const handleIngest = useCallback(async () => {
    const url = repoUrl.trim();
    if (!url) return;
    setStatus("loading");
    setError(undefined);
    setInfo(undefined);
    try {
      const res = await ingestRepo(url);
      setInfo({
        owner: res.owner,
        repo: res.repo,
        file_count: res.file_count,
        chunk_count: res.chunk_count,
      });
      setIngestedUrl(url);
      setMessages([]);
      setStatus("ready");
      toast.success("Repository ingested", {
        description: res.message ?? "Ready to chat.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to ingest repo";
      setError(msg);
      setStatus("error");
      toast.error("Ingest failed", { description: msg });
    }
  }, [repoUrl]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || !ingestedUrl || sending) return;

      const userMsg: ChatMsg = { id: nanoid(), role: "user", content: q };
      setMessages((m) => [...m, userMsg]);
      setSending(true);

      try {
        const res = await askQuestion(ingestedUrl, q);
        const answer = cleanAnswer(res.answer) || "(empty response)";
        setMessages((m) => [
          ...m,
          { id: nanoid(), role: "assistant", content: answer },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        setMessages((m) => [
          ...m,
          {
            id: nanoid(),
            role: "assistant",
            content: `**Error:** ${msg}`,
          },
        ]);
        toast.error("Chat failed", { description: msg });
      } finally {
        setSending(false);
      }
    },
    [ingestedUrl, sending],
  );

  const onSubmit = useCallback(
    (msg: PromptInputMessage) => {
      void send(msg.text);
    },
    [send],
  );

  const ready = status === "ready" && !!ingestedUrl;
  const showEmpty = messages.length === 0;

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundFX />
      <Toaster theme="dark" position="top-right" richColors />

      <RepoHeader
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        status={status}
        info={info}
        error={error}
        onIngest={handleIngest}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 pb-32 pt-4 md:px-6">
        {showEmpty ? (
          <EmptyState ready={ready} onPick={send} />
        ) : (
          <Conversation className="flex-1">
            <ConversationContent className="!pb-6">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Message from={m.role}>
                      {m.role === "user" ? (
                        <MessageContent
                          className="border-0 text-white shadow-[0_0_25px_-8px_oklch(0.68_0.22_295/0.7)]"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </MessageContent>
                      ) : (
                        <MessageContent className="bg-transparent !p-0 !shadow-none">
                          <MessageResponse>{m.content}</MessageResponse>
                        </MessageContent>
                      )}
                    </Message>
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && (
                <Message from="assistant">
                  <MessageContent className="bg-transparent !p-0 !shadow-none">
                    <Shimmer>Thinking…</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-4 md:px-6 md:pb-6">
        <div className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-background to-transparent" />
        <div className="mx-auto max-w-4xl">
          <PromptInput
            onSubmit={onSubmit}
            className="glass-strong rounded-2xl !border-white/15 shadow-[0_20px_60px_-20px_oklch(0.1_0.05_270/0.9)]"
          >
            <PromptInputTextarea
              placeholder={
                ready
                  ? "Ask anything about the code…"
                  : "Ingest a repo to start chatting"
              }
              disabled={!ready || sending}
              className="min-h-[56px] text-[15px]"
            />
            <PromptInputFooter className="justify-end px-2 pb-2">
              <PromptInputSubmit
                disabled={!ready || sending}
                status={sending ? "submitted" : undefined}
                className="border-0 text-white shadow-[0_0_20px_-4px_oklch(0.68_0.22_295/0.7)]"
                style={{ background: "var(--gradient-primary)" }}
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
            Backend: <code className="font-mono">/api/ingest</code> ·{" "}
            <code className="font-mono">/api/chat</code> · powered by your
            FastAPI Codespace
          </p>
        </div>
      </div>
    </div>
  );
}
