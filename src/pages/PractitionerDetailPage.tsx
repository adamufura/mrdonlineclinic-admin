import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
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
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function fmtDate(d?: string | Date) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

type TabId = 'overview' | 'profile' | 'appointments' | 'manage';

export default function PractitionerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
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
      toast.success('Practitioner updated');
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const verifyMut = useMutation({
    mutationFn: () => verifyPractitioner(id!, verifyNotes.trim() || undefined),
    onSuccess: () => {
      toast.success('Verified');
      setVerifyOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectPractitioner(id!, rejectNotes),
    onSuccess: () => {
      toast.success('Rejected');
      setRejectOpen(false);
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioner', id] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const suspendMut = useMutation({
    mutationFn: () => suspendPractitioner(id!),
    onSuccess: () => {
      toast.success('Suspended');
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
      toast.success('Practitioner removed');
      void navigate(ROUTES.practitioners);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  if (query.isLoading) {
    return <p className="text-muted-foreground">Loading practitioner…</p>;
  }
  if (query.isError || !p) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{normalizeAxiosError(query.error).message}</p>
        <Button asChild variant="outline">
          <Link to={ROUTES.practitioners}>Back to list</Link>
        </Button>
      </div>
    );
  }

  const name = `Dr. ${[p.firstName, p.lastName].filter(Boolean).join(' ')}`;
  const specialties = Array.isArray(p.specialties)
    ? (p.specialties as { name?: string }[]).map((s) => s.name).filter(Boolean).join(', ')
    : '—';

  const statuses = [
    { label: p.status, type: 'account' as const },
    { label: p.verificationStatus ?? 'UNVERIFIED', type: 'verification' as const },
    ...(p.isAvailableForBooking ? [{ label: 'Bookable', type: 'info' as const }] : []),
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
      backLabel="Back to practitioners"
      title={name}
      subtitle={p.email}
      statuses={statuses}
    >
      <DetailTabs
        tabs={[
          { id: 'overview', label: 'Overview', hint: 'Summary at a glance' },
          { id: 'profile', label: 'Profile', hint: 'Contact & credentials' },
          { id: 'appointments', label: 'Appointments', hint: 'Recent visits' },
          { id: 'manage', label: 'Manage', hint: 'Verify, edit, suspend' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total reviews</p>
            <p className="mt-1 font-display text-3xl text-brand-navy">{query.data?.reviewsCount ?? 0}</p>
          </DetailPanel>
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appointments</p>
            <p className="mt-1 font-display text-3xl text-brand-navy">{totalAppointments}</p>
          </DetailPanel>
          <DetailPanel>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Specialty</p>
            <p className="mt-1 text-sm font-medium">{specialties}</p>
          </DetailPanel>
          <DetailPanel className="sm:col-span-2 lg:col-span-3">
            <InfoGrid>
              <InfoItem label="Phone" value={p.phoneNumber} />
              <InfoItem label="License" value={p.licenseNumber as string} />
              <InfoItem label="Registered" value={fmtDate(p.createdAt as string)} />
              <InfoItem label="Onboarded" value={fmtDate(p.onboardedAt as string)} />
            </InfoGrid>
          </DetailPanel>
        </div>
      )}

      {tab === 'profile' && (
        <DetailPanel title="Profile information">
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
                <Label>License</Label>
                <Input className="mt-1" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div>
                <Label>Bio</Label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
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
          ) : (
            <InfoGrid>
              <InfoItem label="Phone" value={p.phoneNumber} />
              <InfoItem label="Specialties" value={specialties} />
              <InfoItem label="License" value={p.licenseNumber as string} />
              <InfoItem label="Experience" value={p.yearsOfExperience != null ? `${p.yearsOfExperience} years` : undefined} />
              <InfoItem label="Onboarded" value={fmtDate(p.onboardedAt as string)} />
              <InfoItem label="Registered" value={fmtDate(p.createdAt as string)} />
              <InfoItem label="Bio" value={(p.bio as string) || '—'} />
              {p.licenseDocumentUrl ? (
                <div className="sm:col-span-2">
                  <InfoItem
                    label="Credentials document"
                    value={
                      <a
                        href={p.licenseDocumentUrl as string}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                      >
                        Open document <ExternalLink className="size-3.5" />
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
        <DetailPanel title="Recent appointments">
          {(query.data?.appointments?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <ul className="divide-y divide-[#eef2f8]">
              {query.data!.appointments.map((a) => {
                const patient = a.patient as { firstName?: string; lastName?: string; email?: string } | undefined;
                return (
                  <li key={String(a._id)} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">{patient?.email}</p>
                    </div>
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
      )}

      {tab === 'manage' && (
        <div className="grid gap-4 md:grid-cols-2">
          {can('practitioners:write') ? (
            <ManageActionCard title="Edit profile" description="Update name, phone, license, or bio.">
              <ManageActionButton onClick={startEdit}>Edit profile details</ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:verify') && p.verificationStatus !== 'VERIFIED' ? (
            <ManageActionCard title="Approve practitioner" description="Mark credentials as verified so they can accept bookings.">
              <ManageActionButton variant="primary" onClick={() => setVerifyOpen(true)}>
                Approve & verify
              </ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:verify') && p.verificationStatus !== 'REJECTED' ? (
            <ManageActionCard title="Reject application" description="Decline this practitioner with a written reason.">
              <ManageActionButton onClick={() => setRejectOpen(true)}>Reject application</ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:write') ? (
            <ManageActionCard title="Reset password" description="Set their login password back to the default (mrdclinic).">
              <ManageActionButton disabled={resetMut.isPending} onClick={() => resetMut.mutate()}>
                Reset to default password
              </ManageActionButton>
            </ManageActionCard>
          ) : null}

          {can('practitioners:write') && p.status !== 'SUSPENDED' && p.status !== 'DEACTIVATED' ? (
            <ManageActionCard title="Suspend account" description="They will no longer appear for patient booking." variant="danger">
              <ManageActionButton variant="destructive" onClick={() => setSuspendOpen(true)}>
                Suspend practitioner
              </ManageActionButton>
            </ManageActionCard>
          ) : null}

          {isSuper ? (
            <ManageActionCard title="Remove permanently" description="Delete this practitioner from the system. Cannot be undone." variant="danger">
              <ManageActionButton variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete practitioner
              </ManageActionButton>
            </ManageActionCard>
          ) : null}
        </div>
      )}

      {verifyOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setVerifyOpen(false)} />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg text-brand-navy">Approve practitioner</h2>
            <p className="mt-1 text-sm text-muted-foreground">Optional notes for the audit log.</p>
            <textarea
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder="Optional notes"
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVerifyOpen(false)}>
                Cancel
              </Button>
              <Button disabled={verifyMut.isPending} onClick={() => verifyMut.mutate()}>
                Confirm approval
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setRejectOpen(false)} />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg text-brand-navy">Reject practitioner</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please provide a reason (required).</p>
            <textarea
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
              rows={4}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={!rejectNotes.trim() || rejectMut.isPending} onClick={() => rejectMut.mutate()}>
                Confirm rejection
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={suspendOpen}
        title={`Suspend ${name}?`}
        description="They will no longer appear for booking until reactivated."
        confirmLabel="Suspend"
        variant="destructive"
        busy={suspendMut.isPending}
        onCancel={() => !suspendMut.isPending && setSuspendOpen(false)}
        onConfirm={() => suspendMut.mutate()}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Delete practitioner permanently?"
        description="This cannot be undone. The practitioner record will be removed from the system."
        confirmLabel="Delete"
        variant="destructive"
        busy={deleteMut.isPending}
        onCancel={() => !deleteMut.isPending && setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate()}
      />
    </DetailPageShell>
  );
}
