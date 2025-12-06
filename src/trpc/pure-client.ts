import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app"; // Đảm bảo đường dẫn đúng tới file AppRouter của bạn
import superjson from "superjson";

export const trpcPureClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/trpc`,
      transformer: superjson, // Quan trọng: Phải khớp với transformer ở server
    }),
  ],
});