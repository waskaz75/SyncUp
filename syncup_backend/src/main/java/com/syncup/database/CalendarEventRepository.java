
package com.syncup.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.syncup.model.CalendarEvent;

public class CalendarEventRepository {

    // CREATE: Insert a new calendar event
    public boolean createEvent(CalendarEvent event) throws SQLException {

        String sql = """
            INSERT INTO calendar_events
            (event_id, user_id, title, description,
             start_datetime, end_datetime, location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, event.getEventId().toString());
            stmt.setString(2, event.getUserId().toString());
            stmt.setString(3, event.getTitle());
            stmt.setString(4, event.getDescription());
            stmt.setObject(5, event.getStartDatetime());
            stmt.setObject(6, event.getEndDatetime());
            stmt.setString(7, event.getLocation());

            return stmt.executeUpdate() == 1;
        }
    }

    // READ: Retrieve all calendar events belonging to a user
    public List<CalendarEvent> getEventsByUserId(UUID userId)
            throws SQLException {

        List<CalendarEvent> events = new ArrayList<>();

        String sql = """
            SELECT event_id, user_id, title, description,
                   start_datetime, end_datetime, location, created_at
            FROM calendar_events
            WHERE user_id = ?
            ORDER BY start_datetime ASC
            """;

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, userId.toString());

            try (ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {

                    CalendarEvent event = new CalendarEvent(
                            UUID.fromString(rs.getString("event_id")),
                            UUID.fromString(rs.getString("user_id")),
                            rs.getString("title"),
                            rs.getString("description"),
                            rs.getObject("start_datetime", LocalDateTime.class),
                            rs.getObject("end_datetime", LocalDateTime.class),
                            rs.getString("location"),
                            rs.getObject("created_at", LocalDateTime.class)
                    );

                    events.add(event);
                }
            }
        }

        return events;
    }

    // UPDATE: Modify an existing event belonging to a user
    public boolean updateEvent(CalendarEvent event) throws SQLException {

        String sql = """
            UPDATE calendar_events
            SET title = ?,
                description = ?,
                start_datetime = ?,
                end_datetime = ?,
                location = ?
            WHERE event_id = ? AND user_id = ?
            """;

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, event.getTitle());
            stmt.setString(2, event.getDescription());
            stmt.setObject(3, event.getStartDatetime());
            stmt.setObject(4, event.getEndDatetime());
            stmt.setString(5, event.getLocation());
            stmt.setString(6, event.getEventId().toString());
            stmt.setString(7, event.getUserId().toString());

            return stmt.executeUpdate() > 0;
        }
    }

    // DELETE: Remove an event belonging to a user
    public boolean deleteEvent(UUID eventId, UUID userId)
            throws SQLException {

        String sql = """
            DELETE FROM calendar_events
            WHERE event_id = ? AND user_id = ?
            """;

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, eventId.toString());
            stmt.setString(2, userId.toString());

            return stmt.executeUpdate() > 0;
        }
    }
}
