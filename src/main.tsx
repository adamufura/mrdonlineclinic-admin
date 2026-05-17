import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { getEnv } from '@/config/env';
import { AppSplash } from '@/components/shared/app-splash';
import { AppQueryProvider } from '@/providers/query-provider';
import { router } from '@/router';
import '@/styles/globals.css';

getEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppQueryProvider>
      <Suspense fallback={<AppSplash />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster richColors position="top-center" />
    </AppQueryProvider>
  </StrictMode>,
);
