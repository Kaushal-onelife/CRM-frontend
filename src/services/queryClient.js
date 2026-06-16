import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Central React Query client tuned for an offline-capable field app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached data "fresh" for 1 min before a background refetch — avoids
      // a spinner every time a screen regains focus (the old slowness).
      staleTime: 60 * 1000,
      // Hold cached data for 7 days so it survives restarts and long offline gaps.
      gcTime: 7 * 24 * 60 * 60 * 1000,
      // Retry a couple of times on flaky signal, then fall back to cache.
      retry: 2,
      // Don't auto-refetch the moment the screen mounts if we already have cache;
      // the persisted data shows instantly, then refreshes per staleTime.
      refetchOnReconnect: true,
      networkMode: "offlineFirst", // serve cache when offline instead of erroring
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// Persists the cache to AsyncStorage so the app opens instantly with last-known
// data — including fully offline.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "RQ_CACHE_V1",
  throttleTime: 1000,
});
