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
import { createPractitionerAdmin, listPractitionersAdmin, type PractitionerAdminRow } from '@/features/admin/api';
import { listSpecialties } from '@/features/specialties/api';
import { usePermissions } from '@/hooks/usePermissions';
import { phoneMeta } from '@/lib/i18n/admin-labels';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';

function rowId(row: PractitionerAdminRow) {
  return String(row._id);
}

export default function PractitionersPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const limit = 15;

  const onboardSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().min(5),
    licenseNumber: z.string().optional(),
    specialtyId: z.string().min(1, t('admin.practitioners.onboard.selectSpecialtyError')),
    autoVerify: z.boolean(),
  });

  type OnboardForm = z.infer<typeof onboardSchema>;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, verificationFilter]);

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [lastOnboardMsg, setLastOnboardMsg] = useState<string | null>(null);

  const specialtiesQuery = useQuery({
    queryKey: ['specialties'],
    queryFn: listSpecialties,
    enabled: onboardOpen,
  });

  const onboardForm = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      licenseNumber: '',
      specialtyId: '',
      autoVerify: true,
    },
  });

  const query = useQuery({
    queryKey: ['admin', 'practitioners', page, limit, debouncedSearch, statusFilter, verificationFilter],
    queryFn: () =>
      listPractitionersAdmin({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(verificationFilter ? { verificationStatus: verificationFilter } : {}),
      }),
    enabled: can('practitioners:read'),
  });

  const onboardMut = useMutation({
    mutationFn: (v: OnboardForm) =>
      createPractitionerAdmin({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phoneNumber: v.phoneNumber,
        licenseNumber: v.licenseNumber || undefined,
        specialties: [v.specialtyId],
        autoVerify: v.autoVerify,
      }),
    onSuccess: (data) => {
      setLastOnboardMsg(data.message);
      toast.success(t('admin.practitioners.onboarded'));
      onboardForm.reset();
      setOnboardOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioners'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  const listItems = items.map((row) => ({
    id: rowId(row),
    title: `${t('admin.practitioners.titlePrefix')} ${[row.firstName, row.lastName].filter(Boolean).join(' ')}`.trim(),
    subtitle: row.email,
    meta: phoneMeta(row.phoneNumber),
    status: row.status,
    verificationStatus: row.verificationStatus ?? 'UNVERIFIED',
    extraBadge: row.isAvailableForBooking
      ? { label: t('admin.enums.bookable'), tone: 'ok' as const }
      : undefined,
  }));

  const statusOptions = [
    { value: '', label: t('admin.practitioners.filters.allStatuses') },
    { value: 'ACTIVE', label: t('admin.filters.active') },
    { value: 'SUSPENDED', label: t('admin.filters.suspended') },
    { value: 'DEACTIVATED', label: t('admin.filters.deactivated') },
  ];

  const verificationOptions = [
    { value: '', label: t('admin.filters.all') },
    { value: 'VERIFIED', label: t('admin.enums.verificationStatus.VERIFIED') },
    { value: 'PENDING_REVIEW', label: t('admin.practitioners.filters.pendingReview') },
    { value: 'UNVERIFIED', label: t('admin.enums.verificationStatus.UNVERIFIED') },
    { value: 'REJECTED', label: t('admin.enums.verificationStatus.REJECTED') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.practitioners.title')}
        description={t('admin.practitioners.description')}
        action={
          can('practitioners:onboard') ? (
            <PrimaryActionButton
              onClick={() => {
                setLastOnboardMsg(null);
                setOnboardOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t('admin.practitioners.onboardAction')}
            </PrimaryActionButton>
          ) : undefined
        }
      />

      {lastOnboardMsg ? <OnboardResultBanner message={lastOnboardMsg} /> : null}

      <ListToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t('admin.practitioners.searchPlaceholder')}
        filters={[
          {
            id: 'status',
            label: t('admin.practitioners.accountStatus'),
            value: statusFilter,
            onChange: setStatusFilter,
            options: statusOptions,
          },
          {
            id: 'verification',
            label: t('admin.filters.verification'),
            value: verificationFilter,
            onChange: setVerificationFilter,
            options: verificationOptions,
          },
        ]}
      />

      <div className="space-y-0">
        <RecordList
          items={listItems}
          loading={query.isLoading}
          emptyMessage={t('admin.practitioners.empty')}
          onItemClick={(id) => navigate(ROUTES.practitionerDetail(id))}
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
            aria-label={t('common.close')}
            onClick={() => !onboardMut.isPending && setOnboardOpen(false)}
          />
          <div className="relative z-[1] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg font-medium text-brand-navy">{t('admin.practitioners.onboard.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('admin.practitioners.onboard.description')}</p>
            <form className="mt-4 space-y-3" onSubmit={onboardForm.handleSubmit((v) => onboardMut.mutate(v))}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>{t('admin.fields.firstName')}</Label>
                  <Input className="mt-1" {...onboardForm.register('firstName')} />
                </div>
                <div>
                  <Label>{t('admin.fields.lastName')}</Label>
                  <Input className="mt-1" {...onboardForm.register('lastName')} />
                </div>
              </div>
              <div>
                <Label>{t('admin.fields.email')}</Label>
                <Input type="email" className="mt-1" {...onboardForm.register('email')} />
              </div>
              <div>
                <Label>{t('admin.fields.phone')}</Label>
                <Input className="mt-1" {...onboardForm.register('phoneNumber')} />
              </div>
              <div>
                <Label>{t('admin.practitioners.onboard.licenseOptional')}</Label>
                <Input className="mt-1" {...onboardForm.register('licenseNumber')} />
              </div>
              <div>
                <Label>{t('admin.practitioners.onboard.specialty')}</Label>
                <select className="mt-1 flex h-10 w-full rounded-lg border border-border px-3 text-sm" {...onboardForm.register('specialtyId')}>
                  <option value="">{t('admin.practitioners.onboard.selectSpecialty')}</option>
                  {(specialtiesQuery.data ?? []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...onboardForm.register('autoVerify')} />
                {t('admin.practitioners.onboard.autoVerify')}
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={onboardMut.isPending} onClick={() => setOnboardOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={onboardMut.isPending} className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                  {onboardMut.isPending ? t('admin.practitioners.onboard.creating') : t('admin.practitioners.onboard.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
