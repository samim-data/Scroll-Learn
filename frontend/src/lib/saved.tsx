import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import type { Video } from "./api";

type SavedCtx = {
  saved: Set<string>;
  toggle: (video: Video) => Promise<void>;
  isSaved: (videoId: string) => boolean;
};

const Ctx = createContext<SavedCtx>({
  saved: new Set(),
  toggle: async () => {},
  isSaved: () => false,
});

export function SavedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setSaved(new Set());
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("saved_videos")
        .select("video_id")
        .eq("user_id", user.id);
      if (!error && data) {
        setSaved(new Set(data.map((r: { video_id: string }) => r.video_id)));
      }
    })();
  }, [user]);

  const toggle = useCallback(
    async (video: Video) => {
      if (!user) return;
      const videoId = video.youtube_video_id;
      const isCurrentlySaved = saved.has(videoId);
      // Optimistic
      setSaved((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.delete(videoId);
        else next.add(videoId);
        return next;
      });
      try {
        if (isCurrentlySaved) {
          await supabase
            .from("saved_videos")
            .delete()
            .eq("user_id", user.id)
            .eq("video_id", videoId);
        } else {
          await supabase.from("saved_videos").insert({
            user_id: user.id,
            video_id: videoId,
            title: video.title ?? null,
            thumbnail_url: video.thumbnail_url ?? null,
            channel_name: video.channel?.name ?? null,
            category: video.channel?.category ?? null,
          });
        }
      } catch {
        setSaved((prev) => {
          const next = new Set(prev);
          if (isCurrentlySaved) next.add(videoId);
          else next.delete(videoId);
          return next;
        });
      }
    },
    [user, saved]
  );

  const isSaved = useCallback((videoId: string) => saved.has(videoId), [saved]);

  return <Ctx.Provider value={{ saved, toggle, isSaved }}>{children}</Ctx.Provider>;
}

export const useSaved = () => useContext(Ctx);

