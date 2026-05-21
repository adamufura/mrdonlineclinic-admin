import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DetailTabs } from '@/components/admin/detail-tabs';
import { DetailPageShell, DetailPanel, InfoGrid, InfoItem } from '@/components/admin/detail-page-shell';
import { ManageActionButton, ManageActionCard } from '@/components/admin/manage-action-card';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  changeAdminRole,
  deactivateAdminUser,
  deleteAdminUser,
  getAdminUser,
  resetAdminPassword,
  updateAdminUser,
} from '@/features/admin/api';
import { ASSIGNABLE_ADMIN_ROLES, canManageStaff, type AssignableAdminRole } from '@/lib/rbac';
import { normalizeAxiosError } from '@/lib/api/errors';
import { labelAccountStatus, labelAdminRole } from '@/lib/i18n/admin-labels';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const STAFF_STATUS_OPTIONS = ['ACTIVE', 'DEACTIVATED', 'SUSPENDED'] as const;

type TabId = 'overview' | 'manage';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const isSuper = me?.adminRole === 'SUPER_ADMIN';
  const canManage = canManageStaff(me?.adminRole);

  const [tab, setTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'staff', id],
    queryFn: () => getAdminUser(id!),
    enabled: Boolean(id),
  });

  const staff = query.data;
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    status: 'ACTIVE',
    adminRole: 'OPERATIONS' as AssignableAdminRole,
  });

  function fmtDate(d?: string) {
    if (!d) return t('common.notAvailable');
    return new Date(d).toLocaleString();
  }

  const updateMut = useMutation({
    mutationFn: async () => {
      await updateAdminUser(id!, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        status: form.status,
      });
      if (isSuper && staff?.adminRole !== 'SUPER_ADMIN' && form.adminRole !== staff?.adminRole) {
        await changeAdminRole(id!, form.adminRole);
      }
    },
    onSuccess: () => {
      toast.success(t('admin.staffDetail.toasts.updated'));
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'staff', id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const resetMut = useMutation({
    mutationFn: () => resetAdminPassword(id!),
    onSuccess: (d) => toast.success(d.message),
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const deactivateMut = useMutation({
    mutationFn: () => deactivateAdminUser(id!),
    onSuccess: () => {
      toast.success(t('admin.staffDetail.toasts.deactivated'));
      setDeactivateOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'staff', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAdminUser(id!),
    onSuccess: () => {
      toast.success(t('admin.staffDetail.toasts.removed'));
      void navigate(ROUTES.team);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (query.isLoading) return <p className="text-muted-foreground">{t('admin.staffDetail.loading')}</p>;
  if (query.isError || !staff) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{normalizeAxiosError(query.error).message}</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.team}>{t('admin.staffDetail.back')}</Link>
        </Button>
      </div>
    );
  }

  const isSelf = me?.id === String(staff._id);
  const isSuperRow = staff.adminRole === 'SUPER_ADMIN';
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(' ');
  const roleLabel = labelAdminRole(staff.adminRole);

  function startEdit() {
    setForm({
      firstName: staff!.firstName,
      lastName: staff!.lastName,
      phoneNumber: staff!.phoneNumber ?? '',
      status: staff!.status,
      adminRole: (ASSIGNABLE_ADMIN_ROLES.includes(staff!.adminRole as AssignableAdminRole)
        ? staff!.adminRole
        : 'OPERATIONS') as AssignableAdminRole,
    });
    setEditing(true);
    setTab('manage');
  }

  return (
    <DetailPageShell
      backTo={ROUTES.team}
      backLabel={t('admin.staffDetail.back')}
      title={name}
      subtitle={staff.email}
      statuses={[
        { label: labelAccountStatus(staff.status), type: 'account' },
        { label: roleLabel, type: 'info' },
      ]}
    >
      <DetailTabs
        tabs={[
          { id: 'overview', label: t('admin.tabs.overview'), hint: t('admin.tabs.overviewHintAccount') },
          { id: 'manage', label: t('admin.tabs.manage'), hint: t('admin.tabs.manageHintEdit') },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'overview' && (
        <DetailPanel title={t('admin.staffDetail.accountInfo')}>
          <InfoGrid>
            <InfoItem label={t('admin.fields.phone')} value={staff.phoneNumber} />
            <InfoItem label={t('admin.fields.role')} value={roleLabel} />
            <InfoItem label={t('admin.fields.emailVerified')} value={staff.isEmailVerified ? t('common.yes') : t('common.no')} />
            <InfoItem label={t('admin.fields.accountCreated')} value={fmtDate(staff.createdAt)} />
          </InfoGrid>
        </DetailPanel>
      )}

      {tab === 'manage' && (
        <div className="space-y-4">
          {canManage && editing ? (
            <DetailPanel title={t('admin.staffDetail.editTitle')}>
              <form
                className="grid max-w-lg gap-3"
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
                  <Label>{t('admin.fields.accountStatus')}</Label>
                  <select
                    className="mt-1 flex h-10 w-full rounded-lg border px-3 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={isSuperRow}
                  >
                    {STAFF_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {labelAccountStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
                {isSuper && !isSuperRow ? (
                  <div>
                    <Label>{t('admin.fields.role')}</Label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-lg border px-3 text-sm"
                      value={form.adminRole}
                      onChange={(e) => setForm({ ...form, adminRole: e.target.value as AssignableAdminRole })}
                    >
                      {ASSIGNABLE_ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {labelAdminRole(r)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMut.isPending}>
                    {t('admin.staffDetail.saveChanges')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </DetailPanel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {canManage && !isSuperRow ? (
                <ManageActionCard title={t('admin.staffDetail.editTitle')} description={t('admin.staffDetail.manage.editDescription')}>
                  <ManageActionButton onClick={startEdit}>{t('admin.staffDetail.manage.editButton')}</ManageActionButton>
                </ManageActionCard>
              ) : null}
              {canManage && !isSuperRow ? (
                <ManageActionCard title={t('admin.staffDetail.resetPassword')} description={t('admin.staffDetail.manage.resetPasswordDescription')}>
                  <ManageActionButton disabled={resetMut.isPending} onClick={() => resetMut.mutate()}>
                    {t('admin.staffDetail.manage.resetPasswordButton')}
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
              {canManage && !isSelf && !isSuperRow && staff.status === 'ACTIVE' ? (
                <ManageActionCard title={t('admin.staffDetail.deactivate')} description={t('admin.staffDetail.manage.deactivateDescription')} variant="danger">
                  <ManageActionButton variant="destructive" onClick={() => setDeactivateOpen(true)}>
                    {t('admin.staffDetail.manage.deactivateButton')}
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
              {isSuper && !isSelf && !isSuperRow ? (
                <ManageActionCard title={t('admin.staffDetail.manage.removeTitle')} description={t('admin.staffDetail.manage.removeDescription')} variant="danger">
                  <ManageActionButton variant="destructive" onClick={() => setDeleteOpen(true)}>
                    {t('admin.staffDetail.manage.deleteButton')}
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deactivateOpen}
        title={t('admin.staffDetail.deactivateTitle')}
        description={t('admin.staffDetail.deactivateDescription')}
        confirmLabel={t('admin.staffDetail.deactivateConfirm')}
        variant="destructive"
        busy={deactivateMut.isPending}
        onCancel={() => !deactivateMut.isPending && setDeactivateOpen(false)}
        onConfirm={() => deactivateMut.mutate()}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('admin.staffDetail.deletePermanentTitle')}
        description={t('admin.staffDetail.deletePermanentDescription')}
        confirmLabel={t('common.delete')}
        variant="destructive"
        busy={deleteMut.isPending}
        onCancel={() => !deleteMut.isPending && setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate()}
      />
    </DetailPageShell>
  );
}
