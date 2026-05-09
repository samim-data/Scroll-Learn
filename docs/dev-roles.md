# Developer Roles — 4-Person Team

> Each developer owns a vertical slice. Dependencies are listed so you know what to unblock first.

---

## Team Overview

| Dev | Role | Primary responsibility |
|---|---|---|
| **Dev 1** | Mobile Frontend | Expo app, all screens, slide renderer, branding |
| **Dev 2** | Backend & Data | Express routes, Supabase schema, search, tracking |
| **Dev 3** | AI & ML | Embeddings, recommendation engine, slide generation |
| **Dev 4** | Auth & DevOps | Supabase Auth, JWT, EAS builds, CI/CD |

---

## Dev 1 — Mobile Frontend (Expo)

**Owns the entire app layer.**

### Tasks

| Task | Details |
|---|---|
| Expo project init | `npx create-expo-app`, NativeWind config, `eas.json` |
| Feed screen | `FlatList` + `pagingEnabled` + `viewabilityConfig` |
| YouTubePlayer | `react-native-youtube-iframe` — same `loadVideoById` API as current iframe |
| VideoCard | thumbnail, save bookmark icon, like/dislike thumbs |
| SlideSheet | `react-native-bottom-sheet`, horizontal `FlatList` for slides |
| SummarySlide | big text + emoji + gradient background |
| ConceptSlide | term card + SVG icon via `react-native-svg` |
| MindMapSlide | SVG radial tree, tap node to expand |
| QuizSlide | 4-option tap → reveal correct answer + explanation |
| TimelineSlide | vertical SVG steps |
| RelatedSlide | tap card → opens search for that topic |
| Search screen | `SearchBar` debounced, results list |
| Saved screen | same FlatList layout filtered to saved videos |
| Profile / Stats | Victory Native bar chart (categories), ring (completion rate), streak calendar |
| Branding | `theme.ts` design tokens, logo SVG, custom fonts via `@expo-google-fonts/inter` |
| Onboarding | 3-step category picker for cold-start users (no history yet) |

### Can start day 1 with mocked data

```typescript
// mock/videos.ts  — use until Dev 2 routes are ready
// mock/slides.ts  — use until Dev 3 deepdive endpoint returns slide_json
```

---

## Dev 2 — Backend & Data Layer

**Owns all new API routes and the database schema.**

### Tasks

| Task | Details |
|---|---|
| pgvector setup | `CREATE EXTENSION vector` in Supabase |
| DB migrations | `saved_videos`, `watch_history`, `channel_affinity`, new columns on `videos` + `user_profiles` |
| RLS policies | `user_id = auth.uid()` on every new table |
| `GET /api/search?q=` | Supabase `fts` on `title \|\| description`, ranked results |
| `GET /api/saved` | list user's saved videos, paginated |
| `POST /api/saved` | save a video |
| `DELETE /api/saved/:id` | unsave |
| `POST /api/watch` | insert watch event, upsert `channel_affinity` score |
| `POST /api/like/:id` | update `liked` on latest `watch_history` row |
| `GET /api/stats` | total watch time, category breakdown, streak, completion rate |
| Feed route update | pass `req.user.id` to recommend service instead of plain `ORDER BY published_at` |

### Dependencies

- Needs `middleware/auth.js` from Dev 4 before protected routes work
- DB schema must be merged before Dev 3 can store embeddings

---

## Dev 3 — AI & Recommendation Engine

**Owns everything intelligence-related.**

### Tasks

| Task | Details |
|---|---|
| `services/transcript.js` | `youtube-transcript` npm, fetch + clean CC captions, store in `videos.transcript_text` |
| `services/embeddings.js` | build input string (title + description + transcript[:1000]), call OpenRouter `text-embedding-3-small`, store `videos.embedding` |
| `scripts/generateEmbeddings.js` | backfill all existing videos, rate-limited |
| `services/recommend.js` | pgvector cosine query + 5-layer scoring (see [recommendation-engine.md](./recommendation-engine.md)) |
| `GET /api/recommend` | real-time scoring endpoint with diversity injection |
| `jobs/refreshUserVectors.js` | nightly: compute `pref_vector` + LLM interest narrative + `interest_emb` per active user |
| `services/slideGenerator.js` | LLM prompt returning JSON slide schema, parse + validate |
| Deep dive upgrade | modify `routes/deepdive.js` — inject `transcript_text`, call `slideGenerator`, cache `slide_json` |
| Next-video LLM pick | on `video_ended` event, call `gpt-4o-mini` with top-5 candidates → return best next video id |
| Refresh script update | call transcript + embed service on every new video insert |

### Dependencies

- Needs `transcript_text` and `embedding` columns from Dev 2 schema
- Nightly job needs `SUPABASE_SERVICE_ROLE_KEY` from Dev 4

---

## Dev 4 — Auth, Platform & DevOps

**Owns authentication end-to-end, builds, and deployment.**

### Tasks

| Task | Details |
|---|---|
| Supabase Auth | Enable email + Google OAuth in Supabase dashboard |
| `middleware/auth.js` | `verifyJWT()` — extract user from Supabase token, attach to `req.user` |
| `context/AuthContext.tsx` | session state, `useAuth()` hook, token refresh, `ProtectedRoute` component |
| Login screen wiring | Supabase JS client + `expo-auth-session` for Google OAuth |
| Auto-create profile | Supabase trigger on `auth.users` insert → insert into `user_profiles` |
| `GET /PATCH /api/auth/me` | fetch and update user profile |
| `eas.json` | EAS Build config for dev / preview / production |
| GitHub Actions | lint + type-check on PR, EAS build on merge to `main` |
| Nightly cron | Render cron calling `POST /api/admin/refresh-vectors` (secured with `REFRESH_SECRET`) |
| `.env.example` | keep up-to-date with all new variables |

---

## Dependency Map

```
Dev 4  schema migrations + auth middleware + EAS config
  │
  ├──► Dev 2  all protected routes unblock
  │      │
  │      └──► Dev 1  swap mocks for real API calls
  │
  └──► Dev 3  embedding + transcript columns exist in DB
         │
         ├──► Backfill script runs independently (no frontend needed)
         │
         └──► Dev 1  SlideSheet renders once /api/deepdive returns slide_json
```

**Safe to start in parallel on day 1:**
- Dev 1 with mock data
- Dev 3 backfill script locally
- Dev 4 Supabase Auth config (dashboard only, no code yet)
