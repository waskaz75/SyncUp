package com.syncup.realtime;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.syncup.auth.SessionManager;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class VoiceWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions =
            new ConcurrentHashMap<>();
    private final SessionManager sessionManager = new SessionManager();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session)
            throws Exception {
        UUID userId = authenticate(session);
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        session.getAttributes().put("userId", userId.toString());
    }

    @Override
    protected void handleTextMessage(
            WebSocketSession session,
            TextMessage message) throws IOException {
        JsonNode input = objectMapper.readTree(message.getPayload());
        String type = input.path("type").asText();
        String userId = (String) session.getAttributes().get("userId");

        if ("join".equals(type)) {
            session.getAttributes().put("username", input.path("username").asText("Guest"));
            sendParticipants(session);
            broadcastExcept(session, event("peer-joined", userId, session));
            return;
        }

        if ("leave".equals(type)) {
            broadcastExcept(session, event("peer-left", userId, session));
            return;
        }

        if ("signal".equals(type) || "mute".equals(type)
                || "screen-start".equals(type) || "screen-stop".equals(type)) {
            String target = input.path("target").asText("");
            WebSocketSession recipient = sessions.get(target);
            if (recipient != null && recipient.isOpen()) {
                ObjectNode output = input.deepCopy();
                output.put("from", userId);
                output.put("username", session.getAttributes()
                        .getOrDefault("username", "Guest").toString());
                recipient.sendMessage(new TextMessage(
                        objectMapper.writeValueAsString(output)));
            } else if ("mute".equals(type)
                    || "screen-start".equals(type)
                    || "screen-stop".equals(type)) {
                broadcastExcept(session, input);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            sessions.remove(userId);
            try {
                broadcastExcept(session, event("peer-left", userId, session));
            } catch (IOException ignored) {
                // The connection is already closed.
            }
        }
    }

    private UUID authenticate(WebSocketSession session) {
        String query = session.getUri() == null ? "" : session.getUri().getQuery();
        if (query == null || !query.startsWith("sessionId=")) {
            return null;
        }
        try {
            UUID sessionId = UUID.fromString(query.substring("sessionId=".length()));
            UUID userId = sessionManager.getUserIdFromSession(sessionId);
            if (userId != null) {
                sessions.put(userId.toString(), session);
            }
            return userId;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private void sendParticipants(WebSocketSession recipient) throws IOException {
        ObjectNode output = objectMapper.createObjectNode();
        output.put("type", "participants");
        var participants = output.putArray("participants");
        for (WebSocketSession peer : sessions.values()) {
            if (peer != recipient && peer.isOpen()
                    && peer.getAttributes().containsKey("username")) {
                ObjectNode item = participants.addObject();
                item.put("id", peer.getAttributes().get("userId").toString());
                item.put("username", peer.getAttributes().get("username").toString());
                item.put("picture", "");
                item.put("isMuted", false);
            }
        }
        recipient.sendMessage(new TextMessage(objectMapper.writeValueAsString(output)));
    }

    private void broadcastExcept(WebSocketSession excluded, JsonNode payload)
            throws IOException {
        String text = objectMapper.writeValueAsString(payload);
        for (WebSocketSession peer : sessions.values()) {
            if (peer != excluded && peer.isOpen()) {
                peer.sendMessage(new TextMessage(text));
            }
        }
    }

    private ObjectNode event(
            String type, String userId, WebSocketSession session) {
        ObjectNode output = objectMapper.createObjectNode();
        output.put("type", type);
        output.put("id", userId);
        output.put("username", session.getAttributes()
                .getOrDefault("username", "Guest").toString());
        return output;
    }
}
