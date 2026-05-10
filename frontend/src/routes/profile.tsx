import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/lib/supabase";
import { EditProfileModal } from "@/components/EditProfileModal";
import { StatsPanel } from "@/components/StatsPanel";
import { SavedList } from "@/components/SavedList";

export const Route = createFileRoute("/profile")({
  ssr: false,
  component: Profile,
});

function Profile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [overrideName, setOverrideName] = useState<string | null>(null);
  const [overrideAvatar, setOverrideAvatar] = useState<string | null>(null);

  const avatarId = overrideAvatar ?? (user?.user_metadata?.avatar_id as string) ?? "owl";
  const displayName = overrideName ?? (user?.user_metadata?.display_name as string) ?? user?.email ?? "Learner";

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  async function onLogout() {
    await supabase.auth.signOut();
    nav({ to: "/login" });
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between">
          <Link to="/feed" className="text-muted-foreground text-sm">← Back</Link>
          <button onClick={() => setEditing(true)} className="text-primary text-sm font-semibold">Edit</button>
        </div>

        <div className="flex flex-col items-center mt-6">
          <button onClick={() => setEditing(true)} aria-label="Edit avatar">
            <Avatar id={avatarId} size={104} ring />
          </button>
          <h1 className="text-xl font-bold mt-4">{displayName}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        <Section title="Saved videos">
          <SavedList />
        </Section>

        <Section title="Your learning">
          <StatsPanel />
        </Section>

        <Section title="Settings">
          <Row label="Language" value="English" />
          <Row label="Notifications" value="Off" />
          <Row label="About" value="v1.0" />
        </Section>

        <button
          onClick={onLogout}
          className="w-full mt-8 rounded-full border border-accent/40 text-accent font-semibold py-3 transition-colors hover:bg-accent/10"
        >
          Log out
        </button>
      </div>

      <EditProfileModal
        open={editing}
        initialName={displayName === user?.email ? "" : displayName}
        initialAvatarId={avatarId}
        onClose={() => setEditing(false)}
        onSaved={(n, a) => { setOverrideName(n); setOverrideAvatar(a); }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      <div className="bg-card rounded-2xl p-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}
