import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { ApiMeta } from '@/types/api';

export function PaginationBar({
  page,
  meta,
  onPageChange,
}: {
  page: number;
  meta?: ApiMeta;
  onPageChange: (p: number) => void;
}) {
  const { t } = useTranslation();
  const totalPages = meta?.totalPages ?? 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {t('admin.pagination.pageOf', { page: meta?.page ?? page, totalPages })}
        {typeof meta?.total === 'number' ? t('admin.pagination.total', { total: meta.total }) : null}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t('admin.pagination.previous')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('admin.pagination.next')}
        </Button>
      </div>
    </div>
  );
}
