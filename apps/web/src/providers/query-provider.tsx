'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A mutation invalidates the page it happened on, but every other
            // page kept serving its own cache. With a five minute staleTime
            // that meant recording an expense and then opening the dashboard
            // still showed the old figures until a manual reload — the whole
            // app felt like it needed refreshing by hand. Site data changes
            // constantly and these are small queries, so treat cached data as
            // stale almost immediately and re-check on navigation.
            staleTime: 15 * 1000,
            // Coming back to the tab (or the site on a phone) should show
            // current numbers rather than whatever was there when you left.
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
