const EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || 'openai/text-embedding-3-small';

export async function generateEmbedding({ title, channelName, category, description, transcript }) {
  const input = [
    title,
    channelName,
    category,
    description?.slice(0, 500) || '',
    transcript?.slice(0, 500) || '',
  ]
    .filter(Boolean)
    .join(' | ');

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBED_MODEL, input }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding failed: ${err}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding;
}
