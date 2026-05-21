import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";

const apiUrl = import.meta.env.VITE_API_URL ?? "/api/trpc";

export const trpcClient = createTRPCProxyClient<AnyRouter>({
  links: [
    httpBatchLink({
      url: apiUrl,
    }),
  ],
});
