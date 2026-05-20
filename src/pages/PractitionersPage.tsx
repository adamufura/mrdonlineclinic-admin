import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';

const onboardSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(5),
  licenseNumber: z.string().optional(),
  specialtyId: z.string().min(1, 'Select a specialty'),
  autoVerify: z.boolean(),
});

type OnboardForm = z.infer<typeof onboardSchema>;

function rowId(row: PractitionerAdminRow) {
  return String(row._id);
}

export default function PractitionersPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const limit = 15;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
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
      toast.success('Practitioner onboarded');
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
    title: `Dr. ${[row.firstName, row.lastName].filter(Boolean).join(' ')}`.trim(),
    subtitle: row.email,
    meta: row.phoneNumber ? `Phone: ${row.phoneNumber}` : undefined,
    status: row.status,
    verificationStatus: row.verificationStatus ?? 'UNVERIFIED',
    extraBadge: row.isAvailableForBooking ? { label: 'Bookable', tone: 'ok' as const } : undefined,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practitioners"
        description="Onboard healthcare practitioners on behalf of the Ministry, verify credentials, and manage platform access."
        action={
          can('practitioners:onboard') ? (
            <PrimaryActionButton
              onClick={() => {
                setLastOnboardMsg(null);
                setOnboardOpen(true);
              }}
            >
              <Plus className="size-4" />
              Onboard practitioner
            </PrimaryActionButton>
          ) : undefined
        }
      />

      {lastOnboardMsg ? <OnboardResultBanner message={lastOnboardMsg} /> : null}

      <ListToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Name, email, phone, or license…"
        filters={[
          {
            id: 'status',
            label: 'Account status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: '', label: 'All statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'DEACTIVATED', label: 'Deactivated' },
            ],
          },
          {
            id: 'verification',
            label: 'Verification',
            value: verificationFilter,
            onChange: setVerificationFilter,
            options: [
              { value: '', label: 'All' },
              { value: 'VERIFIED', label: 'Verified' },
              { value: 'PENDING_REVIEW', label: 'Pending review' },
              { value: 'UNVERIFIED', label: 'Unverified' },
              { value: 'REJECTED', label: 'Rejected' },
            ],
          },
        ]}
      />

      <div className="space-y-0">
        <RecordList
          items={listItems}
          loading={query.isLoading}
          emptyMessage="No practitioners found. Try a different search or filter."
          onItemClick={(id) => navigate(ROUTES.practitionerDetail(id))}
        />
        <div className="overflow-hidden rounded-b-2xl border border-t-0 border-[#e8edf4] bg-white shadow-sm">
          <PaginationBar page={page} meta={meta} onPageChange={setPage} />
        </div>
      </div>

      {onboardOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => !onboardMut.isPending && setOnboardOpen(false)} />
          <div className="relative z-[1] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8edf4] bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg font-medium text-brand-navy">Onboard practitioner</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Creates an account with the default password. The practitioner can complete their profile later.
            </p>
            <form className="mt-4 space-y-3" onSubmit={onboardForm.handleSubmit((v) => onboardMut.mutate(v))}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>First name</Label>
                  <Input className="mt-1" {...onboardForm.register('firstName')} />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input className="mt-1" {...onboardForm.register('lastName')} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="mt-1" {...onboardForm.register('email')} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1" {...onboardForm.register('phoneNumber')} />
              </div>
              <div>
                <Label>License number (optional)</Label>
                <Input className="mt-1" {...onboardForm.register('licenseNumber')} />
              </div>
              <div>
                <Label>Specialty</Label>
                <select className="mt-1 flex h-10 w-full rounded-lg border border-border px-3 text-sm" {...onboardForm.register('specialtyId')}>
                  <option value="">Select specialty…</option>
                  {(specialtiesQuery.data ?? []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...onboardForm.register('autoVerify')} />
                Verify immediately (allow booking)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={onboardMut.isPending} onClick={() => setOnboardOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={onboardMut.isPending} className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                  {onboardMut.isPending ? 'Creating…' : 'Create account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
