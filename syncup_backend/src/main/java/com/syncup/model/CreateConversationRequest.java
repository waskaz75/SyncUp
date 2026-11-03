package com.syncup.model;

import java.util.List;

public record CreateConversationRequest(String name, List<String> usernames) {
}
