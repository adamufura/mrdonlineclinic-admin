import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListToolbar } from '@/components/admin/list-toolbar';
import { PageHeader } from '@/components/admin/page-header';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { RecordList } from '@/components/admin/record-list';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { OnboardResultBanner } from '@/components/shared/onboard-result-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_STAFF_PASSWORD } from '@/config/ministry';
import { createAdminStaff, listAdminUsers } from '@/features/admin/api';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ADMIN_ROLE_LABELS,
  ASSIGNABLE_ADMIN_ROLES,
  canManageStaff,
} from '@/lib/rbac';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All roles' },
  ...ASSIGNABLE_ADMIN_ROLES.map((r) => ({ value: r, label: ADMIN_ROLE_LABELS[r] })),
  { value: 'SUPER_ADMIN', label: ADMIN_ROLE_LABELS.SUPER_ADMIN },
];

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  middleName: z.string().optional(),
  email: z.string().email('Valid email required'),
  phoneNumber: z.string().min(5, 'Phone required'),
  adminRole: z.enum(ASSIGNABLE_ADMIN_ROLES),
});

type CreateForm = z.infer<typeof createSchema>;

export default function AdminsTeamPage() {
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = canManageStaff(me?.adminRole);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const limit = 20;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, roleFilter]);

  const [lastCreatedMsg, setLastCreatedMsg] = useState<string | null>(null);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phoneNumber: '',
      adminRole: 'OPERATIONS',
    },
  });

  const listQuery = useQuery({
    queryKey: ['admin', 'users', page, limit, debouncedSearch, statusFilter, roleFilter],
    queryFn: () =>
      listAdminUsers({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(roleFilter ? { adminRole: roleFilter } : {}),
      }),
    enabled: can('admins:read'),
  });

  const createMut = useMutation({
    mutationFn: (values: CreateForm) => createAdminStaff(values),
    onSuccess: (data) => {
      setLastCreatedMsg(data.message);
      toast.success('Staff account created');
      form.reset({ firstName: '', lastName: '', middleName: '', email: '', phoneNumber: '', adminRole: 'OPERATIONS' });
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  const listItems = items.map((row) => ({
    id: String(row._id),
    title: [row.firstName, row.lastName].filter(Boolean).join(' '),
    subtitle: row.email,
    meta: row.phoneNumber ? `Phone: ${row.phoneNumber}` : undefined,
    status: row.status,
    extraBadge: {
      label: ADMIN_ROLE_LABELS[row.adminRole as keyof typeof ADMIN_ROLE_LABELS] ?? row.adminRole,
      tone: 'info' as const,
    },
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ministry staff"
        description={`Create accounts for Ministry of Health Katsina officers. Each new account receives the default password ${DEFAULT_STAFF_PASSWORD} — staff should change it after first sign-in.`}
      />

      {canManage ? (
        <div className="rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-medium text-brand-navy">Add staff member</h2>
          {lastCreatedMsg ? (
            <div className="mt-4">
              <OnboardResultBanner message={lastCreatedMsg} />
            </div>
          ) : null}
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => createMut.mutate(v))}>
            <div>
              <Label htmlFor="staff-first">First name</Label>
              <Input id="staff-first" className="mt-1.5" {...form.register('firstName')} />
            </div>
            <div>
              <Label htmlFor="staff-last">Last name</Label>
              <Input id="staff-last" className="mt-1.5" {...form.register('lastName')} />
            </div>
            <div>
              <Label htmlFor="staff-email">Email</Label>
              <Input id="staff-email" type="email" className="mt-1.5" {...form.register('email')} />
            </div>
            <div>
              <Label htmlFor="staff-phone">Phone</Label>
              <Input id="staff-phone" className="mt-1.5" {...form.register('phoneNumber')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="staff-role">Access role</Label>
              <select
                id="staff-role"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                {...form.register('adminRole')}
              >
                {ASSIGNABLE_ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createMut.isPending} className="h-11 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white">
                {createMut.isPending ? 'Creating…' : 'Create staff account'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-brand-navy">Staff directory</h2>
        <p className="mb-4 text-xs text-muted-foreground">Tap any row to open full details and manage the account.</p>
        <ListToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Name, email, or phone…"
          filters={[
            {
              id: 'role',
              label: 'Role',
              value: roleFilter,
              onChange: setRoleFilter,
              options: ROLE_FILTER_OPTIONS,
            },
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: 'All' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DEACTIVATED', label: 'Deactivated' },
              ],
            },
          ]}
        />
        <div className="mt-4 space-y-0">
          <RecordList
            items={listItems}
            loading={listQuery.isLoading}
            emptyMessage="No staff accounts found."
            onItemClick={(id) => navigate(ROUTES.staffDetail(id))}
          />
          <div className="overflow-hidden rounded-b-2xl border border-t-0 border-[#e8edf4] bg-white shadow-sm">
            <PaginationBar page={page} meta={meta} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
