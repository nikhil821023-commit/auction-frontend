# 🏏 AuctionX — Frontend

The client for **AuctionX**, a real-time cricket player auction platform. Built with **React + Vite**, it renders live auction state — bidding, timers, sold events, and dashboards — as broadcast by the backend over WebSocket, with dedicated views for organizers, captains, spectators, and a big-screen projector mode.

🔗 **Live Demo:** [auction-frontend-mocha.vercel.app](https://auction-frontend-mocha.vercel.app/)

🔗 **Live Demo:** [auction-frontend-mocha.vercel.app](https://auction-frontend-mocha.vercel.app/)

---

## ✨ What This App Does

- Lets organizers set up tournaments, upload/manage players, and run the live auction
- Lets captains join by code (no login) and bid from their own screen
- Lets spectators watch via a share link and react with floating emojis
- Renders a full-screen **projector mode** for TV/stadium display during live events
- Plays an entirely file-free, IPL-style sound engine (gavel, crowd roar, bid war siren) via the Web Audio API
- Speaks sold announcements aloud using the Web Speech API
- Shows live, animated dashboards of team budgets and post-auction analytics

Every client is intentionally **stateless** — it just renders whatever the backend broadcasts, so all screens (organizer, captain, spectator, projector) always stay in sync.

---

## 🧱 Tech Stack

| Tool | Purpose |
|---|---|
| **React 18** | Component-based UI, hooks for state |
| **Vite** | Dev server and build tooling |
| **Zustand** | Global state — auction state, timer, shared dashboard data |
| **STOMP.js + SockJS** | WebSocket client, subscribes to real-time auction topics |
| **Framer Motion** | Animations — spinning wheel, card reveal, sold overlay |
| **React Hot Toast** | Bid notifications, sold alerts |
| **Web Audio API** | Generated sound effects — zero audio file dependencies |
| **Web Speech API** | Spoken "SOLD!" announcements |
| **Axios** | HTTP client with JWT interceptor |

---

## 🗺️ App Structure / Pages

```
HomePage → AuthPage → OrganizerSetup → PlayerManage
  → LobbyOrganizer → AuctionRoom → PostAuction

CaptainView     ← joins by 6-char code, no login
SpectatorView   ← watches via share link, no login
ProjectorView   ← full-screen big display for live events
```

---

## 🔌 Real-Time Connection

The app subscribes to WebSocket topics published by the backend:

| Topic | Purpose |
|---|---|
| `/topic/auction/{id}` | Bid events, phase changes (spin, reveal, sold, unsold) |
| `/topic/auction/{id}/timer` | Per-second countdown tick |
| `/topic/dashboard/{id}` | Live team budget updates |
| `/topic/reactions/{id}` | Spectator emoji reactions |

On reconnect (e.g. after a refresh), the client re-subscribes and receives the current server state immediately — no local timer or auction state is treated as authoritative.

---

## 🎯 Key Features

### 🎰 Spinning Wheel & Reveal
An animated SVG wheel (Framer Motion) spins through the remaining player pool, then flips into a dramatic player reveal card. Platinum-tier players get an extended golden shimmer animation.

### 💰 Bidding
Two supported modes, switchable mid-auction:
- **Organizer-controlled** — organizer taps a captain's button to place bids on their behalf
- **Captain self-bid** — captains bid directly from their own screen, validated with a session token

### 🔊 Sound Engine
The `useAuctionSounds` hook builds every effect from raw oscillators — no MP3s:
- Gavel: sawtooth wave with a pitch drop
- Bid war: pink noise (crowd) + sine drums + rising siren
- Sold announcements spoken aloud via the Web Speech API (e.g. *"SOLD! Virat Kohli. Going to Mumbai Indians! For 20 lakh!"*)

Sounds are unlocked on the first user gesture to satisfy browser autoplay policies.

### 📊 Live Dashboard
Every `SOLD` event triggers a dashboard rebuild on the backend; the frontend's Zustand store updates all subscribed components instantly, with animated team budget progress bars.

### 👀 Spectator Mode
No account needed — anyone with the link can watch, send floating emoji reactions, and see a full-screen SOLD overlay in the winning team's color.

### 🖥️ Projector Mode
Purpose-built for TV/stadium display:
- Stadium scoreboard aesthetic — black, yellow-green (`#c8ff00`), and cyan (`#00e5ff`)
- Giant SVG circular timer with glow effect
- Full-screen red pulse + crowd sound during bid wars
- Scrolling bottom ticker of recent sold events, news-channel style

### 📋 Post-Auction Analytics
- Per-player bid timeline and mini price chart
- Team spend breakdown by tier and role
- MVP score: `(soldPrice / basePrice) × tierMultiplier × log(bidCount)`
- Auction pace tracker (bids per player)

---

## 🧩 Notable Engineering Decisions

| Problem | Solution |
|---|---|
| Browsers block Web Speech API calls from WebSocket callbacks | An `unlock()` function fires a silent utterance on first user gesture to pre-authorize speech |
| Keeping every screen in sync (organizer/captain/spectator/projector) | Client is fully stateless — backend is the single source of truth, frontend only renders broadcasts |
| Timer state on refresh | No client-side timer persistence — reconnecting re-subscribes to `/topic/auction/{id}/timer` and gets the live value |

---

## 🚀 Getting Started

Want to try it without setting anything up first? Check out the [live demo](https://auction-frontend-mocha.vercel.app/).

### Prerequisites
- Node.js 18+
- The AuctionX backend running (see backend README)

### Setup

```bash
git clone <repo-url>
cd auctionx-frontend
npm install
```

Create a `.env` file:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 🌐 Deployment

The frontend is deployed on **Vercel**: [https://auction-frontend-mocha.vercel.app/](https://auction-frontend-mocha.vercel.app/)

To deploy your own instance:

1. Push this repo to GitHub
2. Import it into [Vercel](https://vercel.com/)
3. Set the environment variables under **Project Settings → Environment Variables**:
   - `VITE_API_BASE_URL` — your deployed backend URL
   - `VITE_WS_URL` — your deployed backend's WebSocket endpoint
4. Deploy — Vercel auto-builds with `npm run build` and serves the `dist/` output

---

## 🔭 Roadmap

- Mobile app (React Native), reusing the same backend WebSocket
- In-lobby/auction team chat UI
- Live camera feed integration for spectators
- Auto-bid bot controls (captain sets a max price)

