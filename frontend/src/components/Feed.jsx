import { useEffect, useRef, useState, useCallback } from 'react';
import { getFeed } from '../api';
import VideoCard from './VideoCard';
import CategoryMenu from './CategoryMenu';
import PersistentPlayer from './PersistentPlayer';

const INITIAL_LOAD = 10;
const PAGE_SIZE = 10;
const BUFFER_AHEAD = 5;

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const lastLoadedVideoIdRef = useRef(null);

  // Load initial videos when category changes
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      setError(null);
      setVideos([]);
      setActiveIndex(0);
      setHasMore(true);
      lastLoadedVideoIdRef.current = null;

      try {
        const data = await getFeed(INITIAL_LOAD, 0, selectedCategory);
        setVideos(data.videos);
        setHasMore(data.hasMore);

        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [selectedCategory]);

  // Load more videos
  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return;
    isLoadingMoreRef.current = true;

    try {
      const data = await getFeed(PAGE_SIZE, videos.length, selectedCategory);
      setVideos((prev) => [...prev, ...data.videos]);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [videos.length, hasMore, selectedCategory]);

  // Proactive pagination during browser idle
  useEffect(() => {
    if (!hasMore || isLoadingMoreRef.current) return;
    if (videos.length === 0) return;

    const remainingAhead = videos.length - 1 - activeIndex;
    if (remainingAhead < BUFFER_AHEAD) {
      const idleHandle =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(() => loadMore(), { timeout: 1000 })
          : setTimeout(() => loadMore(), 0);

      return () => {
        if (typeof window.cancelIdleCallback === 'function' && idleHandle) {
          window.cancelIdleCallback(idleHandle);
        } else {
          clearTimeout(idleHandle);
        }
      };
    }
  }, [activeIndex, videos.length, hasMore, loadMore]);

  // IntersectionObserver: tracks active index
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
  }, [videos.length]);

  // Tell the persistent player to load the active video
  useEffect(() => {
    if (videos.length === 0) return;
    const activeVideo = videos[activeIndex];
    if (!activeVideo) return;

    // Skip if this video is already loaded
    if (lastLoadedVideoIdRef.current === activeVideo.youtube_video_id) return;

    if (playerRef.current) {
      playerRef.current.loadVideo(activeVideo.youtube_video_id);
      lastLoadedVideoIdRef.current = activeVideo.youtube_video_id;
    }
  }, [activeIndex, videos]);

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
        <>
          <div
            ref={containerRef}
            onClick={() => setUserInteracted(true)}
            className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
          >
            {videos.map((video, index) => (
              <div key={video.id} data-video-index={index}>
                <VideoCard
                  video={video}
                  isActive={index === activeIndex}
                />
              </div>
            ))}
          </div>

          {/* The persistent player floats on top of all cards */}
          <PersistentPlayer
            ref={playerRef}
            initialVideoId={videos[0]?.youtube_video_id}
            isVisible={true}
            userInteracted={userInteracted}
          />
        </>
      )}
    </>
  );
}