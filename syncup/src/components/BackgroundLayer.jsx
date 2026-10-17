import {
  DEFAULT_BACKGROUND_SRC,
  sanitizeBackgroundSource,
} from "./homePageUtils";

function BackgroundLayer({ backgroundSrc }) {
  const safeSource = sanitizeBackgroundSource(
    backgroundSrc || DEFAULT_BACKGROUND_SRC
  );
  const cssSource = safeSource.replace(/["\\]/g, "\\$&");

  return (
    <div className="background-layer" aria-hidden="true">
      <div
        className="background-image"
        style={{ backgroundImage: `url("${cssSource}")` }}
      />

      <div className="background-overlay" />
    </div>
  );
}

export default BackgroundLayer;
