# Local Setup

> Get the backend and frontend running on your machine in ~5 minutes.

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- A **Supabase** project (free) — [supabase.com](https://supabase.com)
- A **YouTube Data API v3** key (free, 10k req/day) — [console.cloud.google.com](https://console.cloud.google.com)
- An **OpenRouter** API key (pay-as-you-go, very cheap) — [openrouter.ai](https://openrouter.ai)

---

## Windows (one command)

```bat
cd Scroll-Learn
.\start.bat
```

This installs dependencies, creates `.env` files from templates, and opens two terminal windows — one for the backend, one for the frontend.

---

## Mac / Linux

```bash
cd Scroll-Learn
bash start.sh
```

---

## Manual setup (any OS)

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=3001
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciO...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciO...
YOUTUBE_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
REFRESH_SECRET=any-random-string
```

```bash
npm run dev   # starts on http://localhost:3001
```

### 2. Frontend (current React app)

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3001/api
```

```bash
npm run dev   # starts on http://localhost:5173
```

### 3. Seed the database (first time only)

```bash
cd backend
node src/scripts/seedChannels.js      # imports ~20 educational channels
node src/scripts/refreshLibrary.js    # fetches recent videos (≤180s) from each channel
```

---

## Verify everything works

| Check | URL |
|---|---|
| Backend health | [http://localhost:3001/health](http://localhost:3001/health) |
| Database connection | [http://localhost:3001/test-db](http://localhost:3001/test-db) |
| Video feed | [http://localhost:3001/api/feed?limit=5](http://localhost:3001/api/feed?limit=5) |
| Frontend | [http://localhost:5173](http://localhost:5173) |

---

## Expo setup (v3 — coming)

Once the Expo migration starts:

```bash
npm install -g eas-cli
cd expo-app
npm install
npx expo start         # opens Expo Go on your phone via QR code
npx expo start --web   # runs in browser
eas build --platform all --profile preview   # builds for iOS + Android
```

Create `expo-app/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciO...
```

---

## Common issues

| Problem | Fix |
|---|---|
| `Network Error` in frontend | Backend not running, or `VITE_API_URL` wrong |
| `relation "videos" does not exist` | Run seed scripts above |
| Backend cold start ~30s | Render free tier sleeps after 15 min. Use local backend to avoid this. |
| First video plays muted | Browser autoplay policy. Tap once — all subsequent videos play with sound. |
| `wsl.exe` error on Windows | Use `.\start.bat` not `bash start.sh` |
