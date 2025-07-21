import {
  QueryClient,
  QueryClientProvider,
  QueryClientConfig,
} from "@tanstack/react-query";
import * as React from "react";

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // refetch after 10 seconds
      retry: 1,
      refetchOnWindowFocus: false,
      // refetchInterval: 0.002,
    },
  },
};

let queryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // On the server, always create a new QueryClient
    return new QueryClient(queryClientConfig);
  }
  // On the client, create a singleton
  if (!queryClient) {
    queryClient = new QueryClient(queryClientConfig);
  }
  return queryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  //   const client = React.useRef(getQueryClient());
  const client = new QueryClient(queryClientConfig);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
