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
      // Don't retry true offline errors (they won't recover in the retry window —
      // we want the persisted cache shown instantly). Retry other failures once.
      retry: (failureCount, error) => {
        if (error?.isNetworkError) return false;
        return failureCount < 1;
      },
      // Auto-refetch when connectivity returns.
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
