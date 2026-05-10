import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    nav({ to: "/feed" });
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <div className="mb-10">
          <div className="text-3xl font-extrabold tracking-tight">
            Learn <span className="text-primary">Rot</span>
          </div>
          <p className="text-muted-foreground mt-2">Brain rot, but for learning.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-sm text-accent">{err}</p>}
          <button
            disabled={loading}
            className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3 mt-3 glow-primary disabled:opacity-50 transition"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <button className="text-muted-foreground text-sm mt-4 self-center">
          Forgot password?
        </button>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange,
}: { label: string; type: string; value: string; onChange: (v: string) => void }) {
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
