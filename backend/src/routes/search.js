import express from 'express';
import { supabase } from '../supabase.js';
import { generateEmbedding } from '../services/embeddings.js';

const router = express.Router();

// GET /api/search?q=your+query&limit=20
// Semantic search: embeds the query and finds similar videos via pgvector.
// Falls back to ilike text search if embedding fails.
router.get('/search', async (req, res) => {
  const { q, limit = 20 } = req.query;
  if (!q?.trim()) return res.json({ videos: [], source: 'empty' });

  const parsedLimit = Math.min(parseInt(limit) || 20, 50);

  try {
    // semantic path
    const embedding = await generateEmbedding({
      title: q, channelName: '', category: '', description: q,
    });

    const { data: videos, error } = await supabase.rpc('match_videos_search', {
      query_embedding: JSON.stringify(embedding),
      match_count: parsedLimit,
    });

    if (!error && videos?.length) {
      return res.json({ videos, source: 'semantic' });
    }
  } catch (_) { /* fall through */ }

  // text fallback
  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      id, youtube_video_id, title, description, thumbnail_url,
      duration_seconds, published_at, view_count, like_count, channel_id,
      channel:channels!inner(id, name, category, youtube_channel_id)
    `)
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order('view_count', { ascending: false })
    .limit(parsedLimit);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ videos: videos || [], source: 'text' });
});

export default router;
