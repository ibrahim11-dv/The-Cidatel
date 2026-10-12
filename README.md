# The Citadel

This repository contains two applications:

- `client`: React + Vite frontend, running on port `5173`
- `server`: Spring Boot API, running on port `8080`

The frontend calls `/api` through Vite's local proxy. The backend owns account data and uses BCrypt password hashes and signed JWT sessions. Game records and puzzle progress remain browser-local for now, ready to be moved behind application ports when those API features are added.

The bot table uses Stockfish 19's lite, single-threaded browser engine. Six strength configurations use skill and search-time limits; these are not calibrated player Elo ratings. Players can choose either color or random seating, enable hints, take back their turn, and restart the engine after a failure. The worker, WebAssembly binary, and its GPL-3.0 license text are prepared from the `stockfish` dependency when you run the client.

Local play supports click and pointer-drag moves, promotion, time controls, draw claims/agreement, board flipping, move review, FEN/PGN files, and automatic restoration on this browser. Timed games continue while the page is closed. Appearance settings include six complete browser-saved palettes. Online multiplayer remains unimplemented; see `AUDIT.md` and `PROGRESS.md` for the roadmap and verification limits.

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
npm run verify:data
npm run verify:bot
npm run verify:engine-protocol
npm run build
```
