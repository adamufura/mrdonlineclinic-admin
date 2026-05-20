import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { RequireAuth, RequireGuest } from '@/router/guards';
import { RequirePermission } from '@/router/PermissionGuard';
import type { AdminPermission } from '@/lib/rbac';

function withPermission(Page: ComponentType, permission: AdminPermission) {
  return function PermissionWrappedPage() {
    return (
      <RequirePermission permission={permission}>
        <Page />
      </RequirePermission>
    );
  };
}

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
            lazy: async () => {
              const { default: Page } = await import('@/pages/PractitionersPage');
              return { Component: withPermission(Page, 'practitioners:read') };
            },
          },
          {
            path: 'practitioners/:id',
            lazy: async () => {
              const { default: Page } = await import('@/pages/PractitionerDetailPage');
              return { Component: withPermission(Page, 'practitioners:read') };
            },
          },
          {
            path: 'patients',
            lazy: async () => {
              const { default: Page } = await import('@/pages/PatientsPage');
              return { Component: withPermission(Page, 'patients:read') };
            },
          },
          {
            path: 'patients/:id',
            lazy: async () => {
              const { default: Page } = await import('@/pages/PatientDetailPage');
              return { Component: withPermission(Page, 'patients:read') };
            },
          },
          {
            path: 'audit',
            lazy: async () => {
              const { default: Page } = await import('@/pages/AuditLogsPage');
              return { Component: withPermission(Page, 'audit:read') };
            },
          },
          {
            path: 'team',
            lazy: async () => {
              const { default: Page } = await import('@/pages/AdminsTeamPage');
              return { Component: withPermission(Page, 'admins:read') };
            },
          },
          {
            path: 'team/:id',
            lazy: async () => {
              const { default: Page } = await import('@/pages/StaffDetailPage');
              return { Component: withPermission(Page, 'admins:read') };
            },
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
