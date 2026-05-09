const FALLBACK_SLIDE = (title) => ({
  slides: [
    {
      type: 'summary',
      title: title || 'Key Concepts',
      body: 'Watch the video to explore this topic in depth.',
      emoji: '🎓',
    },
  ],
});

function validateSlides(slides) {
  if (!Array.isArray(slides) || slides.length !== 5) return false;
  const types = slides.map(s => s.type);
  if (types[0] !== 'summary' || types[3] !== 'quiz' || types[4] !== 'takeaway') return false;
  for (const s of slides) {
    if (s.type === 'summary'  && (!s.title || !s.body || !s.emoji)) return false;
    if (s.type === 'concept'  && (!s.term || !s.definition)) return false;
    if (s.type === 'quiz'     && (!s.question || !Array.isArray(s.options) || s.options.length !== 4)) return false;
    if (s.type === 'takeaway' && !s.sentence) return false;
  }
  return true;
}

export async function generateSlides({ title, channelName, content }) {
  const prompt = `You are a learning scientist, not a summarizer.

A student just watched this short educational video:
Title: "${title}"
Channel: ${channelName}
Transcript: ${content}

Your goal: after reading your 4 slides, the student should be able to explain
this topic to someone else in one sentence — and pass the quiz.

Produce exactly 5 slides in this order: summary → concept → concept → quiz → takeaway.

Slide 1 — summary
  title: the ONE insight from this video that changes how you think about the topic (not the topic name)
  body: 2 sentences max — explain the insight in plain language, as if to a curious 16-year-old
  emoji: single emoji that represents the core idea

Slide 2 & 3 — concept
  term: a specific word or phrase used in the video that the student needs to own
  definition: 1 sentence using a concrete real-world analogy (not a dictionary definition)
  Pick the 2 terms that unlock the most understanding — the ones where if you don't know them, the whole video is confusing.

Slide 4 — quiz
  question: tests the MECHANISM behind the main concept, not a fact ("Why does X happen?" not "What is X?")
  options: 4 choices — the correct answer plus 3 plausible misconceptions a half-attentive viewer might believe
  answer_index: 0-3 (index of the correct option in the options array)
  explanation: 1 sentence — reveals WHY the correct answer is right, not just that it is

Slide 5 — takeaway
  sentence: the single sentence the student should still remember in one week
  Make it specific, surprising, and impossible to forget. Not a summary — a revelation.

Return ONLY valid JSON. No markdown fences. No text outside the JSON object.

{
  "slides": [
    { "type": "summary",  "title": "...", "body": "...", "emoji": "..." },
    { "type": "concept",  "term": "...", "definition": "..." },
    { "type": "concept",  "term": "...", "definition": "..." },
    { "type": "quiz",     "question": "...", "options": ["...","...","...","..."], "answer_index": 0, "explanation": "..." },
    { "type": "takeaway", "sentence": "..." }
  ]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    console.error('OpenRouter error:', await response.text());
    return FALLBACK_SLIDE(title);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim();

  try {
    // strip markdown code fences if model wraps in ```json
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (validateSlides(parsed.slides)) return parsed;
    console.warn('Slide validation failed, using fallback');
    return FALLBACK_SLIDE(title);
  } catch (e) {
    console.error('Slide JSON parse error:', e.message);
    return FALLBACK_SLIDE(title);
  }
}
