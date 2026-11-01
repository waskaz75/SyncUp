package com.syncup.model;

import java.time.Instant;
import java.util.UUID;

public record ChatMessage(
        UUID id,
        UUID conversationId,
        String author,
        String authorPicture,
        String text,
        Instant sentAt) {
}
