import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// GET /api/feed
// Returns a shuffled list of videos with channel info
// Query params:
//   limit (default 20, max 50) - how many videos to return
//   category (optional) - filter by category like 'tech'
router.get('/feed', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;

    // Step 1: If filtering by category, get matching channel IDs first
    let channelIds = null;
    if (category) {
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id')
        .eq('category', category);

      if (channelsError) {
        return res.status(500).json({ error: channelsError.message });
      }

      channelIds = channels.map((c) => c.id);

      if (channelIds.length === 0) {
        return res.json({ videos: [], hasMore: false });
      }
    }

    // Step 2: Query videos with offset and limit
    let query = supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        thumbnail_url,
        duration_seconds,
        published_at,
        view_count,
        like_count,
        channel_id
      `)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (channelIds) {
      query = query.in('channel_id', channelIds);
    }

    const { data: videos, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Step 3: Fetch channel info separately and attach
    const uniqueChannelIds = [...new Set(videos.map((v) => v.channel_id))];
    const { data: channelsData } = await supabase
      .from('channels')
      .select('id, name, category, youtube_channel_id')
      .in('id', uniqueChannelIds);

    const channelMap = Object.fromEntries(
      (channelsData || []).map((c) => [c.id, c])
    );

    const enrichedVideos = videos.map((v) => ({
      ...v,
      channel: channelMap[v.channel_id] || null,
    }));

    res.json({
      videos: enrichedVideos,
      hasMore: videos.length === limit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channels
// Returns all channels, optionally filtered by category
router.get('/channels', async (req, res) => {
  try {
    const category = req.query.category;

    let query = supabase.from('channels').select('*').order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json({ channels: data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id
// Returns one specific video with its channel info
router.get('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        channel:channels (
          id,
          name,
          category,
          youtube_channel_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Video not found' });

    res.json({ video: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Fisher-Yates shuffle for randomizing the feed
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default router;