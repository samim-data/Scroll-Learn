import express from 'express';
import { supabase } from '../supabase.js';
import { generateEmbedding } from '../services/embeddings.js';

const router = express.Router();

// GET /api/recommend?video_id=X&limit=10&offset=0
// Returns videos most similar to video X using pgvector cosine similarity.
// Falls back to view_count ranking if embedding not available.
router.get('/recommend', async (req, res) => {
  const { video_id, limit = 10, offset = 0 } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 10, 50);
  const parsedOffset = parseInt(offset) || 0;

  try {
    // get current video with its embedding
    const { data: current } = await supabase
      .from('videos')
      .select('id, title, description, transcript_text, embedding, channel:channels!inner(name, category)')
      .eq('youtube_video_id', video_id)
      .single();

    // id is bigint — cast to number for rpc param

    // if embedding exists — use pgvector similarity
    if (current?.embedding) {
      const { data: similar, error } = await supabase.rpc('match_videos', {
        query_embedding: current.embedding,
        match_count:     parsedLimit + parsedOffset + 1,
        exclude_id:      Number(current.id),
      });

      if (!error && similar?.length) {
        const page = similar.slice(parsedOffset, parsedOffset + parsedLimit);
        return res.json({ videos: page, source: 'embedding', hasMore: similar.length > parsedOffset + parsedLimit });
      }
    }

    // fallback: generate embedding on the fly and query
    if (current) {
      try {
        const embedding = await generateEmbedding({
          title:       current.title,
          channelName: current.channel?.name,
          category:    current.channel?.category,
          description: current.description,
          transcript:  current.transcript_text,
        });

        const { data: similar } = await supabase.rpc('match_videos', {
          query_embedding: JSON.stringify(embedding),
          match_count:     parsedLimit + parsedOffset + 1,
          exclude_id:      Number(current.id),
        });

        if (similar?.length) {
          const page = similar.slice(parsedOffset, parsedOffset + parsedLimit);
          return res.json({ videos: page, source: 'embedding_live', hasMore: similar.length > parsedOffset + parsedLimit });
        }
      } catch (_) { /* fall through to category fallback */ }
    }

    // final fallback: same category by view_count
    const category = current?.channel?.category;
    let query = supabase
      .from('videos')
      .select(`id, youtube_video_id, title, description, thumbnail_url,
               duration_seconds, published_at, view_count, like_count, channel_id,
               channel:channels!inner(id, name, category, youtube_channel_id)`)
      .order('view_count', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit);

    if (category) query = query.eq('channels.category', category);
    if (video_id) query = query.neq('youtube_video_id', video_id);

    const { data: videos, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ videos: videos || [], source: 'category', hasMore: videos.length === parsedLimit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
