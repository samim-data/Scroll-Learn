# API Reference

Base URL: `http://localhost:3001` (local) or your Render URL (production)

All protected routes require:
```
Authorization: Bearer <supabase_jwt_token>
```

---

## Public routes (no auth)

### `GET /health`
Returns server status.

```json
{ "status": "ok", "timestamp": "2026-05-09T10:00:00.000Z" }
```

---

### `GET /api/feed`
Returns paginated video feed. Without auth returns chronological feed. With auth returns personalised ranked feed.

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 5 | Number of videos (max 50) |
| `offset` | int | 0 | Pagination offset |
| `category` | string | — | Filter: `science` `tech` `business` `math` `history` `mind` `health` `language` |

**Response**
```json
{
  "videos": [
    {
      "id": "uuid",
      "youtube_video_id": "dQw4w9WgXcQ",
      "title": "How Quantum Computers Work",
      "description": "...",
      "thumbnail_url": "https://...",
      "duration_seconds": 142,
      "view_count": 1200000,
      "published_at": "2024-03-15T00:00:00Z",
      "channel": {
        "id": "uuid",
        "name": "Veritasium",
        "category": "science",
        "youtube_channel_id": "UCHnyfMqiRRG1u-2MsSQLbXA"
      }
    }
  ],
  "hasMore": true
}
```

---

### `GET /api/channels`
Returns all channels, optionally filtered by category.

**Query params:** `category` (optional)

**Response**
```json
{
  "channels": [ { "id": "uuid", "name": "Veritasium", "category": "science", ... } ],
  "count": 20
}
```

---

### `GET /api/videos/:id`
Returns a single video with its channel.

**Response**
```json
{ "video": { ...video fields, "channel": { ...channel fields } } }
```

---

### `GET /api/search`
Full-text search across video titles and descriptions.

**Query params**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | yes | Search query |
| `limit` | int | no | Default 20 |
| `offset` | int | no | Default 0 |

**Response** — same shape as `/api/feed`

---

### `GET /api/deepdive/:videoId`
Returns interactive slide JSON for a video. Generates on first call, cached on all subsequent calls.

**Path param:** `videoId` — the YouTube video ID (e.g. `dQw4w9WgXcQ`)

**Response**
```json
{
  "slides": [
    { "type": "summary", "title": "Quantum Entanglement", "body": "...", "emoji": "⚛️" },
    { "type": "concept", "term": "Superposition", "definition": "...", "svg_icon_name": "wave" },
    { "type": "mindmap", "center": "Quantum Computing", "branches": [
        { "label": "Qubits", "children": ["Superposition", "Entanglement"] },
        { "label": "Applications", "children": ["Cryptography", "Drug discovery"] }
    ]},
    { "type": "quiz", "question": "What makes a qubit different from a classical bit?",
      "options": ["It can be 0", "It can be 1", "It can be both at once", "It is faster"],
      "answer_index": 2, "explanation": "Superposition allows a qubit to exist in both states simultaneously." },
    { "type": "timeline", "title": "Quantum Computing Milestones",
      "steps": [{ "year": 1981, "event": "Feynman proposes quantum simulation" }, ...] },
    { "type": "related", "topics": [
        { "title": "String Theory", "category": "science", "query": "string theory explained" }
    ]}
  ],
  "cached": false
}
```

---

## Protected routes (require auth)

### `GET /api/recommend`
Returns personalised video recommendations for the authenticated user.

**Query params:** `limit` (default 20), `current_video_id` (optional — used for "next video" ranking)

**Response** — same shape as `/api/feed`, with additional `score` field per video

---

### `GET /api/saved`
Returns the authenticated user's saved videos.

**Query params:** `limit`, `offset`

---

### `POST /api/saved`
Save a video.

**Body**
```json
{ "video_id": "uuid" }
```

**Response**
```json
{ "saved": true }
```

---

### `DELETE /api/saved/:videoId`
Unsave a video.

**Response**
```json
{ "saved": false }
```

---

### `POST /api/watch`
Track a watch event. Call this when a video ends or the user scrolls away.

**Body**
```json
{
  "video_id": "uuid",
  "watch_duration_sec": 95,
  "duration_ratio": 0.87,
  "completed": true
}
```

**Response**
```json
{ "ok": true }
```

---

### `POST /api/like/:videoId`
Record an explicit like or dislike.

**Body**
```json
{ "liked": true }
```

**Response**
```json
{ "ok": true }
```

---

### `GET /api/stats`
Returns aggregated watch statistics for the authenticated user.

**Response**
```json
{
  "total_watch_seconds": 14400,
  "total_videos": 97,
  "completion_rate": 0.74,
  "streak_days": 5,
  "category_breakdown": {
    "science": 42,
    "tech": 28,
    "math": 15,
    "history": 12
  },
  "top_channels": [
    { "name": "Veritasium", "watch_count": 18 }
  ]
}
```

---

### `GET /api/auth/me`
Returns the authenticated user's profile.

**Response**
```json
{
  "user_id": "uuid",
  "display_name": "Alex",
  "avatar_url": "https://...",
  "created_at": "2026-05-09T00:00:00Z"
}
```

---

### `PATCH /api/auth/me`
Update display name or avatar.

**Body**
```json
{ "display_name": "Alex", "avatar_url": "https://..." }
```

---

## Admin routes (server-side secret)

### `POST /api/admin/refresh`
Triggers a full library refresh — fetches new videos from all channels.

**Header:** `x-refresh-secret: <REFRESH_SECRET>`

### `POST /api/admin/refresh-vectors`
Triggers the nightly user-vector recompute job.

**Header:** `x-refresh-secret: <REFRESH_SECRET>`
