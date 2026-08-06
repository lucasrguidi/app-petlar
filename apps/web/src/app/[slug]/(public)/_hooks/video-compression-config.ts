/**
 * Shared between the compression worker and the upload component. Kept in its
 * own module so importing the limits does not pull mediabunny into the main
 * bundle.
 */

/** Longest edge of the transcoded video, in pixels (720p). */
export const VIDEO_TARGET_MAX_EDGE = 1280

/** Target video bitrate, in bits per second (~10MB per minute). */
export const VIDEO_TARGET_BITRATE = 1_500_000

/** Target audio bitrate, in bits per second. */
export const VIDEO_TARGET_AUDIO_BITRATE = 96_000

/** What the applicant may select, when compression is available. */
export const VIDEO_INPUT_LIMITS = {
  maxSizeMb: 500,
  maxSizeBytes: 500 * 1024 * 1024,
  maxDurationSeconds: 300,
}

/** Fallback for browsers without WebCodecs: the original file is uploaded. */
export const VIDEO_LEGACY_LIMITS = {
  maxSizeMb: 50,
  maxSizeBytes: 50 * 1024 * 1024,
  maxDurationSeconds: 60,
}

/**
 * Ceiling on the compressed result. Must stay in sync with MAX_VIDEO_SIZE in
 * packages/api/src/routers/applications.ts, which enforces it server-side.
 */
export const VIDEO_OUTPUT_LIMITS = {
  maxSizeMb: 80,
  maxSizeBytes: 80 * 1024 * 1024,
}
