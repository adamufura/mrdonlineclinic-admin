import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listAuditLogsAdmin, type AuditLogRow } from '@/features/admin/api';
import { labelAuditAction } from '@/lib/i18n/admin-labels';
import { normalizeAxiosError } from '@/lib/api/errors';

function actorLabel(log: AuditLogRow, systemLabel: string): string {
  const a = log.actor;
  if (a && typeof a === 'object') {
    const n = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
    if (n) return n;
    if (a.email) return a.email;
  }
  return systemLabel;
}

export default function AuditLogsPage() {
  const { t } = useTranslation();
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
        <h1 className="font-display text-3xl font-normal tracking-tight text-brand-navy md:text-[2rem]">
          {t('admin.audit.title')}
        </h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{t('admin.audit.description')}</p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="audit-action" className="text-muted-foreground">
          {t('admin.audit.filterLabel')}
        </Label>
        <Input
          id="audit-action"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          placeholder={t('admin.audit.filterPlaceholder')}
          className="mt-1.5 font-mono text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-brand">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('admin.audit.columns.when')}</th>
                <th className="px-4 py-3">{t('admin.audit.columns.actor')}</th>
                <th className="px-4 py-3">{t('admin.audit.columns.action')}</th>
                <th className="px-4 py-3">{t('admin.audit.columns.target')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    {t('admin.audit.loading')}
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
                    {t('admin.audit.empty')}
                  </td>
                </tr>
              ) : (
                items.map((log) => (
                  <tr key={String(log._id)} className="bg-card hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{actorLabel(log, t('admin.audit.system'))}</div>
                      <div className="text-xs text-muted-foreground">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground">
                      <span className="font-medium">{labelAuditAction(log.action)}</span>
                      <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{log.action}</span>
                    </td>
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
            {t('admin.pagination.pageOf', { page: meta?.page ?? page, totalPages })}
            {typeof meta?.total === 'number' ? t('admin.pagination.total', { total: meta.total }) : null}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('admin.pagination.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('admin.pagination.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
