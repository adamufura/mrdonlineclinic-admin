import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listAuditLogsAdmin, type AuditLogRow } from '@/features/admin/api';
import { normalizeAxiosError } from '@/lib/api/errors';

function actorLabel(log: AuditLogRow): string {
  const a = log.actor;
  if (a && typeof a === 'object') {
    const n = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
    if (n) return n;
    if (a.email) return a.email;
  }
  return '—';
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const limit = 25;

  const query = useQuery({
    queryKey: ['admin', 'audit', page, limit, actionFilter.trim() || ''],
    queryFn: () =>
      listAuditLogsAdmin({
        page,
        limit,
        ...(actionFilter.trim() ? { action: actionFilter.trim() } : {}),
      }),
  });

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-brand-navy md:text-[2rem]">Audit log</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          Immutable record of sensitive admin actions (verification, suspensions, invitations, and more).
        </p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="audit-action" className="text-muted-foreground">
          Filter by action code
        </Label>
        <Input
          id="audit-action"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          placeholder="e.g. PRACTITIONER_VERIFIED"
          className="mt-1.5 font-mono text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-brand">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Loading audit entries…
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-red-600">
                    {normalizeAxiosError(query.error).message}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No audit entries for this filter.
                  </td>
                </tr>
              ) : (
                items.map((log) => (
                  <tr key={String(log._id)} className="bg-card hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{actorLabel(log)}</div>
                      <div className="text-xs text-muted-foreground">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.targetType} · <span className="font-mono text-xs">{log.targetId}</span>
                    </td>
                  </tr>
                ))
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
    </div>
  );
}
