'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { DEFAULT_STALE_TIME_MS } from '@/lib/constants';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME_MS,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              const status = axios.isAxiosError(error) ? error.response?.status : undefined;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
