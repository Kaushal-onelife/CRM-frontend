const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Mock mode kicks in when env credentials are not provided
const isMockMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

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

  // Track mock auth state so signIn/signOut actually flip the navigator.
  let mockSession = null;
  const mockUserAuth = { id: "u1", email: "kaushal@aquapure.com" };
  const buildSession = () => ({
    access_token: "mock-token-12345",
    refresh_token: "mock-refresh-12345",
    user: mockUserAuth,
  });

  const listeners = new Set();
  const emit = (event) => {
    listeners.forEach((cb) => {
      try {
        cb(event, mockSession);
      } catch (err) {
        console.error("mock auth listener failed:", err?.message || err);
      }
    });
  };

  supabase = {
    from: () => mockQueryBuilder,
    auth: {
      getSession: async () => ({
        data: { session: mockSession },
        error: null,
      }),
      getUser: async () => ({
        data: { user: mockSession ? mockUserAuth : null },
        error: null,
      }),
      onAuthStateChange: (callback) => {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(callback),
            },
          },
        };
      },
      signInWithPassword: async () => {
        mockSession = buildSession();
        emit("SIGNED_IN");
        return {
          data: { session: mockSession, user: mockUserAuth },
          error: null,
        };
      },
      signUp: async () => {
        mockSession = buildSession();
        emit("SIGNED_IN");
        return {
          data: { user: mockUserAuth, session: mockSession },
          error: null,
        };
      },
      signOut: async () => {
        mockSession = null;
        emit("SIGNED_OUT");
        return { error: null };
      },
    },
  };
  console.log("Frontend running in MOCK MODE — no Supabase connection");
} else {
  // Real-mode-only deps: keep them out of the bundle path used in mock dev.
  require("react-native-url-polyfill/auto");
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  const { createClient } = require("@supabase/supabase-js");

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
