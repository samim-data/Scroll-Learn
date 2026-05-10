import 'dotenv/config';
import axios from 'axios';
import { supabase } from '../supabase.js';
import { getLatestVideosFromPlaylist, getVideoDetails } from '../services/youtube.js';

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const MAX_DURATION_SECONDS = 180;

// Usage: node src/scripts/addChannel.js @gcn sport
const handle   = process.argv[2];
const category = process.argv[3];

if (!handle || !category) {
  console.error('Usage: node src/scripts/addChannel.js @handle category');
  process.exit(1);
}

async function run() {
  console.log(`Looking up channel ${handle}...`);

  const { data } = await axios.get(`${BASE_URL}/channels`, {
    params: {
      part: 'snippet,contentDetails',
      forHandle: handle.replace('@', ''),
      key: API_KEY,
    },
  });

  const channel = data.items?.[0];
  if (!channel) {
    console.error(`Channel not found for handle: ${handle}`);
    process.exit(1);
  }

  const channelId       = channel.id;
  const channelName     = channel.snippet.title;
  const uploadsPlaylist = channel.contentDetails.relatedPlaylists.uploads;

  console.log(`Found: ${channelName} (${channelId})`);

  const { data: inserted, error: chErr } = await supabase
    .from('channels')
    .upsert(
      { youtube_channel_id: channelId, name: channelName, uploads_playlist_id: uploadsPlaylist, category },
      { onConflict: 'youtube_channel_id' }
    )
    .select()
    .single();

  if (chErr) { console.error('Channel insert error:', chErr.message); process.exit(1); }
  console.log(`Channel upserted: ${channelName} [${category}]`);

  console.log('Fetching latest videos...');
  const videos  = await getLatestVideosFromPlaylist(uploadsPlaylist, 50);
  const details = await getVideoDetails(videos.map(v => v.youtube_video_id));
  const detailsMap = Object.fromEntries(details.map(d => [d.youtube_video_id, d]));

  const toInsert = videos
    .map(v => ({
      youtube_video_id: v.youtube_video_id,
      channel_id:       inserted.id,
      title:            v.title,
      description:      v.description,
      thumbnail_url:    v.thumbnail_url,
      published_at:     v.published_at,
      duration_seconds: detailsMap[v.youtube_video_id]?.duration_seconds || 0,
      view_count:       detailsMap[v.youtube_video_id]?.view_count || 0,
      like_count:       detailsMap[v.youtube_video_id]?.like_count || 0,
    }))
    .filter(v => v.duration_seconds > 0 && v.duration_seconds <= MAX_DURATION_SECONDS);

  console.log(`Filtered to ${toInsert.length} short videos (≤${MAX_DURATION_SECONDS}s)`);

  if (toInsert.length === 0) {
    console.log('No short videos found — channel may not have shorts yet.');
    process.exit(0);
  }

  const { error: vErr } = await supabase
    .from('videos')
    .upsert(toInsert, { onConflict: 'youtube_video_id' });

  if (vErr) { console.error('Video insert error:', vErr.message); }
  else console.log(`✓ Done. Added ${toInsert.length} videos from ${channelName}`);

  process.exit(0);
}

run();
