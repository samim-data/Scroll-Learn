import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export async function getFeed(limit = 20, category = null) {
  const params = { limit };
  if (category) params.category = category;

  const response = await axios.get(`${API_BASE}/feed`, { params });
  return response.data.videos;
}

export async function getChannels() {
  const response = await axios.get(`${API_BASE}/channels`);
  return response.data.channels;
}