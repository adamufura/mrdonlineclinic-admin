import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  listPractitionersAdmin,
  rejectPractitioner,
  suspendPractitioner,
  verifyPractitioner,
  type PractitionerAdminRow,
} from '@/features/admin/api';
import { cn } from '@/lib/utils/cn';
import { normalizeAxiosError } from '@/lib/api/errors';

function rowId(row: PractitionerAdminRow) {
  return String(row._id);
}

function StatusPill({ children, tone }: { children: string; tone: 'neutral' | 'ok' | 'warn' | 'bad' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        tone === 'ok' && 'bg-emerald-100 text-emerald-800',
        tone === 'warn' && 'bg-amber-100 text-amber-900',
        tone === 'bad' && 'bg-red-100 text-red-800',
      )}
    >
      {children}
    </span>
  );
}

function verificationTone(v?: string): 'neutral' | 'ok' | 'warn' | 'bad' {
  if (v === 'VERIFIED') return 'ok';
  if (v === 'PENDING_REVIEW') return 'warn';
  if (v === 'REJECTED') return 'bad';
  return 'neutral';
}

export default function PractitionersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 15;

  const [verifyOpen, setVerifyOpen] = useState<{ id: string; name: string } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectOpen, setRejectOpen] = useState<{ id: string; name: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [suspendOpen, setSuspendOpen] = useState<{ id: string; name: string } | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'practitioners', page, limit],
    queryFn: () => listPractitionersAdmin({ page, limit }),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => verifyPractitioner(id, notes),
    onSuccess: () => {
      toast.success('Practitioner verified');
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioners'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setVerifyOpen(null);
      setVerifyNotes('');
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => rejectPractitioner(id, notes),
    onSuccess: () => {
      toast.success('Practitioner rejected');
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioners'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setRejectOpen(null);
      setRejectNotes('');
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => suspendPractitioner(id),
    onSuccess: () => {
      toast.success('Practitioner suspended');
      void qc.invalidateQueries({ queryKey: ['admin', 'practitioners'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setSuspendOpen(null);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-brand-navy md:text-[2rem]">Practitioners</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Review verification status, approve qualified profiles, reject incomplete applications, or suspend accounts for
          policy violations.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-brand">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Loading practitioners…
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-red-600">
                    {normalizeAxiosError(query.error).message}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No practitioners found.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const id = rowId(row);
                  const name = `Dr. ${[row.firstName, row.lastName].filter(Boolean).join(' ')}`.trim();
                  const v = row.verificationStatus ?? 'UNVERIFIED';
                  const canVerify = v !== 'VERIFIED';
                  const canReject = v !== 'REJECTED';
                  const canSuspend = row.status !== 'SUSPENDED' && row.status !== 'DEACTIVATED';

                  return (
                    <tr key={id} className="bg-card hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                      <td className="px-4 py-3">
                        <StatusPill tone={row.status === 'ACTIVE' ? 'ok' : row.status === 'SUSPENDED' ? 'bad' : 'warn'}>
                          {row.status}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={verificationTone(v)}>{v}</StatusPill>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canVerify ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white"
                              onClick={() => {
                                setVerifyNotes('');
                                setVerifyOpen({ id, name });
                              }}
                            >
                              Verify
                            </Button>
                          ) : null}
                          {canReject ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => {
                                setRejectNotes('');
                                setRejectOpen({ id, name });
                              }}
                            >
                              Reject
                            </Button>
                          ) : null}
                          {canSuspend ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={() => setSuspendOpen({ id, name })}
                            >
                              Suspend
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Page {meta?.page ?? page} of {totalPages}
            {typeof meta?.total === 'number' ? ` · ${meta.total} total` : null}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {verifyOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => !verifyMut.isPending && setVerifyOpen(null)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-float">
            <h2 className="font-display text-lg font-medium text-brand-navy">Verify {verifyOpen.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Optional internal note is stored on the practitioner record.</p>
            <div className="mt-4">
              <Label htmlFor="verify-notes" className="text-muted-foreground">
                Notes (optional)
              </Label>
              <textarea
                id="verify-notes"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={verifyMut.isPending} onClick={() => setVerifyOpen(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={verifyMut.isPending}
                className="bg-gradient-to-br from-teal-500 to-teal-700 text-white"
                onClick={() =>
                  verifyMut.mutate({ id: verifyOpen.id, notes: verifyNotes.trim() || undefined })
                }
              >
                {verifyMut.isPending ? 'Saving…' : 'Confirm verify'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => !rejectMut.isPending && setRejectOpen(null)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-float">
            <h2 className="font-display text-lg font-medium text-brand-navy">Reject {rejectOpen.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">A clear note helps practitioners fix their submission.</p>
            <div className="mt-4">
              <Label htmlFor="reject-notes" className="text-muted-foreground">
                Notes (required)
              </Label>
              <textarea
                id="reject-notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={rejectMut.isPending} onClick={() => setRejectOpen(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={rejectMut.isPending || rejectNotes.trim().length < 1}
                onClick={() => rejectMut.mutate({ id: rejectOpen.id, notes: rejectNotes })}
              >
                {rejectMut.isPending ? 'Saving…' : 'Confirm reject'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(suspendOpen)}
        title={suspendOpen ? `Suspend ${suspendOpen.name}?` : 'Suspend?'}
        description="They will no longer appear for booking and their account is marked suspended."
        confirmLabel="Suspend"
        variant="destructive"
        busy={suspendMut.isPending}
        onCancel={() => !suspendMut.isPending && setSuspendOpen(null)}
        onConfirm={() => {
          if (suspendOpen) void suspendMut.mutateAsync(suspendOpen.id);
        }}
      />
    </div>
  );
}
