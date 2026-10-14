# The Citadel — current architecture and feature audit

Audit updated 14 October 2026. This covers handwritten application source and verification scripts; generated bundles and Stockfish assets are excluded.

## Architecture

The client is React 19 with Vite 7 and React Router 7. `SessionContext` owns signed-in state, guest/account preferences, and board controls. `ChessBoard` is the single visual board used by local, bot, online, puzzle, home, preview, and replay experiences. `chess.js` owns client-side legal-move and local-game rules; Stockfish 19 runs in a browser Worker for bot games.

The server is Spring Boot 3.5 on Java 17. JPA/H2 persists accounts, appearance preferences, puzzle progress, and online-game checkpoints. The game aggregate uses chesslib for authoritative online move validation, clocks, draw adjudication, idempotent commands, and durable recovery. JWT sessions, BCrypt password hashes, CORS configuration, input validation, and short authentication-burst limits protect the API.

## Core feature audit

| Area | Status | Current evidence |
|---|---|---|
| Citadel identity and layout | IMPLEMENTED | Original rook mark and favicon in `client/public/citadel.svg`; titles and metadata in `client/index.html`; responsive shell in `Shell.jsx` and `styles.css`. |
| Shared chessboard | IMPLEMENTED | `ChessBoard.jsx` provides SVG pieces, click, pointer-drag, touch, legal/selected/last/check highlights, promotion, capture and castling animations, coordinates, arrows, premove markers, keyboard operation, roving focus, and reduced-motion behavior. |
| Local play | IMPLEMENTED | `LocalGame` preserves complete move history, clocks, legal special moves, automatic and claimable draws, resignation, review, FEN/PGN, persistent restoration, and completed-game records. `verify:local` covers the rules and timing path. |
| Bot play | IMPLEMENTED | `GamePage.jsx`, `useStockfish.js`, and `stockfishClient.js` provide genuine Worker-based Stockfish 19 play, six calibrated-by-skill configurations, color choice, hints, takebacks, lifecycle recovery, and sound/status feedback. `verify:bot` and the Edge journey cover both colors and live replies. |
| Online play | IMPLEMENTED | `GameController`, `GameSession`, and `PrivateGames` provide authenticated private links, compatible matchmaking, authoritative moves/clocks, draw offers and claims, resignations, rematches, refresh recovery, maintenance, abandonment, and history. `verify:online-browser` runs two isolated Edge accounts through the full visible flow. |
| Puzzles | IMPLEMENTED | `data/puzzles.js` contains composed studies plus attributed CC0 Lichess material. `PuzzlesPage.jsx` supports categories, valid lines, opponent replies, feedback, hints, reveal/retry/next, progression, board flip, local/account progress, and statistics. Catalog and stats verifiers validate the data and persistence behavior. |
| Themes and personalization | IMPLEMENTED | `themes.js`, `SettingsPage.jsx`, and account appearance endpoints provide six themes, custom color tokens, contrast feedback, board/piece choices, coordinates, legal markers, sound, movement speed, orientation, guest persistence, and account synchronization. |
| Profiles and history | IMPLEMENTED | Profile and guest scorebook views combine local, bot, and online records, offer full-history expansion, replay routes, player-relative results, and puzzle progress. |
| Accessibility and resilience | IMPLEMENTED | Semantic controls, focus return for confirmations, roving board focus, arrow-key navigation, touch controls, responsive breakpoints, reduced motion, and an application error boundary are present. The rendered Edge check verifies desktop, mobile, keyboard, and reduced-motion behavior. |

## Verification evidence

The current server suite contains 15 reports and 45 passing tests with zero failures and errors. It covers authentication, API error dispatch, account preference persistence, puzzle progress, game aggregate rules, clocks, timeout recovery, durable checkpoints, process restart, matchmaking, invitations, draw rules, rematches, and authorization.

Client verification includes legal local play, Stockfish protocol and live responses, puzzle catalog and statistics, data integrity, browser storage/auth boundaries, online helpers, profile records, board annotations, and production builds. The two main rendered checks are:

- `npm run verify:browser-ui` for local, bot, puzzle, settings, desktop/mobile, keyboard, and reduced-motion paths.
- `npm run verify:online-browser` for two independently authenticated Edge sessions using the real Spring server.

## Operational boundaries

Online updates use short polling rather than a WebSocket, with the server remaining authoritative. The current deployment model is one API instance: active games are durable across restart, while waiting queues, invitations, and rematch offers are intentionally transient. Authentication burst limits are in-process; multi-instance production deployments should apply the same limits at a shared edge or store.

The deliberately deferred areas remain advanced ratings, leaderboards, tournaments, social networks, subscriptions, broad anti-cheat systems, opening explorers, and full engine analysis. They are outside the defined core-mode scope.
