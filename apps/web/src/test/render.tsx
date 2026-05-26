import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function Wrapper({
  children,
  client,
}: {
  children: ReactNode;
  client: QueryClient;
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient } = {},
) {
  const { queryClient = createTestQueryClient(), ...rest } = options;
  return {
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => <Wrapper client={queryClient}>{children}</Wrapper>,
      ...rest,
    }),
  };
}
