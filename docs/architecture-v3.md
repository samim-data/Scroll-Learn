# Architecture v3

> Expo mobile app · Interactive AI slides · Personalised recommendation engine

---

## Platform Migration Summary

| Layer | v1 (current) | v3 (target) |
|---|---|---|
| App shell | React + Vite (browser SPA) | **Expo** (iOS + Android + Web) |
| Video player | `react-youtube` iframe | `react-native-youtube-iframe` |
| Styling | Tailwind CSS | **NativeWind** (same class syntax) |
| Routing | `react-router-dom` | **Expo Router** (file-based) |
| Scroll detection | `IntersectionObserver` | `FlatList` `viewabilityConfig` |
| Animations | Framer Motion | **React Native Reanimated 3** |
| Charts | Recharts | **Victory Native** + `react-native-svg` |
| Deep dive | Markdown text | **LLM JSON → swipeable SVG slides** |
| Feed order | `published_at DESC` | **AI recommendation engine** |

---

## Full System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  EXPO APP  (React Native + NativeWind + Expo Router)                     │
│                                                                          │
│  app/ (Expo Router file-based)                                           │
│  ├── (auth)/login.tsx          email + Google OAuth                      │
│  ├── (auth)/signup.tsx                                                   │
│  ├── (tabs)/index.tsx          Feed screen                               │
│  ├── (tabs)/search.tsx         Search + results                          │
│  ├── (tabs)/saved.tsx          Saved videos                              │
│  └── (tabs)/profile.tsx        Stats dashboard                           │
│                                                                          │
│  components/                                                             │
│  ├── Feed/VideoFeed.tsx         FlatList pagingEnabled                   │
│  ├── Feed/VideoCard.tsx         thumbnail + save + like/dislike          │
│  ├── Feed/YouTubePlayer.tsx     single persistent player                 │
│  ├── DeepDive/SlideSheet.tsx    bottom sheet → horizontal slide swipe    │
│  ├── DeepDive/slides/           SummarySlide, ConceptSlide, MindMap,     │
│  │                              QuizSlide, TimelineSlide, RelatedSlide   │
│  ├── Search/SearchBar.tsx                                                │
│  ├── Stats/StatsReport.tsx      Victory Native charts                    │
│  └── Brand/BrandHeader.tsx      logo + design tokens                     │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ Axios + Bearer JWT
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND  (Node.js + Express 5, port 3001)                               │
│                                                                          │
│  middleware/auth.js        verifyJWT() → req.user                        │
│                                                                          │
│  routes/                                                                 │
│  ├── feed.js               GET /api/feed  (now calls recommend service)  │
│  ├── search.js             GET /api/search?q=                            │
│  ├── saved.js              GET / POST / DELETE /api/saved                │
│  ├── watch.js              POST /api/watch                               │
│  ├── likes.js              POST /api/like/:id                            │
│  ├── stats.js              GET /api/stats                                │
│  ├── deepdive.js           GET /api/deepdive/:id  (returns slide JSON)   │
│  ├── recommend.js          GET /api/recommend                            │
│  └── admin.js              POST /api/admin/refresh                       │
│                                                                          │
│  services/                                                               │
│  ├── transcript.js         fetch YouTube CC captions                     │
│  ├── embeddings.js         text-embedding-3-small via OpenRouter         │
│  ├── slideGenerator.js     LLM → structured JSON slides                  │
│  └── recommend.js          multi-layer scoring engine                    │
│                                                                          │
│  jobs/                                                                   │
│  └── refreshUserVectors.js nightly batch → pref_vector + interest_emb   │
└──────────┬────────────────────────┬───────────────────────┬──────────────┘
           │                        │                       │
           ▼                        ▼                       ▼
  ┌──────────────────┐   ┌────────────────────┐   ┌──────────────────────┐
  │  Supabase        │   │  External APIs      │   │  OpenRouter          │
  │  PostgreSQL      │   │                     │   │                      │
  │  + pgvector      │   │  YouTube Data v3    │   │  gpt-4o-mini         │
  │  + Auth          │   │  youtube-transcript │   │    slide generation  │
  │                  │   │    (CC captions)    │   │    interest text     │
  │  See schema      │   │                     │   │    next-video pick   │
  │  below           │   │                     │   │                      │
  └──────────────────┘   └────────────────────┘   │  text-embedding      │
                                                   │  -3-small            │
                                                   │    video embeddings  │
                                                   │    user pref vector  │
                                                   └──────────────────────┘
```

---

## Database Schema

### Existing tables (unchanged)

```
channels   id, youtube_channel_id, name, uploads_playlist_id, category
videos     id, youtube_video_id, channel_id, title, description,
           thumbnail_url, duration_seconds, view_count, like_count,
           published_at, deep_dive_text
```

### New columns on `videos`

```sql
ALTER TABLE videos ADD COLUMN transcript_text  TEXT;
ALTER TABLE videos ADD COLUMN embedding        vector(1536);
ALTER TABLE videos ADD COLUMN slide_json       JSONB;
```

### New tables

```sql
CREATE TABLE user_profiles (
  user_id        UUID PRIMARY KEY REFERENCES auth.users,
  display_name   TEXT,
  avatar_url     TEXT,
  pref_vector    vector(1536),   -- weighted avg of watched video embeddings
  interest_text  TEXT,           -- LLM-generated interest narrative (plain text)
  interest_emb   vector(1536),   -- embedding of interest_text
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_videos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users,
  video_id  UUID REFERENCES videos,
  saved_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE TABLE watch_history (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users,
  video_id           UUID REFERENCES videos,
  watched_at         TIMESTAMPTZ DEFAULT now(),
  watch_duration_sec INT,
  duration_ratio     FLOAT,     -- 0.0–1.0 how much of the video they watched
  completed          BOOLEAN,
  liked              BOOLEAN    -- NULL = no signal, true/false = explicit tap
);

CREATE TABLE channel_affinity (
  user_id     UUID REFERENCES auth.users,
  channel_id  UUID REFERENCES channels,
  score       FLOAT DEFAULT 0, -- incremented on each watch event
  updated_at  TIMESTAMPTZ,
  PRIMARY KEY (user_id, channel_id)
);
```

### Row-level security

Every new table has an RLS policy: `user_id = auth.uid()`.  
Only the nightly batch job uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

---

## Environment Variables

### Backend `.env`

```
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # for batch jobs only
YOUTUBE_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
REFRESH_SECRET=                 # shared secret for /api/admin/refresh
```

### Frontend (Expo) `.env`

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Deployment Targets

| Platform | Tool | Target |
|---|---|---|
| iOS | EAS Build | TestFlight → App Store |
| Android | EAS Build | Internal track → Play Store |
| Web | `expo export` + Vercel | Static site (same codebase) |
| Backend | Render | Node.js dyno |
| Database | Supabase | Managed PostgreSQL |
| AI | OpenRouter | Pay-as-you-go |

---

## New npm Packages

### Expo app

```
expo-router
react-native-youtube-iframe
nativewind
react-native-reanimated
react-native-gesture-handler
react-native-svg
react-native-bottom-sheet
victory-native
@expo-google-fonts/inter
@supabase/supabase-js
expo-auth-session
expo-secure-store
```

### Backend

```
youtube-transcript
```
