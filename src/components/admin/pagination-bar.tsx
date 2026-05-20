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
  const totalPages = meta?.totalPages ?? 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        Page {meta?.page ?? page} of {totalPages}
        {typeof meta?.total === 'number' ? ` · ${meta.total} total` : null}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
