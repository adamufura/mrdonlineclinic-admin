import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusBadge, statusToneForAccount, statusToneForVerification } from '@/components/admin/status-badge';
import { labelAccountStatus, labelVerificationStatus } from '@/lib/i18n/admin-labels';
import { cn } from '@/lib/utils/cn';

const listCard = 'overflow-hidden rounded-2xl border border-[#e8edf4] bg-white shadow-sm';

export type RecordListItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  verificationStatus?: string;
  extraBadge?: { label: string; tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'info' };
};

export function RecordList({
  items,
  loading,
  emptyMessage,
  onItemClick,
}: {
  items: RecordListItem[];
  loading?: boolean;
  emptyMessage?: string;
  onItemClick: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={cn(listCard, 'px-4 py-12 text-center text-sm text-muted-foreground')}>
        {t('admin.recordList.loading')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn(listCard, 'px-4 py-12 text-center text-sm text-muted-foreground')}>
        {emptyMessage ?? t('admin.recordList.empty')}
      </div>
    );
  }

  return (
    <ul className={cn(listCard, 'divide-y divide-[#eef2f8]')}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onItemClick(item.id)}
            className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-sky-50/60 focus-visible:bg-sky-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/40"
          >
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-brand-navy">{item.title}</p>
              {item.subtitle ? (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.subtitle}</p>
              ) : null}
              {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {item.status ? (
                  <StatusBadge label={labelAccountStatus(item.status)} tone={statusToneForAccount(item.status)} />
                ) : null}
                {item.verificationStatus ? (
                  <StatusBadge
                    label={labelVerificationStatus(item.verificationStatus)}
                    tone={statusToneForVerification(item.verificationStatus)}
                  />
                ) : null}
                {item.extraBadge ? (
                  <StatusBadge label={item.extraBadge.label} tone={item.extraBadge.tone ?? 'info'} />
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <span className="text-sm font-medium text-sky-700">{t('admin.recordList.viewDetails')}</span>
              <ChevronRight className="size-5 text-sky-600" aria-hidden />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
