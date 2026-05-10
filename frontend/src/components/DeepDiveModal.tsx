import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lightbulb, Target, Sparkles, BookOpen, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { getDeepDive, type Slide } from "@/lib/api";

type Props = {
  videoId: string | null;
  videoTitle?: string;
  onClose: () => void;
};

const ACCENTS = [
  { from: "from-violet-500", to: "to-fuchsia-500", ring: "ring-violet-400/40", Icon: Sparkles, label: "Intro" },
  { from: "from-sky-500", to: "to-cyan-400", ring: "ring-sky-400/40", Icon: Lightbulb, label: "Insight" },
  { from: "from-emerald-500", to: "to-teal-400", ring: "ring-emerald-400/40", Icon: Target, label: "Concept" },
  { from: "from-amber-500", to: "to-orange-500", ring: "ring-amber-400/40", Icon: Zap, label: "Example" },
  { from: "from-rose-500", to: "to-pink-500", ring: "ring-rose-400/40", Icon: BookOpen, label: "Recap" },
];

export function DeepDiveModal({ videoId, videoTitle, onClose }: Props) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;
    setSlides(null); setText(null); setIdx(0); setErr(null); setLoading(true);
    getDeepDive(videoId)
      .then((res) => {
        if ("slides" in res && Array.isArray(res.slides)) setSlides(res.slides);
        else if ("deepDive" in res) setText(res.deepDive);
        else setErr("Unexpected response");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [videoId]);

  // Normalize various slide shapes returned by the backend into { title, content, key_concept }
  function normalize(s: any, i: number): { title: string; content: string; key_concept?: string } {
    const type = s?.type as string | undefined;
    const emoji = s?.emoji ? `${s.emoji} ` : "";
    if (type === "concept") {
      return { title: `${emoji}${s.term ?? "Key Concept"}`, content: s.definition ?? "", key_concept: "Concept" };
    }
    if (type === "quiz") {
      const opts = Array.isArray(s.options) ? s.options : [];
      const ai = typeof s.answer_index === "number" ? s.answer_index : -1;
      const list = opts
        .map((o: string, idx: number) => `${idx === ai ? "✅" : "•"} ${o}`)
        .join("\n");
      const explain = s.explanation ? `\n\nWhy: ${s.explanation}` : "";
      return { title: `${emoji}${s.question ?? "Quick Quiz"}`, content: `${list}${explain}`, key_concept: "Quiz" };
    }
    if (type === "takeaway") {
      return { title: `${emoji}Takeaway`, content: s.sentence ?? "", key_concept: "Takeaway" };
    }
    // summary or generic
    const title = s?.title ?? `Key Point ${i + 1}`;
    const content = s?.content ?? s?.body ?? s?.sentence ?? s?.definition ?? "";
    return { title: `${emoji}${title}`, content, key_concept: s?.key_concept ?? (type === "summary" ? "Summary" : undefined) };
  }

  const builtSlides = (slides ?? (text
    ? text.split(/\n{2,}/).filter(Boolean).slice(0, 6).map((para, i) => ({
        title: i === 0 ? "The Big Idea" : `Key Point ${i}`,
        content: para.trim(),
      }))
    : null))?.map(normalize) ?? null;

  const open = videoId !== null;
  const total = builtSlides?.length ?? 0;
  const accent = ACCENTS[idx % ACCENTS.length];
  const Icon = accent.Icon;

  function next() { if (builtSlides && idx < builtSlides.length - 1) setIdx(idx + 1); }
  function prev() { if (idx > 0) setIdx(idx - 1); }

  return (
    <BottomSheet open={open} onClose={onClose} heightPct={68} variant="dialog">
      <div className="h-full flex flex-col px-5 pb-5">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <Brain size={18} color="white" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Go Deeper</p>
            {videoTitle && (
              <h2 className="text-[13px] font-semibold leading-tight text-foreground/90 truncate">{videoTitle}</h2>
            )}
          </div>
        </div>

        {/* Top progress bars */}
        {builtSlides && builtSlides.length > 0 && (
          <div className="shrink-0 flex items-center gap-1 mb-4">
            {builtSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"
                aria-label={`Slide ${i + 1}`}
              >
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300"
                  style={{ width: i < idx ? "100%" : i === idx ? "100%" : "0%" }}
                />
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-full gradient-primary glow-primary flex items-center justify-center animate-pulse">
              <Brain size={22} color="white" />
            </div>
            <p className="text-sm animate-pulse">Crafting deeper insights…</p>
          </div>
        )}

        {err && !loading && (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center px-6">{err}</div>
        )}

        {!loading && !err && builtSlides && builtSlides.length > 0 && (
          <>
            {/* Slide */}
            <div className="flex-1 overflow-hidden -mx-1 px-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 32, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -32, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative h-full rounded-lg overflow-hidden ring-1 ${accent.ring} bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10`}
                >
                  {/* Glow blob */}
                  <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${accent.from} ${accent.to} opacity-30 blur-3xl`} />
                  <div className={`absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-br ${accent.from} ${accent.to} opacity-15 blur-3xl`} />

                  <div className="relative h-full flex flex-col p-6">
                    {/* Top row: icon chip + counter */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r ${accent.from} ${accent.to} shadow-lg`}>
                        <Icon size={13} color="white" strokeWidth={2.5} />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          {builtSlides[idx].key_concept || accent.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                        {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[26px] sm:text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground mb-4">
                      {builtSlides[idx].title}
                    </h3>

                    {/* Divider accent */}
                    <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${accent.from} ${accent.to} mb-4`} />

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                      <p className="text-[15px] sm:text-base text-foreground/80 leading-[1.65] whitespace-pre-line">
                        {builtSlides[idx].content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav controls */}
            <div className="flex items-center gap-3 mt-4 shrink-0">
              <button
                onClick={prev}
                disabled={idx === 0}
                className="w-12 h-12 rounded-full bg-secondary border border-white/10 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={idx === total - 1 ? onClose : next}
                className="flex-1 h-12 rounded-full gradient-primary text-sm font-bold glow-primary active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {idx === total - 1 ? "Got it" : "Next"}
                {idx !== total - 1 && <ChevronRight size={18} />}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
