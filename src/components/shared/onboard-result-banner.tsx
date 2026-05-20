import { DEFAULT_STAFF_PASSWORD } from '@/config/ministry';

export function OnboardResultBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <p>{message}</p>
      <p className="mt-1 font-medium">
        Default password: <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[13px]">{DEFAULT_STAFF_PASSWORD}</code>
      </p>
    </div>
  );
}
