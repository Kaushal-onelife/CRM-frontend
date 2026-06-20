// Builds a print-ready HTML invoice for expo-print. Pure string output — no
// React, no native deps — so it's easy to tweak and testable.
//
// Brand colors mirror the ClientTrack logo (navy + bright blue from tokens.js).

const NAVY = "#1B3A6B";
const BLUE = "#2E9BE6";
const TEXT = "#1F2937";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const SOFT = "#F8FAFC";

const money = (n) => {
  const num = Number(n);
  const v = Number.isFinite(num) ? num : 0;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? esc(iso)
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// bill: { bill_number, created_at, amount, tax, total, payment_status,
//         payment_method, customers:{name,phone,address}, bill_items:[...] }
// business: { business_name, address, phone, email }
// logoDataUri: optional base64 data URI string for the logo image
export function buildInvoiceHtml(bill, business = {}, logoDataUri = "") {
  const items = bill.bill_items || [];
  const isPaid = bill.payment_status === "paid";
  const hasTax = Number(bill.tax) > 0;

  const rows = items
    .map(
      (it, i) => `
      <tr style="background:${i % 2 ? SOFT : "#fff"}">
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};">${esc(it.description)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};text-align:center;">${esc(it.quantity)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};text-align:right;">${money(it.unit_price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};text-align:right;font-weight:600;">${money(it.total)}</td>
      </tr>`
    )
    .join("");

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" style="width:96px;height:96px;object-fit:contain;margin-right:16px;" />`
    : "";

  const statusColor = isPaid ? "#10B981" : "#F59E0B";
  const statusSoft = isPaid ? "#ECFDF5" : "#FFFBEB";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: ${TEXT}; margin: 0; padding: 32px; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:3px solid ${NAVY}; }
  .biz { display:flex; align-items:center; }
  .biz-name { font-size:20px; font-weight:800; color:${NAVY}; }
  .biz-meta { color:${MUTED}; font-size:12px; line-height:1.5; margin-top:2px; }
  .invoice-title { font-size:30px; font-weight:800; color:${BLUE}; letter-spacing:1px; }
  .meta-grid { display:flex; justify-content:space-between; margin-top:24px; }
  .label { color:${MUTED}; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
  .val { font-weight:600; }
  table { width:100%; border-collapse:collapse; margin-top:24px; }
  thead th { background:${NAVY}; color:#fff; padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; text-align:left; }
  .totals { margin-top:18px; display:flex; justify-content:flex-end; }
  .totals table { width:280px; margin:0; }
  .totals td { padding:6px 0; }
  .total-box { background:${BLUE}; color:#fff; border-radius:8px; }
  .total-box td { padding:12px 14px; font-size:16px; font-weight:800; }
  .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-weight:700; font-size:12px; color:${statusColor}; background:${statusSoft}; }
  .footer { margin-top:40px; padding-top:16px; border-top:1px solid ${BORDER}; color:${MUTED}; font-size:11px; text-align:center; }
</style>
</head>
<body>
  <div class="header">
    <div class="biz">
      ${logoHtml}
      <div>
        <div class="biz-name">${esc(business.business_name || "ClientTrack")}</div>
        ${business.address ? `<div class="biz-meta">${esc(business.address)}</div>` : ""}
        ${
          // Phone & email on one line, joined by · only when both exist; the line
          // is omitted entirely if neither is set.
          (business.phone || business.email)
            ? `<div class="biz-meta">${[business.phone && esc(business.phone), business.email && esc(business.email)].filter(Boolean).join(" &middot; ")}</div>`
            : ""
        }
      </div>
    </div>
    <div class="invoice-title">INVOICE</div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="label">Bill To</div>
      <div class="val">${esc(bill.customers?.name || "Customer")}</div>
      <div style="color:${MUTED};">${esc(bill.customers?.phone || "")}</div>
      ${bill.customers?.address ? `<div style="color:${MUTED};max-width:220px;">${esc(bill.customers.address)}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="label">Invoice #</div>
      <div class="val">${esc(bill.bill_number)}</div>
      <div class="label" style="margin-top:10px;">Date</div>
      <div class="val">${formatDate(bill.created_at)}</div>
      <div class="label" style="margin-top:10px;">Status</div>
      <div><span class="badge">${isPaid ? "PAID" : "UNPAID"}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td style="color:${MUTED};">Subtotal</td><td style="text-align:right;">${money(bill.amount)}</td></tr>
      ${hasTax ? `<tr><td style="color:${MUTED};">Tax</td><td style="text-align:right;">${money(bill.tax)}</td></tr>` : ""}
      <tr><td colspan="2" style="height:6px;"></td></tr>
      <tr class="total-box"><td>TOTAL</td><td style="text-align:right;">${money(bill.total)}</td></tr>
    </table>
  </div>

  ${bill.payment_method ? `<div style="margin-top:18px;color:${MUTED};">Payment Method: <span class="val" style="text-transform:capitalize;">${esc(bill.payment_method)}</span></div>` : ""}

  <div class="footer">
    Thank you for your business!<br/>
    Generated by ClientTrack
  </div>
</body>
</html>`;
}
