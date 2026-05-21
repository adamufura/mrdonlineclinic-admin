import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListToolbar } from '@/components/admin/list-toolbar';
import { PageHeader, PrimaryActionButton } from '@/components/admin/page-header';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { RecordList } from '@/components/admin/record-list';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { OnboardResultBanner } from '@/components/shared/onboard-result-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPatientAdmin, listPatientsAdmin } from '@/features/admin/api';
import { usePermissions } from '@/hooks/usePermissions';
import { phoneMeta } from '@/lib/i18n/admin-labels';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';

export default function PatientsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [lastOnboardMsg, setLastOnboardMsg] = useState<string | null>(null);
  const limit = 20;

  const onboardSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().min(5),
  });

  type OnboardForm = z.infer<typeof onboardSchema>;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const form = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phoneNumber: '' },
  });

  const query = useQuery({
    queryKey: ['admin', 'patients', page, limit, debouncedSearch, statusFilter],
    queryFn: () =>
      listPatientsAdmin({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    enabled: can('patients:read'),
  });

  const onboardMut = useMutation({
    mutationFn: (v: OnboardForm) => createPatientAdmin(v),
    onSuccess: (data) => {
      setLastOnboardMsg(data.message);
      toast.success(t('admin.patients.onboarded'));
      form.reset();
      setOnboardOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'patients'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  const listItems = items.map((row) => ({
    id: String(row._id),
    title: [row.firstName, row.lastName].filter(Boolean).join(' '),
    subtitle: row.email,
    meta: phoneMeta(row.phoneNumber),
    status: row.status,
  }));

  const statusOptions = [
    { value: '', label: t('admin.filters.all') },
    { value: 'ACTIVE', label: t('admin.filters.active') },
    { value: 'SUSPENDED', label: t('admin.filters.suspended') },
    { value: 'DEACTIVATED', label: t('admin.filters.deactivated') },
    { value: 'PENDING_VERIFICATION', label: t('admin.patients.filters.pendingVerification') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.patients.title')}
        description={t('admin.patients.description')}
        action={
          can('patients:write') ? (
            <PrimaryActionButton
              onClick={() => {
                setLastOnboardMsg(null);
                setOnboardOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t('admin.patients.onboardAction')}
            </PrimaryActionButton>
          ) : undefined
        }
      />

      {lastOnboardMsg ? <OnboardResultBanner message={lastOnboardMsg} /> : null}

      <ListToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t('admin.patients.searchPlaceholder')}
        filters={[
          {
            id: 'status',
            label: t('admin.filters.status'),
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusOptions,
          },
        ]}
      />

      <div className="space-y-0">
        <RecordList
          items={listItems}
          loading={query.isLoading}
          emptyMessage={t('admin.patients.empty')}
          onItemClick={(id) => navigate(ROUTES.patientDetail(id))}
        />
        <div className="overflow-hidden rounded-b-2xl border border-t-0 border-[#e8edf4] bg-white shadow-sm">
          <PaginationBar page={page} meta={meta} onPageChange={setPage} />
        </div>
      </div>

      {onboardOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => !onboardMut.isPending && setOnboardOpen(false)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg font-medium text-brand-navy">{t('admin.patients.onboard.title')}</h2>
            <form className="mt-4 space-y-3" onSubmit={form.handleSubmit((v) => onboardMut.mutate(v))}>
              <div>
                <Label>{t('admin.fields.firstName')}</Label>
                <Input className="mt-1" {...form.register('firstName')} />
              </div>
              <div>
                <Label>{t('admin.fields.lastName')}</Label>
                <Input className="mt-1" {...form.register('lastName')} />
              </div>
              <div>
                <Label>{t('admin.fields.email')}</Label>
                <Input type="email" className="mt-1" {...form.register('email')} />
              </div>
              <div>
                <Label>{t('admin.fields.phone')}</Label>
                <Input className="mt-1" {...form.register('phoneNumber')} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOnboardOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={onboardMut.isPending} className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                  {onboardMut.isPending ? t('admin.patients.onboard.creating') : t('admin.patients.onboard.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
