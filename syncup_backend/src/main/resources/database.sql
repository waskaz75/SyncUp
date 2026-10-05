USE syncupdb;
-- =========================================================
-- PROFILE PICTURES
-- Must be created before users because users references it.
-- =========================================================
CREATE TABLE profile_pictures (
   profile_id CHAR(36) PRIMARY KEY,
   avatar_name VARCHAR(100) NOT NULL,
   image_url VARCHAR(2048) NOT NULL
);
-- =========================================================
-- USERS
-- Main account table.
-- role handles the user/admin requirement from Section 7.
-- =========================================================
CREATE TABLE users (
   user_id CHAR(36) PRIMARY KEY,
   username VARCHAR(50) NOT NULL UNIQUE,
   password_hash VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL UNIQUE,
   profile_id CHAR(36) NULL,
--    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
--    CONSTRAINT fk_users_profile
--        FOREIGN KEY (profile_id)
--        REFERENCES profile_pictures(profile_id)
--        ON DELETE SET NULL
);
-- =========================================================
-- SESSIONS
-- Used for login/logout and session handling.
-- logout_time remains NULL while the session is active.
-- IPv6 addresses may require up to 45 characters.
-- =========================================================
CREATE TABLE sessions (
   session_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   device_info VARCHAR(255),
   ip_address VARCHAR(45),
   login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   logout_time DATETIME NULL,
   CONSTRAINT fk_sessions_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- CHAT ROOMS
-- =========================================================
CREATE TABLE chat_rooms (
   room_id CHAR(36) PRIMARY KEY,
   room_name VARCHAR(100) NOT NULL,
   created_by CHAR(36) NOT NULL,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_chat_rooms_creator
       FOREIGN KEY (created_by)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- CHAT ROOM MEMBERS
-- Connects users to chat rooms.
-- =========================================================
CREATE TABLE chat_room_members (
   member_id CHAR(36) PRIMARY KEY,
   room_id CHAR(36) NOT NULL,
   user_id CHAR(36) NOT NULL,
   joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_chat_members_room
       FOREIGN KEY (room_id)
       REFERENCES chat_rooms(room_id)
       ON DELETE CASCADE,
   CONSTRAINT fk_chat_members_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE,
   CONSTRAINT uq_room_user
       UNIQUE (room_id, user_id)
);
-- =========================================================
-- MEDIA
-- Added because Messages references Media.media_id,
-- but your current written design does not define Media.
-- =========================================================
CREATE TABLE media (
   media_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   media_type VARCHAR(100),
   media_url VARCHAR(2048) NOT NULL,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_media_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- MESSAGES
-- media_id is optional.
-- =========================================================
CREATE TABLE messages (
   message_id CHAR(36) PRIMARY KEY,
   room_id CHAR(36) NOT NULL,
   user_id CHAR(36) NOT NULL,
   content TEXT,
   media_id CHAR(36) NULL,
   sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_messages_room
       FOREIGN KEY (room_id)
       REFERENCES chat_rooms(room_id)
       ON DELETE CASCADE,
   CONSTRAINT fk_messages_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE,
   CONSTRAINT fk_messages_media
       FOREIGN KEY (media_id)
       REFERENCES media(media_id)
       ON DELETE SET NULL
);
-- =========================================================
-- CHATBOT INTERACTIONS
-- =========================================================
CREATE TABLE chatbot_interactions (
   interaction_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   prompt_text TEXT NOT NULL,
   response_text TEXT,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_chatbot_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- GENERATED IMAGES
-- =========================================================
CREATE TABLE generated_images (
   image_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   prompt_text TEXT,
   image_url VARCHAR(2048) NOT NULL,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_generated_images_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- CALENDAR EVENTS
-- =========================================================
CREATE TABLE calendar_events (
   event_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   title VARCHAR(255) NOT NULL,
   description TEXT,
   start_datetime DATETIME NOT NULL,
   end_datetime DATETIME NOT NULL,
   location TEXT,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_calendar_events_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- CHECKLISTS
-- =========================================================
CREATE TABLE checklists (
   checklist_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   title VARCHAR(255) NOT NULL,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_checklists_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE
);
-- =========================================================
-- CHECKLIST ITEMS
-- =========================================================
CREATE TABLE checklist_items (
   item_id CHAR(36) PRIMARY KEY,
   checklist_id CHAR(36) NOT NULL,
   description TEXT NOT NULL,
   is_completed BOOLEAN NOT NULL DEFAULT FALSE,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_checklist_items_checklist
       FOREIGN KEY (checklist_id)
       REFERENCES checklists(checklist_id)
       ON DELETE CASCADE
);
-- =========================================================
-- FOLDERS
-- parent_folder_id allows folders inside other folders.
-- =========================================================
CREATE TABLE folders (
   folder_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   folder_name VARCHAR(255) NOT NULL,
   parent_folder_id CHAR(36) NULL,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_folders_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE,
   CONSTRAINT fk_folders_parent
       FOREIGN KEY (parent_folder_id)
       REFERENCES folders(folder_id)
       ON DELETE CASCADE
);
-- =========================================================
-- FILES
-- =========================================================
CREATE TABLE files (
   file_id CHAR(36) PRIMARY KEY,
   user_id CHAR(36) NOT NULL,
   folder_id CHAR(36) NULL,
   file_name VARCHAR(255) NOT NULL,
   file_type VARCHAR(100),
   file_url VARCHAR(2048) NOT NULL,
   uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_files_user
       FOREIGN KEY (user_id)
       REFERENCES users(user_id)
       ON DELETE CASCADE,
   CONSTRAINT fk_files_folder
       FOREIGN KEY (folder_id)
       REFERENCES folders(folder_id)
       ON DELETE SET NULL
);
