import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/src/trpc/routers/index";

const apiUrl = import.meta.env.VITE_API_URL ?? "/api/trpc";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: apiUrl,
    }),
  ],
});
