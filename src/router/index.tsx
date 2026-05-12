import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { RequireAuth, RequireGuest } from '@/router/guards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'login',
        element: (
          <RequireGuest>
            <AuthLayout />
          </RequireGuest>
        ),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/LoginPage')).default }),
          },
        ],
      },
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/DashboardPage')).default }),
          },
          {
            path: 'practitioners',
            lazy: async () => ({ Component: (await import('@/pages/PractitionersPage')).default }),
          },
          {
            path: 'patients',
            lazy: async () => ({ Component: (await import('@/pages/PatientsPage')).default }),
          },
          {
            path: 'audit',
            lazy: async () => ({ Component: (await import('@/pages/AuditLogsPage')).default }),
          },
          {
            path: 'team',
            lazy: async () => ({ Component: (await import('@/pages/AdminsTeamPage')).default }),
          },
        ],
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).default }),
      },
    ],
  },
]);
