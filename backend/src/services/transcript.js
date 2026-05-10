import { YoutubeTranscript } from 'youtube-transcript';

const TRANSCRIPT_TIMEOUT_MS = 5000;

export async function getTranscript(youtubeVideoId) {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('transcript timeout')), TRANSCRIPT_TIMEOUT_MS)
    );

    const items = await Promise.race([
      YoutubeTranscript.fetchTranscript(youtubeVideoId),
      timeout,
    ]);

    const full = items
      .map(i => i.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Bias toward the payoff: setup (first 500) + insight (last 1500).
    const setup  = full.slice(0, 500);
    const payoff = full.slice(-1500);
    return full.length <= 2000 ? full : `${setup} [...] ${payoff}`;
  } catch {
    return null; // falls back to description
  }
}
