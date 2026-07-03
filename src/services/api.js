import { supabase } from "./supabase";
import { Platform } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:5000/api"
    : "http://10.0.2.2:5000/api");

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function apiCall(endpoint, options = {}) {
  const headers = await getAuthHeaders();

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch (e) {
    // fetch() throws a TypeError when the device is offline / server unreachable.
    // Tag it so React Query can skip retries and the UI can fall back to cache.
    const err = new Error("You appear to be offline. Showing saved data where available.");
    err.isNetworkError = true;
    throw err;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Session expired or invalid token — force sign-out so the auth navigator takes over.
    // Skip for /auth/* so a wrong password just shows an error, not a hard logout.
    if (response.status === 401 && !endpoint.startsWith("/auth/")) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore — listener will still fire on next session check
      }
    }
    const err = new Error(
      data.error || data.message || `Request failed (${response.status})`
    );
    err.status = response.status;
    throw err;
  }

  return data;
}

// Auth
export const authAPI = {
  signup: (body) =>
    apiCall("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    apiCall("/auth/login", { method: "POST", body: JSON.stringify(body) }),
};

// Tenant / business profile (business info + bill terms)
export const tenantAPI = {
  update: (id, body) =>
    apiCall(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

// Dashboard
export const dashboardAPI = {
  get: () => apiCall("/dashboard"),
  // Monthly revenue report (collected/billed/outstanding) over the last N months
  // ending at `end` (a "YYYY-MM" anchor; omit for the current month).
  getRevenue: (months = 6, end = null) =>
    apiCall(`/dashboard/revenue?months=${months}${end ? `&end=${end}` : ""}`),
};

// Customers
export const customerAPI = {
  getAll: (params = "") => apiCall(`/customers?${params}`),
  getById: (id) => apiCall(`/customers/${id}`),
  create: (body) =>
    apiCall("/customers", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    apiCall(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => apiCall(`/customers/${id}`, { method: "DELETE" }),
  // Export returns raw CSV text (not JSON), so it bypasses apiCall's .json().
  exportCsv: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/customers/export`, { headers });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `Export failed (${res.status})`);
    }
    return res.text();
  },
  // Import posts raw CSV text; returns { summary, errors }.
  importCsv: (csv, mode = "update") =>
    apiCall("/customers/import", {
      method: "POST",
      body: JSON.stringify({ csv, mode }),
    }),
};

// Services
export const serviceAPI = {
  getAll: (params = "") => apiCall(`/services?${params}`),
  getById: (id) => apiCall(`/services/${id}`),
  getCustomerHistory: (customerId) =>
    apiCall(`/services/customer/${customerId}/history`),
  create: (body) =>
    apiCall("/services", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    apiCall(`/services/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => apiCall(`/services/${id}`, { method: "DELETE" }),
  markCompleted: (id, body) =>
    apiCall(`/services/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  generateBill: (body) =>
    apiCall("/services/generate-bill", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// Bills
export const billAPI = {
  getAll: (params = "") => apiCall(`/bills?${params}`),
  getById: (id) => apiCall(`/bills/${id}`),
  create: (body) =>
    apiCall("/bills", { method: "POST", body: JSON.stringify(body) }),
  markPaid: (id, body) =>
    apiCall(`/bills/${id}/pay`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// Reminders (service due/overdue, AMC expiring) — computed live, tenant-scoped.
export const reminderAPI = {
  get: (params = "") => apiCall(`/reminders?${params}`),
  logContacted: (body) =>
    apiCall("/reminders/contacted", { method: "POST", body: JSON.stringify(body) }),
};

// Push notifications — register this device's Expo token so the daily reminder
// cron can notify the logged-in staff user. `null` token unregisters the device.
export const pushAPI = {
  saveToken: (token) =>
    apiCall("/me/push-token", { method: "POST", body: JSON.stringify({ token }) }),
  test: () => apiCall("/me/push-token/test", { method: "POST" }),
};

// Notification Center — the in-app inbox of everything the system has flagged
// (payments, due services, AMC expiries, etc.), with read state + deep-links.
export const notificationAPI = {
  list: (params = "") => apiCall(`/me/notifications?${params}`),
  unreadCount: () => apiCall("/me/notifications/unread-count"),
  markRead: (id) => apiCall(`/me/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiCall("/me/notifications/read-all", { method: "POST" }),
  getPrefs: () => apiCall("/me/notify-prefs"),
  setPref: (category, enabled) =>
    apiCall("/me/notify-prefs", {
      method: "PATCH",
      body: JSON.stringify({ category, enabled }),
    }),
};

// AMC Contracts
export const amcAPI = {
  getAll: (params = "") => apiCall(`/amc?${params}`),
  getById: (id) => apiCall(`/amc/${id}`),
  create: (body) =>
    apiCall("/amc", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    apiCall(`/amc/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  checkExpired: () => apiCall("/amc/check-expired", { method: "POST" }),
  // Renew an existing contract — creates a new linked contract, closes the old.
  renew: (id, body) =>
    apiCall(`/amc/${id}/renew`, { method: "POST", body: JSON.stringify(body) }),
  remove: (id) => apiCall(`/amc/${id}`, { method: "DELETE" }),
};

// Parts Inventory
export const inventoryAPI = {
  getAll: (params = "") => apiCall(`/inventory?${params}`),
  getById: (id) => apiCall(`/inventory/${id}`),
  create: (body) =>
    apiCall("/inventory", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    apiCall(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id) => apiCall(`/inventory/${id}`, { method: "DELETE" }),
};
