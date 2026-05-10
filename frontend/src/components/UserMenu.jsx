import { useState, useRef, useEffect } from 'react';

export default function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const handle = user?.email?.split('@')[0] ?? '';

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="fixed top-4 left-4 z-30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition"
      >
        <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-xs">
          {initial}
        </div>
        <span className="text-white text-xs font-medium max-w-[100px] truncate">{handle}</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-44 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-white text-xs font-medium truncate">{user?.email}</p>
          </div>
          <button
            onClick={onSignOut}
            className="w-full px-4 py-3 text-left text-red-400 text-sm hover:bg-zinc-800 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
