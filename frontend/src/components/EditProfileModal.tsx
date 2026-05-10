import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AVATARS } from "@/lib/avatars";
import { Avatar } from "./Avatar";

type Props = {
  open: boolean;
  initialName: string;
  initialAvatarId: string;
  onClose: () => void;
  onSaved: (name: string, avatarId: string) => void;
};

export function EditProfileModal({ open, initialName, initialAvatarId, onClose, onSaved }: Props) {
  const [name, setName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { display_name: name, avatar_id: avatarId },
      });
      if (metaErr) throw metaErr;
      await supabase
        .from("profiles")
        .upsert({ id: u.user.id, display_name: name, avatar_id: avatarId });
      onSaved(name, avatarId);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-background overflow-y-auto p-6 sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Edit profile</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg" aria-label="Close">×</button>
            </div>

            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              maxLength={32}
            />

            <p className="block text-xs uppercase tracking-wider text-muted-foreground mt-5 mb-3">Avatar</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAvatarId(a.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition ${avatarId === a.id ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-secondary"}`}
                >
                  <Avatar id={a.id} size={48} />
                  <span className="text-[10px] text-muted-foreground">{a.label}</span>
                </button>
              ))}
            </div>

            {err && <p className="text-xs text-accent mt-4">{err}</p>}

            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="w-full mt-6 rounded-full gradient-primary py-3 text-sm font-semibold glow-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
