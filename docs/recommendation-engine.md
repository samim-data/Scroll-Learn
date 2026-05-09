# Recommendation Engine

> How Scroll-Learn learns what you want to watch next.

---

## The core problem

Pure vector similarity gives you "more of the same."  
The goal is a system that learns the user's **learning trajectory**, not just their taste.

A user who watched three quantum physics videos and one Roman history video probably wants more physics — but occasionally the history detour is what keeps them curious. The engine has to balance depth with breadth.

---

## Four-layer architecture

```
Layer 0  Cold start          (new user, no history)
Layer 1  Content similarity  (pgvector, available from day 1)
Layer 2  Behavioural signals (improves with every watch)
Layer 3  LLM interest model  (nightly batch, highest quality)
```

---

## Layer 0 — Cold start

A new user has no history. We can't personalise yet.

**Solution: onboarding category picker**

On first launch, user taps 1–3 topics they want to learn about (Science / Tech / Math / etc.).  
Feed = top videos by `view_count` within chosen categories.

After **5 watches**: compute `pref_vector` in real-time (no nightly batch wait).  
After **15 watches**: full pipeline kicks in.

---

## Layer 1 — Content-based filtering (pgvector)

Every video has a 1536-dimensional embedding vector stored in `videos.embedding`.

**How embeddings are built (at ingest time):**

```
input = title + " | " + channel_name + " | " + category
      + " | " + description[:500]
      + " | " + transcript[:1000]   ← if available

embedding = openai/text-embedding-3-small(input)   via OpenRouter
```

**User preference vector (`user_profiles.pref_vector`):**

```
pref_vector = weighted average of watched video embeddings

weight for each video =
  duration_ratio           (0.0–1.0 how much they watched)
  × (1 + 0.5 if liked)
  × (1 + 1.0 if saved)
  × recency_decay(watched_at)   (recent watches count more)
```

**Query at request time:**

```sql
SELECT id, title, 1 - (embedding <=> $pref_vector) AS similarity
FROM videos
WHERE id NOT IN (SELECT video_id FROM watch_history WHERE user_id = $uid)
ORDER BY similarity DESC
LIMIT 60;
```

This gives us **60 candidates** in a single fast query.

---

## Layer 2 — Behavioural signals

The 60 candidates are re-ranked using behavioural signals stored in `watch_history` and `channel_affinity`.

**Signal weights:**

| Signal | How captured | Weight |
|---|---|---|
| Content similarity | pgvector cosine | 0.35 |
| Interest model (LLM) | `interest_emb` cosine | 0.20 |
| Channel affinity | `channel_affinity.score` | 0.20 |
| Category weight | watch count per category | 0.15 |
| Freshness | days since `published_at` | 0.10 |

**Final score formula:**

```
score =
  0.35 × cosine_sim(video.embedding, user.pref_vector)
  + 0.20 × cosine_sim(video.embedding, user.interest_emb)
  + 0.20 × channel_affinity_score(user, video.channel_id)        [0–1 normalised]
  + 0.15 × category_weight(user, video.category)                  [0–1 normalised]
  + 0.10 × freshness(video.published_at)                          [0–1, decays over 90 days]
```

**Diversity injection** (prevents filter bubble):

Take top 16 by score → replace 4 with random videos from the user's _least_ watched category.  
This keeps the feed surprising without breaking the main signal.

---

## Layer 3 — LLM interest model (nightly batch)

Every night, for each user who watched at least one video in the last 7 days:

**Step 1 — Build interest narrative**

```
Prompt to gpt-4o-mini:

"A user has been watching short educational videos.
 Here are their last 20 watch events (most recent first):

  [title] — watched 94% — liked
  [title] — watched 31% — skipped
  [title] — watched 100% — saved
  ...

 In 2–3 sentences, summarise what this person is genuinely
 interested in learning. Focus on topics and depth, not format."

→ "This user is deeply interested in quantum physics and
   cognitive science. They prefer conceptual explanations
   over applied tutorials. They consistently skip
   historical content."
```

**Step 2 — Embed the narrative**

```
interest_emb = text-embedding-3-small(interest_text)
```

**Step 3 — Store**

```sql
UPDATE user_profiles
SET interest_text = $text,
    interest_emb  = $embedding,
    pref_vector   = $recomputed_pref_vector
WHERE user_id = $uid;
```

This `interest_emb` is used in Layer 2 scoring above (the 0.20 weight).

---

## "Next video" — LLM pick

When the current video ends, the app calls `GET /api/recommend?current_video_id=X`.

In addition to the standard ranked list, the backend runs a lightweight LLM call:

```
Top 5 scored candidates → gpt-4o-mini:

"User just finished watching: [current video title].
 Their interests: [interest_text].
 Pick the single best next video for their learning journey:

 1. [title A] — [category]
 2. [title B] — [category]
 3. [title C] — [category]
 4. [title D] — [category]
 5. [title E] — [category]

 Reply with only the number."

→ "3"
```

The LLM-picked video is placed first in the response.  
This single LLM call runs per-video-end event, not per-page-load — so the cost stays low.

---

## Channel recommendation

`channel_affinity` table stores a score per `(user_id, channel_id)` pair.

**Score update rule (triggered by every `POST /api/watch`):**

```
new_score = old_score
  + duration_ratio × 1.0          (base watch signal)
  + (if completed)  × 0.5
  + (if liked)      × 1.0
  + (if saved)      × 2.0
  - (if duration_ratio < 0.2) × 0.5   (skip penalty)
```

When recommending, videos from high-affinity channels get the 0.20 channel bonus above.  
New channels (affinity = 0) are still surfaced via content similarity — this is how channel discovery works.

---

## Summary diagram

```
User opens feed
  │
  ├─ Has pref_vector?
  │    No  →  Cold start: top videos by view_count in chosen categories
  │    Yes →  pgvector query → 60 candidates
  │               │
  │               ▼
  │           Score each candidate (5-factor formula)
  │               │
  │               ▼
  │           Diversity injection (swap 4 for exploration)
  │               │
  │               ▼
  │           Return top 20 to app
  │
  └─ Video ends
       │
       ▼
     LLM picks best next from top-5 → autoplay immediately
```

---

## Cost estimate

| Operation | Model | Approx cost |
|---|---|---|
| Embedding one video | `text-embedding-3-small` | ~$0.00002 |
| Nightly user interest narrative | `gpt-4o-mini` | ~$0.0003 per user |
| Next-video LLM pick | `gpt-4o-mini` | ~$0.0001 per video-end |
| Deep dive slides | `gpt-4o-mini` | ~$0.0005 per video (cached after first) |

At 1000 active users watching 20 videos/day:  
**~$1–2/day total AI cost.**
