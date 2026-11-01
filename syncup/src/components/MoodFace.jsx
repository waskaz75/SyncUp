import { getMood } from "./meUtils";

const MOUTHS = {
  great: <path d="M11 23h18a9 9 0 0 1-18 0Z" fill="currentColor" />,
  good: <path d="M13 24c2 3.5 12 3.5 14 0" className="mood-face-mouth" />,
  okay: <path d="M14 27h12" className="mood-face-mouth" />,
  low: <path d="M13 29c2-3.5 12-3.5 14 0" className="mood-face-mouth" />,
  awful: <path d="M12.5 30c2.5-5 12.5-5 15 0" className="mood-face-mouth" />,
};

function MoodFace({ mood, size, title }) {
  const info = getMood(mood);
  const hasCheeks = info.value === "great" || info.value === "good";

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="mood-face"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        style={{ fill: `var(--mood-${info.value})` }}
      />

      <circle cx="14" cy="16" r="2.2" fill="currentColor" />
      <circle cx="26" cy="16" r="2.2" fill="currentColor" />

      {hasCheeks && (
        <>
          <circle cx="8.5" cy="22" r="2.6" className="mood-face-cheek" />
          <circle cx="31.5" cy="22" r="2.6" className="mood-face-cheek" />
        </>
      )}

      {info.value === "awful" && (
        <ellipse cx="10.5" cy="23" rx="1.7" ry="2.6" className="mood-face-tear" />
      )}

      {MOUTHS[info.value]}
    </svg>
  );
}

export default MoodFace;