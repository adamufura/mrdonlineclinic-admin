import { cn } from '@/lib/utils/cn';

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  ok: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-900',
  bad: 'bg-red-100 text-red-800',
  info: 'bg-sky-100 text-sky-800',
};

export function statusToneForAccount(status?: string): Tone {
  if (status === 'ACTIVE') return 'ok';
  if (status === 'SUSPENDED' || status === 'DEACTIVATED') return 'bad';
  if (status === 'PENDING_VERIFICATION') return 'warn';
  return 'neutral';
}

export function statusToneForVerification(v?: string): Tone {
  if (v === 'VERIFIED') return 'ok';
  if (v === 'PENDING_REVIEW') return 'warn';
  if (v === 'REJECTED') return 'bad';
  if (v === 'UNVERIFIED') return 'neutral';
  return 'info';
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold', toneClass[tone])}>
      {label}
    </span>
  );
}
