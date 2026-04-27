import { useEffect, useRef, useState } from 'react';
import { getFeed } from '../api';
import VideoCard from './VideoCard';
import CategoryMenu from './CategoryMenu';

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeed(30, selectedCategory);
        setVideos(data);
        setActiveIndex(0);
        // Scroll back to top when category changes
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [selectedCategory]);

  useEffect(() => {
    if (videos.length === 0) return;

    const cards = containerRef.current?.querySelectorAll('[data-video-index]');
    if (!cards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const index = parseInt(entry.target.getAttribute('data-video-index'));
            setActiveIndex(index);
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [videos]);

  return (
    <>
      <CategoryMenu
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {loading && (
        <div className="h-screen flex items-center justify-center text-white bg-black">
          Loading...
        </div>
      )}

      {error && !loading && (
        <div className="h-screen flex items-center justify-center text-red-400 bg-black">
          Error: {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="h-screen flex items-center justify-center text-white bg-black">
          No videos in this category yet
        </div>
      )}

      {!loading && !error && videos.length > 0 && (
        <div
          ref={containerRef}
          className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
        >
          {videos.map((video, index) => (
            <div key={video.id} data-video-index={index}>
              <VideoCard video={video} isActive={index === activeIndex} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}