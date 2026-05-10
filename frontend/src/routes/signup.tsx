import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  ssr: false,
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) return setErr(error.message);
    if (!data.session) return setErr("Check your email to confirm your account.");
    nav({ to: "/pick-avatar" });
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <div className="mb-10">
          <div className="text-3xl font-extrabold tracking-tight">Welcome to Learn <span className="text-primary">Rot</span></div>
          <p className="text-muted-foreground mt-2">Brain rot, but for learning.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Display name" value={name} onChange={setName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password (min 8)" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-sm text-accent">{err}</p>}
          <button
            disabled={loading}
            className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3 mt-3 glow-primary disabled:opacity-50 transition"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type = "text", value, onChange,
}: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full bg-card border border-border rounded-2xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring transition"
      />
    </label>
  );
}
