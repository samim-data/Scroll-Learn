import { useState, useRef, useEffect } from 'react';
import { searchVideos } from '../api';

export default function SearchBar({ onSelectVideo }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchVideos(val);
        setResults(data.videos || []);
        setSource(data.source);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (video) => {
    onSelectVideo(video);
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* Search icon button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-30 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition"
        aria-label="Search"
      >
        <span className="text-white text-base">🔍</span>
      </button>

      {/* Search overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-zinc-800">
            <span className="text-white text-lg">🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="Search topics, concepts, channels..."
              className="flex-1 bg-transparent text-white placeholder-zinc-500 text-base outline-none"
            />
            <button onClick={() => { setOpen(false); setQuery(''); setResults([]); }}
              className="text-zinc-400 hover:text-white text-2xl leading-none px-1">
              ×
            </button>
          </div>

          {/* Source badge */}
          {source && results.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                source === 'semantic'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-zinc-700 text-zinc-400'
              }`}>
                {source === 'semantic' ? '✦ AI semantic search' : 'Text search'}
              </span>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex justify-center pt-12">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && results.length === 0 && query.trim() && (
              <p className="text-zinc-500 text-sm text-center pt-12">No results for "{query}"</p>
            )}

            {!loading && results.map((video) => (
              <button
                key={video.id}
                onClick={() => handleSelect(video)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left border-b border-zinc-900"
              >
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
                    {video.title}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">{video.channel?.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
