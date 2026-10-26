const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const TEXT_EXTENSIONS = ["txt", "md", "csv"];

function getExtension(name) {
  const dotIndex = name.lastIndexOf(".");

  return dotIndex === -1 ? "" : name.slice(dotIndex + 1).toLowerCase();
}

export function getPreview(file) {
  const type = (file.type || "").toLowerCase();
  const extension = getExtension(file.name);

  if (IMAGE_TYPES.includes(type)) {
    return { kind: "image", mime: type };
  }

  if (type === "application/pdf" || extension === "pdf") {
    return { kind: "pdf", mime: "application/pdf" };
  }

  if (
    TEXT_EXTENSIONS.includes(extension) ||
    type === "text/plain" ||
    type === "text/markdown" ||
    type === "text/csv"
  ) {
    return { kind: "text", mime: "text/plain" };
  }

  if (AUDIO_TYPES.includes(type)) {
    return { kind: "audio", mime: type };
  }

  if (VIDEO_TYPES.includes(type)) {
    return { kind: "video", mime: type };
  }

  return { kind: "none", mime: "" };
}

const KIND_LABELS = {
  image: "Image",
  pdf: "PDF",
  text: "Text",
  audio: "Audio",
  video: "Video",
};

export function getTypeLabel(file) {
  const { kind } = getPreview(file);

  if (KIND_LABELS[kind]) {
    return KIND_LABELS[kind];
  }

  const extension = getExtension(file.name);

  return extension ? extension.toUpperCase() : "File";
}

export function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}