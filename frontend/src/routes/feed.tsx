import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFeed, trackWatch, type Video } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSaved } from "@/lib/saved";
import { Avatar } from "@/components/Avatar";
import { VideoCard } from "@/components/VideoCard";
import { DeepDiveModal } from "@/components/DeepDiveModal";
import { CategorySheet } from "@/components/CategorySheet";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/feed")({
  ssr: false,
  component: Feed,
});

const PAGE = 10;

function Feed() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [deepDiveVideo, setDeepDiveVideo] = useState<Video | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const watchTrackedRef = useRef<Set<string>>(new Set());
  const watchTimerRef = useRef<number | null>(null);
  const { isSaved, toggle: toggleSaved } = useSaved();

  const avatarId = (user?.user_metadata?.avatar_id as string) ?? "owl";

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  const loadMore = useCallback(async (reset = false) => {
    if (loading) return;
    if (!reset && !hasMore) return;
    setLoading(true);
    setErr(null);
    try {
      const off = reset ? 0 : offset;
      const data = await getFeed({
        limit: PAGE,
        offset: off,
        category: category === "All" ? undefined : category.toLowerCase(),
      });
      setVideos((prev) => (reset ? data.videos : [...prev, ...data.videos]));
      setOffset(off + data.videos.length);
      setHasMore(data.hasMore);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load feed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, category]);

  useEffect(() => {
    setVideos([]);
    setOffset(0);
    setHasMore(true);
    setActiveIdx(0);
    scrollerRef.current?.scrollTo({ top: 0 });
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        });
        if (videos.length > 0 && activeIdx >= videos.length - 5) {
          loadMore();
        }
      },
      { root, threshold: [0, 0.6, 1] }
    );
    itemsRef.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [videos.length, activeIdx, loadMore]);

  useEffect(() => {
    if (!muted) return;
    const onTap = () => setMuted(false);
    window.addEventListener("touchend", onTap, { once: true, passive: true });
    window.addEventListener("click", onTap, { once: true });
    return () => {
      window.removeEventListener("touchend", onTap);
      window.removeEventListener("click", onTap);
    };
  }, [muted]);

  useEffect(() => {
    if (watchTimerRef.current) {
      window.clearTimeout(watchTimerRef.current);
      watchTimerRef.current = null;
    }
    const v = videos[activeIdx];
    if (!v || !user) return;
    const key = v.id;
    if (watchTrackedRef.current.has(key)) return;
    watchTimerRef.current = window.setTimeout(() => {
      watchTrackedRef.current.add(key);
      trackWatch({
        user_id: user.id,
        video_id: v.id,
        watched_seconds: 10,
        completed: false,
      });
    }, 10000);
    return () => {
      if (watchTimerRef.current) window.clearTimeout(watchTimerRef.current);
    };
  }, [activeIdx, videos, user]);

  const showEmpty = useMemo(() => !loading && videos.length === 0, [loading, videos.length]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-40 fade-top px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <span className="h-9 px-3.5 inline-flex items-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 font-semibold tracking-tight text-sm">
            Learn<span className="text-primary ml-1">Rot</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategoryOpen(true)}
              aria-label="Categories"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-95 transition"
              title={category}
            >
              <SlidersHorizontal size={16} />
            </button>
            <Link to="/profile" aria-label="Profile">
              <Avatar id={avatarId} size={36} ring />
            </Link>
          </div>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {videos.map((v, i) => (
          <div
            key={`${v.id}-${i}`}
            data-idx={i}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="snap-start"
          >
            <VideoCard
              video={v}
              active={i === activeIdx}
              muted={muted}
              onUnmute={() => setMuted(false)}
              onMute={() => setMuted(true)}
              saved={isSaved(v.youtube_video_id)}
              onSavedToggle={() => toggleSaved(v)}
              onDeepDive={() => setDeepDiveVideo(v)}
            />
          </div>
        ))}

        {loading && (
          <div className="h-[100dvh] flex items-center justify-center snap-start">
            <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
          </div>
        )}

        {showEmpty && !err && (
          <div className="h-[100dvh] flex flex-col items-center justify-center text-center px-8">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-muted-foreground">No videos for this category yet.</p>
          </div>
        )}

        {err && (
          <div className="h-[100dvh] flex flex-col items-center justify-center text-center px-8">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-sm text-muted-foreground mb-4">{err}</p>
            <button
              onClick={() => loadMore(true)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {!hasMore && videos.length > 0 && (
          <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
            You're all caught up ✨
          </div>
        )}
      </div>

      <DeepDiveModal
        videoId={deepDiveVideo?.youtube_video_id ?? null}
        videoTitle={deepDiveVideo?.title}
        onClose={() => setDeepDiveVideo(null)}
      />

      <CategorySheet
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        active={category}
        onSelect={setCategory}
      />
    </div>
  );
}
