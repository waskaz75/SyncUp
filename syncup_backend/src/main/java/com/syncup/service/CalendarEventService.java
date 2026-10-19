
package com.syncup.service;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.syncup.database.CalendarEventRepository;
import com.syncup.model.CalendarEvent;

public class CalendarEventService {

    private final CalendarEventRepository repository =
            new CalendarEventRepository();

    // CREATE: Save and return the newly created event
    public CalendarEvent createEvent(
            UUID userId,
            String title,
            String description,
            LocalDateTime startDatetime,
            LocalDateTime endDatetime,
            String location) throws SQLException {

        if (userId == null) {
            throw new IllegalArgumentException("Invalid user");
        }

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "Event title cannot be empty"
            );
        }

        if (startDatetime == null || endDatetime == null) {
            throw new IllegalArgumentException(
                    "Event start and end times are required"
            );
        }

        if (!endDatetime.isAfter(startDatetime)) {
            throw new IllegalArgumentException(
                    "Event end time must be after start time"
            );
        }

        CalendarEvent event = new CalendarEvent(
                UUID.randomUUID(),
                userId,
                title.trim(),
                description,
                startDatetime,
                endDatetime,
                location,
                LocalDateTime.now()
        );

        boolean created = repository.createEvent(event);

        if (!created) {
            throw new SQLException("Failed to create event");
        }

        return event;
    }

    // READ: Retrieve all events belonging to the user
    public List<CalendarEvent> getEventsByUserId(UUID userId)
            throws SQLException {

        if (userId == null) {
            throw new IllegalArgumentException("Invalid user");
        }

        return repository.getEventsByUserId(userId);
    }

    // UPDATE: Modify an existing event
    public String updateEvent(
            UUID eventId,
            UUID userId,
            String title,
            String description,
            LocalDateTime startDatetime,
            LocalDateTime endDatetime,
            String location) {

        if (eventId == null || userId == null) {
            return "Invalid event or user";
        }

        if (title == null || title.isBlank()) {
            return "Event title cannot be empty";
        }

        if (startDatetime == null || endDatetime == null) {
            return "Event start and end times are required";
        }

        if (!endDatetime.isAfter(startDatetime)) {
            return "Event end time must be after start time";
        }

        CalendarEvent updatedEvent = new CalendarEvent(
                eventId,
                userId,
                title.trim(),
                description,
                startDatetime,
                endDatetime,
                location,
                null
        );

        try {
            boolean updated = repository.updateEvent(updatedEvent);

            if (updated) {
                return "SUCCESS";
            }

            return "Event not found or no changes were made";

        } catch (SQLException e) {
            e.printStackTrace();
            return "A database error occurred. Please try again later.";
        }
    }

    // DELETE: Remove an existing event
    public String deleteEvent(UUID eventId, UUID userId) {

        if (eventId == null || userId == null) {
            return "Invalid event or user";
        }

        try {
            boolean deleted = repository.deleteEvent(eventId, userId);

            if (deleted) {
                return "SUCCESS";
            }

            return "Event not found";

        } catch (SQLException e) {
            e.printStackTrace();
            return "A database error occurred. Please try again later.";
        }
    }
}
