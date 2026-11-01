package com.syncup.model;

import java.util.List;
import java.util.UUID;

public record Conversation(
        UUID id,
        String name,
        String type,
        List<Member> members) {

    public record Member(UUID id, String username) {
    }
}
