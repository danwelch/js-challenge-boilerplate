/**
 * A failed upload attempt, in a shape the view can render safely.
 *
 * `message` is the plain-text reason (no markup); `filename` — when present —
 * is the user-controlled name of the file that failed, rendered separately by
 * the template inside a `<code>` element. Splitting the two means the store
 * never carries HTML and every interpolation path goes through Angular's
 * default escaping.
 */
export interface UploadError {
  message: string;
  filename?: string;
}
