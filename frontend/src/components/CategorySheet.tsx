import { BottomSheet } from "./BottomSheet";

const CATEGORIES: { label: string; emoji: string }[] = [
  { label: "All", emoji: "✨" },
  { label: "Science", emoji: "🔬" },
  { label: "Tech", emoji: "💻" },
  { label: "Business", emoji: "💼" },
  { label: "Math", emoji: "➗" },
  { label: "History", emoji: "🏛️" },
  { label: "Mind", emoji: "🧠" },
  { label: "Health", emoji: "💪" },
  { label: "Language", emoji: "🗣️" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  active: string;
  onSelect: (c: string) => void;
};

export function CategorySheet({ open, onClose, active, onSelect }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Pick a topic" heightPct={70}>
      <div className="px-5 pb-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORIES.map((c) => {
          const isActive = c.label === active;
          return (
            <button
              key={c.label}
              onClick={() => {
                onSelect(c.label);
                onClose();
              }}
              className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all ${
                isActive
                  ? "gradient-primary glow-primary text-primary-foreground"
                  : "bg-secondary hover:bg-white/10"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-semibold text-sm">{c.label}</span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
