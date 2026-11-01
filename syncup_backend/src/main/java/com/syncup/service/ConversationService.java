package com.syncup.service;

import com.syncup.database.ConversationRepository;
import com.syncup.model.ChatMessage;
import com.syncup.model.Conversation;
import java.sql.SQLException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ConversationService {

    private final ConversationRepository repository;

    public ConversationService(ConversationRepository repository) {
        this.repository = repository;
    }

    public List<Conversation> getConversations(UUID userId) throws SQLException {
        return repository.findForUser(userId);
    }

    public Conversation createGroup(
            UUID userId, String name, List<String> emails) throws SQLException {
        return repository.createGroup(userId, name, emails);
    }

    public Conversation createDirect(UUID userId, String email)
            throws SQLException {
        return repository.createOrFindDirect(userId, email);
    }

    public Conversation addMember(
            UUID userId, UUID conversationId, String email)
            throws SQLException {
        return repository.addMember(conversationId, userId, email);
    }

    public List<ChatMessage> getMessages(UUID userId, UUID conversationId)
            throws SQLException {
        requireMember(userId, conversationId);
        return repository.findMessages(conversationId);
    }

    public ChatMessage sendMessage(
            UUID userId, UUID conversationId, String text) throws SQLException {
        requireMember(userId, conversationId);
        if (text == null || text.isBlank() || text.length() > 2000) {
            throw new IllegalArgumentException(
                    "Message must contain 1 to 2000 characters.");
        }
        return repository.addMessage(conversationId, userId, text.trim());
    }

    public Set<UUID> memberIds(UUID conversationId) throws SQLException {
        return repository.memberIds(conversationId);
    }

    private void requireMember(UUID userId, UUID conversationId)
            throws SQLException {
        if (conversationId == null || !repository.isMember(conversationId, userId)) {
            throw new IllegalArgumentException(
                    "You are not a member of this conversation.");
        }
    }
}
