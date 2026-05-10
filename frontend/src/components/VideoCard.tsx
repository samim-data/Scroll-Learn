import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import { Heart, Brain, Share2, Volume2, VolumeX } from "lucide-react";
import type { Video } from "@/lib/api";

type Props = {
  video: Video;
  active: boolean;
  muted: boolean;
  onUnmute: () => void;
  onMute?: () => void;
  onSavedToggle?: () => void;
  saved?: boolean;
  onDeepDive?: () => void;
};

export function VideoCard({ video, active, muted, onUnmute, onMute, saved, onSavedToggle, onDeepDive }: Props) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    try {
      if (active) {
        if (muted) p.mute(); else p.unMute();
        p.playVideo();
      } else {
        p.mute();
        p.pauseVideo();
      }
    } catch { /* ignore */ }
  }, [muted, active, ready]);

  useEffect(() => {
    if (!ready || !active) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const d = p.getDuration?.() ?? 0;
        const c = p.getCurrentTime?.() ?? 0;
        if (d > 0) {
          setDuration(d);
          setCurrent(c);
          setProgress(Math.min(1, c / d));
        }
      } catch { /* ignore */ }
    }, 250);
    return () => window.clearInterval(id);
  }, [ready, active]);

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (muted) {
        onUnmute();
        p.unMute();
        p.playVideo();
        return;
      }
      if (playing) p.pauseVideo();
      else p.playVideo();
    } catch { /* ignore */ }
  }

  function fmt(s: number) {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="relative w-full h-[100dvh] snap-start snap-always bg-background flex items-center justify-center overflow-hidden">
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
        style={{
          height: "80dvh",
          width: "min(100%, calc(80dvh * 9 / 16))",
          maxWidth: "100%",
        }}
      >
        <div className="absolute inset-0">
          <div className="w-full h-full">
            <YouTube
              videoId={video.youtube_video_id}
              className="w-full h-full"
              iframeClassName="w-full h-full block"
              opts={{
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  modestbranding: 1,
                  rel: 0,
                  playsinline: 1,
                  mute: 1,
                  disablekb: 1,
                  fs: 0,
                  iv_load_policy: 3,
                  showinfo: 0,
                },
              }}
              onReady={(e: YouTubeEvent) => {
                playerRef.current = e.target;
                try {
                  e.target.mute();
                  if (active) {
                    if (!muted) e.target.unMute();
                    e.target.playVideo();
                  } else {
                    e.target.pauseVideo();
                  }
                } catch { /* ignore */ }
                setReady(true);
              }}
              onStateChange={(e: YouTubeEvent<number>) => {
                setPlaying(e.data === 1);
              }}
            />
          </div>
        </div>

        <button
          onClick={togglePlay}
          aria-label="Toggle playback"
          className="absolute inset-0 z-10"
        />

        <div className="absolute right-2 sm:right-3 bottom-24 z-30 flex flex-col items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); onSavedToggle?.(); }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label={saved ? "Unsave" : "Save"}
          >
            <span className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Heart
                size={24}
                fill={saved ? "var(--accent)" : "transparent"}
                color={saved ? "var(--accent)" : "white"}
                strokeWidth={2}
              />
            </span>
            <span className="text-[10px] font-semibold drop-shadow">{saved ? "Saved" : "Save"}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDeepDive?.(); }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Go Deeper"
          >
            <span className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center glow-primary">
              <Brain size={22} color="white" strokeWidth={2.2} />
            </span>
            <span className="text-[10px] font-semibold drop-shadow">Deeper</span>
          </button>

          <button
            onClick={async (e) => {
              e.stopPropagation();
              const url = `https://youtu.be/${video.youtube_video_id}`;
              try {
                if (navigator.share) {
                  await navigator.share({ title: video.title, url });
                  return;
                }
              } catch (err) {
                if ((err as DOMException)?.name === "AbortError") return;
              }
              try {
                await navigator.clipboard?.writeText(url);
                alert("Link copied to clipboard");
              } catch {
                window.prompt("Copy link", url);
              }
            }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label="Share"
          >
            <span className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Share2 size={20} color="white" strokeWidth={2} />
            </span>
            <span className="text-[10px] font-semibold drop-shadow">Share</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const p = playerRef.current;
              const next = !muted;
              if (next) onMute?.();
              else onUnmute();
              if (!p) return;
              try {
                if (next) p.mute();
                else { p.unMute(); p.playVideo(); }
              } catch { /* ignore */ }
            }}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <span className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              {muted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </span>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 fade-bottom pt-16 pb-8 px-4 pointer-events-none">
          <div className="pr-16">
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">
              {video.channel?.category ?? ""}
            </p>
            <h3 className="text-sm font-bold leading-tight line-clamp-2 mt-1">{video.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{video.channel?.name}</p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/80 tabular-nums w-9 text-right">{fmt(current)}</span>
            <div className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/60 tabular-nums w-9">{fmt(duration)}</span>
          </div>
        </div>

        {muted && active && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-xs flex items-center gap-2">
              <VolumeX size={14} /> Tap to unmute
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
