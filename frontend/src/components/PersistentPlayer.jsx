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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80vh] w-full max-w-[min(100vw,calc(80vh*9/16))] bg-black rounded-2xl overflow-hidden z-20 pointer-events-auto"
            style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 200ms',
            }}
        >
            <YouTube
                videoId={initialVideoId}
                opts={opts}
                onReady={onReady}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
    );
});

export default PersistentPlayer;