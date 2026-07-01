import React from 'react';
import { AppProvider } from './src/context/AppContext';
import { MainLayout } from './src/screens/MainLayout';

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
