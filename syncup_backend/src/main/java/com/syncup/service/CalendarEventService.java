
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

    // CREATE
    public String createEvent(
            UUID userId,
            String title,
            String description,
            LocalDateTime startDatetime,
            LocalDateTime endDatetime,
            String location) {

        if (userId == null) {
            return "Invalid user";
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

        UUID eventId = UUID.randomUUID();

        CalendarEvent event = new CalendarEvent(
                eventId,
                userId,
                title.trim(),
                description,
                startDatetime,
                endDatetime,
                location,
                LocalDateTime.now()
        );

        try {
            boolean created = repository.createEvent(event);

            if (created) {
                return "SUCCESS";
            }

            return "Failed to create event";

        } catch (SQLException e) {
            e.printStackTrace();
            return "A database error occurred. Please try again later.";
        }
    }

    // READ
    public List<CalendarEvent> getEventsByUserId(UUID userId)
            throws SQLException {

        if (userId == null) {
            throw new IllegalArgumentException("Invalid user");
        }

        return repository.getEventsByUserId(userId);
    }

    // UPDATE
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

    // DELETE
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
