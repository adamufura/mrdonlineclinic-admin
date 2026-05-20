import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-brand-navy md:text-[2rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        <p className="mt-2 text-xs text-muted-foreground">Tap any row to open full details and manage the record.</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PrimaryActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="h-11 gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-5 text-base font-semibold text-white shadow-sm"
    >
      {children}
    </Button>
  );
}
