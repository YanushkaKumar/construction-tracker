'use client';

import React from 'react';
import QueryProvider from './query-provider';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
