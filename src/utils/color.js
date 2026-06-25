// Convert a hex color (#abc or #aabbcc) into an rgba() string with the given
// alpha. Use this instead of 8-digit hex-alpha (`${color}1A`) — that shorthand
// renders in dev (web/Hermes) but can silently fail in release builds, leaving
// elements with no background. Falls back to the solid color on any unexpected
// input so callers never crash.
export function tint(hex, alpha) {
  if (typeof hex !== "string" || hex[0] !== "#") return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join(""); // #abc -> #aabbcc
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default tint;
