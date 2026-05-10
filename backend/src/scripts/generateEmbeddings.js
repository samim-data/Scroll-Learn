import 'dotenv/config';
import { supabase } from '../supabase.js';
import { generateEmbedding } from '../services/embeddings.js';
import { getTranscript } from '../services/transcript.js';

const BATCH_SIZE = 10;
const DELAY_MS = 500; // stay under rate limits

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Fetching videos without embeddings...');

  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      id, youtube_video_id, title, description,
      channel:channels!inner(name, category)
    `)
    .is('embedding', null);

  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Found ${videos.length} videos to embed.`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (video) => {
      try {
        // fetch transcript on the fly (transcript_text not stored yet)
        const transcript = await getTranscript(video.youtube_video_id);

        const embedding = await generateEmbedding({
          title:       video.title,
          channelName: video.channel?.name,
          category:    video.channel?.category,
          description: video.description,
          transcript,
        });

        await supabase
          .from('videos')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', video.id);

        success++;
        console.log(`✓ [${success + failed}/${videos.length}] ${video.title.slice(0, 50)}`);
      } catch (err) {
        failed++;
        console.error(`✗ ${video.title.slice(0, 50)}: ${err.message}`);
      }
    }));

    if (i + BATCH_SIZE < videos.length) await sleep(DELAY_MS);
  }

  console.log(`\nDone. ${success} embedded, ${failed} failed.`);
}

run();
