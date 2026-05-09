import { useState } from 'react';

const STORAGE_KEY = 'sl_bookmarks';

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  function toggle(video) {
    setBookmarks(prev => {
      const exists = prev.some(b => b.youtube_video_id === video.youtube_video_id);
      const next = exists
        ? prev.filter(b => b.youtube_video_id !== video.youtube_video_id)
        : [
            ...prev,
            {
              id: video.id,
              youtube_video_id: video.youtube_video_id,
              title: video.title,
              thumbnail_url: video.thumbnail_url,
              channel: video.channel,
              duration_seconds: video.duration_seconds,
            },
          ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function isBookmarked(youtubeVideoId) {
    return bookmarks.some(b => b.youtube_video_id === youtubeVideoId);
  }

  return { bookmarks, toggle, isBookmarked };
}
