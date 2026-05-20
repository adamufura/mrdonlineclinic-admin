import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, statusToneForAccount, statusToneForVerification } from '@/components/admin/status-badge';
import { cn } from '@/lib/utils/cn';

const shellCard = 'rounded-2xl border border-[#e8edf4] bg-white shadow-sm';

export function DetailPageShell({
  backTo,
  backLabel,
  title,
  subtitle,
  statuses,
  actions,
  children,
}: {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  statuses?: { label: string; type: 'account' | 'verification' | 'info' }[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <div className={cn(shellCard, 'p-5 md:p-6')}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-normal tracking-tight text-brand-navy md:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            {statuses && statuses.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <StatusBadge
                    key={s.label}
                    label={s.label}
                    tone={
                      s.type === 'verification'
                        ? statusToneForVerification(s.label)
                        : s.type === 'account'
                          ? statusToneForAccount(s.label)
                          : 'info'
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>

      {children}
    </div>
  );
}

export function DetailPanel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn(shellCard, 'p-5', className)}>
      {title ? <h2 className="mb-4 font-display text-lg font-medium text-brand-navy">{title}</h2> : null}
      {children}
    </section>
  );
}

export function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>;
}

export function InfoItem({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-[#eef2f8]">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value ?? '—'}</dd>
    </div>
  );
}
