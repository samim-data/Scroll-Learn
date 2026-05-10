import { avatarById } from "@/lib/avatars";

type Props = {
  id?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
};

export function Avatar({ id, size = 40, ring, className = "" }: Props) {
  const a = avatarById(id);
  return (
    <div
      className={`flex items-center justify-center rounded-full overflow-hidden ${ring ? "ring-2 ring-primary glow-primary" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        background: a.bg,
        fontSize: size * 0.55,
        lineHeight: 1,
      }}
      aria-label={a.label}
    >
      <span style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>{a.emoji}</span>
    </div>
  );
}
