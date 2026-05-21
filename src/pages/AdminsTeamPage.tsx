import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { labelAdminRole, phoneMeta } from '@/lib/i18n/admin-labels';
import { ASSIGNABLE_ADMIN_ROLES, canManageStaff } from '@/lib/rbac';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminsTeamPage() {
  const { t } = useTranslation();
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

  const createSchema = z.object({
    firstName: z.string().min(1, t('common.required')),
    lastName: z.string().min(1, t('common.required')),
    middleName: z.string().optional(),
    email: z.string().email(t('admin.validation.email')),
    phoneNumber: z.string().min(5, t('admin.validation.phone')),
    adminRole: z.enum(ASSIGNABLE_ADMIN_ROLES),
  });

  type CreateForm = z.infer<typeof createSchema>;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
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
      toast.success(t('admin.team.created'));
      form.reset({ firstName: '', lastName: '', middleName: '', email: '', phoneNumber: '', adminRole: 'OPERATIONS' });
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  const roleFilterOptions = [
    { value: '', label: t('admin.filters.allRoles') },
    ...ASSIGNABLE_ADMIN_ROLES.map((r) => ({ value: r, label: labelAdminRole(r) })),
    { value: 'SUPER_ADMIN', label: labelAdminRole('SUPER_ADMIN') },
  ];

  const listItems = items.map((row) => ({
    id: String(row._id),
    title: [row.firstName, row.lastName].filter(Boolean).join(' '),
    subtitle: row.email,
    meta: phoneMeta(row.phoneNumber),
    status: row.status,
    extraBadge: {
      label: labelAdminRole(row.adminRole),
      tone: 'info' as const,
    },
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('admin.team.title')}
        description={t('admin.team.description', { password: DEFAULT_STAFF_PASSWORD })}
      />

      {canManage ? (
        <div className="rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-medium text-brand-navy">{t('admin.team.addTitle')}</h2>
          {lastCreatedMsg ? (
            <div className="mt-4">
              <OnboardResultBanner message={lastCreatedMsg} />
            </div>
          ) : null}
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => createMut.mutate(v))}>
            <div>
              <Label htmlFor="staff-first">{t('admin.fields.firstName')}</Label>
              <Input id="staff-first" className="mt-1.5" {...form.register('firstName')} />
            </div>
            <div>
              <Label htmlFor="staff-last">{t('admin.fields.lastName')}</Label>
              <Input id="staff-last" className="mt-1.5" {...form.register('lastName')} />
            </div>
            <div>
              <Label htmlFor="staff-email">{t('admin.fields.email')}</Label>
              <Input id="staff-email" type="email" className="mt-1.5" {...form.register('email')} />
            </div>
            <div>
              <Label htmlFor="staff-phone">{t('admin.fields.phone')}</Label>
              <Input id="staff-phone" className="mt-1.5" {...form.register('phoneNumber')} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="staff-role">{t('admin.fields.role')}</Label>
              <select
                id="staff-role"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                {...form.register('adminRole')}
              >
                {ASSIGNABLE_ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {labelAdminRole(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createMut.isPending} className="h-11 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white">
                {createMut.isPending ? t('admin.team.creating') : t('admin.team.createSubmit')}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 font-display text-lg font-medium text-brand-navy">{t('admin.team.directoryTitle')}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{t('admin.team.directoryHint')}</p>
        <ListToolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={t('admin.team.searchPlaceholder')}
          filters={[
            {
              id: 'role',
              label: t('admin.filters.role'),
              value: roleFilter,
              onChange: setRoleFilter,
              options: roleFilterOptions,
            },
            {
              id: 'status',
              label: t('admin.filters.status'),
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: t('admin.filters.all') },
                { value: 'ACTIVE', label: t('admin.filters.active') },
                { value: 'DEACTIVATED', label: t('admin.filters.deactivated') },
              ],
            },
          ]}
        />
        <div className="mt-4 space-y-0">
          <RecordList
            items={listItems}
            loading={listQuery.isLoading}
            emptyMessage={t('admin.team.empty')}
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
