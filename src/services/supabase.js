import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Check if we're in mock mode (no real Supabase credentials)
const isMockMode =
  !SUPABASE_URL ||
  SUPABASE_URL === "YOUR_SUPABASE_URL" ||
  SUPABASE_URL === "";

let supabase;

if (isMockMode) {
  // Mock query builder for supabase.from() calls (used in SettingsScreen)
  const mockUser = {
    id: "u1",
    tenant_id: "t1",
    name: "Kaushal Patil",
    phone: "9876543210",
    role: "owner",
    tenants: {
      business_name: "AquaPure Services",
      owner_name: "Kaushal Patil",
      phone: "9876543210",
      email: "kaushal@aquapure.com",
      subscription_status: "active",
    },
  };

  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    single: async () => ({ data: mockUser, error: null }),
  };

  supabase = {
    from: () => mockQueryBuilder,
    auth: {
      getSession: async () => ({
        data: {
          session: {
            access_token: "mock-token-12345",
            refresh_token: "mock-refresh-12345",
            user: { id: "u1", email: "kaushal@aquapure.com" },
          },
        },
        error: null,
      }),
      getUser: async () => ({
        data: {
          user: { id: "u1", email: "kaushal@aquapure.com" },
        },
        error: null,
      }),
      onAuthStateChange: (callback) => {
        setTimeout(() => {
          callback("SIGNED_IN", {
            access_token: "mock-token-12345",
            refresh_token: "mock-refresh-12345",
            user: { id: "u1", email: "kaushal@aquapure.com" },
          });
        }, 0);
        return {
          data: {
            subscription: { unsubscribe: () => {} },
          },
        };
      },
      signInWithPassword: async () => ({
        data: {
          session: { access_token: "mock-token-12345" },
          user: { id: "u1", email: "kaushal@aquapure.com" },
        },
        error: null,
      }),
      signUp: async () => ({
        data: { user: { id: "u1" } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
  };
  console.log("Frontend running in MOCK MODE — no Supabase connection");
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase, isMockMode };
