import { supabase } from '../supabase.js';
import { getChannelInfo, getLatestVideosFromPlaylist, getVideoDetails } from '../services/youtube.js';

// PASTE YOUR CHANNEL IDS HERE
// Format: { youtube_channel_id: 'UC...', category: 'tech' }
const CHANNELS_TO_SEED = [
  { youtube_channel_id: 'UCHnyfMqiRRG1u-2MsSQLbXA', category: 'science' },
  { youtube_channel_id: 'UCsXVk37bltHxD1rDPwtNM8Q', category: 'science' },
  { youtube_channel_id: 'UCUHW94eEFW7hkUMVaZz4eDg', category: 'science' },
  { youtube_channel_id: 'UCeiYXex_fwgYDonaTcSIk6w', category: 'science' },
  { youtube_channel_id: 'UCFbNIlppjAuEX4znoulh0Cw', category: 'tech' },
  { youtube_channel_id: 'UCPjNBjflYl0-HQtUvOx0Ibw', category: 'tech' },
  { youtube_channel_id: 'UC6biysICWOJ-C3P4Tyeggzg', category: 'tech' },
  { youtube_channel_id: 'UCoOae5nYA7VqaXzerajD0lg', category: 'business' },
  { youtube_channel_id: 'UCUyDOdBWhC1MCxEjC46d-zw', category: 'business' },
  { youtube_channel_id: 'UCV6KDgJskWaEckne5aPA0aQ', category: 'business' },
  { youtube_channel_id: 'UCmtBqvOp6xHlecDO0Un9O4w', category: 'business' },
  { youtube_channel_id: 'UCYO_jab_esuFRV4b17AJtAw', category: 'math' },
  { youtube_channel_id: 'UCHnj59g7jezwTy5GeL8EA_g', category: 'math' },
  { youtube_channel_id: 'UCP5tjEmvPItGyLhmjdwP7Ww', category: 'history' },
  { youtube_channel_id: 'UClHVl2N3jPEbkNJVx-ItQIQ', category: 'mind' },
  { youtube_channel_id: 'UC0QHWhjbe5fGJEPz3sVb6nw', category: 'health' },
  { youtube_channel_id: 'UCC552Sd-3nyi_tk2BudLUzA', category: 'health' }, 
  { youtube_channel_id: 'UCNHb7I85BKnwbJF4fWBXJjA', category: 'language' },
  { youtube_channel_id: 'UCNhX3WQEkraW3VHPyup8jkQ', category: 'language' },
];
// Gohar Khan - example
 // Gohar Khan - example


async function seedChannels() {
  console.log(`Starting seed with ${CHANNELS_TO_SEED.length} channels...`);

  for (const channel of CHANNELS_TO_SEED) {
    try {
      console.log(`\nFetching channel info for ${channel.youtube_channel_id}...`);
      const channelInfo = await getChannelInfo(channel.youtube_channel_id);

      // Insert or update the channel in the database
      const { data: insertedChannel, error: channelError } = await supabase
        .from('channels')
        .upsert(
          {
            youtube_channel_id: channelInfo.youtube_channel_id,
            name: channelInfo.name,
            uploads_playlist_id: channelInfo.uploads_playlist_id,
            category: channel.category,
          },
          { onConflict: 'youtube_channel_id' }
        )
        .select()
        .single();

      if (channelError) {
        console.error(`Error inserting channel: ${channelError.message}`);
        continue;
      }

      console.log(`Added channel: ${channelInfo.name}`);

      // Fetch latest videos from this channel
      console.log(`Fetching latest videos...`);
      const videos = await getLatestVideosFromPlaylist(channelInfo.uploads_playlist_id, 50);
      console.log(`Found ${videos.length} videos`);

      if (videos.length === 0) continue;

      // Get detailed stats (duration, views) in one batched call
      const videoIds = videos.map((v) => v.youtube_video_id);
      const details = await getVideoDetails(videoIds);
      const detailsMap = Object.fromEntries(details.map((d) => [d.youtube_video_id, d]));

      // Merge metadata with details and prepare for insertion
      const MAX_DURATION_SECONDS = 180; // 3 minutes

      const videosToInsert = videos
        .map((video) => ({
            youtube_video_id: video.youtube_video_id,
            channel_id: insertedChannel.id,
            title: video.title,
            description: video.description,
            thumbnail_url: video.thumbnail_url,
            published_at: video.published_at,
            duration_seconds: detailsMap[video.youtube_video_id]?.duration_seconds || 0,
            view_count: detailsMap[video.youtube_video_id]?.view_count || 0,
            like_count: detailsMap[video.youtube_video_id]?.like_count || 0,
  }))
        .filter((video) => video.duration_seconds > 0 && video.duration_seconds <= MAX_DURATION_SECONDS);

      console.log(`  Filtered to ${videosToInsert.length} short videos (≤${MAX_DURATION_SECONDS}s)`);

      const { error: videosError } = await supabase
        .from('videos')
        .upsert(videosToInsert, { onConflict: 'youtube_video_id' });

      if (videosError) {
        console.error(`Error inserting videos: ${videosError.message}`);
      } else {
        console.log(`Added ${videosToInsert.length} videos`);
      }
    } catch (err) {
      console.error(`Error processing channel ${channel.youtube_channel_id}:`, err.message);
    }
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

seedChannels();