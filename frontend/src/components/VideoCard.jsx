import { useEffect, useRef, useState } from 'react';

export default function VideoCard({ video, isActive }) {
  const playerRef = useRef(null);
  const playerContainerId = `player-${video.id}`;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!window.YT) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }

    let cancelled = false;

    function createPlayer() {
      if (cancelled) return;

      if (!window.YT || !window.YT.Player) {
        setTimeout(createPlayer, 100);
        return;
      }

      playerRef.current = new window.YT.Player(playerContainerId, {
        videoId: video.youtube_video_id,
        playerVars: {
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          controls: 1,
          mute: 1,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setIsReady(true);
            event.target.mute();
          },
        },
      });
    }

    createPlayer();

    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Player already destroyed, ignore
        }
      }
    };
  }, [video.youtube_video_id]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const player = playerRef.current;

    try {
      if (isActive) {
        player.unMute();
        player.playVideo();
      } else {
        player.pauseVideo();
        player.mute();
      }
    } catch (e) {
      // Player methods can fail during transitions, safe to ignore
    }
  }, [isActive, isReady]);

  return (
  <div className="h-screen w-full flex items-center justify-center snap-start snap-always relative bg-black">
    <div className="relative h-[90vh] w-full max-w-[min(100vw,calc(90vh*9/16))] bg-black rounded-2xl overflow-hidden">
      <div id={playerContainerId} className="w-full h-full" />

      {/* Overlay with title and channel info, bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
        <h3 className="text-white text-base font-semibold line-clamp-2 mb-1">
          {video.title}
        </h3>
        <p className="text-white/80 text-sm">
          @{video.channel?.name} · {formatDuration(video.duration_seconds)}
        </p>
      </div>
    </div>
  </div>
);
}
function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}