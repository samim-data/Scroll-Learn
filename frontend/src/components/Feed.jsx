import { useEffect, useRef, useState, useCallback } from 'react';
import { getFeed } from '../api';
import VideoCard from './VideoCard';
import CategoryMenu from './CategoryMenu';
import PersistentPlayer from './PersistentPlayer';
import DeepDiveSheet from './DeepDiveSheet';
import VideoOverlay from './VideoOverlay';
import SessionSummary from './SessionSummary';
import { useSession } from '../hooks/useSession';
import { useBookmarks } from '../hooks/useBookmarks';
import UserMenu from './UserMenu';

const INITIAL_LOAD = 10;
const PAGE_SIZE = 10;
const BUFFER_AHEAD = 5;

export default function Feed({ user, onSignOut }) {
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
  const observerRef = useRef(null);
  const observedCardsRef = useRef(new Set());
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const { session, recordWatch, autoShow, dismissAuto } = useSession();
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks();
  const lastRecordedIndexRef = useRef(-1);

  // Load initial videos when category changes
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      setError(null);
      setVideos([]);
      setActiveIndex(0);
      setHasMore(true);
      lastLoadedVideoIdRef.current = null;
      observedCardsRef.current = new Set();

      // Pause the player while the new category loads
      if (playerRef.current) {
        playerRef.current.pause();
      }

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

  // Create the IntersectionObserver once
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
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
    return () => {
      observerRef.current?.disconnect();
      observedCardsRef.current = new Set();
    };
  }, []);

  // Observe only newly added cards when videos are appended
  useEffect(() => {
    if (videos.length === 0 || !observerRef.current) return;
    const cards = containerRef.current?.querySelectorAll('[data-video-index]');
    if (!cards) return;
    cards.forEach((card) => {
      const key = card.getAttribute('data-video-index');
      if (!observedCardsRef.current.has(key)) {
        observerRef.current.observe(card);
        observedCardsRef.current.add(key);
      }
    });
  }, [videos.length]);

  // Tell the persistent player to load the active video + record session watch
  useEffect(() => {
    if (videos.length === 0) return;
    const activeVideo = videos[activeIndex];
    if (!activeVideo) return;

    if (lastLoadedVideoIdRef.current === activeVideo.youtube_video_id) return;

    if (playerRef.current) {
      playerRef.current.loadVideo(activeVideo.youtube_video_id);
      lastLoadedVideoIdRef.current = activeVideo.youtube_video_id;
    }

    // Record once per unique video visited
    if (lastRecordedIndexRef.current !== activeIndex) {
      recordWatch(activeVideo);
      lastRecordedIndexRef.current = activeIndex;
    }
  }, [activeIndex, videos, recordWatch]);

  return (
    <>
      <CategoryMenu
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <SessionSummary
        session={session}
        autoShow={autoShow}
        onDismissAuto={dismissAuto}
      />

      <UserMenu user={user} onSignOut={onSignOut} />

      {!loading && !error && videos.length > 0 && (
        <VideoOverlay
          video={videos[activeIndex]}
          isBookmarked={isBookmarked(videos[activeIndex]?.youtube_video_id)}
          onToggleBookmark={() => toggleBookmark(videos[activeIndex])}
          onDeepDive={() => setDeepDiveOpen(true)}
        />
      )}

      <DeepDiveSheet
        video={videos[activeIndex]}
        isOpen={deepDiveOpen}
        onClose={() => setDeepDiveOpen(false)}
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
            data-scroll-container
            onClick={() => setUserInteracted(true)}
            onScroll={() => { if (!userInteracted) setUserInteracted(true); }}
            onTouchStart={() => { if (!userInteracted) setUserInteracted(true); }}
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