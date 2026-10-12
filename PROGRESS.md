# The Citadel — implementation checkpoint

## 12 October 2026: online participant names

Added a participant-authorized /players endpoint returning only White/Black usernames through the existing account service. OnlinePage loads names when the game changes and displays them beside labeled clocks. It does not expose account email, credentials or preference details.

All twenty-four backend tests and the client build pass. Extended real HTTP coverage checks outsiders receive 403, both participants receive identical names, and the response contains exactly the two public fields. Visual/two-client browser verification and outstanding multiplayer work remain open.

Commit message: feat(online): display authorized participant names beside clocks

## 12 October 2026: rematch UI and HTTP acceptance

Connected finished-game rematch request, accept, decline and cancel controls to the API. Polling shows the opponent's request and transitions both participants to the agreed new game. The existing board/history/clocks consume the new authoritative state.

Client build and all twenty-four backend tests pass. A real HTTP rematch test verifies consent visibility, duplicate acceptance returning one game, reversed colors, empty history and a fresh active result. Browser rematch interaction remains unverified, alongside the outstanding two-client gameplay acceptance and persistence work.

Commit message: feat(online): connect rematch controls and verify shared game transition

## 12 October 2026: rematch service and endpoints

Added authenticated rematch request/status/cancel endpoints and a serialized registry flow. Both original players must request a rematch; agreement swaps colors, preserves the original time control, starts fresh clocks/history and returns one stable game ID on retries. A participant can decline/cancel an unaccepted request. Active-game checks prevent either player from being assigned twice, and new rematches remove stale queue/invitation entries.

All twenty-three backend tests pass. Rematch tests cover premature requests, outsider rejection, repeated single-player requests, cancellation, agreement, stable duplicate responses, swapped colors and unchanged time control. Rematch UI and actual HTTP/browser acceptance still need implementation/verification. The full goal remains incomplete.

Commit message: feat(server): add mutually accepted rematches with swapped colors

## 12 October 2026: browser lobby checks and stable development port

Browser testing found Vite's automatic fallback to 5174 incompatible with the backend's configured 5173 origins. Enabled strictPort in client/vite.config.js so startup reports a conflict instead of serving a misleading, broken account flow on another port. Restarted the test services with an isolated in-memory backend database.

Real browser verified account registration, signed-in /online entry, matchmaking waiting state, cancellation returning to the lobby, and creation of a private invitation link. Screenshot: citadel-online-invitation-proof.png. This is single-client lobby verification; two-client moves, clocks, reconnection and game completion still require browser acceptance testing. Full goal remains active.

Commit message: fix(dev): keep frontend on the configured API origin

## 11 October 2026: matchmaking UI and HTTP verification

OnlinePage now offers Find an opponent using the selected time control, refreshes queue membership while waiting, displays waiting state and supports cancellation. Cancellation waits for an in-flight queue request before removing membership, and follows the server's game ID if matching happened first. Private-game controls are disabled during matchmaking.

Client production build and all twenty-two backend tests pass. New real HTTP coverage verifies cancellation removes waiting membership, two authenticated accounts match, repeated requests return the same game, late cancellation preserves the assigned game, and active-game lookup agrees. Browser interaction, disconnection UX and all remaining multiplayer gaps still need verification/completion.

Commit message: feat(online): connect matchmaking queue and cancellation controls

## 11 October 2026: matchmaking service

Added authenticated matchmaking join/refresh and cancel endpoints. PrivateGames pairs distinct accounts with identical time controls, randomizes colors, serializes queue/game assignment, prevents duplicate entries, and expires entries without a refresh for thirty seconds using monotonic time. Cancellation returns a game ID if matching won the race. Joining private games or creating invitations removes queue membership.

All twenty-one backend tests pass. New tests cover duplicate polling, compatible/incompatible controls, cancellation, exact lease expiry, conflicting time-control changes, private-invitation conflicts and late cancellation after matching. Queue UI/heartbeat integration and real HTTP/browser matchmaking tests remain required; this is not yet exposed in the frontend.

Commit message: feat(server): add time-control matchmaking with expiring queue leases

## 11 October 2026: one active online game per account

PrivateGames now tracks active games by account, rejects creating/joining another while either participant is playing, clears a joining player's unused invitation, and releases both players after a finished game. GET /api/games/active lets the online page recover an active game even without its locally saved ID. Existing session authorization remains in force.

All nineteen backend tests and the client production build pass. Added coverage for both players' active lookup, duplicate-game prevention, stale invitation removal and availability after resignation. Browser restoration still needs acceptance verification. Persistence and the remaining online requirements remain unfinished.

Commit message: fix(online): enforce one active game and restore it by account

## 11 October 2026: online draw agreement integration

Exposed offer/accept/decline endpoints through GameController and gameApi, and connected them to OnlinePage. The page shows pending offers to the sender and explicit acceptance/rejection controls to the opponent. Existing GameSession authorization and clock/result handling are reused.

Production build and all eighteen backend tests pass. A real HTTP test verifies opponent-visible offers, self-acceptance rejection, outsider rejection, decline, acceptance, synchronized result and stopped clocks. Browser interaction remains unverified. Draw claims still need UI/API exposure; broader online gaps from previous checkpoints remain open.

Commit message: feat(online): connect authenticated draw offers and responses

## 11 October 2026: private-table frontend integration

Replaced OnlinePage's placeholder controls with authenticated invitation creation/cancellation, invitation-link/code joining, shared ChessBoard, server-approved moves, clocks, SAN history, captures, flipping and confirmed resignation. Reuses account API transport and existing board components. Game ID persists per account for restoration. Sequential polling refreshes server state; command versioning and a pending-operation guard prevent poll/action races.

Production build passes. Actual browser interaction remains unverified for this new page. Current gaps include opponent display names, draw controls, waiting-room refresh persistence, push updates, smooth clock interpolation, matchmaking/rematches, durable backend storage and full two-browser acceptance. Online mode is still partial.

Commit message: feat(client): connect private online tables to the game API

## 11 October 2026: real HTTP private-game verification

Added GameHttpIntegrationTest with a real embedded HTTP server, isolated in-memory database and independent Java HTTP clients. It registers separate accounts and verifies unauthenticated/outsider rejection, invitation joining, illegal and wrong-turn rejection, accepted move synchronization, duplicate-command handling, stale-position rejection, reconnecting with the existing token, resignation and identical frozen final clocks/results. The full Maven suite passes: seventeen tests. An initial test expectation incorrectly used 200 for registration; corrected to the existing API's 201 response.

This proves the REST flow over actual HTTP, not the required two-browser experience. Browser UI integration, live transport, persistence, matchmaking and rematches remain incomplete.

Commit message: test(server): verify private games across authenticated HTTP clients

## 11 October 2026: private-game REST foundation

Added PrivateGames registry and GameController under /api/games, reusing JWT authentication. Endpoints create/status/cancel/join invitations, fetch player-only state, submit moves and resign. Player IDs come from authenticated principals. Invitations expire after fifteen minutes; duplicate host creation and guest joins reuse existing state. Error handling maps forbidden, missing and conflicting requests to appropriate HTTP statuses.

Maven test passes (sixteen tests), including invitation ownership, self-join prevention, duplicate joining, outsider rejection and shared move state. Controller compiles under the existing authenticated security configuration, but real HTTP/two-client endpoint tests are still required. Registry is currently in-memory: persistence, finished-game cleanup, one-active-game enforcement, rate limiting, push transport, matchmaking, rematches and UI integration remain unfinished. Do not treat this as completed multiplayer.

Commit message: feat(server): expose authenticated private game endpoints

## 11 October 2026: server draw offers and claims

GameSession now supports draw offers, opponent-only acceptance/rejection, automatic rejection when the opponent moves, and current/intended-move threefold or fifty-move claims. Claims enforce the player to move and expected ply. ChessPosition temporarily applies an intended move and always restores the board/history after checking. Finished games clear offers and freeze clocks.

Maven test passes (fourteen tests). New tests verify offer ownership, move-based rejection, acceptance, failed claims, stale/wrong-player claims and a seven-ply intended repetition claim that retains the original FEN and history. Fifty-move claim code is present but needs its own boundary coverage. Networking, persistence and complete timeout/dead-position adjudication remain outstanding.

Commit message: feat(server): add draw offers and intended-move claims

## 11 October 2026: authorized game-session aggregate

Added game/GameSession.java and GameSessionTest.java. The aggregate composes the existing rules and monotonic clock, binds two distinct account IDs, serializes operations, checks player/turn/expected ply, and deduplicates accepted move commands by ID and exact payload. Snapshots expose immutable move histories. Checkmate, stalemate, basic material, fivefold/75-move endings, resignation and basic timeout outcomes are server-owned.

Maven test passes with twelve tests total, including four session tests for unauthorized access, self-play, illegal/wrong-turn/stale moves, duplicate/reused IDs, complete Fool's mate, post-game rejection and expiry precedence. This is a domain component, not a network endpoint; authenticated identity must be supplied by the forthcoming controller. Persistence, transport, draw offers/claims, richer timeout/dead-position adjudication, matchmaking and independent-client verification are still required.

Commit message: feat(server): compose authorized chess sessions with idempotent moves

## 11 October 2026: server legal-move boundary

Added Chesslib 1.3.7 through its documented JitPack repository in server/pom.xml, plus game/ChessPosition.java and ChessPositionTest.java. The existing Java backend is retained. ChessPosition accepts coordinate moves only when present in the library's generated legal move list; it does not rely on doMove's incomplete movement validation. It keeps board internals private and preserves repetition history.

Maven test passes (eight tests across rules, clock and account integration). Rules coverage includes impossible movement and unchanged state on rejection, wrong-side moves, Fool's mate, threefold/fivefold history, castling and attacked transit, en passant and explicit knight underpromotion. Library source/license: https://github.com/bhlangonijr/chesslib/tree/1.3.7 (Apache-2.0). No source was copied into the project.

Still not exposed as online gameplay. Next: combine rules and clocks in authorized game sessions, followed by transport and client integration. Complete draw/timeout adjudication and all online acceptance criteria remain outstanding.

Commit message: feat(server): add chesslib-backed legal move validation

## 11 October 2026: server clock foundation

Added server/src/main/java/com/chess/server/game/GameClock.java and its JUnit tests, preserving the existing Spring Boot stack. This server-owned component uses monotonic time, retains submillisecond elapsed time across snapshots, starts only when explicitly activated, applies increments to the mover, rejects expiry at the exact deadline, and freezes completed games. It accepts bounded custom controls covering all requested online presets.

Maven test passes: four clock tests and the existing account integration test, zero failures/errors. The component is not yet wired to a game service or endpoint; online play is still unavailable. Next: authoritative legal-move/session service and authenticated transport, followed by matchmaking, invitations, persistence, reconnection and independent browser acceptance testing. This increment does not satisfy the online-mode acceptance criteria.

## 11 October 2026: bot setup, lifecycle and verification

Reused the shared board, LocalGame model, chess.js and installed Stockfish worker. Added six skill/search configurations, white/black/random seating, optional hints, turn takebacks with clock restoration, and visible engine restart after failure. Searches now include the game's move history; cancellation drains the previous UCI response before starting another request. Boot/search watchdogs, legal-response validation and worker disposal protect the UI from stalled or stale searches.

Position validation now rejects imported positions where the player who just moved left their king in check. Live engine testing exposed two such puzzle starting positions; both were corrected and the six stored lines revalidated. This does not establish comprehensive puzzle quality or provenance.

Primary files: client/src/lib/stockfishClient.js, hooks/useStockfish.js, lib/botLevels.js, lib/localGame.js, lib/chess.js, pages/GamePage.jsx, pages/HomePage.jsx, puzzle data, styles.css, scripts/verify-engine-protocol.mjs, scripts/verify-stockfish.mjs and scripts/verify-local.mjs. README reflects the six configurations and protocol check.

Verification: local, auth-boundary, puzzle-data, engine-protocol and live Stockfish checks all pass; production build passes. Live Stockfish checks cover each level's legal response, full-history commands, cancellation/replacement, promotion, mating move and terminal handling. Protocol tests cover invalid replies, startup/search timeouts, disposal, and a worker failing during cancellation; replacement requests now reject immediately in that failure case. These checks do not calibrate playing strength.

Earlier browser checks exercised hint generation without moving, a human move with a real bot reply, takeback of both plies, color/difficulty selection and a legal imported mate-in-one ending in checkmate. The proof is citadel-bot-proof.png. Full start-to-finish bot gameplay and browser-triggered recovery still need broader acceptance coverage.

The overall goal remains incomplete. Next major implementation: authoritative online sessions, matchmaking, invitation games, clocks and reconnection with independent clients. Other outstanding work includes comprehensive dead-position/timeout cases, complete puzzle data/progression, custom colors/account preference synchronization and final accessibility/responsive QA.

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
