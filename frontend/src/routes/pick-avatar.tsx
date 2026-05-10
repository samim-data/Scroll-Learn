import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AVATARS, type AvatarId } from "@/lib/avatars";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pick-avatar")({
  ssr: false,
  component: PickAvatar,
});

function PickAvatar() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [picked, setPicked] = useState<AvatarId>("owl");
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    if (!user) return nav({ to: "/login" });
    setSaving(true);
    // Best-effort write; profiles table assumed present.
    await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_id: picked, display_name: user.user_metadata?.display_name ?? null })
      .then(() => null, () => null);
    await supabase.auth.updateUser({ data: { avatar_id: picked } });
    setSaving(false);
    nav({ to: "/feed" });
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        <h1 className="text-2xl font-bold">Pick your avatar</h1>
        <p className="text-muted-foreground mt-1">You can change this later.</p>

        <div className="grid grid-cols-4 gap-3 mt-8">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              onClick={() => setPicked(a.id)}
              className={`aspect-square rounded-2xl flex items-center justify-center transition ${
                picked === a.id ? "ring-2 ring-primary glow-primary" : "ring-1 ring-border"
              }`}
              style={{ background: a.bg }}
            >
              <span style={{ fontSize: 36 }}>{a.emoji}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8 flex flex-col items-center gap-4">
          <Avatar id={picked} size={88} ring />
          <button
            onClick={onContinue}
            disabled={saving}
            className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3 glow-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
