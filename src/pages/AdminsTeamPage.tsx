import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deactivateAdminUser, inviteAdmin, listAdminUsers, type AdminUserRow } from '@/features/admin/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type InviteForm = z.infer<typeof inviteSchema>;

export default function AdminsTeamPage() {
  const me = useAuthStore((s) => s.user);
  const isSuper = me?.adminRole === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserRow | null>(null);

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  });

  const listQuery = useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: () => listAdminUsers({ page, limit }),
    enabled: isSuper,
  });

  const inviteMut = useMutation({
    mutationFn: (email: string) => inviteAdmin(email),
    onSuccess: (data) => {
      toast.success(data.message || 'Invitation sent');
      form.reset();
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => deactivateAdminUser(id),
    onSuccess: (data) => {
      toast.success(data.message || 'Admin deactivated');
      setDeactivateTarget(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  if (!isSuper) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-brand-navy md:text-[2rem]">
          Team & invites
        </h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Invite standard administrators by email. They receive a link to set a password. You can deactivate admins who
          no longer need access (super admins cannot be removed from this screen).
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
        <h2 className="font-display text-lg font-medium text-brand-navy">Invite admin</h2>
        <form
          className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={form.handleSubmit((v) => inviteMut.mutate(v.email))}
        >
          <div className="min-w-0 flex-1">
            <Label htmlFor="invite-email" className="text-muted-foreground">
              Email
            </Label>
            <Input id="invite-email" type="email" autoComplete="off" className="mt-1.5" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="shrink-0 bg-gradient-to-br from-teal-500 to-teal-700 text-white" disabled={inviteMut.isPending}>
            {inviteMut.isPending ? 'Sending…' : 'Send invite'}
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-brand">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-lg font-medium text-brand-navy">Administrators</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Loading admins…
                  </td>
                </tr>
              ) : listQuery.isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-red-600">
                    {normalizeAxiosError(listQuery.error).message}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No admins found.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const id = String(row._id);
                  const isSelf = me?.id != null && me.id === id;
                  const isSuper = row.adminRole === 'SUPER_ADMIN';
                  const canDeactivate = !isSelf && !isSuper && row.status === 'ACTIVE';

                  return (
                    <tr key={id} className="bg-card hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {[row.firstName, row.lastName].filter(Boolean).join(' ')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.adminRole}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.status}</td>
                      <td className="px-4 py-3 text-right">
                        {canDeactivate ? (
                          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setDeactivateTarget(row)}>
                            Deactivate
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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

      <ConfirmModal
        open={Boolean(deactivateTarget)}
        title={deactivateTarget ? `Deactivate ${deactivateTarget.email}?` : 'Deactivate?'}
        description="They will no longer be able to sign in until a super admin restores access."
        confirmLabel="Deactivate"
        variant="destructive"
        busy={deactivateMut.isPending}
        onCancel={() => !deactivateMut.isPending && setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) void deactivateMut.mutateAsync(String(deactivateTarget._id));
        }}
      />
    </div>
  );
}
