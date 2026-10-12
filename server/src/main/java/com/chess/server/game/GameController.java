package com.chess.server.game;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import com.chess.server.account.application.AccountService;

@RestController
@RequestMapping("/api/games")
public class GameController {
    public record Setup(@Min(15) @Max(10800) int seconds, @Min(0) @Max(180) int increment) {}
    public record MoveRequest(@NotNull UUID commandId, @Min(0) int expectedPly,
                              @NotBlank @Pattern(regexp="[a-h][1-8][a-h][1-8][qrbn]?") String move) {}
    private final PrivateGames games;
    private final AccountService accounts;
    public GameController(PrivateGames games, AccountService accounts) { this.games = games; this.accounts = accounts; }
    public record Players(String white, String black) {}
    @GetMapping("/{id}/players")
    public Players players(Authentication auth, @PathVariable UUID id) {
        GameSession.Snapshot state = games.get(id).snapshot(player(auth));
        return new Players(accounts.get(state.white()).username(), accounts.get(state.black()).username());
    }
    private UUID player(Authentication auth) { return (UUID) auth.getPrincipal(); }

    @GetMapping("/active")
    public GameSession.Snapshot active(Authentication auth) { return games.active(player(auth)); }

    @PostMapping("/matchmaking")
    public PrivateGames.QueueState matchmaking(Authentication auth, @Valid @RequestBody Setup setup) {
        return games.findOpponent(player(auth), setup.seconds(), setup.increment());
    }
    @DeleteMapping("/matchmaking")
    public PrivateGames.QueueState cancelMatchmaking(Authentication auth) { return games.cancelMatchmaking(player(auth)); }

    @GetMapping("/{id}/rematch")
    public PrivateGames.Rematch rematchStatus(Authentication auth, @PathVariable UUID id) { return games.rematchStatus(id, player(auth)); }
    @PostMapping("/{id}/rematch")
    public PrivateGames.Rematch rematch(Authentication auth, @PathVariable UUID id) { return games.requestRematch(id, player(auth)); }
    @DeleteMapping("/{id}/rematch")
    public PrivateGames.Rematch cancelRematch(Authentication auth, @PathVariable UUID id) { return games.cancelRematch(id, player(auth)); }

    @PostMapping("/invitations")
    public PrivateGames.Invitation create(Authentication auth, @Valid @RequestBody Setup setup) {
        return games.create(player(auth), setup.seconds(), setup.increment());
    }
    @GetMapping("/invitations/{code}")
    public PrivateGames.Invitation invitation(Authentication auth, @PathVariable UUID code) {
        return games.status(code, player(auth));
    }
    @DeleteMapping("/invitations/{code}")
    public void cancel(Authentication auth, @PathVariable UUID code) { games.cancel(code, player(auth)); }
    @PostMapping("/invitations/{code}/join")
    public GameSession.Snapshot join(Authentication auth, @PathVariable UUID code) { return games.join(code, player(auth)); }
    @GetMapping("/{id}")
    public GameSession.Snapshot state(Authentication auth, @PathVariable UUID id) { return games.get(id).snapshot(player(auth)); }
    @PostMapping("/{id}/moves")
    public GameSession.Snapshot move(Authentication auth, @PathVariable UUID id, @Valid @RequestBody MoveRequest request) {
        return games.get(id).move(player(auth), request.commandId(), request.expectedPly(), request.move());
    }
    @PostMapping("/{id}/resign")
    public GameSession.Snapshot resign(Authentication auth, @PathVariable UUID id) { return games.get(id).resign(player(auth)); }

    @PostMapping("/{id}/draw/offer")
    public GameSession.Snapshot offerDraw(Authentication auth, @PathVariable UUID id) { return games.get(id).offerDraw(player(auth)); }
    @PostMapping("/{id}/draw/accept")
    public GameSession.Snapshot acceptDraw(Authentication auth, @PathVariable UUID id) { return games.get(id).respondToDraw(player(auth), true); }
    @PostMapping("/{id}/draw/decline")
    public GameSession.Snapshot declineDraw(Authentication auth, @PathVariable UUID id) { return games.get(id).respondToDraw(player(auth), false); }
}
