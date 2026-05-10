type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function CategoryChip({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground glow-primary"
          : "bg-white/5 text-white border border-white/20 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}
