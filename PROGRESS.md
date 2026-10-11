# The Citadel — implementation checkpoint

## 10 October 2026: audit and first foundation/local-play increment

Reused React, React Router, chess.js, Stockfish Worker, shared ChessBoard/MoveLedger, local storage and the Spring Boot account API. No database schema changes or new dependencies.

Implemented:
- Original geometric rook logo/favicon, title/description, consistent visible name, dark walnut palette, desktop side navigation and mobile layouts.
- Six full UI/board palettes in centralized themes.js, guest-accessible Settings, immediate application and browser persistence before React renders.
- LocalGame model retaining full legal move history. Threefold/50-move claims separated from fivefold/75-move automatic draws. Mate precedence preserved.
- Optional preset clocks with increments, elapsed-time accounting, move-time expiry checks and restoration after refresh/navigation. Bare-king and basic insufficient-material timeout draws.
- Local active-game restoration, stable record IDs to prevent repeated saves on reload, FEN/PGN import/export, review controls, board flip, material balance, draw agreement and resignation.
- Pointer drag movement alongside click/keyboard buttons, check highlights, corrected a1 square color, promotion focus and keyboard handling.
- Move ledger handles black-to-move imported positions and actual fullmove numbers.
- Stockfish cancellation drains a stopped search before launching its replacement; visible uncalibrated Elo labels removed.

Primary modified/new files: client/src/pages/GamePage.jsx, client/src/lib/localGame.js, client/src/lib/chess.js, client/src/components/ChessBoard.jsx, client/src/components/MoveLedger.jsx, client/src/hooks/useStockfish.js, client/src/lib/storage.js, client/src/lib/themes.js, client/src/pages/SettingsPage.jsx, client/src/styles.css, client/src/components/Shell.jsx, client/src/App.jsx, client/src/main.jsx, client/index.html, client/public/citadel.svg, client/package.json, client/scripts/verify-local.mjs. Branding also updated in HomePage, LoginPage and ProfilePage. README and audit added/updated.

Verification completed:
- verify:local passes: legal/illegal moves, castling and attacked transit restriction, en passant, underpromotion, checkmate, stalemate, claims vs automatic draws, increments, expiry, timeout draw, material, PGN and saved-game restoration.
- verify:auth, verify:data and live verify:bot pass.
- Production Vite build passes (installed Vite reports 7.3.7).
- Existing Spring Boot account integration test passes against an isolated in-memory database.
- Real browser: Fool's mate from initial position, correct result and four SAN moves, refresh restoration, move review, FEN import, promotion dialog and knight underpromotion, insufficient-material result, flip, theme switch and restoration after reload.
- Mobile 390×844: board/controls visually inspected and e2–e4 pointer drag succeeds. Desktop board inspected. Real Stockfish responds to e4 with legal Nc6.

Still incomplete; do not claim all phases complete:
- Local: sound, smooth piece/capture/castling animations, intended-move draw claims, comprehensive dead-position detection and rare timeout mating-possibility cases. UI result/promotion accessibility and full tablet/touch-device testing need more work. Clocks use wall time so system-clock adjustments can affect local games. Guest completed records need a scorebook UI.
- Bots: six levels, hints/takebacks/random color, search failure recovery and repeated cancellation/completion tests.
- Online: all authoritative multiplayer infrastructure and real two-session acceptance flow.
- Puzzles: accurate provenance/dataset, solution alternatives, full history/progress/streaks, guest access, next/solution workflows.
- Settings: custom colors, board/sound/motion controls, account synchronization of new theme fields; current six-theme preference is explicitly browser-local.
- Visuals: Unicode pieces remain, no custom piece assets yet. Some older profile-specific colors need token cleanup.
- No lint/typecheck scripts are configured. No new automated browser test harness was installed; reported UI checks were performed through the browser controls.

Next: finish and verify local-play polish before expanding bot gameplay, then multiplayer and puzzles in the audit order. The master goal remains active.

## 11 October 2026: local-play polish and guest scorebook

This increment supersedes the corresponding incomplete items in the first checkpoint.

Implemented:
- Intended-move threefold and fifty-move claims, verified without playing the announced move. Failed claims preserve the position/history. The bot opponent's turn cannot be used to claim on its behalf.
- PGN result headers respected on import; imported/restored sequences reject moves after automatic game endings.
- Original scalable vector piece silhouettes in the shared board. Configurable piece movement, paired castling movement, capture fade, and reduced-motion support.
- Optional synthesized move/capture/check/castling/promotion/start/end sounds, without remote assets. Sound, coordinates, legal-move indicators, animation speed and local orientation have browser-persisted settings.
- Guest profile and completed-game replay, reusing existing storage and HistoryPage.
- Accessible in-app confirmation dialogs for restart, seating/difficulty changes, resignation and draw agreement; clocks remain running while the choice is open.
- Desktop game dimensions respond to available viewport height.

Files: lib/chess.js, lib/localGame.js, lib/boardOptions.js, lib/sound.js, components/ChessPiece.jsx, components/ChessBoard.jsx, components/ConfirmDialog.jsx, pages/GamePage.jsx, pages/GuestProfilePage.jsx, pages/HistoryPage.jsx, pages/SettingsPage.jsx, context/SessionContext.jsx, App.jsx, styles.css and scripts/verify-local.mjs.

Verification:
- verify:local includes valid/invalid intended claims, unchanged history, fifty-move intended claim, declared PGN results and rejection of play after fivefold termination; passes.
- verify:auth, verify:data, live verify:bot and production build pass after all code changes.
- Browser: preference toggles and animation selection restore after reload; intended Ng8 claim ends the game with the knight still on f6 and seven recorded plies; guest scorebook and final replay match; cancel restart retains e4; accepted draw agreement ends that game with e4 retained.
- Vector board inspected in browser, with proof saved as citadel-local-proof.png. Animation code respects reduced motion, but a timed animation capture and actual audio-output validation remain to be completed. No claim of audible sound QA is made.

Outstanding: comprehensive dead-position/rare timeout adjudication, system-clock-change robustness, broader keyboard/touch/tablet QA, full bot setup/hints/takebacks/recovery, authoritative multiplayer, valid expanded puzzle workflows/data, custom colors and server synchronization of the new preferences. Continue with remaining local correctness checks and bot completion; the full goal remains active.
