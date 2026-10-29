import { USERNAME_KEY } from "./homePageUtils";

const MESSAGES_KEY = "syncup_comms_messages";
const PROFILE_PICTURE_KEY = "syncup_profile_picture";
const MOCK_DELAY_MS = 300;
const GUEST_NAME = "Guest";

export const MAX_MESSAGE_LENGTH = 2000;

// ------------------------------------------------------------
// Mock helpers (these all disappear when the backend is wired in)
// ------------------------------------------------------------

function wait() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function getCurrentUsername() {
  return (localStorage.getItem(USERNAME_KEY) || "").trim() || GUEST_NAME;
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isSafePicture(value) {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|webp);base64,/.test(value)
  );
}

function readPicture(author) {
  const suffix = author === GUEST_NAME ? "guest" : author;
  const stored = localStorage.getItem(`${PROFILE_PICTURE_KEY}_${suffix}`);

  return isSafePicture(stored) ? stored : "";
}

function withPicture(message) {
  return { ...message, authorPicture: readPicture(message.author) };
}

function buildSeedMessages() {
  const now = Date.now();
  const yesterday = now - 24 * 60 * 60 * 1000;

  return [
    {
      id: createId(),
      author: "Maya",
      text: "Hey everyone! Anyone studying for the exam this week?",
      sentAt: new Date(yesterday).toISOString(),
    },
    {
      id: createId(),
      author: "Jordan",
      text: "I am! Want to jump on a call later?",
      sentAt: new Date(yesterday + 5 * 60 * 1000).toISOString(),
    },
    {
      id: createId(),
      author: "Maya",
      text: "Yes, let's do it. I'll start a screen share for my notes.",
      sentAt: new Date(now - 60 * 1000).toISOString(),
    },
  ];
}

function writeMessages(messages) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

function readMessages() {
  const raw = localStorage.getItem(MESSAGES_KEY);

  if (raw === null) {
    const seeded = buildSeedMessages();

    writeMessages(seeded);

    return seeded;
  }

  try {
    const stored = JSON.parse(raw);

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

// ------------------------------------------------------------
// TEXT CHANNEL
// Each message: { id, author, authorPicture, text, sentAt }
// ------------------------------------------------------------

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/comms/messages", {
//     method: "GET",
//   });
// Send the session ID the same way calendarApi.js does (query parameter).
// Then throw if !response.ok, and return the messages from the response.
// The backend should return each author's picture URL as `authorPicture`
// (or "" if they have none).
export async function getMessages() {
  await wait();

  return readMessages().map(withPicture);
}

// TODO (Spring Boot): replace the mock below with
//   const response = await fetch("http://localhost:8080/api/comms/messages", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({ text }),
//   });
// The server decides the author and the time. Throw if !response.ok,
// and return the created message from the response.
export async function sendMessage(text) {
  await wait();

  const message = {
    id: createId(),
    author: getCurrentUsername(),
    text: text.trim(),
    sentAt: new Date().toISOString(),
  };

  writeMessages([...readMessages(), message]);

  return withPicture(message);
}

// Calls onChange(allMessages) whenever someone else posts. Returns a function
// that stops listening.
// TODO (Spring Boot): replace the mock below with a WebSocket, for example
//   const socket = new WebSocket("ws://localhost:8080/ws/comms");
//   socket.onmessage = (event) => onChange(JSON.parse(event.data));
//   return () => socket.close();
// (The mock only reacts to messages sent from ANOTHER browser tab.)
export function subscribeToMessages(onChange) {
  function handleStorage(event) {
    if (event.key === MESSAGES_KEY) {
      onChange(readMessages().map(withPicture));
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => window.removeEventListener("storage", handleStorage);
}

// ------------------------------------------------------------
// VOICE CHANNEL + SCREEN SHARE
// The browser already captures the microphone and screen (see
// VoiceChannel.jsx). What is missing is a server that connects people.
//
// TODO (Spring Boot / signaling): voice and video travel directly between
// browsers using WebRTC (RTCPeerConnection), but the browsers need a
// signaling server (for example a WebSocket at ws://localhost:8080/ws/voice)
// to exchange connection details. Agree with your backend teammate on how
// that works. The functions below mark where each step belongs.
// ------------------------------------------------------------

// Called after the microphone is captured.
// TODO: connect to the signaling server, announce "joined", create one
// RTCPeerConnection per other person, and add stream's audio track to it.
export async function joinVoiceChannel(stream) {
  void stream;
  await wait();
}

// TODO: tell the signaling server we left and close every RTCPeerConnection.
export async function leaveVoiceChannel() {
  await wait();
}

// TODO: tell other users this person is muted or unmuted.
export async function setVoiceMuted(isMuted) {
  void isMuted;
}

// Called when the user starts sharing.
// TODO: add the stream's video track to every RTCPeerConnection and tell
// the signaling server who is sharing.
export async function startScreenShare(stream) {
  void stream;
  await wait();
}

// TODO: remove the video track from every connection and tell the server.
export async function stopScreenShare() {
  await wait();
}

// Listen for changes from other people in the voice channel.
//   onParticipants([{ id, username, picture, isMuted }]) - others in the call
//   onRemoteScreen({ username, stream } | null) - someone else's shared
//     screen as a MediaStream (RTCPeerConnection "track" event), or null
//     when they stop.
// Returns a function that stops listening.
// TODO: wire these callbacks to the signaling server and RTCPeerConnections.
export function subscribeToVoiceChannel({ onParticipants, onRemoteScreen }) {
  onParticipants([]);
  onRemoteScreen(null);

  return () => {};
}