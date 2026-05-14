// Shared form validators. Each validator returns null when valid, or an error string.
// Use with `firstError()` to short-circuit on the first failure.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

export function isRequired(value, fieldName = "This field") {
  if (value === null || value === undefined) return `${fieldName} is required.`;
  if (typeof value === "string" && value.trim() === "") return `${fieldName} is required.`;
  return null;
}

export function isEmail(value, fieldName = "Email") {
  if (!value) return null; // use isRequired separately if mandatory
  if (!EMAIL_RE.test(value.trim())) return `${fieldName} is not a valid email address.`;
  return null;
}

// 10-digit Indian mobile number. Adjust if you need international.
export function isPhone(value, fieldName = "Phone") {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!PHONE_RE.test(digits)) return `${fieldName} must be a 10-digit number.`;
  return null;
}

export function minLength(value, min, fieldName = "This field") {
  if (!value) return null;
  if (String(value).length < min) return `${fieldName} must be at least ${min} characters.`;
  return null;
}

export function maxLength(value, max, fieldName = "This field") {
  if (!value) return null;
  if (String(value).length > max) return `${fieldName} must be at most ${max} characters.`;
  return null;
}

// Accepts numeric strings or numbers. Rejects NaN, Infinity, and negatives.
export function isNonNegativeNumber(value, fieldName = "This field") {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${fieldName} must be a number.`;
  if (n < 0) return `${fieldName} cannot be negative.`;
  return null;
}

export function isPositiveNumber(value, fieldName = "This field") {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${fieldName} must be a number.`;
  if (n <= 0) return `${fieldName} must be greater than 0.`;
  return null;
}

// Integer in [min, max] inclusive. Pass min=1 for "at least 1".
export function isIntegerInRange(value, min, max, fieldName = "This field") {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n)) return `${fieldName} must be a whole number.`;
  if (n < min) return `${fieldName} must be at least ${min}.`;
  if (n > max) return `${fieldName} must be at most ${max}.`;
  return null;
}

// Returns null if endDateStr is on/after startDateStr, else an error.
// Both expected as YYYY-MM-DD strings.
export function isDateAfter(endDateStr, startDateStr, fieldName = "End date") {
  if (!endDateStr || !startDateStr) return null;
  if (new Date(endDateStr) < new Date(startDateStr)) {
    return `${fieldName} must be on or after the start date.`;
  }
  return null;
}

// Run an array of [validatorResult] entries and return the first non-null.
// Each entry is the return value of a validator call.
//   firstError([isRequired(name, "Name"), isEmail(email)]);
export function firstError(results) {
  for (const r of results) if (r) return r;
  return null;
}

// Convenience: trim every string field in an object (shallow).
export function trimAll(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}
