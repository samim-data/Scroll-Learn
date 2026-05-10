import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useSaved } from "@/lib/saved";
import { Skeleton } from "@/components/ui/skeleton";

type Saved = {
  video_id: string;
  title?: string;
  thumbnail_url?: string;
  channel_name?: string;
  category?: string;
};

export function SavedList() {
  const { saved, toggle } = useSaved();
  const [items, setItems] = useState<Saved[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setItems([]); return; }
      const { data } = await supabase
        .from("saved_videos")
        .select("video_id, title, thumbnail_url, channel_name, category")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((r: Saved) => r));
    })();
  }, [saved.size]);

  if (items === null) return <Skeleton className="h-20 w-full rounded-xl" />;

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No saved videos yet. Tap the heart on any video to save it.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.video_id} className="flex gap-3 items-center bg-secondary rounded-xl p-2">
          <Link
            to="/feed"
            className="flex gap-3 items-center flex-1 min-w-0"
          >
            <div className="w-20 h-12 bg-background rounded-md overflow-hidden flex-shrink-0">
              {it.thumbnail_url ? (
                <img src={it.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">▶</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold line-clamp-2">{it.title ?? it.video_id}</p>
              <p className="text-[10px] text-muted-foreground truncate">{it.channel_name ?? ""}</p>
            </div>
          </Link>
          <button
            onClick={() => toggle({
              id: it.video_id,
              youtube_video_id: it.video_id,
              title: it.title ?? "",
              thumbnail_url: it.thumbnail_url,
              channel: it.channel_name ? { name: it.channel_name, category: it.category ?? "" } : undefined,
            })}
            className="w-8 h-8 flex items-center justify-center text-accent text-lg"
            aria-label="Remove"
          >
            ♥
          </button>
        </div>
      ))}
    </div>
  );
}
