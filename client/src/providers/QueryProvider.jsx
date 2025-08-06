// src/providers/QueryProvider.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Optional devtools (comment these 2 lines out if you don't want them)
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Comment out if you don't want devtools */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
