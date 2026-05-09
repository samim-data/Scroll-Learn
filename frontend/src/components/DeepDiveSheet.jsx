import { useEffect, useRef, useState } from 'react';
import { getDeepDive } from '../api';
import SummarySlide from './slides/SummarySlide';
import ConceptSlide from './slides/ConceptSlide';
import QuizSlide from './slides/QuizSlide';
import TakeawaySlide from './slides/TakeawaySlide';

function SlideRenderer({ slide }) {
  if (slide.type === 'summary')  return <SummarySlide slide={slide} />;
  if (slide.type === 'concept')  return <ConceptSlide slide={slide} />;
  if (slide.type === 'quiz')     return <QuizSlide slide={slide} />;
  if (slide.type === 'takeaway') return <TakeawaySlide slide={slide} />;
  return null;
}

export default function DeepDiveSheet({ video, isOpen, onClose }) {
  const [slides, setSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !video) return;
    setSlides([]);
    setActiveSlide(0);
    setError(null);
    setLoading(true);

    getDeepDive(video.youtube_video_id)
      .then(data => setSlides(data.slides || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, video]);

  // track active dot as user scrolls horizontally
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const index = Math.round(
      scrollRef.current.scrollLeft / scrollRef.current.offsetWidth
    );
    setActiveSlide(index);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
        style={{
          height: '75vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease',
          background: '#0a0a0a',
        }}
      >
        {/* Drag handle + close */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 absolute top-0 left-0 right-0 z-10">
          <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div className="flex-1" />
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm">Building your slides...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="h-full flex items-center justify-center px-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Slides */}
        {!loading && !error && slides.length > 0 && (
          <div className="h-full flex flex-col pt-8">
            {/* Horizontal slide strip */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 flex overflow-x-scroll snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {slides.map((slide, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-full h-full snap-start"
                >
                  <SlideRenderer slide={slide} />
                </div>
              ))}
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 py-4">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:  i === activeSlide ? 20 : 8,
                    height: 8,
                    background: i === activeSlide ? '#3B82F6' : '#3f3f46',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
