import { motion, AnimatePresence } from "framer-motion";
import {
  FolderGit2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export type IngestStatus = "idle" | "loading" | "ready" | "error";

export interface RepoInfo {
  owner?: string;
  repo?: string;
  file_count?: number;
  chunk_count?: number;
}

interface Props {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  status: IngestStatus;
  info?: RepoInfo;
  error?: string;
  onIngest: () => void;
}

export function RepoHeader({
  repoUrl,
  setRepoUrl,
  status,
  info,
  error,
  onIngest,
}: Props) {
  const disabled = status === "loading" || !repoUrl.trim();

  return (
    <header className="glass-strong sticky top-0 z-30 border-b border-white/10">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-4 md:py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Repo Chat"
            className="h-9 w-9 drop-shadow-[0_0_18px_oklch(0.68_0.22_295/0.6)]"
          />
          <div className="leading-tight">
            <h1 className="font-display text-lg font-semibold tracking-tight">
              Repo<span className="text-gradient">Chat</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Chat with any GitHub repository
            </p>
          </div>
        </div>

        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled) onIngest();
          }}
        >
          <div className="relative flex-1">
            <FolderGit2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="h-11 border-white/10 bg-white/5 pl-9 font-mono text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-primary/40"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <Button
            type="submit"
            disabled={disabled}
            className={cn(
              "h-11 min-w-[140px] gap-2 border-0 font-medium text-white shadow-[0_0_30px_-6px_oklch(0.68_0.22_295/0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-4px_oklch(0.68_0.22_295/0.8)] disabled:opacity-60 disabled:hover:scale-100",
            )}
            style={{ background: "var(--gradient-primary)" }}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingesting…
              </>
            ) : (
              <>
                <Sparkle className="h-4 w-4" />
                Ingest Repo
              </>
            )}
          </Button>
        </form>
      </div>

      <AnimatePresence>
        {(status === "ready" || status === "error") && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mx-auto max-w-5xl px-4 pb-3"
          >
            {status === "ready" && info && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-mono">
                  {info.owner}/{info.repo}
                </span>
                {info.file_count != null && (
                  <span className="text-emerald-300/70">
                    · {info.file_count} files
                  </span>
                )}
                {info.chunk_count != null && (
                  <span className="text-emerald-300/70">
                    · {info.chunk_count} chunks
                  </span>
                )}
              </div>
            )}
            {status === "error" && (
              <div className="inline-flex max-w-full items-start gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs text-destructive-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{error ?? "Ingest failed"}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
