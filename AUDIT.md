# The Citadel — audit and implementation roadmap

Audit date: 10 October 2026. Scope: all handwritten client/server source, configuration and existing verification scripts; generated bundles and vendored engine binaries are not application source.

## Architecture

React 19 + Vite 7 + React Router 7. Component state and SessionContext; CSS is centralized in styles.css. One ChessBoard is shared by local, bot, puzzles, home and replay screens. chess.js 1.4 validates client moves. Stockfish 19 runs lazily in a Web Worker. Spring Boot 3.5.6/Java 17 exposes account REST endpoints through Vite's /api proxy. JPA/H2 stores accounts and three appearance preferences. BCrypt hashes passwords; JWT sessions are held in sessionStorage. Game records and solved puzzle IDs are localStorage data, not server records.

## Initial feature audit

| Area | Status | Evidence and required changes |
|---|---|---|
| Local play | PARTIAL / repetition BROKEN | GamePage.jsx reconstructs Chess from FEN every ply, losing history. Click moves, promotion, resignation and SAN exist. No clocks, flip, draw agreement/claims, drag, imports or guest review. |
| Rules | PARTIAL | chess.js handles legal movement, castling, en passant, promotion, mate/stalemate. lib/chess.js automatically ends claimable draws; no fivefold/75-move handling. Unusual dead positions need further work. |
| Bots | PARTIAL | Real Stockfish worker and five strength configurations; live engine smoke test passes. useStockfish.js can assign an old stopped search's bestmove to a new request. No takebacks/hints/random side; displayed Elo is uncalibrated. |
| Online | MISSING | OnlinePage.jsx contains placeholder buttons. No game API, authoritative rules, clocks, matchmaking, transport, reconnection or persistence on server. |
| Puzzles | PARTIAL | Six composed studies have legal terminal lines (verify:data passes). PuzzlesPage.jsx loses earlier SAN history between steps; account required; no solution playback, next action, attempt/streak metrics or dataset provenance. Legal lines alone do not prove unique/best solutions. |
| Accounts | IMPLEMENTED, limited validation | Registration/login/profile/password/appearance API and integration test exist. Production configuration, rate limiting, token invalidation and validation bounds need hardening. |
| Personalization | PARTIAL | Three board palettes and font/tone variations saved for accounts. No guest settings, six app themes, custom colors, sound, coordinates or motion controls. |
| Branding/layout | PARTIAL | Consistent light editorial walnut design, responsive breakpoints and reduced-motion CSS. Old name, Unicode pieces, no favicon, header-only navigation, large headings and pale panels. |
| Persistence | PARTIAL | Account data persists in H2. Local games save only at completion and only signed in. No active game restoration. |
| Accessibility/testing | PARTIAL | Labels, focus styles, keyboard button input and reduced motion exist. Promotion focus/escape, error boundary, actual browser gameplay and comprehensive rules/clock tests are missing. |

## Ordered roadmap

1. Preserve existing stack and baseline tests. Introduce Citadel identity, original geometric rook, shared walnut tokens and guest settings foundation.
2. Local play first: retain complete Chess state; distinguish draw claims and automatic draws; add clocks, flip, drag/touch, check highlight, material, review, imports/exports and restoration. Verify special moves and complete games.
3. Repair Stockfish request lifecycle, six meaningful strengths without Elo claims, color/random setup, takeback/hints and completion tests.
4. Add authoritative multiplayer to Spring Boot with an established Java rules library, bound player identity, validated commands, clocks, queues/private rooms, reconnect and rematch. Test real independent browser sessions.
5. Validate and license puzzle content; support alternatives where applicable, full move lines, hints/solution/next and persistent statistics for guests/accounts.
6. Six full themes, color overrides and board controls, then account synchronization and previews.
7. Browser QA desktop/tablet/mobile, security/performance/accessibility review and regression checks. Do not mark the product complete before all four modes pass.

## Primary files

Client: src/lib/chess.js, src/pages/GamePage.jsx, src/components/ChessBoard.jsx, src/components/MoveLedger.jsx, src/styles.css, src/components/Shell.jsx, src/context/SessionContext.jsx, src/lib/storage.js, src/hooks/useStockfish.js, src/pages/OnlinePage.jsx, src/pages/PuzzlesPage.jsx, src/data/puzzles.js, src/App.jsx, index.html. Server: add a separate game domain/application/transport area; preserve account ports and security boundaries.

## Baseline verification

Passed: verify:data (six legal puzzle lines), verify:auth (storage/form boundary), verify:bot (live Stockfish UCI search). These are smoke tests, not complete gameplay acceptance tests.
