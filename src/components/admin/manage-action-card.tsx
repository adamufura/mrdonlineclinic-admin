import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export function ManageActionCard({
  title,
  description,
  children,
  variant = 'default',
}: {
  title: string;
  description: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-4',
        variant === 'danger' ? 'border-red-200 bg-red-50/50' : 'border-[#e8edf4] bg-[#f8fafc]',
      )}
    >
      <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ManageActionButton({
  children,
  onClick,
  variant = 'outline',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'outline' | 'primary' | 'destructive';
  disabled?: boolean;
}) {
  const className =
    variant === 'primary'
      ? 'h-10 w-full rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 text-white sm:w-auto'
      : variant === 'destructive'
        ? 'h-10 w-full rounded-lg sm:w-auto'
        : 'h-10 w-full rounded-lg sm:w-auto';
  return (
    <Button type="button" variant={variant === 'primary' ? 'default' : variant === 'destructive' ? 'destructive' : 'outline'} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
