import { supabase } from "./supabase";

const API_URL = "http://localhost:5000/api";

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };
}

async function apiCall(endpoint, options = {}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
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

// Dashboard
export const dashboardAPI = {
  get: () => apiCall("/dashboard"),
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
