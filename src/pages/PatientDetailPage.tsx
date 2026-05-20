import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { deletePatientAdmin, getPatientAdmin, updatePatientAdmin } from '@/features/admin/api';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function fmtDate(d?: string | Date) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

type TabId = 'overview' | 'health' | 'appointments' | 'manage';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = usePermissions();
  const isSuper = useAuthStore((s) => s.user)?.adminRole === 'SUPER_ADMIN';

  const [tab, setTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'patient', id],
    queryFn: () => getPatientAdmin(id!),
    enabled: Boolean(id),
  });

  const patient = query.data?.patient;
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    status: 'ACTIVE',
    gender: '',
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updatePatientAdmin(id!, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        status: form.status,
        ...(form.gender ? { gender: form.gender } : {}),
      }),
    onSuccess: () => {
      toast.success('Patient updated');
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'patient', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deletePatientAdmin(id!),
    onSuccess: () => {
      toast.success('Patient removed');
      void navigate(ROUTES.patients);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (query.isLoading) return <p className="text-muted-foreground">Loading patient…</p>;
  if (query.isError || !patient) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{normalizeAxiosError(query.error).message}</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.patients}>Back to patients</Link>
        </Button>
      </div>
    );
  }

  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ');

  function startEdit() {
    setForm({
      firstName: patient!.firstName,
      lastName: patient!.lastName,
      phoneNumber: patient!.phoneNumber,
      status: patient!.status,
      gender: (patient!.gender as string) ?? '',
    });
    setEditing(true);
    setTab('manage');
  }

  const appointmentCount = query.data?.appointments?.length ?? 0;
  const prescriptionCount = query.data?.prescriptions?.length ?? 0;

  return (
    <DetailPageShell
      backTo={ROUTES.patients}
      backLabel="Back to patients"
      title={name}
      subtitle={patient.email}
      statuses={[{ label: patient.status, type: 'account' }]}
    >
      <DetailTabs
        tabs={[
          { id: 'overview', label: 'Overview', hint: 'Summary' },
          { id: 'health', label: 'Health record', hint: 'Allergies & conditions' },
          { id: 'appointments', label: 'Visits', hint: 'Appointments & prescriptions' },
          { id: 'manage', label: 'Manage', hint: 'Edit or remove' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appointments</p>
            <p className="mt-1 font-display text-3xl text-brand-navy">{appointmentCount}</p>
          </DetailPanel>
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Prescriptions</p>
            <p className="mt-1 font-display text-3xl text-brand-navy">{prescriptionCount}</p>
          </DetailPanel>
          <DetailPanel className="sm:col-span-2 lg:col-span-1">
            <InfoGrid>
              <InfoItem label="Phone" value={patient.phoneNumber} />
              <InfoItem label="Gender" value={patient.gender as string} />
              <InfoItem label="Date of birth" value={patient.dateOfBirth ? fmtDate(patient.dateOfBirth as string) : undefined} />
              <InfoItem label="Registered" value={fmtDate(patient.createdAt as string)} />
            </InfoGrid>
          </DetailPanel>
          {patient.address ? (
            <DetailPanel className="sm:col-span-2 lg:col-span-3">
              <InfoItem
                label="Address"
                value={[
                  (patient.address as { city?: string }).city,
                  (patient.address as { state?: string }).state,
                  (patient.address as { country?: string }).country,
                ]
                  .filter(Boolean)
                  .join(', ') || '—'}
              />
            </DetailPanel>
          ) : null}
        </div>
      )}

      {tab === 'health' && (
        <DetailPanel title="Health information">
          <InfoGrid>
            <InfoItem
              label="Allergies"
              value={
                Array.isArray(patient.allergies) && patient.allergies.length
                  ? (patient.allergies as string[]).join(', ')
                  : 'None recorded'
              }
            />
            <InfoItem
              label="Chronic conditions"
              value={
                Array.isArray(patient.chronicConditions) && patient.chronicConditions.length
                  ? (patient.chronicConditions as string[]).join(', ')
                  : 'None recorded'
              }
            />
          </InfoGrid>
        </DetailPanel>
      )}

      {tab === 'appointments' && (
        <div className="space-y-4">
          <DetailPanel title="Recent appointments">
            {(query.data?.appointments?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <ul className="divide-y divide-[#eef2f8]">
                {query.data!.appointments.map((a) => {
                  const pr = a.practitioner as { firstName?: string; lastName?: string } | undefined;
                  return (
                    <li key={String(a._id)} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">{pr ? `Dr. ${pr.firstName} ${pr.lastName}` : '—'}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{fmtDate(a.scheduledStart as string)}</span>
                        <StatusBadge label={String(a.status)} tone={statusToneForAccount(String(a.status))} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DetailPanel>

          <DetailPanel title="Prescriptions">
            {(query.data?.prescriptions?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No prescriptions issued.</p>
            ) : (
              <ul className="divide-y divide-[#eef2f8]">
                {query.data!.prescriptions.map((rx) => (
                  <li key={String(rx._id)} className="flex justify-between py-3 text-sm">
                    <span className="font-medium">{(rx.diagnosis as string) || 'Prescription'}</span>
                    <span className="text-muted-foreground">{fmtDate(rx.issuedAt as string)}</span>
                  </li>
                ))}
              </ul>
            )}
          </DetailPanel>
        </div>
      )}

      {tab === 'manage' && (
        <div className="space-y-4">
          {can('patients:write') && editing ? (
            <DetailPanel title="Edit patient details">
              <form
                className="grid max-w-xl gap-3"
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
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                    <option value="PENDING_VERIFICATION">Pending verification</option>
                  </select>
                </div>
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
              {can('patients:write') ? (
                <ManageActionCard title="Edit patient" description="Update name, phone, or account status.">
                  <ManageActionButton onClick={startEdit}>Edit patient details</ManageActionButton>
                </ManageActionCard>
              ) : null}
              {isSuper ? (
                <ManageActionCard title="Remove permanently" description="Delete this patient from the system. Cannot be undone." variant="danger">
                  <ManageActionButton variant="destructive" onClick={() => setDeleteOpen(true)}>
                    Delete patient
                  </ManageActionButton>
                </ManageActionCard>
              ) : null}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Delete patient permanently?"
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
