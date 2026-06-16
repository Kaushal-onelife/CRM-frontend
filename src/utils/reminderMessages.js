// Channel-agnostic reminder message builder. Returns plain text usable by the
// WhatsApp deep link today and by an SMS/WhatsApp-API sender later — so adding
// paid sending needs no change here.

function formatDate(iso) {
  if (!iso) return "";
  // YYYY-MM-DD -> "12 Jun 2026"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// type: 'service_due' | 'service_overdue' | 'amc_expiring'
export function buildReminderMessage({ customerName, businessName, type, date, label }) {
  const name = customerName || "there";
  const biz = businessName ? ` from ${businessName}` : "";
  const when = formatDate(date);

  switch (type) {
    case "service_due":
      return `Hi ${name}, your water purifier service${biz} is due on ${when}. Please reply to confirm a convenient time. Thank you!`;
    case "service_overdue":
      return `Hi ${name}, your water purifier service${biz} was due on ${when} and is now pending. Please book at your earliest convenience so your purifier keeps running well.`;
    case "amc_expiring":
      return `Hi ${name}, your AMC plan${label ? ` "${label}"` : ""}${biz} expires on ${when}. Renew now to keep uninterrupted service and avoid downtime.`;
    default:
      return `Hi ${name}, this is a reminder${biz}.`;
  }
}

// Builds a WhatsApp deep link with a prefilled message, matching the existing
// 91-prefix convention used in ServiceSuccessScreen.
export function buildWhatsAppUrl(phone, message) {
  const digits = (phone || "").replace(/\D/g, "");
  const number = digits.startsWith("91") ? digits : `91${digits}`;
  return `whatsapp://send?phone=${number}&text=${encodeURIComponent(message)}`;
}

// Human-friendly relative label for the reminder date.
export function relativeWhen(daysUntil) {
  if (daysUntil < 0) return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} overdue`;
  if (daysUntil === 0) return "due today";
  if (daysUntil === 1) return "due tomorrow";
  return `in ${daysUntil} days`;
}
