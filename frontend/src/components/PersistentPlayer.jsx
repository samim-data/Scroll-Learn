import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import YouTube from 'react-youtube';

const PersistentPlayer = forwardRef(({ initialVideoId, isVisible, userInteracted }, ref) => {
    const playerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useImperativeHandle(ref, () => ({
        loadVideo: (videoId) => {
            if (playerRef.current && isReady) {
                try {
                    playerRef.current.loadVideoById(videoId);
                    if (userInteracted) {
                        playerRef.current.unMute();
                        playerRef.current.setVolume(100);
                    }
                } catch (e) {
                    // Player not ready
                }
            }
        },
        play: () => {
            if (playerRef.current && isReady) {
                try {
                    playerRef.current.playVideo();
                } catch (e) { }
            }
        },
        pause: () => {
            if (playerRef.current && isReady) {
                try {
                    playerRef.current.pauseVideo();
                } catch (e) { }
            }
        },
    }));

    const onReady = (event) => {
        playerRef.current = event.target;
        setIsReady(true);
        try {
            event.target.playVideo();
        } catch (e) {
            // Autoplay may be blocked
        }
    };

    const opts = {
        width: '100%',
        height: '100%',
        playerVars: {
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            controls: 1,
            mute: userInteracted ? 0 : 1,
        },
    };

    return (
        <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80vh] w-full max-w-[min(100vw,calc(80vh*9/16))] bg-black rounded-2xl overflow-hidden z-20"
            style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 200ms',
            }}
        >
            {/* Iframe positioned absolutely so z-index works properly */}
            <div className="absolute inset-0 w-full h-full">
                <YouTube
                    videoId={initialVideoId}
                    opts={opts}
                    onReady={onReady}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                />
            </div>

            {/* Scroll-capture zone — explicitly above iframe */}
            <div
                className="absolute right-0"
                style={{
                    width: '37%',
                    height: '50%',
                    top: '25%',
                    zIndex: 50,
                    touchAction: 'pan-y',
                    background: 'transparent',  // keep visible while testing
                }}
                onWheel={(e) => {
                    e.preventDefault();
                    const scrollContainer = document.querySelector('[data-scroll-container]');
                    if (!scrollContainer) return;

                    // Throttle: ignore further wheel events for 600ms after a scroll
                    if (scrollContainer.dataset.scrolling === 'true') return;
                    scrollContainer.dataset.scrolling = 'true';
                    setTimeout(() => {
                        scrollContainer.dataset.scrolling = 'false';
                    }, 600);

                    // Direction: positive deltaY = scroll down (next video)
                    const direction = e.deltaY > 0 ? 1 : -1;
                    const videoHeight = window.innerHeight;
                    scrollContainer.scrollBy({
                        top: direction * videoHeight,
                        behavior: 'smooth',
                    });
                }}
            />
        </div>
    );
});

export default PersistentPlayer;