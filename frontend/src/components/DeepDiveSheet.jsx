import { useEffect, useState } from 'react';
import { getDeepDive } from '../api';

export default function DeepDiveSheet({ video, isOpen, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !video) return;

    async function load() {
      setLoading(true);
      setError(null);
      setContent('');
      try {
        const data = await getDeepDive(video.youtube_video_id);
        setContent(data.deepDive);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen, video]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-zinc-900 text-white rounded-t-3xl max-h-[80vh] overflow-y-auto transition-transform"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: '300ms',
        }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 bg-zinc-900 pt-3 pb-2 z-10">
          <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto" />
        </div>

        <div className="px-6 pb-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold">Go Deeper</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {video && (
            <div className="text-sm text-zinc-400 mb-4 line-clamp-2">
              {video.title}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-3" />
              <div className="text-zinc-400 text-sm">Thinking...</div>
            </div>
          )}

          {error && (
            <div className="text-red-400 py-4">
              Error: {error}
            </div>
          )}

          {!loading && !error && content && (
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>
      </div>
    </>
  );
}