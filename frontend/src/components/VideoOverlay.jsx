function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoOverlay({ video, isBookmarked, onToggleBookmark, onDeepDive }) {
  if (!video) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80vh] w-full max-w-[min(100vw,calc(80vh*9/16))] z-30 pointer-events-none rounded-2xl overflow-hidden">
      {/* Bottom gradient with title + channel */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pt-16 pb-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1 pr-14">
          {video.title}
        </p>
        <p className="text-white/60 text-xs">
          {video.channel?.name}
          {video.duration_seconds ? ` · ${formatDuration(video.duration_seconds)}` : ''}
        </p>
      </div>

      {/* Right-side action buttons */}
      <div className="absolute right-3 bottom-14 flex flex-col gap-5 items-center pointer-events-auto">
        <button onClick={onToggleBookmark} className="flex flex-col items-center gap-1 group">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isBookmarked
              ? 'bg-red-500 scale-110'
              : 'bg-white/20 backdrop-blur group-hover:bg-white/30'
          }`}>
            <span className="text-xl leading-none">{isBookmarked ? '♥' : '♡'}</span>
          </div>
          <span className="text-white/70 text-xs">Save</span>
        </button>

        <button onClick={onDeepDive} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 transition-all">
            <span className="text-lg leading-none">🧠</span>
          </div>
          <span className="text-white/70 text-xs">Deeper</span>
        </button>
      </div>
    </div>
  );
}
