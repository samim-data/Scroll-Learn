import { useEffect, useState } from "react";
import { getStats, type StatsResponse } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsPanel() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStats().then((s) => {
      if (cancelled) return;
      if (!s) setUnavailable(true);
      else setStats(s);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (unavailable || !stats) {
    return <p className="text-sm text-muted-foreground">Stats coming soon — keep learning!</p>;
  }

  const max = Math.max(1, ...stats.byCategory.map((c) => c.minutes));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Minutes" value={stats.totalMinutes} />
        <Stat label="Streak" value={`${stats.streak}🔥`} />
        <Stat label="Done" value={stats.videosCompleted} />
      </div>

      {stats.byCategory.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">By category</p>
          <div className="space-y-2">
            {stats.byCategory.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize">{c.category}</span>
                  <span className="text-muted-foreground">{c.minutes}m</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all"
                    style={{ width: `${(c.minutes / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-secondary rounded-xl p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
