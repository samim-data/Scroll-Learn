import express from 'express';
import { supabase } from '../supabase.js';
import { getTranscript } from '../services/transcript.js';
import { generateSlides } from '../services/slideGenerator.js';

const router = express.Router();

router.get('/deepdive/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('id, title, description, slide_json, channel_id')
      .eq('youtube_video_id', videoId)
      .single();

    if (fetchError || !video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // return cached slides if available
    if (video.slide_json) {
      return res.json({ slides: video.slide_json.slides, cached: true });
    }

    const { data: channel } = await supabase
      .from('channels')
      .select('name')
      .eq('id', video.channel_id)
      .single();

    const channelName = channel?.name || 'Unknown channel';

    // try transcript, fall back to description
    const transcript = await getTranscript(videoId);
    const content = transcript || video.description || 'No content available';

    const slideData = await generateSlides({
      title: video.title,
      channelName,
      content,
    });

    // cache in DB
    await supabase
      .from('videos')
      .update({ slide_json: slideData })
      .eq('id', video.id);

    res.json({ slides: slideData.slides, cached: false });
  } catch (err) {
    console.error('Deepdive error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
