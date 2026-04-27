import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Fetches basic channel info including the uploads playlist ID
// Cost: 1 unit per call
export async function getChannelInfo(channelId) {
  const url = `${BASE_URL}/channels`;
  const response = await axios.get(url, {
    params: {
      part: 'snippet,contentDetails',
      id: channelId,
      key: API_KEY,
    },
  });

  const channel = response.data.items[0];
  if (!channel) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  return {
    youtube_channel_id: channel.id,
    name: channel.snippet.title,
    uploads_playlist_id: channel.contentDetails.relatedPlaylists.uploads,
  };
}

// Fetches the latest videos from a channel's uploads playlist
// Cost: 1 unit per call, returns up to 50 videos
export async function getLatestVideosFromPlaylist(playlistId, maxResults = 20) {
  const url = `${BASE_URL}/playlistItems`;
  const response = await axios.get(url, {
    params: {
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: maxResults,
      key: API_KEY,
    },
  });

  return response.data.items.map((item) => ({
    youtube_video_id: item.contentDetails.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
    published_at: item.contentDetails.videoPublishedAt,
  }));
}

// Fetches detailed data for videos in batches of up to 50
// Cost: 1 unit per call regardless of how many video IDs you pass
export async function getVideoDetails(videoIds) {
  if (videoIds.length === 0) return [];

  // YouTube allows up to 50 IDs per call
  const batches = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  const allVideos = [];
  for (const batch of batches) {
    const response = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: batch.join(','),
        key: API_KEY,
      },
    });

    for (const video of response.data.items) {
      allVideos.push({
        youtube_video_id: video.id,
        duration_seconds: parseDuration(video.contentDetails.duration),
        view_count: parseInt(video.statistics.viewCount || '0'),
        like_count: parseInt(video.statistics.likeCount || '0'),
      });
    }
  }

  return allVideos;
}

// YouTube returns durations in ISO 8601 format like "PT4M13S"
// This converts it to total seconds
function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}