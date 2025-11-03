'use client';
// ^-- to make sure we can mount the Provider from a server component
import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient,httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';
import superjson from "superjson";
export const { TRPCProvider, useTRPC} = createTRPCContext<AppRouter>();
let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
// Xóa hàm getUrl cũ của bạn và thay bằng hàm này
function getUrl() {
  // 1. Nếu chạy trên trình duyệt, dùng đường dẫn tương đối
  if (typeof window !== 'undefined') {
    return '/api/trpc';
  }

  // 2. Nếu chạy trên server Vercel (production)
  if (process.env.VERCEL_URL) {
    return `https://{process.env.VERCEL_URL}/api/trpc`;
  }

  // 3. Nếu chạy trên server local (development)
  // Đảm bảo bạn có http:// ở đầu
  return `http://localhost:${process.env.PORT ?? 3000}/api/trpc`;
}
// function getUrl() {
//   const base = (() => {
//     if (typeof window !== 'undefined') return '';
//     return process.env.NEXT_PUBLIC_AP_URL;
//   })();
//   return `${base}/api/trpc`;
// }
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    }),
  );
  return (
    <QueryClientProvider client={queryClient} >
      <TRPCProvider trpcClient={trpcClient}queryClient={queryClient}>
        {props.children}
          </TRPCProvider>
    </QueryClientProvider>
  );
}