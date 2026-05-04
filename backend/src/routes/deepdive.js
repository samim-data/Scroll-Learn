import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

router.get('/deepdive/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    // Look up the video by youtube_video_id
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('id, title, description, deep_dive_text, channel_id')
      .eq('youtube_video_id', videoId)
      .single();

    if (fetchError || !video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Return cached version if it exists
    if (video.deep_dive_text) {
      return res.json({ deepDive: video.deep_dive_text, cached: true });
    }

    // Get channel name for context
    const { data: channel } = await supabase
      .from('channels')
      .select('name')
      .eq('id', video.channel_id)
      .single();

    const channelName = channel?.name || 'Unknown channel';

    // Build the prompt
    const prompt = `You are an expert educator. A user just watched this short educational video and wants to learn more.

Video Title: ${video.title}
Channel: ${channelName}
Description: ${video.description || 'No description available'}

Provide a deep-dive explanation that:
1. Summarizes the core concept in 2-3 sentences
2. Explains the key ideas and important terms
3. Lists 3 follow-up questions to think about
4. Suggests 2-3 related topics to explore next

Format with clear sections and headings. Keep it engaging and accessible. Around 300-400 words total.`;

    // Call OpenRouter
    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      console.error('OpenRouter error:', errText);
      return res.status(500).json({ error: 'AI generation failed' });
    }

    const orData = await orResponse.json();
    const deepDiveText = orData.choices?.[0]?.message?.content;

    if (!deepDiveText) {
      return res.status(500).json({ error: 'No content returned from AI' });
    }

    // Cache it in the database
    await supabase
      .from('videos')
      .update({ deep_dive_text: deepDiveText })
      .eq('id', video.id);

    res.json({ deepDive: deepDiveText, cached: false });
  } catch (err) {
    console.error('Deep dive error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;