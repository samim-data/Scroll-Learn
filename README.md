# Scroll-Learn

A curated short-form video app that turns scrolling time into learning time.

Every video is hand-selected from trusted educational creators across science, tech, business, math, and more. Built mobile-first with a TikTok-style vertical scroll experience.

🔗 **Live demo:** https://scroll-learn.vercel.app/

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

## Built by

Samim — a Powercoders student in Switzerland building this while learning to code.

---

## License

This project is for educational purposes. All video content remains the property of its respective YouTube creators and is used via YouTube's official embed and API services in compliance with the YouTube API Terms of Service.
