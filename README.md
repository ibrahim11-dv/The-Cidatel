# The Citadel

This repository contains two applications:

- `client`: React + Vite frontend, running on port `5173`
- `server`: Spring Boot API, running on port `8080`

The frontend calls `/api` through Vite's local proxy. The backend owns account data, online game checkpoints, signed-in puzzle progress, and signed-in appearance and board preferences; it uses BCrypt password hashes, signed JWT sessions, and short server-side limits for authentication bursts. Local and bot game records remain browser-local so those modes stay usable without a server. The account scorebook combines every available local, bot, and online record, initially showing its seven most recent entries with an option to expand the complete list.

The bot table uses Stockfish 19's lite, single-threaded browser engine. Six strength configurations use skill and search-time limits; these are not calibrated player Elo ratings. Players can choose either color or random seating, enable hints, take back their turn, and restart the engine after a failure. The worker, WebAssembly binary, and its GPL-3.0 license text are prepared from the `stockfish` dependency when you run the client.

Local play supports click and pointer-drag moves, promotion, time controls, draw claims/agreement, board flipping, move review, FEN/PGN files, and automatic restoration on this browser. Timed games continue while the page is closed. Appearance settings include six complete browser-saved palettes.

Online play provides authenticated private invitations with a confirmed copy action, compatible-time-control matchmaking, server-validated moves and clocks, draw offers and claims, resignation, and mutually accepted rematches. The client polls for updates. Game checkpoints use the existing database and active games reload at startup with downtime deducted; pending invitations, queue entries, and rematch offers remain transient. Run one backend instance. The browser acceptance command below uses two isolated Microsoft Edge sessions to verify account-backed theme, custom-color, and board-preference restoration; invitation copying and joining; move and clock synchronization; refresh recovery; draw agreement; rematches; scorebook results; and cancelling then restarting matchmaking.

## Client

```text
cd client
npm install
npm run dev
```

## Server

The server requires Java 17+ and Maven.

```text
cd server
mvn spring-boot:run
```

Start the server before using account features in the client. The API stores local development data in `server/data/` and provides:

- `POST /api/auth/register` and `POST /api/auth/login`
- authenticated account/profile endpoints under `/api/account/me`
- `GET /api/health`

For deployment, always provide a strong Base64-encoded `JWT_SECRET` environment variable. The value in `application.properties` is a development-only fallback.

## Checks

```text
cd server
mvn test

cd ../client
npm run verify:auth
npm run verify:api
npm run verify:local
npm run verify:scorebook
npm run verify:data
npm run verify:bot
npm run verify:engine-protocol
npm run build
```

With both development servers running, this checks the full online journey in two isolated Edge sessions:

```text
cd client
npm run verify:online-browser
```

With the client development server running, this checks single-stop arrow-key board navigation and rendered local play, promotion, persisted orientation, and completion actions; puzzle-board flipping plus one-move and multi-move puzzle solving with retry; Stockfish play as either color; bot selection; theme switching; touch-sized layout; and reduced-motion board moves in Edge:

```text
cd client
npm run verify:browser-ui
```
