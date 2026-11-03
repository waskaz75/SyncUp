package com.syncup.controller;

import com.syncup.auth.SessionManager;
import com.syncup.model.ChatMessage;
import com.syncup.model.Conversation;
import com.syncup.model.AddMemberRequest;
import com.syncup.model.CreateConversationRequest;
import com.syncup.model.DirectMessageRequest;
import com.syncup.realtime.ChatWebSocketHandler;
import com.syncup.service.ConversationService;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/comms")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://www.syncup-project.com",
    "https://syncup-project.com"
})
public class CommsController {

    private final ConversationService conversationService;
    private final ChatWebSocketHandler socketHandler;
    private final SessionManager sessionManager = new SessionManager();

    public CommsController(
            ConversationService conversationService,
            ChatWebSocketHandler socketHandler) {
        this.conversationService = conversationService;
        this.socketHandler = socketHandler;
    }

    @GetMapping("/conversations")
    public List<Conversation> getConversations(@RequestParam UUID sessionId)
            throws SQLException {
        return conversationService.getConversations(authenticated(sessionId));
    }

    @PostMapping("/conversations")
    public Conversation createGroup(
            @RequestParam UUID sessionId,
            @RequestBody CreateConversationRequest request)
            throws SQLException {
        return conversationService.createGroup(
                    authenticated(sessionId), request.name(), request.usernames());
    }

    @PostMapping("/direct")
    public Conversation createDirect(
            @RequestParam UUID sessionId,
            @RequestBody DirectMessageRequest request)
            throws SQLException {
        return conversationService.createDirect(
                    authenticated(sessionId), request.username());
    }

    @PostMapping("/conversations/{conversationId}/members")
    public Conversation addMember(
            @RequestParam UUID sessionId,
            @PathVariable UUID conversationId,
            @RequestBody AddMemberRequest request)
            throws SQLException {
        return conversationService.addMember(
                authenticated(sessionId), conversationId, request.username());
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<ChatMessage> getMessages(
            @RequestParam UUID sessionId,
            @PathVariable UUID conversationId) throws SQLException {
        return conversationService.getMessages(
                authenticated(sessionId), conversationId);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ChatMessage sendMessage(
            @RequestParam UUID sessionId,
            @PathVariable UUID conversationId,
            @RequestParam String text) throws SQLException {
        UUID userId = authenticated(sessionId);
        ChatMessage message = conversationService.sendMessage(
                userId, conversationId, text);
        socketHandler.broadcast(
                message, conversationService.memberIds(conversationId));
        return message;
    }

    private UUID authenticated(UUID sessionId) {
        UUID userId = sessionManager.getUserIdFromSession(sessionId);
        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid or expired session.");
        }
        return userId;
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(
            IllegalArgumentException.class)
    public ResponseEntity<String> handleConversationValidation(
            IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(SQLException.class)
    public ResponseEntity<String> handleConversationDatabaseError(
            SQLException exception) {
        String message = exception.getMessage() == null
                ? "" : exception.getMessage().toLowerCase();
        if (message.contains("unknown column")
                || message.contains("doesn't exist")) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Communications database schema is outdated. "
                            + "Run database-migrations.sql and restart the backend.");
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("The message could not be sent because of a database error.");
    }
}
