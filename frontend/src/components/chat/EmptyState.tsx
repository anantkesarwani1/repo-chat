import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const SUGGESTIONS = [
  "What does this repository do?",
  "Walk me through the project structure.",
  "Explain the main entry point file.",
  "What are the key dependencies and why?",
];

interface Props {
  ready: boolean;
  onPick: (q: string) => void;
}

export function EmptyState({ ready, onPick }: Props) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <motion.img
        src={logo}
        alt=""
        className="h-24 w-24 drop-shadow-[0_0_40px_oklch(0.68_0.22_295/0.6)]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-display mt-6 text-3xl font-semibold tracking-tight"
      >
        {ready ? "Ask anything about the code" : "Paste a repo to begin"}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mt-3 max-w-md text-sm text-muted-foreground"
      >
        {ready
          ? "Your repository is indexed. Try one of these to get started, or type your own question below."
          : "Drop a public GitHub URL above and hit Ingest. We'll embed the codebase so you can chat with it like a teammate."}
      </motion.p>

      {ready && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
          }}
          className="mt-8 grid w-full gap-2 sm:grid-cols-2"
        >
          {SUGGESTIONS.map((s) => (
            <motion.button
              key={s}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              onClick={() => onPick(s)}
              className="glass group rounded-xl px-4 py-3 text-left text-sm text-foreground/90 transition-all hover:border-primary/40 hover:bg-white/[0.08] hover:shadow-[0_0_25px_-10px_oklch(0.68_0.22_295/0.6)]"
            >
              <span className="text-gradient mr-2 font-mono text-[10px] uppercase tracking-wider opacity-70 group-hover:opacity-100">
                Ask
              </span>
              {s}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
