// Human-readable labels for service types. Handles the AMC acronym (a plain
// capitalize renders "Amc") and the legacy "amc_service" value. Anything not
// listed falls back to title-casing the underscored key.
export const SERVICE_TYPE_LABELS = {
  installation: "Installation",
  repair: "Repair",
  maintenance: "Maintenance",
  filter_replacement: "Filter Change",
  filter_change: "Filter Change",
  amc: "AMC Service",
  amc_service: "AMC Service",
  general_service: "General Service",
  inspection: "Inspection",
  complaint: "Complaint",
};

export function formatServiceType(type) {
  if (!type) return "Service";
  if (SERVICE_TYPE_LABELS[type]) return SERVICE_TYPE_LABELS[type];
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
