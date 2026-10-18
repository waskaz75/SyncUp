package com.syncup.auth.twofactor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.syncup.model.User;

public final class LoginChallengeManager {

    private static final long CHALLENGE_LIFETIME_SECONDS = 300;
    private static final ConcurrentHashMap<UUID, Challenge> CHALLENGES = new ConcurrentHashMap<>();

    private LoginChallengeManager() {
    }

    public static LoginChallenge create(User user, String code) {
        UUID challengeId = UUID.randomUUID();
        CHALLENGES.put(challengeId,
                new Challenge(user, hash(code), Instant.now().plusSeconds(CHALLENGE_LIFETIME_SECONDS)));
        return new LoginChallenge(challengeId, user.getUsername());
    }

    public static User consume(UUID challengeId, String code) {
        Challenge challenge = CHALLENGES.remove(challengeId);
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            return null;
        }
        return MessageDigest.isEqual(challenge.codeHash(), hash(code)) ? challenge.user() : null;
    }

    private static byte[] hash(String value) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    public record LoginChallenge(UUID id, String username) {

    }

    private record Challenge(User user, byte[] codeHash, Instant expiresAt) {

    }
}
