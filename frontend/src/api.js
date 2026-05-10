import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getFeed(limit = 5, offset = 0, category = null) {
  const params = { limit, offset };
  if (category) params.category = category;

  const response = await axios.get(`${API_BASE}/feed`, { params });
  return response.data; // returns { videos, hasMore }
}

export async function getChannels() {
  const response = await axios.get(`${API_BASE}/channels`);
  return response.data.channels;
}
export async function getDeepDive(youtubeVideoId) {
  const response = await axios.get(`${API_BASE}/deepdive/${youtubeVideoId}`);
  return response.data;
}

export async function getRecommend(videoId, limit = 10, offset = 0) {
  const response = await axios.get(`${API_BASE}/recommend`, {
    params: { video_id: videoId, limit, offset },
  });
  return response.data;
}

export async function searchVideos(query, limit = 20) {
  const response = await axios.get(`${API_BASE}/search`, {
    params: { q: query, limit },
  });
  return response.data;
}