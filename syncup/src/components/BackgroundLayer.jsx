import { DEFAULT_BACKGROUND_SRC } from "./homePageUtils";

function BackgroundLayer({ backgroundSrc }) {
  return (
    <div className="background-layer" aria-hidden="true">
      <img
        src={backgroundSrc || DEFAULT_BACKGROUND_SRC}
        alt="SyncUp background"
        className="background-image"
      />

      <div className="background-overlay" />
    </div>
  );
}

export default BackgroundLayer;
