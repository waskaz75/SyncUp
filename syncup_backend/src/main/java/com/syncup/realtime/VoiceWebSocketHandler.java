
package com.syncup.realtime;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.syncup.auth.SessionManager;
import com.syncup.database.ConversationRepository;
import java.io.IOException;
import java.sql.SQLException;
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
    private final ConversationRepository conversationRepository =
            new ConversationRepository();
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

        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        if ("join".equals(type)) {
            if (session.getAttributes().containsKey("conversationId")) {
                sendError(session, "Already joined a voice room.");
                return;
            }

            UUID conversationId;

            try {
                conversationId = UUID.fromString(
                        input.path("conversationId").asText());

                if (!conversationRepository.isMember(
                        conversationId, UUID.fromString(userId))) {
                    sendError(session,
                            "You are not a member of this conversation.");
                    return;
                }
            } catch (IllegalArgumentException exception) {
                sendError(session, "A valid conversation ID is required.");
                return;
            } catch (SQLException exception) {
                sendError(session,
                        "Could not verify conversation membership.");
                return;
            }

            WebSocketSession existing = sessions.putIfAbsent(userId, session);

            if (existing != null && existing != session) {
                sendError(session,
                        "You are already connected to a voice call.");
                return;
            }

            session.getAttributes().put(
                    "conversationId", conversationId.toString());
            session.getAttributes().put(
                    "username", input.path("username").asText("Guest"));

            sendParticipants(session, true);
            broadcastExcept(session, event("peer-joined", userId, session));
            broadcastParticipants(session);
            return;
        }

        if (!session.getAttributes().containsKey("conversationId")) {
            sendError(session, "Join a voice room first.");
            return;
        }

        if ("leave".equals(type)) {
            leaveRoom(session);
            return;
        }

        if ("signal".equals(type) || "mute".equals(type)
                || "screen-start".equals(type)
                || "screen-stop".equals(type)) {

            String target = input.path("target").asText("");
            WebSocketSession recipient = sessions.get(target);

            ObjectNode output = input.deepCopy();
            output.put("from", userId);
            output.put("username", session.getAttributes()
                    .getOrDefault("username", "Guest").toString());

            if (recipient != null && recipient.isOpen()
                    && sameRoom(session, recipient)) {
                send(recipient, output);
            } else if ("mute".equals(type)
                    || "screen-start".equals(type)
                    || "screen-stop".equals(type)) {
                broadcastExcept(session, output);
            }
        }
    }

    @Override
    public void afterConnectionClosed(
            WebSocketSession session, CloseStatus status) {
        try {
            leaveRoom(session);
        } catch (IOException ignored) {
            // The connection is already closed.
        }
    }

    private void leaveRoom(WebSocketSession session) throws IOException {
        String userId = (String) session.getAttributes().get("userId");

        if (userId == null
                || !session.getAttributes().containsKey("conversationId")) {
            return;
        }

        sessions.remove(userId, session);
        broadcastExcept(session, event("peer-left", userId, session));

        session.getAttributes().remove("conversationId");
        session.getAttributes().remove("username");
    }

    private UUID authenticate(WebSocketSession session) {
        String query = session.getUri() == null
                ? null : session.getUri().getQuery();

        if (query == null || !query.startsWith("sessionId=")) {
            return null;
        }

        try {
            UUID sessionId = UUID.fromString(
                    query.substring("sessionId=".length()));

            return sessionManager.getUserIdFromSession(sessionId);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private boolean sameRoom(
            WebSocketSession first, WebSocketSession second) {
        Object room = first.getAttributes().get("conversationId");

        return room != null
                && room.equals(second.getAttributes().get("conversationId"));
    }

    private void sendParticipants(
            WebSocketSession recipient, boolean initiateOffers)
            throws IOException {

        send(recipient, participantsEvent(recipient, initiateOffers));
    }

    private void broadcastParticipants(WebSocketSession excluded)
            throws IOException {
        for (WebSocketSession peer : sessions.values()) {
            if (peer != excluded && peer.isOpen()
                    && sameRoom(excluded, peer)) {
                send(peer, participantsEvent(peer, false));
            }
        }
    }

    private ObjectNode participantsEvent(
            WebSocketSession recipient, boolean initiateOffers) {
        ObjectNode output = objectMapper.createObjectNode();
        output.put("type", "participants");
        output.put("initiateOffers", initiateOffers);

        var participants = output.putArray("participants");

        for (WebSocketSession peer : sessions.values()) {
            if (peer != recipient && peer.isOpen()
                    && sameRoom(recipient, peer)
                    && peer.getAttributes().containsKey("username")) {

                ObjectNode item = participants.addObject();
                item.put("id", peer.getAttributes().get("userId").toString());
                item.put("username",
                        peer.getAttributes().get("username").toString());
                item.put("picture", "");
                item.put("isMuted", false);
            }
        }

        return output;
    }

    private void broadcastExcept(
            WebSocketSession excluded, JsonNode payload)
            throws IOException {

        for (WebSocketSession peer : sessions.values()) {
            if (peer != excluded && peer.isOpen()
                    && sameRoom(excluded, peer)) {
                send(peer, payload);
            }
        }
    }

    private void sendError(
            WebSocketSession session, String message) throws IOException {

        ObjectNode output = objectMapper.createObjectNode();
        output.put("type", "error");
        output.put("message", message);

        send(session, output);
    }

    private void send(
            WebSocketSession recipient, JsonNode payload)
            throws IOException {
        if (!recipient.isOpen()) {
            return;
        }

        synchronized (recipient) {
            if (recipient.isOpen()) {
                recipient.sendMessage(new TextMessage(
                        objectMapper.writeValueAsString(payload)));
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
