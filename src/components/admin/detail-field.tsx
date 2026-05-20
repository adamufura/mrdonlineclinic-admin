import type { ReactNode } from 'react';

export function DetailField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value ?? '—'}</dd>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-brand">
      <h2 className="font-display text-lg font-medium text-brand-navy">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
