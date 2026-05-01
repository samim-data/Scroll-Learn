import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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