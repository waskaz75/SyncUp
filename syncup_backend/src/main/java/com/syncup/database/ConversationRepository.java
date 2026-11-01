package com.syncup.database;

import com.syncup.model.ChatMessage;
import com.syncup.model.Conversation;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class ConversationRepository {

    public List<Conversation> findForUser(UUID userId) throws SQLException {
        String sql = """
            SELECT r.room_id, r.room_name, r.room_type
            FROM chat_rooms r
            JOIN chat_room_members m ON m.room_id = r.room_id
            WHERE m.user_id = ?
            ORDER BY r.created_at, r.room_name
            """;

        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                List<Conversation> conversations = new ArrayList<>();
                while (results.next()) {
                    UUID id = UUID.fromString(results.getString("room_id"));
                    conversations.add(new Conversation(
                            id,
                            results.getString("room_name"),
                            results.getString("room_type"),
                            findMembers(connection, id)));
                }
                return conversations;
            }
        }
    }

    public Conversation createGroup(
            UUID creatorId, String name, List<String> emails)
            throws SQLException {
        if (name == null || name.isBlank() || name.length() > 100) {
            throw new IllegalArgumentException("Group name must contain 1 to 100 characters.");
        }
        Set<UUID> members = new HashSet<>();
        for (String email : emails == null ? List.<String>of() : emails) {
            UUID member = findUserByEmail(email);
            if (member == null) {
                throw new IllegalArgumentException(
                        "No registered user was found with email: " + email);
            }
            members.add(member);
        }
        members.add(creatorId);

        try (Connection connection = JdbcConnector.getConnection()) {
            connection.setAutoCommit(false);
            UUID roomId = UUID.randomUUID();
            try (PreparedStatement room = connection.prepareStatement(
                    "INSERT INTO chat_rooms (room_id, room_name, room_type, created_by) VALUES (?, ?, 'GROUP', ?)")) {
                room.setString(1, roomId.toString());
                room.setString(2, name.trim());
                room.setString(3, creatorId.toString());
                room.executeUpdate();
            }
            addMembers(connection, roomId, members);
            connection.commit();
            return findById(connection, roomId);
        }
    }

    private UUID findUserByEmail(String email) throws SQLException {
        if (email == null || email.isBlank()) {
            return null;
        }
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(
                        "SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)")) {
            statement.setString(1, email.trim());
            try (ResultSet results = statement.executeQuery()) {
                return results.next()
                        ? UUID.fromString(results.getString("user_id"))
                        : null;
            }
        }
    }

    public Conversation createOrFindDirect(UUID creatorId, String email)
            throws SQLException {
        UUID otherUser = findUserByEmail(email);
        if (otherUser == null || !userExists(otherUser)) {
            throw new IllegalArgumentException(
                    "No other registered user was found with that email.");
        }
        if (creatorId.equals(otherUser)) {
            throw new IllegalArgumentException(
                    "You cannot send a direct message to yourself.");
        }

        String key = directMessageKey(creatorId, otherUser);
        String lookup = "SELECT room_id FROM chat_rooms WHERE direct_message_key = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(lookup)) {
            statement.setString(1, key);
            try (ResultSet results = statement.executeQuery()) {
                if (results.next()) {
                    return findById(connection,
                            UUID.fromString(results.getString("room_id")));
                }
            }
        }

        try (Connection connection = JdbcConnector.getConnection()) {
            connection.setAutoCommit(false);
            try {
                UUID roomId = UUID.randomUUID();
                try (PreparedStatement room = connection.prepareStatement(
                        "INSERT INTO chat_rooms (room_id, room_name, room_type, direct_message_key, created_by) VALUES (?, ?, 'DIRECT', ?, ?)")) {
                    room.setString(1, roomId.toString());
                    room.setString(2, "Direct message");
                    room.setString(3, key);
                    room.setString(4, creatorId.toString());
                    room.executeUpdate();
                }
                addMembers(connection, roomId, Set.of(creatorId, otherUser));
                connection.commit();
                return findById(connection, roomId);
            } catch (SQLException | RuntimeException exception) {
                connection.rollback();
                throw exception;
            }
        }
    }

    public boolean isMember(UUID conversationId, UUID userId) throws SQLException {
        String sql = "SELECT 1 FROM chat_room_members WHERE room_id = ? AND user_id = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, conversationId.toString());
            statement.setString(2, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                return results.next();
            }
        }
    }

    public Conversation addMember(
            UUID conversationId, UUID requesterId, String email)
            throws SQLException {
        UUID memberId = findUserByEmail(email);
        if (memberId == null) {
            throw new IllegalArgumentException(
                    "No registered user was found with email: " + email);
        }

        String roomSql = """
            SELECT room_type FROM chat_rooms WHERE room_id = ?
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement room = connection.prepareStatement(roomSql)) {
            room.setString(1, conversationId.toString());
            try (ResultSet results = room.executeQuery()) {
                if (!results.next()) {
                    throw new IllegalArgumentException("Conversation was not found.");
                }
                if (!"GROUP".equals(results.getString("room_type"))) {
                    throw new IllegalArgumentException(
                            "People can only be added to group conversations.");
                }
            }
        }
        if (!isMember(conversationId, requesterId)) {
            throw new IllegalArgumentException(
                    "Only group members can add people.");
        }

        try (Connection connection = JdbcConnector.getConnection()) {
            if (!isMember(conversationId, memberId)) {
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO chat_room_members (member_id, room_id, user_id) VALUES (?, ?, ?)")) {
                    statement.setString(1, UUID.randomUUID().toString());
                    statement.setString(2, conversationId.toString());
                    statement.setString(3, memberId.toString());
                    statement.executeUpdate();
                }
            }
            return findById(connection, conversationId);
        }
    }

    public Set<UUID> memberIds(UUID conversationId) throws SQLException {
        String sql = "SELECT user_id FROM chat_room_members WHERE room_id = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, conversationId.toString());
            try (ResultSet results = statement.executeQuery()) {
                Set<UUID> members = new HashSet<>();
                while (results.next()) {
                    members.add(UUID.fromString(results.getString("user_id")));
                }
                return members;
            }
        }
    }

    public List<ChatMessage> findMessages(UUID conversationId) throws SQLException {
        String sql = """
            SELECT m.message_id, m.room_id, u.username,
                   COALESCE(p.image_url, '') AS image_url, m.content, m.sent_at
            FROM messages m
            JOIN users u ON u.user_id = m.user_id
            LEFT JOIN profile_pictures p ON p.profile_id = u.profile_id
            WHERE m.room_id = ?
            ORDER BY m.sent_at ASC
            LIMIT 200
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, conversationId.toString());
            try (ResultSet results = statement.executeQuery()) {
                List<ChatMessage> messages = new ArrayList<>();
                while (results.next()) {
                    messages.add(readMessage(results));
                }
                return messages;
            }
        }
    }

    public ChatMessage addMessage(UUID conversationId, UUID userId, String text)
            throws SQLException {
        UUID messageId = UUID.randomUUID();
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO messages (message_id, room_id, user_id, content) VALUES (?, ?, ?, ?)")) {
            statement.setString(1, messageId.toString());
            statement.setString(2, conversationId.toString());
            statement.setString(3, userId.toString());
            statement.setString(4, text);
            statement.executeUpdate();
        }
        return findMessage(messageId);
    }

    private ChatMessage findMessage(UUID messageId) throws SQLException {
        String sql = """
            SELECT m.message_id, m.room_id, u.username,
                   COALESCE(p.image_url, '') AS image_url, m.content, m.sent_at
            FROM messages m
            JOIN users u ON u.user_id = m.user_id
            LEFT JOIN profile_pictures p ON p.profile_id = u.profile_id
            WHERE m.message_id = ?
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, messageId.toString());
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next()) {
                    throw new SQLException("Created message could not be loaded.");
                }
                return readMessage(results);
            }
        }
    }

    private Conversation findById(Connection connection, UUID id)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT room_name, room_type FROM chat_rooms WHERE room_id = ?")) {
            statement.setString(1, id.toString());
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next()) {
                    throw new SQLException("Conversation was not found.");
                }
                return new Conversation(
                        id,
                        results.getString("room_name"),
                        results.getString("room_type"),
                        findMembers(connection, id));
            }
        }
    }

    private List<Conversation.Member> findMembers(Connection connection, UUID roomId)
            throws SQLException {
        String sql = """
            SELECT u.user_id, u.username
            FROM chat_room_members m JOIN users u ON u.user_id = m.user_id
            WHERE m.room_id = ? ORDER BY u.username
            """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, roomId.toString());
            try (ResultSet results = statement.executeQuery()) {
                List<Conversation.Member> members = new ArrayList<>();
                while (results.next()) {
                    members.add(new Conversation.Member(
                            UUID.fromString(results.getString("user_id")),
                            results.getString("username")));
                }
                return members;
            }
        }
    }

    private void addMembers(Connection connection, UUID roomId, Set<UUID> members)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO chat_room_members (member_id, room_id, user_id) VALUES (?, ?, ?)")) {
            for (UUID member : members) {
                if (!userExists(connection, member)) {
                    throw new IllegalArgumentException("A selected user does not exist.");
                }
                statement.setString(1, UUID.randomUUID().toString());
                statement.setString(2, roomId.toString());
                statement.setString(3, member.toString());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private boolean userExists(UUID userId) throws SQLException {
        try (Connection connection = JdbcConnector.getConnection()) {
            return userExists(connection, userId);
        }
    }

    private boolean userExists(Connection connection, UUID userId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT 1 FROM users WHERE user_id = ?")) {
            statement.setString(1, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                return results.next();
            }
        }
    }

    private String directMessageKey(UUID first, UUID second) {
        return first.toString().compareTo(second.toString()) < 0
                ? first + ":" + second : second + ":" + first;
    }

    private ChatMessage readMessage(ResultSet results) throws SQLException {
        Timestamp timestamp = results.getTimestamp("sent_at");
        return new ChatMessage(
                UUID.fromString(results.getString("message_id")),
                UUID.fromString(results.getString("room_id")),
                results.getString("username"),
                results.getString("image_url"),
                results.getString("content"),
                timestamp == null ? Instant.now() : timestamp.toInstant());
    }
}
