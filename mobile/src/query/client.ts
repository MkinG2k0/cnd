import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/** Persist forever — drop only on app data clear / persister key change. */
export const PERSIST_MAX_AGE = Number.MAX_SAFE_INTEGER;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: Infinity,
        retry: 1,
        networkMode: "offlineFirst",
      },
    },
  });
}

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "cnd:rq",
});
