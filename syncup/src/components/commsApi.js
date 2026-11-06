
import { SESSION_KEY, USERNAME_KEY } from "./homePageUtils";

const API_BASE_URL = `${(import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
)}/api/comms`;

const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || "").replace(
  /\/+$/,
  ""
);

export const MAX_MESSAGE_LENGTH = 2000;

function getSessionId() {
  const sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    throw new Error("You must be logged in to use communications.");
  }

  return sessionId;
}

function buildUrl(path = "") {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  url.searchParams.set("sessionId", getSessionId());
  return url.toString();
}

function webSocketUrl(path) {
  const configuredApi = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/+$/,
    ""
  );

  const base =
    WS_BASE_URL ||
    (configuredApi
      ? configuredApi.replace(/^http/, "ws")
      : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`);

  const url = new URL(`${base}${path}`, window.location.origin);
  url.searchParams.set("sessionId", getSessionId());
  return url.toString();
}

async function readResponse(response) {
  if (!response.ok) {
    throw new Error(
      (await response.text()) || "The communications request failed."
    );
  }

  return response.json();
}

export async function getConversations() {
  return readResponse(await fetch(buildUrl("/conversations")));
}

export async function createGroup(name, usernames) {
  return readResponse(
    await fetch(buildUrl("/conversations"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, usernames }),
    })
  );
}

export async function createDirectMessage(username) {
  return readResponse(
    await fetch(buildUrl("/direct"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
  );
}

export async function addConversationMember(conversationId, username) {
  return readResponse(
    await fetch(buildUrl(`/conversations/${conversationId}/members`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
  );
}

export async function getMessages(conversationId) {
  return readResponse(
    await fetch(buildUrl(`/conversations/${conversationId}/messages`))
  );
}

export async function sendMessage(conversationId, text) {
  const body = new URLSearchParams({ text });

  return readResponse(
    await fetch(buildUrl(`/conversations/${conversationId}/messages`), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
  );
}

export function subscribeToMessages(conversationId, onChange) {
  let socket;

  try {
    socket = new WebSocket(webSocketUrl("/ws/comms"));
  } catch (error) {
    console.error("Opening communications socket failed:", error);
    return () => {};
  }

  socket.onmessage = (event) => {
    try {
      onChange((current) => {
        const message = JSON.parse(event.data);

        if (message.conversationId !== conversationId) {
          return current;
        }

        return current.some((item) => item.id === message.id)
          ? current
          : [...current, message];
      });
    } catch (error) {
      console.error("Reading communications event failed:", error);
    }
  };

  socket.onerror = (error) =>
    console.error("Communications socket failed:", error);

  return () => socket.close();
}

// Voice communication state

let voiceSocket = null;
let localStream = null;
let screenStream = null;
let voiceCallbacks = {};
let participants = [];

const peers = new Map();

function iceServers() {
  try {
    return JSON.parse(import.meta.env.VITE_ICE_SERVERS || "[]");
  } catch (error) {
    console.error("Invalid VITE_ICE_SERVERS configuration:", error);
    return [];
  }
}

function sendVoice(message) {
  if (voiceSocket?.readyState === WebSocket.OPEN) {
    voiceSocket.send(JSON.stringify(message));
  }
}

function updateParticipants(next) {
  participants = next;
  voiceCallbacks.onParticipants?.(participants);
}

function removePeer(id) {
  const peer = peers.get(id);

  peer?.connection.close();
  peers.delete(id);

  updateParticipants(
    participants.filter((participant) => participant.id !== id)
  );
}

function createPeer(id) {
  if (peers.has(id)) {
    return peers.get(id).connection;
  }

  const connection = new RTCPeerConnection({
    iceServers: iceServers(),
  });

  const peer = {
    connection,
    sender: null,
    ready: false,
    negotiating: false,
  };

  peers.set(id, peer);

  localStream?.getTracks().forEach((track) => {
    peer.sender = connection.addTrack(track, localStream);
  });

  screenStream?.getTracks().forEach((track) => {
    connection.addTrack(track, screenStream);
  });

  connection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendVoice({
        type: "signal",
        target: id,
        candidate,
      });
    }
  };

  connection.ontrack = ({ track, streams }) => {
    if (track.kind === "audio") {
      const audio = new Audio();
      audio.srcObject = streams[0];
      audio.play().catch(() => {});
    } else if (track.kind === "video") {
      voiceCallbacks.onRemoteScreen?.({
        username:
          participants.find((participant) => participant.id === id)
            ?.username || "Participant",
        stream: streams[0],
      });
    }
  };

  connection.onconnectionstatechange = () => {
    if (
      ["failed", "closed", "disconnected"].includes(
        connection.connectionState
      )
    ) {
      removePeer(id);
    }
  };

  connection.onnegotiationneeded = async () => {
    if (
      !peer.ready ||
      peer.negotiating ||
      connection.signalingState !== "stable"
    ) {
      return;
    }

    try {
      peer.negotiating = true;

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      sendVoice({
        type: "signal",
        target: id,
        description: connection.localDescription,
      });
    } finally {
      peer.negotiating = false;
    }
  };

  return connection;
}

async function handleSignal(event) {
  const id = event.from;
  const connection = createPeer(id);

  if (event.description) {
    await connection.setRemoteDescription(event.description);

    if (event.description.type === "offer") {
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      sendVoice({
        type: "signal",
        target: id,
        description: connection.localDescription,
      });
    }

    peers.get(id).ready = true;
  }

  if (event.candidate) {
    await connection.addIceCandidate(event.candidate);
  }
}

export async function joinVoiceChannel(stream, conversationId) {
  if (!conversationId) {
    throw new Error("Select a conversation before joining voice.");
  }

  if (voiceSocket) {
    throw new Error("You are already connecting to or in a voice call.");
  }

  localStream = stream;

  let socket;

  try {
    socket = new WebSocket(webSocketUrl("/ws/voice"));
  } catch (error) {
    localStream = null;
    throw error;
  }

  voiceSocket = socket;

  try {
    await new Promise((resolve, reject) => {
      let settled = false;

      function finish(error) {
        if (settled) return;
        settled = true;

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "join",
            username: localStorage.getItem(USERNAME_KEY) || "Guest",
            conversationId,
          })
        );
      };

      socket.onerror = () => {
        finish(new Error("Could not connect to the voice channel."));
      };

      socket.onclose = () => {
        finish(new Error("The voice connection was closed."));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "error") {
            finish(
              new Error(message.message || "Could not join voice.")
            );
          } else if (message.type === "participants") {
            updateParticipants(message.participants);
            finish();
          }
        } catch (error) {
          finish(error);
        }
      };
    });
  } catch (error) {
    socket.close();

    if (voiceSocket === socket) {
      voiceSocket = null;
    }

    localStream = null;
    throw error;
  }

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "participants") {
        updateParticipants(message.participants);

        if (message.initiateOffers === false) {
          return;
        }

        for (const participant of message.participants) {
          const connection = createPeer(participant.id);

          if (connection.signalingState === "stable") {
            const peer = peers.get(participant.id);
            peer.negotiating = true;

            try {
              const offer = await connection.createOffer();
              await connection.setLocalDescription(offer);

              sendVoice({
                type: "signal",
                target: participant.id,
                description: connection.localDescription,
              });
            } finally {
              peer.ready = true;
              peer.negotiating = false;
            }
          } else {
            peers.get(participant.id).ready = true;
          }
        }
      } else if (message.type === "peer-joined") {
        if (!participants.some((person) => person.id === message.id)) {
          updateParticipants([
            ...participants,
            {
              id: message.id,
              username: message.username,
              picture: "",
              isMuted: false,
            },
          ]);
        }
      } else if (message.type === "peer-left") {
        removePeer(message.id);
      } else if (message.type === "signal") {
        await handleSignal(message);
      } else if (message.type === "mute") {
        updateParticipants(
          participants.map((participant) =>
            participant.id === message.from
              ? { ...participant, isMuted: message.isMuted }
              : participant
          )
        );
      } else if (message.type === "screen-stop") {
        voiceCallbacks.onRemoteScreen?.(null);
      } else if (message.type === "error") {
        console.error("Voice server error:", message.message);
      }
    } catch (error) {
      console.error("Handling voice event failed:", error);
    }
  };

  socket.onerror = (error) => {
    console.error("Voice WebSocket error:", error);
  };

  socket.onclose = () => {
    if (voiceSocket === socket) {
      voiceSocket = null;
      localStream = null;
      screenStream = null;

      peers.forEach((peer) => peer.connection.close());
      peers.clear();

      updateParticipants([]);
    }
  };
}

export async function leaveVoiceChannel() {
  sendVoice({ type: "leave" });

  peers.forEach((peer) => peer.connection.close());
  peers.clear();

  voiceSocket?.close();
  voiceSocket = null;

  localStream = null;
  screenStream = null;

  updateParticipants([]);
}

export async function setVoiceMuted(isMuted) {
  sendVoice({
    type: "mute",
    isMuted,
  });
}

export async function startScreenShare(stream) {
  screenStream = stream;

  for (const [id, peer] of peers) {
    stream.getTracks().forEach((track) => {
      peer.connection.addTrack(track, stream);
    });

    sendVoice({
      type: "screen-start",
      target: id,
    });
  }
}

export async function stopScreenShare() {
  screenStream = null;

  peers.forEach(({ connection }) => {
    connection
      .getSenders()
      .filter((sender) => sender.track?.kind === "video")
      .forEach((sender) => connection.removeTrack(sender));
  });

  sendVoice({ type: "screen-stop" });
}

export function subscribeToVoiceChannel({
  onParticipants,
  onRemoteScreen,
}) {
  voiceCallbacks = {
    onParticipants,
    onRemoteScreen,
  };

  onParticipants(participants);
  onRemoteScreen(null);

  return () => {
    voiceCallbacks = {};
  };
}
