import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { ADMIN_ROLE_LABELS, ASSIGNABLE_ADMIN_ROLES, canManageStaff, type AssignableAdminRole } from '@/lib/rbac';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

type TabId = 'overview' | 'manage';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
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
      toast.success('Staff updated');
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
      toast.success('Staff deactivated');
      setDeactivateOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'staff', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAdminUser(id!),
    onSuccess: () => {
      toast.success('Staff removed');
      void navigate(ROUTES.team);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (query.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (query.isError || !staff) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{normalizeAxiosError(query.error).message}</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.team}>Back to staff</Link>
        </Button>
      </div>
    );
  }

  const isSelf = me?.id === String(staff._id);
  const isSuperRow = staff.adminRole === 'SUPER_ADMIN';
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(' ');
  const roleLabel = ADMIN_ROLE_LABELS[staff.adminRole as keyof typeof ADMIN_ROLE_LABELS] ?? staff.adminRole;

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
      backLabel="Back to ministry staff"
      title={name}
      subtitle={staff.email}
      statuses={[
        { label: staff.status, type: 'account' },
        { label: roleLabel, type: 'info' },
      ]}
    >
      <DetailTabs
        tabs={[
          { id: 'overview', label: 'Overview', hint: 'Account details' },
          { id: 'manage', label: 'Manage', hint: 'Edit, password, deactivate' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'overview' && (
        <DetailPanel title="Account information">
          <InfoGrid>
            <InfoItem label="Phone" value={staff.phoneNumber} />
            <InfoItem label="Access role" value={roleLabel} />
            <InfoItem label="Email verified" value={staff.isEmailVerified ? 'Yes' : 'No'} />
            <InfoItem label="Account created" value={fmtDate(staff.createdAt)} />
          </InfoGrid>
        </DetailPanel>
      )}

      {tab === 'manage' && (
        <div className="space-y-4">
          {canManage && editing ? (
            <DetailPanel title="Edit staff account">
              <form
                className="grid max-w-lg gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMut.mutate();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>First name</Label>
                    <Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Account status</Label>
                  <select
                    className="mt-1 flex h-10 w-full rounded-lg border px-3 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={isSuperRow}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DEACTIVATED">Deactivated</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                {isSuper && !isSuperRow ? (
                  <div>
                    <Label>Access role</Label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-lg border px-3 text-sm"
                      value={form.adminRole}
                      onChange={(e) => setForm({ ...form, adminRole: e.target.value as AssignableAdminRole })}
                    >
                      {ASSIGNABLE_ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ADMIN_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMut.isPending}>
                    Save changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DetailPanel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {canManage && !isSuperRow ? (
                <ManageActionCard title="Edit account" description="Update name, phone, status, or access role.">
                  <ManageActionButton onClick={startEdit}>Edit staff details</ManageActionButton>
                </ManageActionCard>
              ) : null}
              {canManage && !isSuperRow ? (
                <ManageActionCard title="Reset password" description="Set their login password back to the default (mrdclinic).">
                  <ManageActionButton disabled={resetMut.isPending} onClick={() => resetMut.mutate()}>
                    Reset to default password
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
              {canManage && !isSelf && !isSuperRow && staff.status === 'ACTIVE' ? (
                <ManageActionCard title="Deactivate account" description="They will no longer be able to sign in to this console." variant="danger">
                  <ManageActionButton variant="destructive" onClick={() => setDeactivateOpen(true)}>
                    Deactivate staff member
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
              {isSuper && !isSelf && !isSuperRow ? (
                <ManageActionCard title="Remove permanently" description="Delete this staff account. Cannot be undone." variant="danger">
                  <ManageActionButton variant="destructive" onClick={() => setDeleteOpen(true)}>
                    Delete staff account
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deactivateOpen}
        title="Deactivate this staff account?"
        description="They will not be able to sign in until reactivated."
        confirmLabel="Deactivate"
        variant="destructive"
        busy={deactivateMut.isPending}
        onCancel={() => !deactivateMut.isPending && setDeactivateOpen(false)}
        onConfirm={() => deactivateMut.mutate()}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Delete staff permanently?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        busy={deleteMut.isPending}
        onCancel={() => !deleteMut.isPending && setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate()}
      />
    </DetailPageShell>
  );
}
