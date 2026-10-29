import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CommsAvatar from "./commsAvatar";
import {
  joinVoiceChannel,
  leaveVoiceChannel,
  setVoiceMuted,
  startScreenShare,
  stopScreenShare,
  subscribeToVoiceChannel,
} from "./commsApi";
import { useUser } from "./homePageUtils";
import { useProfilePicture } from "./useProfilePicture";

function describeMediaError(error, device) {
  const name = error?.name;

  if (name === "NotAllowedError" || name === "SecurityError") {
    return device === "microphone"
      ? "Microphone access was blocked. Allow the microphone in your browser's address bar, then try again."
      : "Screen sharing was cancelled or blocked. Please try again.";
  }

  if (name === "NotFoundError") {
    return "No microphone was found. Plug one in and try again.";
  }

  if (name === "NotReadableError") {
    return "Your microphone is in use by another app, or your system is blocking it.";
  }

  return device === "microphone"
    ? "Could not start your microphone. Please try again."
    : "Could not start screen sharing. Please try again.";
}

function getTileSize(count) {
  if (count <= 1) {
    return 200;
  }

  if (count === 2) {
    return 170;
  }

  if (count <= 4) {
    return 140;
  }

  if (count <= 6) {
    return 112;
  }

  if (count <= 9) {
    return 92;
  }

  if (count <= 16) {
    return 76;
  }

  return 64;
}

function VoiceChannel({ onVoiceChange }) {
  const username = useUser();
  const picture = useProfilePicture();

  const micStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const meterIntervalRef = useRef(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mountedRef = useRef(false);
  const joinedRef = useRef(false);

  const [status, setStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [remoteScreen, setRemoteScreen] = useState(null);

  const isJoined = status === "joined";
  const showScreen = isSharing || Boolean(remoteScreen);

  const everyone = useMemo(
    () => [
      {
        id: "me",
        username,
        picture,
        isMuted,
        isSelf: true,
        speaking: isSpeaking && !isMuted,
      },
      ...participants,
    ],
    [username, picture, isMuted, isSpeaking, participants]
  );

  const releaseAll = useCallback(() => {
    window.clearInterval(meterIntervalRef.current);
    meterIntervalRef.current = 0;

    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;

    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;

    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      releaseAll();

      if (joinedRef.current) {
        joinedRef.current = false;
        leaveVoiceChannel().catch(() => {});
      }
    };
  }, [releaseAll]);

  useEffect(() => {
    onVoiceChange({
      isJoined,
      people: isJoined ? everyone : [],
      screenActive: isJoined && showScreen,
    });
  }, [isJoined, everyone, showScreen, onVoiceChange]);

  useEffect(() => {
    if (!isJoined) {
      return undefined;
    }

    const unsubscribe = subscribeToVoiceChannel({
      onParticipants: setParticipants,
      onRemoteScreen: setRemoteScreen,
    });

    return () => {
      unsubscribe();
      setParticipants([]);
      setRemoteScreen(null);
    };
  }, [isJoined]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = isSharing
        ? screenStreamRef.current
        : null;
    }
  }, [isSharing]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteScreen?.stream ?? null;
    }
  }, [remoteScreen]);

  function startLevelMeter(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    const samples = new Uint8Array(512);

    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    context.resume().catch(() => {});

    audioContextRef.current = context;

    meterIntervalRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(samples);

      let peak = 0;

      samples.forEach((value) => {
        peak = Math.max(peak, Math.abs(value - 128));
      });

      setIsSpeaking(peak > 12);
    }, 120);
  }

  async function handleJoin() {
    if (status !== "idle") {
      return;
    }

    setError("");
    setStatus("joining");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone is not supported here.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      micStreamRef.current = stream;

      await joinVoiceChannel(stream);

      if (!mountedRef.current) {
        return;
      }

      joinedRef.current = true;
      startLevelMeter(stream);
      setIsMuted(false);
      setStatus("joined");
    } catch (joinError) {
      console.error("Joining voice channel failed:", joinError);

      releaseAll();

      if (mountedRef.current) {
        setError(describeMediaError(joinError, "microphone"));
        setStatus("idle");
      }
    }
  }

  async function handleLeave() {
    releaseAll();
    joinedRef.current = false;

    setIsSharing(false);
    setIsSpeaking(false);
    setIsMuted(false);
    setStatus("idle");

    try {
      await leaveVoiceChannel();
    } catch (leaveError) {
      console.error("Leaving voice channel failed:", leaveError);
    }
  }

  function handleToggleMute() {
    const nextMuted = !isMuted;

    micStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
    setVoiceMuted(nextMuted).catch((muteError) => {
      console.error("Sharing mute state failed:", muteError);
    });
  }

  function handleStopShare() {
    if (!screenStreamRef.current) {
      return;
    }

    screenStreamRef.current.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;

    setIsSharing(false);
    stopScreenShare().catch((stopError) => {
      console.error("Stopping screen share failed:", stopError);
    });
  }

  async function handleStartShare() {
    setError("");

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen sharing is not supported here.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      screenStreamRef.current = stream;

      stream.getVideoTracks()[0]?.addEventListener("ended", handleStopShare);

      await startScreenShare(stream);

      if (mountedRef.current && screenStreamRef.current === stream) {
        setIsSharing(true);
      }
    } catch (shareError) {
      console.error("Screen share failed:", shareError);

      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      if (mountedRef.current) {
        setIsSharing(false);
        setError(describeMediaError(shareError, "screen"));
      }
    }
  }

  return (
    <section className="comms-view" aria-labelledby="comms-voice-title">
        <header
            className={`comms-view-header ${showScreen ? "visually-hidden" : ""}`}
        >
            <h2 id="comms-voice-title">Voice channel</h2>
        </header>

      {error && (
        <div className="checklist-banner comms-banner" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="checklist-banner-dismiss"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {!isJoined ? (
        <div className="comms-voice-body">
          <div className="comms-voice-intro">
            <p>
              Join the voice channel to talk with other people. Your browser
              will ask for permission to use your microphone.
            </p>

            <button
              type="button"
              className="checklist-button"
              onClick={handleJoin}
              disabled={status === "joining"}
            >
              {status === "joining" ? "Joining…" : "Join voice"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`comms-voice-body ${showScreen ? "has-screen" : ""}`}
          >
            {!showScreen && (
              <>
                <p className="comms-voice-count" role="status">
                  {`In voice (${everyone.length})`}
                </p>

                <ul
                  className="comms-participants"
                  style={{
                    "--tile-size": `${getTileSize(everyone.length)}px`,
                  }}
                >
                  {everyone.map((person) => (
                    <li
                      key={person.id}
                      className={`comms-participant ${
                        person.speaking ? "speaking" : ""
                      }`}
                    >
                      <CommsAvatar
                        picture={person.picture}
                        name={person.username}
                        className="comms-avatar-large"
                      />

                      <span className="comms-participant-name">
                        {person.isSelf
                          ? `${person.username} (you)`
                          : person.username}
                      </span>

                      {person.isMuted && (
                        <span className="comms-participant-state">Muted</span>
                      )}
                    </li>
                  ))}
                </ul>

                {everyone.length === 1 && (
                  <p className="comms-empty">
                    You're the only one here right now.
                  </p>
                )}
              </>
            )}

            {remoteScreen && (
              <figure className="comms-screen">
                <figcaption>{`${remoteScreen.username} is sharing their screen`}</figcaption>

                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  aria-label={`${remoteScreen.username}'s shared screen`}
                />
              </figure>
            )}

            {isSharing && (
              <figure className="comms-screen">

                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Preview of your shared screen"
                />
              </figure>
            )}
          </div>

          <div className="comms-controls" role="group" aria-label="Call controls">
            <button
              type="button"
              className="checklist-button checklist-button-secondary"
              aria-pressed={isMuted}
              onClick={handleToggleMute}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>

            <button
              type="button"
              className="checklist-button checklist-button-secondary"
              aria-pressed={isSharing}
              onClick={isSharing ? handleStopShare : handleStartShare}
            >
              {isSharing ? "Stop sharing" : "Share screen"}
            </button>

            <button
              type="button"
              className="checklist-button comms-leave"
              onClick={handleLeave}
            >
              Leave
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default VoiceChannel;