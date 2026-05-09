import { YoutubeTranscript } from 'youtube-transcript';

export async function getTranscript(youtubeVideoId) {
  try {
    const items = await YoutubeTranscript.fetchTranscript(youtubeVideoId);
    const full = items
      .map(i => i.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // The last 20% of a transcript is where the presenter delivers the payoff.
    // Bias the context window toward it: setup (first 500) + insight (last 1500).
    const setup  = full.slice(0, 500);
    const payoff = full.slice(-1500);
    return full.length <= 2000 ? full : `${setup} [...] ${payoff}`;
  } catch {
    return null; // caller falls back to description
  }
}
