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
    // Fetch limit+1 to reliably detect if more pages exist
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
        channel_id,
        channel:channels!inner(id, name, category, youtube_channel_id)
      `)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit);

    if (category) {
      query = query.eq('channels.category', category);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Feed query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch feed' });
    }

    const hasMore = rows.length > limit;
    const videos = hasMore ? rows.slice(0, limit) : rows;

    res.json({ videos, hasMore });
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

    if (error) {
      console.error('Channels query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch channels' });
    }

    res.json({ channels: data, count: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;