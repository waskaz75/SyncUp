import {
  DEFAULT_BACKGROUND_SRC,
  sanitizeBackgroundSource,
} from "./homePageUtils";

function BackgroundLayer({ backgroundSrc }) {
  const safeSource = sanitizeBackgroundSource(
    backgroundSrc || DEFAULT_BACKGROUND_SRC
  );

  return (
    <div className="background-layer" aria-hidden="true">
      <img
        src={safeSource}
        alt="SyncUp background"
        className="background-image"
      />

      <div className="background-overlay" />
    </div>
  );
}

export default BackgroundLayer;
