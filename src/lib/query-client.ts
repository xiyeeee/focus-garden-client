import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/http";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      retry: (failureCount, error) =>
        !(
          error instanceof ApiError &&
          error.status !== null &&
          error.status < 500
        ) && failureCount < 1,
    },
    mutations: { retry: false },
  },
});
