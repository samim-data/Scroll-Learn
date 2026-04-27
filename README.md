# Scroll-Learn

A curated short-form video app that turns scrolling time into learning time.

Every video is hand-selected from trusted educational creators across science, tech, business, math, and more. Built mobile-first with a TikTok-style vertical scroll experience.

🔗 **Live demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## Why this exists

Young adults spend hours daily on short-form video platforms, but most of that time is entertainment, not learning. Existing educational platforms don't fit the scroll habit — they require scheduled time and intentional effort.

Scroll-Learn is built for people who want to learn during the same downtime they'd otherwise spend on TikTok or YouTube Shorts. The same scrolling experience, but with curation that guarantees every video is worth watching.

---

## Features

- **Vertical scroll feed** with snap-to-video behavior and auto-play on focus
- **Smart play/pause** — only the currently visible video plays, others pause and mute
- **Curated content** from hand-selected educational creators
- **Category filtering** across science, tech, business, math, history, philosophy, health, and language
- **Auto-refreshing library** that pulls new videos from trusted channels daily
- **Mobile-first** layout with phone-shape video container, centered on desktop

---

## Tech stack

**Frontend**
- React + Vite
- Tailwind CSS
- YouTube IFrame API for player control
- IntersectionObserver for scroll-aware playback

**Backend**
- Node.js + Express
- Supabase (PostgreSQL)
- YouTube Data API v3
- Axios for external API calls

**Hosting**
- Frontend: Vercel
- Backend: Render
- Database: Supabase

---

## Architecture

The key architectural decision: video metadata is cached in our own database. User scrolling never triggers YouTube API calls. The YouTube API is only used by a scheduled background job that refreshes the library daily, keeping daily quota usage well under 1% of the 10,000 unit allowance.

User browser → Frontend (Vercel) → Backend (Render) → Supabase Postgres + YouTube Data API v3

---

## Getting started

### Prerequisites

- Node.js 18 or higher
- A Supabase project (free tier works)
- A YouTube Data API v3 key

### Backend setup

    cd backend
    npm install

Create a `.env` file in the `backend` folder:

    SUPABASE_URL=your-supabase-project-url
    SUPABASE_ANON_KEY=your-supabase-anon-key
    YOUTUBE_API_KEY=your-youtube-api-key
    REFRESH_SECRET=any-long-random-string
    PORT=3001

Set up the database tables in Supabase SQL Editor:

    create table channels (
      id bigint primary key generated always as identity,
      youtube_channel_id text unique not null,
      name text,
      category text not null,
      uploads_playlist_id text,
      added_at timestamptz default now()
    );

    create table videos (
      id bigint primary key generated always as identity,
      youtube_video_id text unique not null,
      channel_id bigint references channels(id) on delete cascade,
      title text not null,
      description text,
      thumbnail_url text,
      duration_seconds integer,
      published_at timestamptz,
      view_count bigint,
      like_count bigint,
      fetched_at timestamptz default now()
    );

    create index videos_channel_id_idx on videos(channel_id);
    create index videos_published_at_idx on videos(published_at desc);

    alter table channels disable row level security;
    alter table videos disable row level security;

Add channels to seed by editing `backend/src/scripts/seedChannels.js`, then run:

    node src/scripts/seedChannels.js

Start the backend:

    npm run dev

Backend runs on http://localhost:3001

### Frontend setup

    cd frontend
    npm install

Create a `.env.local` file in the `frontend` folder:

    VITE_API_URL=http://localhost:3001/api

Start the frontend:

    npm run dev

Frontend runs on http://localhost:5173

---

## Project structure

    scroll-learn/
    ├── backend/
    │   ├── src/
    │   │   ├── routes/
    │   │   │   ├── feed.js
    │   │   │   └── admin.js
    │   │   ├── services/
    │   │   │   ├── youtube.js
    │   │   │   └── refreshLibrary.js
    │   │   ├── scripts/
    │   │   │   ├── seedChannels.js
    │   │   │   └── refreshLibrary.js
    │   │   ├── supabase.js
    │   │   └── index.js
    │   └── package.json
    └── frontend/
        ├── src/
        │   ├── components/
        │   │   ├── Feed.jsx
        │   │   ├── VideoCard.jsx
        │   │   └── CategoryMenu.jsx
        │   ├── api.js
        │   ├── App.jsx
        │   ├── main.jsx
        │   └── index.css
        └── package.json

---

## API endpoints

**GET /api/feed** — Returns a shuffled list of videos with channel info. Query params: `limit` (default 20, max 50), `category` (optional).

**GET /api/channels** — Returns all channels, optionally filtered by category.

**GET /api/videos/:id** — Returns a specific video with channel info.

**POST /api/admin/refresh** — Triggers a library refresh. Requires `x-refresh-secret` header.

---

## Roadmap

- [ ] Saved videos feature
- [ ] Daily background refresh via Render Cron
- [ ] AI-powered "go deeper" feature for video topics
- [ ] User accounts and personalized recommendations
- [ ] Search across the curated library
- [ ] More categories and channels
- [ ] Mobile native app

---

## Built by

Samim — a Powercoders student in Switzerland building this while learning to code.

---

## License

This project is for educational purposes. All video content remains the property of its respective YouTube creators and is used via YouTube's official embed and API services in compliance with the YouTube API Terms of Service.
