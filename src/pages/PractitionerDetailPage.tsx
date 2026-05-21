import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DetailTabs } from '@/components/admin/detail-tabs';
import { DetailPageShell, DetailPanel, InfoGrid, InfoItem } from '@/components/admin/detail-page-shell';
import { ManageActionButton, ManageActionCard } from '@/components/admin/manage-action-card';
import { StatusBadge, statusToneForAccount } from '@/components/admin/status-badge';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  deletePractitionerAdmin,
  getPractitionerAdmin,
  rejectPractitioner,
  resetPractitionerPassword,
  suspendPractitioner,
  updatePractitionerAdmin,
  verifyPractitioner,
} from '@/features/admin/api';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeAxiosError } from '@/lib/api/errors';
import {
  labelAccountStatus,
  labelAppointmentStatus,
  labelVerificationStatus,
} from '@/lib/i18n/admin-labels';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

type TabId = 'overview' | 'profile' | 'appointments' | 'manage';

export default function PractitionerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const isSuper = useAuthStore((s) => s.user)?.adminRole === 'SUPER_ADMIN';

  const [tab, setTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'practitioner', id],
    queryFn: () => getPractitionerAdmin(id!),
    enabled: Boolean(id),
  });

  const p = query.data?.practitioner;
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', licenseNumber: '', bio: '' });

  function fmtDate(d?: string | Date) {
    if (!d) return t('common.notAvailable');
    return new Date(d).toLocaleString();
  }

  const updateMut = useMutation({
    mutationFn: () =>
      updatePractitionerAdmin(id!, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        licenseNumber: form.licenseNumber || undefined,
        bio: form.bio || undefined,
      }),
    onSuccess: () => {
      toast.success(t('admin.practitionerDetail.toasts.updated'));
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const verifyMut = useMutation({
    mutationFn: () => verifyPractitioner(id!, verifyNotes.trim() || undefined),
    onSuccess: () => {
      toast.success(t('admin.practitionerDetail.toasts.verified'));
      setVerifyOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectPractitioner(id!, rejectNotes),
    onSuccess: () => {
      toast.success(t('admin.practitionerDetail.toasts.rejected'));
      setRejectOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const suspendMut = useMutation({
    mutationFn: () => suspendPractitioner(id!),
    onSuccess: () => {
      toast.success(t('admin.practitionerDetail.toasts.suspended'));
      setSuspendOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const resetMut = useMutation({
    mutationFn: () => resetPractitionerPassword(id!),
    onSuccess: (d) => toast.success(d.message),
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deletePractitionerAdmin(id!),
    onSuccess: () => {
      toast.success(t('admin.practitionerDetail.toasts.removed'));
      void navigate(ROUTES.practitioners);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (query.isLoading) {
    return <p className="text-muted-foreground">{t('admin.practitionerDetail.loading')}</p>;
  }
  if (query.isError || !p) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{normalizeAxiosError(query.error).message}</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.practitioners}>{t('admin.practitionerDetail.back')}</Link>
        </Button>
      </div>
    );
  }

  const name = `${t('admin.practitionerDetail.titlePrefix')} ${[p.firstName, p.lastName].filter(Boolean).join(' ')}`;
  const specialties = Array.isArray(p.specialties)
    ? (p.specialties as { name?: string }[]).map((s) => s.name).filter(Boolean).join(', ')
    : t('common.notAvailable');

  const statuses = [
    { label: labelAccountStatus(p.status), type: 'account' as const },
    { label: labelVerificationStatus(p.verificationStatus ?? 'UNVERIFIED'), type: 'verification' as const },
    ...(p.isAvailableForBooking ? [{ label: t('admin.enums.bookable'), type: 'info' as const }] : []),
  ];

  function startEdit() {
    setForm({
      firstName: p!.firstName,
      lastName: p!.lastName,
      phoneNumber: p!.phoneNumber,
      licenseNumber: (p!.licenseNumber as string) ?? '',
      bio: (p!.bio as string) ?? '',
    });
    setEditing(true);
    setTab('profile');
  }

  const appointmentStats = query.data?.appointmentStats ?? {};
  const totalAppointments = Object.values(appointmentStats).reduce((a, b) => a + Number(b), 0);

  return (
    <DetailPageShell
      backTo={ROUTES.practitioners}
      backLabel={t('admin.practitionerDetail.back')}
      title={name}
      subtitle={p.email}
      statuses={statuses}
    >
      <DetailTabs
        tabs={[
          { id: 'overview', label: t('admin.tabs.overview'), hint: t('admin.tabs.overviewHintSummary') },
          { id: 'profile', label: t('admin.tabs.profile'), hint: t('admin.tabs.profileHint') },
          { id: 'appointments', label: t('admin.tabs.appointments'), hint: t('admin.tabs.appointmentsHint') },
          { id: 'manage', label: t('admin.tabs.manage'), hint: t('admin.tabs.manageHintVerify') },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('admin.practitionerDetail.stats.reviews')}
            </p>
            <p className="mt-1 font-display text-3xl text-brand-navy">{query.data?.reviewsCount ?? 0}</p>
          </DetailPanel>
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('admin.practitionerDetail.stats.appointments')}
            </p>
            <p className="mt-1 font-display text-3xl text-brand-navy">{totalAppointments}</p>
          </DetailPanel>
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('admin.fields.specialty')}
            </p>
            <p className="mt-1 text-sm font-medium">{specialties}</p>
          </DetailPanel>
          <DetailPanel className="sm:col-span-2 lg:col-span-3">
            <InfoGrid>
              <InfoItem label={t('admin.fields.phone')} value={p.phoneNumber} />
              <InfoItem label={t('admin.fields.license')} value={p.licenseNumber as string} />
              <InfoItem label={t('admin.fields.registered')} value={fmtDate(p.createdAt as string)} />
              <InfoItem label={t('admin.fields.onboarded')} value={fmtDate(p.onboardedAt as string)} />
            </InfoGrid>
          </DetailPanel>
        </div>
      )}

      {tab === 'profile' && (
        <DetailPanel title={t('admin.practitionerDetail.profileInfo')}>
          {editing ? (
            <form
              className="grid max-w-xl gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateMut.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>{t('admin.fields.firstName')}</Label>
                  <Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <Label>{t('admin.fields.lastName')}</Label>
                  <Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{t('admin.fields.phone')}</Label>
                <Input className="mt-1" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div>
                <Label>{t('admin.fields.license')}</Label>
                <Input className="mt-1" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div>
                <Label>{t('admin.fields.bio')}</Label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMut.isPending}>
                  {t('admin.practitionerDetail.saveChanges')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <InfoGrid>
              <InfoItem label={t('admin.fields.phone')} value={p.phoneNumber} />
              <InfoItem label={t('admin.fields.specialties')} value={specialties} />
              <InfoItem label={t('admin.fields.license')} value={p.licenseNumber as string} />
              <InfoItem
                label={t('admin.fields.experience')}
                value={p.yearsOfExperience != null ? t('admin.practitionerDetail.yearsCount', { count: p.yearsOfExperience }) : undefined}
              />
              <InfoItem label={t('admin.fields.onboarded')} value={fmtDate(p.onboardedAt as string)} />
              <InfoItem label={t('admin.fields.registered')} value={fmtDate(p.createdAt as string)} />
              <InfoItem label={t('admin.fields.bio')} value={(p.bio as string) || t('common.notAvailable')} />
              {p.licenseDocumentUrl ? (
                <div className="sm:col-span-2">
                  <InfoItem
                    label={t('admin.fields.credentialsDocument')}
                    value={
                      <a
                        href={p.licenseDocumentUrl as string}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                      >
                        {t('admin.practitionerDetail.openDocument')} <ExternalLink className="size-3.5" />
                      </a>
                    }
                  />
                </div>
              ) : null}
            </InfoGrid>
          )}
        </DetailPanel>
      )}

      {tab === 'appointments' && (
        <DetailPanel title={t('admin.practitionerDetail.recentAppointments')}>
          {(query.data?.appointments?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.practitionerDetail.noAppointments')}</p>
          ) : (
            <ul className="divide-y divide-[#eef2f8]">
              {query.data!.appointments.map((a) => {
                const patient = a.patient as { firstName?: string; lastName?: string; email?: string } | undefined;
                return (
                  <li key={String(a._id)} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : t('common.notAvailable')}
                      </p>
                      <p className="text-xs text-muted-foreground">{patient?.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{fmtDate(a.scheduledStart as string)}</span>
                      <StatusBadge label={labelAppointmentStatus(String(a.status))} tone={statusToneForAccount(String(a.status))} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DetailPanel>
      )}

      {tab === 'manage' && (
        <div className="grid gap-4 md:grid-cols-2">
          {can('practitioners:write') ? (
            <ManageActionCard title={t('admin.practitionerDetail.editTitle')} description={t('admin.practitionerDetail.manage.editDescription')}>
              <ManageActionButton onClick={startEdit}>{t('admin.practitionerDetail.manage.editButton')}</ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:verify') && p.verificationStatus !== 'VERIFIED' ? (
            <ManageActionCard title={t('admin.practitionerDetail.approveTitle')} description={t('admin.practitionerDetail.manage.approveDescription')}>
              <ManageActionButton variant="primary" onClick={() => setVerifyOpen(true)}>
                {t('admin.practitionerDetail.manage.approveButton')}
              </ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:verify') && p.verificationStatus !== 'REJECTED' ? (
            <ManageActionCard title={t('admin.practitionerDetail.reject')} description={t('admin.practitionerDetail.manage.rejectDescription')}>
              <ManageActionButton onClick={() => setRejectOpen(true)}>{t('admin.practitionerDetail.manage.rejectButton')}</ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:write') ? (
            <ManageActionCard title={t('admin.practitionerDetail.resetPassword')} description={t('admin.practitionerDetail.manage.resetPasswordDescription')}>
              <ManageActionButton disabled={resetMut.isPending} onClick={() => resetMut.mutate()}>
                {t('admin.practitionerDetail.manage.resetPasswordButton')}
              </ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:write') && p.status !== 'SUSPENDED' && p.status !== 'DEACTIVATED' ? (
            <ManageActionCard title={t('admin.practitionerDetail.suspend')} description={t('admin.practitionerDetail.manage.suspendDescription')} variant="danger">
              <ManageActionButton variant="destructive" onClick={() => setSuspendOpen(true)}>
                {t('admin.practitionerDetail.manage.suspendButton')}
              </ManageActionButton>
            </ManageActionCard>
          ) : null}

          {isSuper ? (
            <ManageActionCard title={t('admin.practitionerDetail.manage.removeTitle')} description={t('admin.practitionerDetail.manage.removeDescription')} variant="danger">
              <ManageActionButton variant="destructive" onClick={() => setDeleteOpen(true)}>
                {t('admin.practitionerDetail.manage.deleteButton')}
              </ManageActionButton>
            </ManageActionCard>
          ) : null}
        </div>
      )}

      {verifyOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setVerifyOpen(false)} />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg text-brand-navy">{t('admin.practitionerDetail.approveTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('admin.practitionerDetail.approveHint')}</p>
            <textarea
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder={t('admin.practitionerDetail.optionalNotesPlaceholder')}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVerifyOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button disabled={verifyMut.isPending} onClick={() => verifyMut.mutate()}>
                {t('admin.practitionerDetail.confirmApproval')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setRejectOpen(false)} />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg text-brand-navy">{t('admin.practitionerDetail.rejectModalTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('admin.practitionerDetail.rejectHint')}</p>
            <textarea
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
              rows={4}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" disabled={!rejectNotes.trim() || rejectMut.isPending} onClick={() => rejectMut.mutate()}>
                {t('admin.practitionerDetail.confirmRejection')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={suspendOpen}
        title={t('admin.practitionerDetail.suspendNameTitle', { name })}
        description={t('admin.practitionerDetail.suspendBookingDescription')}
        confirmLabel={t('admin.practitionerDetail.suspendConfirm')}
        variant="destructive"
        busy={suspendMut.isPending}
        onCancel={() => !suspendMut.isPending && setSuspendOpen(false)}
        onConfirm={() => suspendMut.mutate()}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('admin.practitionerDetail.deletePermanentTitle')}
        description={t('admin.practitionerDetail.deletePermanentDescription')}
        confirmLabel={t('common.delete')}
        variant="destructive"
        busy={deleteMut.isPending}
        onCancel={() => !deleteMut.isPending && setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate()}
      />
    </DetailPageShell>
  );
}
