
package com.syncup.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class CalendarEvent {

    private final UUID eventId;
    private final UUID userId;
    private final String title;
    private final String description;
    private final LocalDateTime startDatetime;
    private final LocalDateTime endDatetime;
    private final String location;
    private final LocalDateTime createdAt;

    public CalendarEvent(
            UUID eventId,
            UUID userId,
            String title,
            String description,
            LocalDateTime startDatetime,
            LocalDateTime endDatetime,
            String location,
            LocalDateTime createdAt) {

        this.eventId = eventId;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.startDatetime = startDatetime;
        this.endDatetime = endDatetime;
        this.location = location;
        this.createdAt = createdAt;
    }

    public UUID getEventId() {
        return eventId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getStartDatetime() {
        return startDatetime;
    }

    public LocalDateTime getEndDatetime() {
        return endDatetime;
    }

    public String getLocation() {
        return location;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
