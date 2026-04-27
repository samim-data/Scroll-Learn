import { supabase } from '../supabase.js';
import {
  getLatestVideosFromPlaylist,
  getVideoDetails,
} from './youtube.js';

const MAX_DURATION_SECONDS = 180;

export async function refreshLibrary() {
  console.log('Starting library refresh...');
  const startTime = Date.now();

  // Get all channels from the database
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*');

  if (channelsError) {
    throw new Error(`Failed to fetch channels: ${channelsError.message}`);
  }

  if (!channels || channels.length === 0) {
    console.log('No channels in database. Run seed script first.');
    return { channelsProcessed: 0, videosAdded: 0 };
  }

  let totalVideosAdded = 0;
  let totalQuotaUsed = 0;

  for (const channel of channels) {
    try {
      console.log(`\nChecking ${channel.name}...`);

      if (!channel.uploads_playlist_id) {
        console.log(`  Skipping — no uploads playlist ID`);
        continue;
      }

      // Get the latest 50 videos from this channel's uploads playlist
      const latestVideos = await getLatestVideosFromPlaylist(
        channel.uploads_playlist_id,
        50
      );
      totalQuotaUsed += 1;

      if (latestVideos.length === 0) {
        console.log(`  No videos returned`);
        continue;
      }

      // Check which of these we already have in the database
      const videoIds = latestVideos.map((v) => v.youtube_video_id);
      const { data: existing } = await supabase
        .from('videos')
        .select('youtube_video_id')
        .in('youtube_video_id', videoIds);

      const existingIds = new Set((existing || []).map((v) => v.youtube_video_id));
      const newVideos = latestVideos.filter(
        (v) => !existingIds.has(v.youtube_video_id)
      );

      if (newVideos.length === 0) {
        console.log(`  No new videos`);
        continue;
      }

      console.log(`  Found ${newVideos.length} potentially new videos`);

      // Get details (duration, stats) for the new videos
      const newVideoIds = newVideos.map((v) => v.youtube_video_id);
      const details = await getVideoDetails(newVideoIds);
      totalQuotaUsed += Math.ceil(newVideoIds.length / 50);

      const detailsMap = Object.fromEntries(
        details.map((d) => [d.youtube_video_id, d])
      );

      // Build records and filter to short videos only
      const videosToInsert = newVideos
        .map((video) => ({
          youtube_video_id: video.youtube_video_id,
          channel_id: channel.id,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail_url,
          published_at: video.published_at,
          duration_seconds: detailsMap[video.youtube_video_id]?.duration_seconds || 0,
          view_count: detailsMap[video.youtube_video_id]?.view_count || 0,
          like_count: detailsMap[video.youtube_video_id]?.like_count || 0,
        }))
        .filter(
          (v) =>
            v.duration_seconds > 0 &&
            v.duration_seconds <= MAX_DURATION_SECONDS
        );

      if (videosToInsert.length === 0) {
        console.log(`  No new short videos to add`);
        continue;
      }

      const { error: insertError } = await supabase
        .from('videos')
        .insert(videosToInsert);

      if (insertError) {
        console.error(`  Insert error: ${insertError.message}`);
        continue;
      }

      console.log(`  Added ${videosToInsert.length} new short videos`);
      totalVideosAdded += videosToInsert.length;
    } catch (err) {
      console.error(`  Error processing ${channel.name}: ${err.message}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\nRefresh complete. Channels: ${channels.length}, New videos: ${totalVideosAdded}, ` +
    `Quota used: ~${totalQuotaUsed} units, Duration: ${duration}s`
  );

  return {
    channelsProcessed: channels.length,
    videosAdded: totalVideosAdded,
    quotaUsed: totalQuotaUsed,
    durationSeconds: parseFloat(duration),
  };
}