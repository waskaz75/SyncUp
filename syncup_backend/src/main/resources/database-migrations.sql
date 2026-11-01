USE syncupdb;

-- Run this once against an existing database created before group and DM support.
ALTER TABLE chat_rooms
    ADD COLUMN room_type VARCHAR(20) NOT NULL DEFAULT 'GROUP',
    ADD COLUMN direct_message_key VARCHAR(73) NULL UNIQUE;
