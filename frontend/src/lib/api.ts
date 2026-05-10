import axios from "axios";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL as string;
const FEED_ENDPOINT = (import.meta.env.VITE_FEED_ENDPOINT as string) || "/feed";

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return config;
});

export type Channel = { name: string; category: string };
export type Video = {
  id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  published_at?: string;
  channel?: Channel;
};

export type FeedResponse = { videos: Video[]; hasMore: boolean };

export async function getFeed(params: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<FeedResponse> {
  const { limit = 10, offset = 0, category } = params;
  const res = await api.get<FeedResponse>(FEED_ENDPOINT, {
    params: {
      limit,
      offset,
      ...(category && category !== "all" ? { category } : {}),
    },
  });
  return res.data;
}

export type Slide =
  | { type?: "summary"; title: string; body?: string; content?: string; emoji?: string; key_concept?: string }
  | { type: "concept"; term: string; definition: string; emoji?: string }
  | { type: "quiz"; question: string; options: string[]; answer_index: number; explanation?: string; emoji?: string }
  | { type: "takeaway"; sentence: string; emoji?: string }
  | { type?: string; title?: string; content?: string; key_concept?: string; [k: string]: unknown };

export type DeepDiveResponse =
  | { slides: Slide[]; cached?: boolean }
  | { deepDive: string; cached?: boolean };

export async function getDeepDive(youtubeVideoId: string): Promise<DeepDiveResponse> {
  const res = await api.get<DeepDiveResponse>(`/deepdive/${youtubeVideoId}`);
  return res.data;
}

export async function trackWatch(payload: {
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
}): Promise<void> {
  try {
    await api.post("/track-watch", payload);
  } catch {
    // silent fail per spec
  }
}

export type StatsResponse = {
  totalMinutes: number;
  byCategory: { category: string; minutes: number }[];
  streak: number;
  videosCompleted: number;
};

export async function getStats(): Promise<StatsResponse | null> {
  try {
    const res = await api.get<StatsResponse>("/user/stats");
    return res.data;
  } catch {
    return null;
  }
}
