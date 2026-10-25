import { useEffect, useRef, useState } from "react";

const PRESETS = [
  { label: "Focus", minutes: 25 },
  { label: "Short break", minutes: 5 },
  { label: "Long break", minutes: 15 },
];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function TimerPage() {
  const [mode, setMode] = useState("pomodoro");
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const audioContextRef = useRef(null);

  function playCompletionSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const audioContext =
      audioContextRef.current || new AudioContext();
    audioContextRef.current = audioContext;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, startTime);
    oscillator.frequency.setValueAtTime(880, startTime + 0.18);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.5);
  }

  function toggleRunning() {
    if (!isRunning && audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    setIsRunning((current) => !current);
  }

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (mode === "stopwatch") {
          return currentSeconds + 1;
        }

        if (currentSeconds <= 1) {
          setIsRunning(false);

          if (mode !== "stopwatch") {
            playCompletionSound();
          }

          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, mode]);

  function changeMode(nextMode) {
    setMode(nextMode);
    setIsRunning(false);
    setRemainingSeconds(nextMode === "stopwatch" ? 0 : 25 * 60);
    setSelectedPreset(25);
    setCustomMinutes(25);
  }

  function choosePreset(minutes) {
    setSelectedPreset(minutes);
    setCustomMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(false);
  }

  function applyCustomDuration(event) {
    event.preventDefault();

    const minutes = Number(customMinutes);

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
      return;
    }

    setSelectedPreset(null);
    setRemainingSeconds(Math.round(minutes * 60));
    setIsRunning(false);
  }

  function resetTimer() {
    if (mode === "stopwatch") {
      setRemainingSeconds(0);
      setIsRunning(false);
      return;
    }

    const minutes = selectedPreset ?? Number(customMinutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(false);
  }

  return (
    <section className="timer-page" aria-labelledby="timer-title">
      <div className="timer-panel">
        <div className="timer-heading">
          <p className="timer-kicker">TIME TOOL</p>
          <h1 id="timer-title">Stay in the moment.</h1>
        </div>

        <div className="timer-mode-switcher" role="tablist" aria-label="Timer modes">
          {[
            ["pomodoro", "Pomodoro"],
            ["countdown", "Countdown"],
            ["stopwatch", "Stopwatch"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? "active" : ""}
              onClick={() => changeMode(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "pomodoro" && (
          <div className="timer-presets" aria-label="Pomodoro presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                className={selectedPreset === preset.minutes ? "active" : ""}
                onClick={() => choosePreset(preset.minutes)}
              >
                <span>{preset.label}</span>
                <strong>{preset.minutes} min</strong>
              </button>
            ))}
          </div>
        )}

        <div className="timer-display" aria-live="polite">
          {formatTime(remainingSeconds)}
        </div>

        <div className="timer-actions">
          <button
            type="button"
            className="timer-primary-action"
            onClick={toggleRunning}
            disabled={mode !== "stopwatch" && remainingSeconds === 0}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button type="button" className="timer-secondary-action" onClick={resetTimer}>
            Reset
          </button>
        </div>

        {mode === "countdown" && (
          <form className="timer-custom-form" onSubmit={applyCustomDuration}>
            <label htmlFor="custom-timer-minutes">Countdown minutes</label>
            <div>
              <input
                id="custom-timer-minutes"
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
              />
              <button type="submit">Set timer</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default TimerPage;