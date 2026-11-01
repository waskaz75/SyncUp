package com.syncup.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncup.auth.SessionManager;
import com.syncup.model.ChatMessage;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final Map<WebSocketSession, UUID> sessions =
            new ConcurrentHashMap<>();
    private final SessionManager sessionManager = new SessionManager();
    private final ObjectMapper objectMapper;

    public ChatWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session)
            throws Exception {
        UUID sessionId = sessionId(session);
        UUID userId = sessionId == null
                ? null : sessionManager.getUserIdFromSession(sessionId);
        if (userId == null) {
            session.close();
            return;
        }
        sessions.put(session, userId);
    }

    @Override
    public void afterConnectionClosed(
            WebSocketSession session,
            org.springframework.web.socket.CloseStatus status) {
        sessions.remove(session);
    }

    public void broadcast(ChatMessage message, Set<UUID> recipients) {
        final String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Could not serialize chat message.", exception);
        }
        for (Map.Entry<WebSocketSession, UUID> entry : sessions.entrySet()) {
            WebSocketSession session = entry.getKey();
            if (!recipients.contains(entry.getValue())) {
                continue;
            }
            if (!session.isOpen()) {
                sessions.remove(session);
                continue;
            }
            try {
                synchronized (session) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(payload));
                    }
                }
            } catch (java.io.IOException | IllegalStateException exception) {
                sessions.remove(session);
            }
        }
    }

    private UUID sessionId(WebSocketSession session) {
        String query = session.getUri() == null
                ? null : session.getUri().getQuery();
        if (query == null || !query.startsWith("sessionId=")) {
            return null;
        }
        try {
            return UUID.fromString(query.substring("sessionId=".length()));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
