#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[start]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
error() { echo -e "${RED}[error]${NC} $*"; exit 1; }

# ── Guard: node & npm ──────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || error "node not found. Install Node.js 18+."
command -v npm  >/dev/null 2>&1 || error "npm not found."
info "Node $(node -v)  npm $(npm -v)"

# ── Backend .env ───────────────────────────────────────────────────────────────
if [ ! -f "$BACKEND/.env" ]; then
  warn "backend/.env not found — creating from template. Fill in the values before use."
  cat > "$BACKEND/.env" <<'EOF'
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
YOUTUBE_API_KEY=
OPENROUTER_API_KEY=
REFRESH_SECRET=
EOF
fi

# ── Frontend .env ──────────────────────────────────────────────────────────────
if [ ! -f "$FRONTEND/.env" ]; then
  warn "frontend/.env not found — creating with default local backend URL."
  echo "VITE_API_URL=http://localhost:3001/api" > "$FRONTEND/.env"
fi

# ── Install dependencies ────────────────────────────────────────────────────────
if [ ! -d "$BACKEND/node_modules" ]; then
  info "Installing backend dependencies..."
  (cd "$BACKEND" && npm install)
fi

if [ ! -d "$FRONTEND/node_modules" ]; then
  info "Installing frontend dependencies..."
  (cd "$FRONTEND" && npm install)
fi

# ── Start both services ─────────────────────────────────────────────────────────
info "Starting backend  → http://localhost:3001"
info "Starting frontend → http://localhost:5173"
echo ""

# Trap Ctrl-C and kill both child processes
trap 'kill 0' SIGINT SIGTERM

(cd "$BACKEND"  && npm run dev)  &
(cd "$FRONTEND" && npm run dev)  &

wait
