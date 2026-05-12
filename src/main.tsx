import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { getEnv } from '@/config/env';
import { AppQueryProvider } from '@/providers/query-provider';
import { router } from '@/router';
import '@/styles/globals.css';

getEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppQueryProvider>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-background font-sans text-muted-foreground">
            Loading…
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
      <Toaster richColors position="top-center" />
    </AppQueryProvider>
  </StrictMode>,
);
