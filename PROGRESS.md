# The Citadel — implementation checkpoint

## 13 October 2026: account-backed puzzle progress

Signed-in puzzle players now load and save their completed studies and attempt statistics through an authenticated, account-isolated server resource. Existing browser-local account progress migrates on first use when the server has no saved record; guests continue to play without an account and retain browser-local progress. The puzzle board waits for an account snapshot before accepting a move, serializes saves in order, and plainly reports when the server is unavailable while retaining a local fallback.

The server validates progress shape and mutually consistent counters before persistence, and the integration test proves authentication, account isolation, save/restore and invalid-input rejection. The full server suite, focused client storage/stat/data/category checks and the production client build pass. This records learning state rather than validating puzzle solutions on the server; broader licensed coverage, alternate multi-move branches and browser acceptance remain open.

Commit message: feat(puzzles): persist account progress and attempt statistics

## 13 October 2026: tactical category browsing

The puzzle index now derives its categories from the study metadata and lets a player filter the ten available studies by theme. Choosing a category immediately keeps the displayed study within that category; Next wraps through the filtered set rather than jumping to an unrelated study. The selected study also exposes all of its category tags alongside its analysis.

Focused category filtering/next-navigation, puzzle-data and puzzle-stat checks pass, and the production client build passes. The metadata currently supports the available seed collection only; difficulty progression, broad category coverage, alternate multi-move branches, browser acceptance and server-side progress remain open.

Commit message: feat(puzzles): add tactical category browsing

## 13 October 2026: licensed Lichess puzzle seed collection

Added four attributed CC0 puzzles from the Lichess Open Database, alongside the existing Citadel studies. The imported records retain puzzle IDs, game URLs, ratings, category tags and source/license metadata. The loader applies the source format's initial opponent move before presenting the position and converts the remaining UCI line to SAN for the existing shared-board flow. The puzzle screen now shows either foundation/club difficulty or a Lichess rating, plus a source link for imported records.

Adjusted the data verifier so composed Citadel mate studies still must end the game, while Lichess advantage tactics validate their authoritative line without incorrectly requiring checkmate. Ten positions validate, including four CC0 Lichess records; puzzle-stat checks and production build pass. This is a small licensed seed set, not a replacement for the full Lichess database. More categories, filtering, alternate multi-move branches, browser acceptance and account persistence remain open.

Source: https://database.lichess.org/#puzzles (CC0; consulted 13 October 2026).

Commit message: feat(puzzles): add attributed Lichess CC0 tactical seed set

## 12 October 2026: guest and account piece rendering controls

Settings now exposes the existing outline weights and ivory/ebony/brass tones with a shared-board preview. SessionContext keeps guest preferences separate from authenticated preferences; guests save locally, signed-in users reuse the existing appearance API. Saves disable the selectors until complete and failures produce an honest message. Invalid saved guest choices fall back to defaults. Labels describe outline rendering rather than claiming distinct silhouettes.

Guest preference round-trip/default checks and the existing auth verifier pass; production build passes. Browser preview/restore acceptance, distinct piece silhouettes and full preference synchronization remain open. Files: client/src/lib/storage.js, client/src/context/SessionContext.jsx, client/src/pages/SettingsPage.jsx, client/scripts/verify-auth.mjs.

Commit message: feat(settings): persist guest piece tones and expose account piece controls

## 12 October 2026: custom-color contrast feedback

Settings now calculates contrast for main text against background/sidebar/panels and for primary-button text. Color changes immediately identify combinations below the 4.5:1 normal-text target, with measured ratios. The interface explicitly limits this check to solid colors; it is not a full accessibility certification.

Black/white, identical-color, symmetry and low-contrast detection checks pass; production build passes. Visual inspection, muted text/hover/board-marker checks and the remaining accessibility work are still pending. Files: client/src/lib/colorContrast.js and client/src/pages/SettingsPage.jsx.

Commit message: feat(settings): show contrast feedback for custom colors

## 12 October 2026: custom appearance colors

Added eleven labeled color pickers to Settings for background, sidebar, panels, text, accent, buttons, board squares and selected/legal/last-move highlights. Reused centralized theme tokens and shared board styles. Overrides apply immediately, persist in browser storage, restore before rendering through the existing startup theme call, and can be reset independently. Overrides deliberately remain applied across preset changes, as explained in the UI. Only known tokens with six-digit hex values are accepted.

Production build and focused palette-override/invalid-value checks pass. Visual browser QA, contrast validation and authenticated server persistence remain incomplete. Files: client/src/lib/themes.js, client/src/pages/SettingsPage.jsx, client/src/styles.css.

Commit message: feat(settings): add persistent custom interface and board colors

## 12 October 2026: consistent timeout snapshots and checkpoints

Fixed a clock-read boundary race: timeout could occur between the initial adjudication check and the later clock read used for a response/checkpoint, leaving an expired clock paired with a null game result. GameSession now adjudicates from that final clock sample before constructing the response or saved record. Finished checkpoints retain the stopped clock state.

Fourteen clock/session/recovery tests pass, including two new deterministic tests crossing the exact expiry boundary between reads and restoring the resulting checkpoint. No frontend changes. Remaining full-platform requirements and broader browser acceptance remain open.

Commit message: fix(server): adjudicate timeout from final snapshot and checkpoint clocks

## 12 October 2026: local puzzle attempt statistics

Added attempted/solved totals, explicitly labeled unassisted success rate, current streak and best streak. Attempts begin on the first legal move, hint or reveal; retry creates a new attempt. Wrong answers and hints break the clean streak, but a later solve still counts as solved. Revealed solutions never count as solved; duplicate completion within an attempt is ignored. Beginning a new attempt after abandoning one breaks the streak. Existing completion marks remain intact and are not converted into invented attempt history.

Statistics are stored separately per guest/account in this browser, with in-memory fallback if storage fails. Targeted tests pass for duplicates, mistakes, hints, reveals, abandonment, persistence, corrupt storage and account isolation; production build passes. Browser acceptance, concurrent-tab reconciliation, account database persistence, difficulty progression and dataset expansion remain open.

Files: client/src/lib/puzzleStats.js, client/src/pages/PuzzlesPage.jsx, client/scripts/verify-puzzle-stats.mjs, client/package.json.

Commit message: feat(puzzles): track local attempts success and unassisted streaks

## 12 October 2026: accept alternative final checkmates in puzzles

Extracted puzzle-answer validation and connected it to the study board. When the final stored move is checkmate, another legal move that actually checkmates is accepted. Earlier moves still require the supplied line; this does not claim to solve alternative multi-move branches.

The data verifier enumerates every legal move in the five mate-in-one studies, accepts exactly the checkmates (including two alternatives previously rejected), and rejects non-mates. All six stored lines and out-of-range completion checks pass; production build passes. Browser acceptance, licensed dataset expansion, general alternate branches, richer progress and account database persistence remain open.

Files: client/src/lib/puzzleAnswer.js, client/src/pages/PuzzlesPage.jsx, client/scripts/verify-game-data.mjs.

Commit message: fix(puzzles): accept alternative legal checkmates

## 12 October 2026: guest puzzle access and learning controls

Removed the puzzle route's authentication requirement and keyed its study state by guest/account identity. Reused the existing storage functions to keep guest completions separate from each account's local completions. Added Show solution, Retry puzzle and Next puzzle; revealing a solution does not mark completion and disables board input until retry. Hints disable after completion. Multi-turn solutions now append move history rather than replacing previous turns. Feedback uses a live status region and the page explicitly describes its current browser-local persistence.

Auth/storage checks pass with guest/account isolation and duplicate-completion assertions; all six existing puzzle positions validate; production build passes. Browser controls still need acceptance testing. Licensed dataset expansion, alternate correct solutions, richer statistics, difficulty progression and authenticated database persistence remain incomplete.

Files: client/src/App.jsx, client/src/pages/PuzzlesPage.jsx, client/scripts/verify-auth.mjs.

Commit message: feat(puzzles): enable guest play and add solution retry and next controls

## 12 October 2026: preserve invitations through authentication

Fixed RequireSession dropping the invitation query when redirecting guests to sign-in. A shared authRedirect helper preserves pathname, query and fragment; LoginPage uses its validated app-relative return path after sign-in or registration. Existing links between login and registration already preserve the query. Protocol-relative URLs, backslashes and literal whitespace/control characters fall back to the profile.

The auth verifier passes with invitation-return and unsafe-return regression checks; production client build passes. Full browser invitation-through-authentication acceptance remains pending. Modified App.jsx, LoginPage.jsx, added lib/authRedirect.js and extended scripts/verify-auth.mjs. The overall platform goal remains active.

Commit message: fix(auth): preserve online invitations through sign-in and registration

## 12 October 2026: preserve unexpected server error status

Fixed the error exposed during browser QA: Spring Security now permits only internal ERROR dispatches so an unexpected failure dispatched to /error retains its original status instead of becoming an authentication error. Direct requests to /error and protected endpoints still require authentication. The existing client request helper now supplies a useful server-failure message when a 5xx response lacks a message, reminding players to reconnect and check whether an action was received.

Three targeted backend tests pass, including a real embedded-server HTTP failure, protected-endpoint access checks, and the existing account registration/login flow. The client API verifier passes with new 500/401 distinctions and existing timeout/recovery checks. Production build passes. No browser fault injection was performed for this fix; remaining multiplayer and full-platform acceptance remain open.

Files: server/src/main/java/com/chess/server/security/SecurityConfiguration.java, server/src/test/java/com/chess/server/ErrorDispatchIntegrationTest.java, client/src/lib/api.js, client/scripts/verify-api.mjs.

Commit message: fix(api): preserve server failures instead of reporting authentication errors

## 12 October 2026: real browser online workflow verification

Used two separately authenticated browser tabs on localhost and 127.0.0.1, talking to the actual Spring server (no mocked gameplay). Created a private invitation, joined as a second account, played e4/e5 through board clicks and observed both move lists and boards synchronize. Reloading the second tab restored the position, names and clock readings. Selecting First in review restored the initial board and ignored attempted board moves while the live clock continued. Downloaded FEN was read from disk and exactly matched the standard starting position.

The download observation took unusually long, during which White's live clock expired. Both clients reported the same 0-1 timeout. Requested and accepted a rematch, verified swapped colors and reset clocks/board/review, then resigned through the confirmation dialog. Both clients displayed 0-1 resignation. Screenshot: citadel-online-rematch-proof.png.

Environment issue found: the old disposable H2 memory database lost its schema after a long idle interval. Restarted only that test server with DB_CLOSE_DELAY=-1; the user's file database was untouched. Unexpected database errors were misleadingly displayed as authentication failures; error-dispatch handling needs a follow-up fix.

These were isolated origin sessions in one browser product, not two separate browsers. Full cross-browser acceptance, deliberate network interruption, PGN browser download, and remaining mode/polish requirements are still open. Current test services: frontend session 80563, backend session 43535 (revalidate before reuse).

Commit message: docs(qa): record online synchronization review and rematch browser checks

## 12 October 2026: online move review and file exports

OnlinePage now reuses ChessBoard, MoveLedger and the existing replay-control styling to inspect earlier positions, navigate from the starting position to the latest move, and return to live play. Review disables board moves while server clocks and polling continue. Captures and last-move highlights follow the selected position; review state is scoped to a game ID so rematches return to live play. Download controls export the complete PGN with player names and the authoritative result, or the displayed position as FEN. The new onlineRecord helper reconstructs standard-start online histories with chess.js.

The online-record verification script passes PGN round trips for checkmate, resignation/draw result markers, castling, en passant and knight underpromotion, plus review-position boundaries. The production build passes. Browser download/review acceptance and two-client live gameplay still need verification; the full platform goal remains active.

Files: client/src/pages/OnlinePage.jsx, client/src/lib/onlineRecord.js, client/scripts/verify-online-record.mjs, client/package.json.

Commit message: feat(online): add move review and PGN and FEN exports

## 12 October 2026: smooth online clock display

Online clocks now estimate elapsed time using a monotonic browser clock between server snapshots, with an isolated clock component ticking every 100 milliseconds. Each accepted snapshot reanchors the estimate; inactive and finished clocks remain fixed, increments come from the server, and the display clamps at zero without declaring a result. During reconnect the estimate continues until a new authoritative snapshot arrives.

The online-clock verification script and production client build pass. Browser timing and two-client gameplay acceptance remain pending; network latency can still cause small corrections when snapshots arrive. The overall platform goal remains incomplete.

Commit message: fix(online): interpolate clock displays between server updates

## 12 October 2026: waiting-room restoration

Added authenticated lobby lookup returning the account's active game or pending invitation. OnlinePage restores the invitation/control after refresh, prioritizes a server-active game over a saved browser ID, and delays polling until that initial lookup finishes. Expired invitations return the user to the lobby instead of repeatedly polling a missing room.

HTTP integration tests pass with new assertions for owner-only invitation recovery and transition to an active game after joining; client build passes. This restores rooms while the server is running; invitation persistence across server restart remains incomplete. Actual browser-refresh acceptance remains pending.

Commit message: fix(online): restore pending invitations and prioritize server lobby state

## 12 October 2026: background game maintenance

Enabled a one-second scheduled maintenance pass: expired queue/invitation entries are removed, unobserved clock expiry is adjudicated/checkpointed, and completed games leave the in-memory cache after fifteen minutes. Database records remain available on demand. Completed saves release both account-to-active-game mappings. In-memory rematch metadata is discarded with old cached games.

The full backend suite passed after adding maintenance (thirty-four tests, including real process restart). After the final active-account cleanup adjustment, maintenance, database integration, HTTP and persistence-failure tests passed again. New cache test verifies eviction causes a repository reload while preserving the completed result. A real browser abandonment/timeout scenario is still unverified; remaining full-goal requirements stay open.

Commit message: feat(server): expire abandoned sessions and evict completed game caches

## 12 October 2026: real server-process restart verification

Added ProcessRestartTest and its RecoveryProcess fixture. Three distinct JVMs start the real Spring Boot application against one temporary file-backed H2 database: create/checkpoint, restart/resume/finish, restart/read completed record. The isolated database is outside the user's development data.

The targeted process-restart test passes. It verifies active account assignment, exact position, draw-offer retention, downtime deduction, accepted-command deduplication, continued legal play and completed history/result/stopped clocks across actual process lifetimes. The previous thirty-two-test full suite remains the last full-suite run; this change adds one new passing process test. It covers orderly shutdown/restart, not forced termination during a write or browser reconnection. Those and remaining multiplayer requirements remain open.

Commit message: test(server): verify game recovery across real process restarts

## 12 October 2026: live persistence wiring — backend verification passed

Connected production PrivateGames to GameStore. New private/matched/rematch games checkpoint before assignment; controller move/resignation/draw actions checkpoint before returning success; active games reload and account mappings rebuild at startup; finished records load on demand. Observed timeouts are checkpointed. Failed operation/checkpoint attempts restore the prior in-memory position, with elapsed time retained through recovery.

Added fresh-registry database recovery and storage-failure regression tests. The initial Maven run was blocked by an approval-review usage limit. Retried through normal approval on 12 October: all thirty-two backend tests compile and pass with zero failures/errors. Recovery tests verify active account mappings, duplicate-command retention and completed-record reload; failure tests verify rejected storage writes roll back moves and do not assign new players.

Outstanding persistence limitations include transient invitations/rematch offers and links, single-process coordination, completed-game cache cleanup and actual process-restart/browser verification.

Commit message: feat(server): checkpoint live games and recover sessions on startup

## 12 October 2026: database game checkpoint repository

Added online_games entity, JPA repository and transactional GameStore using the existing H2/JPA stack. Stores the complete versioned recovery record, participant IDs and completion status; supports active-game loading and completed-record lookup. Optimistic entity versions detect concurrent writes and older checkpoint timestamps are rejected.

All twenty-nine backend tests pass. A real H2 integration test writes, reloads, resumes and completes a game, checks retained command deduplication, excludes completed records from active loading, and verifies rejection of an older overwrite. This repository is not yet connected to live registry mutations/startup, so production online sessions still require that integration before restart recovery is complete.

Commit message: feat(server): persist versioned game checkpoints with JPA

## 12 October 2026: serializable game recovery model

Added versioned GameSession/GameClock saved-state records and restoration. Saved state retains initial position/full history, nanosecond clock balances, time control, result, pending draw offer and accepted command IDs. Recovery rebuilds the rules history, subtracts elapsed downtime from the active clock, detects expiry and preserves frozen finished clocks. Wall time is used only to bridge process downtime; active-process timing remains monotonic.

All twenty-eight backend tests pass. New JSON round-trip tests verify move/history identity, increments, downtime deduction, offer retention, retry idempotency, further legal play, timeout during downtime and finished-state preservation. This is the persistence format, not database integration: games are still stored in memory until the repository write/load path is connected.

Commit message: feat(server): serialize game sessions for restart recovery

## 12 October 2026: online rule-based draw claims

Added validated draw-claim endpoint and online controls for the current position or an intended legal move selected by SAN. The server verifies player/ply/rule and restores an announced move without recording it. Existing claim logic is reused.

All twenty-six backend tests and the client build pass. New HTTP coverage completes a seven-ply repetition claim with unchanged FEN/history and rejects the wrong player. New rules coverage checks the 99/100 halfmove boundary, pawn reset and restoration after intended claims. Browser interaction and remaining full-goal requirements are still unfinished.

Commit message: feat(online): expose current and intended-move draw claims

## 12 October 2026: bounded API requests

Shared API requests now abort after ten seconds, covering both response headers and body reads. Timers are cleared on every outcome, server status/messages are preserved, and timeout feedback asks users to reconnect to confirm whether a submitted action was received. This lets sequential online polling and pending actions recover from stalled connections.

Added verify:api coverage using controlled transport/timers for stalled headers, stalled bodies, error preservation, timer cleanup and a successful subsequent request. verify:api, verify:auth and the production build pass. This does not substitute for actual browser network-interruption testing, which remains outstanding.

Commit message: fix(client): bound API requests and recover from stalled connections

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
