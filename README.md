# Scroll-Learn

**Live:** [scroll-learn.vercel.app](https://scroll-learn.vercel.app) &nbsp;|&nbsp; **[Engineering Wiki →](./docs/README.md)**

A TikTok-style feed for short educational videos. Built because doomscrolling is too easy and learning shouldn't be a separate decision — same scroll, different content.

---

## What it actually does

You open it. A short video plays. You scroll. Another short video plays. Every video is curated from educational YouTube channels — Veritasium, Kurzgesagt, Ali Abdaal, 3Blue1Brown, Doctor Mike, and more. No cat videos, no rage bait, no algorithm optimizing for outrage.

Want to go deeper on something? Tap **Go Deeper**. An AI generates a written explanation of the topic — key concepts, follow-up questions, what to explore next. Free reading material that turns a 60-second hook into actual learning.

Pick a category from the menu (Science, Tech, Business, Math, History, Mind, Health, Language) to filter the feed. Or leave it on All and let curiosity decide.

---

## Why this exists

I'm in a coding bootcamp in Switzerland. I've watched myself and people around me lose hours every day to scroll feeds that give nothing back. The format works — short videos, vertical scroll, low commitment — but the content is junk.

So I rebuilt the format with content that gives something back. Same dopamine, different deposit.

---

## Tech stack

- **Frontend:** React + Vite + Tailwind, deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database:** Supabase (PostgreSQL)
- **Video player:** YouTube IFrame API with a custom persistent-player architecture
- **AI:** OpenRouter (currently using GPT-4o-mini for deep-dives)

The architecture had to solve a non-obvious problem: TikTok-style feeds with YouTube embeds are slow and crash mobile browsers if you do it the obvious way. After a lot of failed attempts (multi-iframe windowing, virtualization with windows of varying sizes, parallel preloading), I landed on a single persistent iframe that swaps videos via `loadVideoById()`. One iframe alive for the whole session. Memory stays low, audio permission persists, transitions are nearly instant.

Lesson: the simplest design is usually the right one, but you have to walk the wrong paths first to know which one is simple.

---

## How to run it locally

You'll need Node.js 18+, a Supabase account (free), a YouTube Data API key (free), and an OpenRouter API key (cheap).

```bash
# Clone and install
git clone https://github.com/samim-data/Scroll-Learn.git
cd Scroll-Learn

# Backend
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Backend runs on `localhost:3001`, frontend on `localhost:5173`.

To populate your database with channels and videos, run:

```bash
cd backend
node src/scripts/seedChannels.js
node src/scripts/refreshLibrary.js
```

The refresh script fetches recent shorts (≤180 seconds) from each seeded channel and stores their metadata. The frontend reads from your database, never directly from YouTube — keeps things fast and within API limits.

---

## What's working

- Single persistent player architecture (no crashes, no slow loads)
- Custom scroll zones on the sides of the video for navigation (works on desktop and mobile)
- Category filtering
- Pagination that loads in the background during browser idle time
- AI-powered "Go Deeper" feature with database caching (free after first request per video)
- Bottom-sheet UI for the deep-dive that feels native on mobile

---

## What's not done yet (and being honest about it)

- **Library is small.** ~300-400 videos across ~20 channels. Goal is 2000+ across 50-80 channels.
- **No recommendation algorithm.** Feed is reverse-chronological. A real personalization layer (based on watch behavior + tags + content embeddings) is the v2 plan.
- **No saved/liked videos.** Refresh and your spot is gone.
- **AI deep-dives use metadata, not transcripts.** GPT sees the title, description, and channel — not the actual video content. Good enough for most well-described videos. To do it properly, I'd need to pull YouTube transcripts, which is a bigger feature.
- **No native mobile app.** Web only for now. React Native version planned after user validation.
- **No search.** Browsing only. Search needs a tags column and a real query layer.
- **Compliance work pending.** Currently using YouTube's standard embed which is fine for personal/educational use, but anything commercial would need a deeper review of YouTube's API Terms (especially around custom UI overlays and ad handling).

---

## Hackathon sprint — shipping in 12 hours

4 developers, 12 hours, 6 features:

| Feature | Owner | Tools |
|---|---|---|
| Branding + Search UI + Save button + Slide renderer | Dev 1 | Lovable |
| Schema migrations + Search/Save/Watch APIs + Recommendation | Dev 2 | Kimi |
| Transcript fetching + AI slide generation (summary/concept/quiz) | Dev 3 | Kimi |
| Supabase Auth + JWT middleware + Login/Signup pages | Dev 4 | Kimi |

> Full sprint plan, hour-by-hour breakdown, and AI tool usage: **[wiki/Hackathon-Sprint](https://github.com/samim-data/Scroll-Learn/wiki/Hackathon-Sprint)**

---

## Roadmap (rough)

**Hackathon MVP** — Auth, search, save, transcript-powered deep dive slides, category-based personalisation

**v2** — Recommendation algorithm based on user watch behavior, learning paths (curated playlists for specific topics), pgvector embeddings

**v3** — Expo mobile app (iOS + Android), full interactive AI slide deck (6 types), personalised recommendation engine, user stats dashboard

> Full engineering wiki: **[docs/](./docs/README.md)** &nbsp;|&nbsp; **[GitHub Wiki](https://github.com/samim-data/Scroll-Learn/wiki)**

---

## Known issues

- First video opens muted (browser autoplay policy). Tap once and every subsequent video plays with sound.
- Render free tier sleeps after 15 minutes. First request after sleep takes ~30 seconds to wake the backend. After that, fast.
- Mobile Safari is occasionally weird about touch events on iframes. Side scroll zones handle most of this.

---

## Built by

**Samim Yasinzada** — currently at Powercoders coding bootcamp in Switzerland. Born in Afghanistan, raised across three countries, now figuring out where I land. This is the first real product I've shipped.

If you've used it and have thoughts (good, bad, or "this is broken") — I'd genuinely love to hear them. The whole point of shipping is to get feedback from people who weren't in my head when I built it.

Reach out: sam.yasinzada@gmail.com

---

## License

All rights reserved. The code is here so people can read it and learn from it. If you want to use any of it commercially, contact me first.
